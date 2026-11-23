#!/usr/bin/env python3
"""Import reviewed discovery candidates with normalization, dedupe, and dry-run."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

from candidate_utils import (
    SLUG_PATTERN,
    canonicalize_repo_url,
    known_index,
    load_json,
    normalize_spdx_license,
    slug_from_url,
    write_json_atomic,
)
from repository_resolver import (
    RepositoryResolutionError,
    load_resolution_fixture,
    resolve_repository_url,
)


REVIEW_REJECTION_PREFIXES = (
    "reject:",
    "rejected:",
    "do not import",
    "not admitted",
    "拒绝：",
    "拒绝:",
    "不收录",
)


def _validated_review(review: dict) -> None:
    decision = review.get("decision")
    if decision is not None and decision != "approved":
        raise ValueError("candidate review decision is not approved")
    if review.get("approved") is not True or review.get("topic_relevant") is not True:
        raise ValueError("candidate must be explicitly approved as topic-relevant by the reviewing Agent")
    notes = review.get("notes")
    if isinstance(notes, str) and notes.strip().lower().startswith(REVIEW_REJECTION_PREFIXES):
        raise ValueError("review decision conflicts with rejection notes")


def _validated_license(review_value: object, resolver_value: object) -> tuple[str, str]:
    resolver_license = None
    if isinstance(resolver_value, str) and resolver_value.strip():
        resolver_license = normalize_spdx_license(resolver_value)
    review_license = None
    if isinstance(review_value, str) and review_value.strip():
        review_license = normalize_spdx_license(review_value)
    if resolver_license and review_license and resolver_license != review_license:
        raise ValueError(f"license mismatch: repository metadata reports {resolver_license}, review reports {review_license}")
    if resolver_license:
        return resolver_license, "repository_metadata"
    if review_license:
        return review_license, "review"
    raise ValueError("a verified SPDX license is required")


def _resolved_candidate_url(raw: dict, resolver) -> tuple[str, dict, dict | None]:
    url = raw.get("url")
    resolution = resolver(url)
    is_fork = raw.get("fork") is True or resolution.get("fork") is True
    parent_resolution = None
    resolved_url = resolution["resolved_url"]
    if is_fork and not raw.get("fork_reason"):
        parent_url = raw.get("parent_url") or raw.get("source_repo_url") or resolution.get("parent_url") or resolution.get("source_repo_url")
        if not parent_url:
            raise ValueError("fork candidates require parent_url/source_repo_url or a fork_reason")
        parent_resolution = resolver(parent_url)
        resolved_url = parent_resolution["resolved_url"]
    return canonicalize_repo_url(resolved_url), resolution, parent_resolution


def reviewed_candidate(raw: dict, date: str, resolver=resolve_repository_url) -> dict:
    name = raw.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name is required")
    review = raw.get("review", {})
    verification = raw.get("verification", {})
    _validated_review(review)
    if verification.get("official_repository_checked") is not True:
        raise ValueError("official repository must be checked before import")

    canonical, resolution, parent_resolution = _resolved_candidate_url(raw, resolver)
    final_resolution = parent_resolution or resolution
    license_name, license_source = _validated_license(verification.get("license"), final_resolution.get("license"))
    archived = verification.get("archived") is True or final_resolution.get("archived") is True
    archived_exception = verification.get("archived_exception")
    if archived and (not isinstance(archived_exception, str) or not archived_exception.strip()):
        raise ValueError("archived candidates require an explicit legacy-research exception")
    selection_reason = raw.get("selection_reason") or review.get("notes")
    if not isinstance(selection_reason, str) or not selection_reason.strip():
        raise ValueError("selection_reason or review.notes is required")

    original_canonical = canonicalize_repo_url(raw.get("url"))
    aliases = set(raw.get("aliases", []))
    previous_urls = set(raw.get("previous_urls", []))
    redirected_from = []
    for item in (resolution, parent_resolution):
        if item and item.get("redirected"):
            redirected_from.append(item["original_url"])
            previous_urls.add(item["original_url"])
    if original_canonical != canonical and not redirected_from:
        aliases.add(original_canonical)

    slug = raw.get("slug") or slug_from_url(canonical)
    if not SLUG_PATTERN.fullmatch(slug):
        raise ValueError(f"invalid slug: {slug}")
    discovery = raw.get("discovery", {})
    source = discovery.get("source")
    query = discovery.get("query")
    if not isinstance(source, str) or not source or not isinstance(query, str) or not query:
        raise ValueError("discovery.source and discovery.query are required")

    warnings = []
    for item in (resolution, parent_resolution):
        if item:
            warnings.extend(item.get("warnings", []))
    verification_result = {
        "official_repository_checked": True,
        "license": license_name,
        "license_source": license_source,
        "archived": archived,
        "checked_at": verification.get("checked_at", date),
        "resolved_url": canonical,
        "url_resolution": final_resolution.get("resolver"),
        "repository_checked_at": date,
        **({"redirected_from": redirected_from} if redirected_from else {}),
        **({"url_resolution_warnings": warnings} if warnings else {}),
        **({"archived_exception": archived_exception} if archived else {}),
    }

    return {
        "slug": slug,
        "name": name.strip(),
        "url": canonical,
        "canonical_url": canonical,
        "aliases": sorted(aliases),
        "previous_urls": sorted(previous_urls),
        "discovered_date": raw.get("discovered_date", date),
        "status": "pending",
        "discovery": {
            "source": source,
            "query": query,
            "source_url": discovery.get("source_url", ""),
        },
        "verification": verification_result,
        "scores": raw.get("scores", {}),
        "selection_reason": selection_reason.strip(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", nargs="?", choices=["import"], default="import")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--researched", type=Path, required=True)
    parser.add_argument("--history", type=Path)
    parser.add_argument("--date", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--history-limit", type=int, default=30)
    parser.add_argument("--resolver-fixture", type=Path, help="Offline JSON fixture for deterministic repository-resolution tests")
    args = parser.parse_args()
    if args.history_limit < 1:
        raise SystemExit("history-limit must be positive")

    payload = load_json(args.input)
    raw_candidates = payload.get("candidates")
    if not isinstance(raw_candidates, list):
        raise SystemExit("input must contain a candidates array")
    candidates_data = load_json(args.candidates)
    researched = load_json(args.researched)
    existing = candidates_data.setdefault("candidates", [])
    if not isinstance(existing, list):
        raise SystemExit("candidates.json candidates must be an array")
    known_slugs, known_urls = known_index(candidates_data, researched)
    resolution_fixture = load_resolution_fixture(args.resolver_fixture) if args.resolver_fixture else None
    resolution_cache: dict[str, dict] = {}

    def resolver(url: str) -> dict:
        return resolve_repository_url(url, fixture=resolution_fixture, cache=resolution_cache)

    source_errors = list(payload.get("source_errors", []))
    added = []
    duplicates = []
    rejected = []
    for index, raw in enumerate(raw_candidates):
        try:
            if not isinstance(raw, dict):
                raise ValueError("candidate entry must be an object")
            candidate = reviewed_candidate(raw, args.date, resolver)
            candidate_urls = {candidate["canonical_url"]}
            for alias in candidate["aliases"] + candidate["previous_urls"]:
                candidate_urls.add(canonicalize_repo_url(alias))
            duplicate_url = next((url for url in candidate_urls if url in known_urls), None)
            if candidate["slug"] in known_slugs or duplicate_url:
                duplicates.append({
                    "slug": candidate["slug"],
                    "matched_slug": candidate["slug"] if candidate["slug"] in known_slugs else known_urls[duplicate_url],
                    "matched_url": duplicate_url,
                })
                continue
            added.append(candidate)
            known_slugs.add(candidate["slug"])
            for url in candidate_urls:
                known_urls[url] = candidate["slug"]
        except (ValueError, TypeError) as exc:
            rejected.append({"index": index, "name": raw.get("name") if isinstance(raw, dict) else None, "reason": str(exc)})
            if isinstance(exc, RepositoryResolutionError):
                source_errors.append({
                    "source": "repository_resolver",
                    "query": raw.get("url") if isinstance(raw, dict) else "",
                    "error": str(exc),
                })

    run = {
        "date": args.date,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": args.dry_run,
        "added": [item["slug"] for item in added],
        "duplicates": duplicates,
        "rejected": rejected,
        "source_errors": source_errors,
    }
    result = {
        "status": "dry_run" if args.dry_run else "imported",
        "added_count": len(added),
        "duplicate_count": len(duplicates),
        "rejected_count": len(rejected),
        "candidates": added,
        "duplicates": duplicates,
        "rejected": rejected,
        "source_errors": source_errors,
    }
    if not args.dry_run:
        updated = dict(candidates_data)
        updated["candidates"] = existing + added
        original = load_json(args.candidates)
        try:
            write_json_atomic(args.candidates, updated)
            if args.history:
                history = load_json(args.history) if args.history.exists() else {"runs": []}
                runs = history.setdefault("runs", [])
                runs.append(run)
                history["runs"] = runs[-args.history_limit:]
                write_json_atomic(args.history, history)
        except Exception:
            write_json_atomic(args.candidates, original)
            raise
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise SystemExit(f"DISCOVERY_IMPORT_STOPPED: {exc}") from exc
