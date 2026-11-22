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
    slug_from_url,
    write_json_atomic,
)


def reviewed_candidate(raw: dict, date: str) -> dict:
    name = raw.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name is required")
    review = raw.get("review", {})
    verification = raw.get("verification", {})
    if review.get("approved") is not True or review.get("topic_relevant") is not True:
        raise ValueError("candidate must be explicitly approved as topic-relevant by the reviewing Agent")
    if verification.get("official_repository_checked") is not True:
        raise ValueError("official repository must be checked before import")
    license_name = verification.get("license")
    if not isinstance(license_name, str) or not license_name.strip():
        raise ValueError("a verified license is required")
    archived = verification.get("archived") is True
    archived_exception = verification.get("archived_exception")
    if archived and (not isinstance(archived_exception, str) or not archived_exception.strip()):
        raise ValueError("archived candidates require an explicit legacy-research exception")
    selection_reason = raw.get("selection_reason") or review.get("notes")
    if not isinstance(selection_reason, str) or not selection_reason.strip():
        raise ValueError("selection_reason or review.notes is required")

    url = raw.get("url")
    if raw.get("fork") is True and not raw.get("fork_reason"):
        url = raw.get("parent_url") or raw.get("source_repo_url")
        if not url:
            raise ValueError("fork candidates require parent_url/source_repo_url or a fork_reason")
    canonical = canonicalize_repo_url(url)
    slug = raw.get("slug") or slug_from_url(canonical)
    if not SLUG_PATTERN.fullmatch(slug):
        raise ValueError(f"invalid slug: {slug}")
    discovery = raw.get("discovery", {})
    source = discovery.get("source")
    query = discovery.get("query")
    if not isinstance(source, str) or not source or not isinstance(query, str) or not query:
        raise ValueError("discovery.source and discovery.query are required")

    return {
        "slug": slug,
        "name": name.strip(),
        "url": canonical,
        "canonical_url": canonical,
        "aliases": sorted(set(raw.get("aliases", []))),
        "previous_urls": sorted(set(raw.get("previous_urls", []))),
        "discovered_date": raw.get("discovered_date", date),
        "status": "pending",
        "discovery": {
            "source": source,
            "query": query,
            "source_url": discovery.get("source_url", ""),
        },
        "verification": {
            "official_repository_checked": True,
            "license": license_name.strip(),
            "archived": archived,
            "checked_at": verification.get("checked_at", date),
            **({"archived_exception": archived_exception} if archived else {}),
        },
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

    added = []
    duplicates = []
    rejected = []
    for index, raw in enumerate(raw_candidates):
        try:
            if not isinstance(raw, dict):
                raise ValueError("candidate entry must be an object")
            candidate = reviewed_candidate(raw, args.date)
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

    run = {
        "date": args.date,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": args.dry_run,
        "added": [item["slug"] for item in added],
        "duplicates": duplicates,
        "rejected": rejected,
        "source_errors": payload.get("source_errors", []),
    }
    result = {
        "status": "dry_run" if args.dry_run else "imported",
        "added_count": len(added),
        "duplicate_count": len(duplicates),
        "rejected_count": len(rejected),
        "candidates": added,
        "duplicates": duplicates,
        "rejected": rejected,
        "source_errors": payload.get("source_errors", []),
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
