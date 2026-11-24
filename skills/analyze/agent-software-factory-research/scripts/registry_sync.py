#!/usr/bin/env python3
"""Verify, rebuild, and export local state from the GitHub candidate registry."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

from candidate_utils import load_json, write_json_atomic

STATE_FILENAMES = ("candidates.json", "researched.json", "discovery-history.json")
SOURCE_REPOSITORY = "lance-r17/agent-software-factory"
REGISTRY_REPOSITORY = "lance-r17/agent-software-factory-registry"


def read_state(state_dir: Path) -> dict[str, dict]:
    return {name: load_json(state_dir / name) for name in STATE_FILENAMES}


def read_registry(registry_dir: Path) -> dict[str, dict]:
    index = load_json(registry_dir / "candidates" / "index.json")
    ordered = index.get("ordered_slugs")
    if not isinstance(ordered, list) or not ordered or any(not isinstance(slug, str) for slug in ordered):
        raise ValueError("candidates/index.json must contain a non-empty ordered_slugs array")
    if len(ordered) != len(set(ordered)):
        raise ValueError("candidate order contains duplicate slugs")
    candidates = []
    for slug in ordered:
        candidate = load_json(registry_dir / "candidates" / f"{slug}.json")
        if candidate.get("slug") != slug:
            raise ValueError(f"candidate slug does not match filename: {slug}")
        candidates.append(candidate)
    return {
        "candidates.json": {"description": index["description"], "candidates": candidates},
        "researched.json": load_json(registry_dir / "researched.json"),
        "discovery-history.json": load_json(registry_dir / "discovery-history.json"),
    }


def compare(state_dir: Path, registry_dir: Path) -> dict:
    state = read_state(state_dir)
    registry = read_registry(registry_dir)
    differences = {name: state[name] != registry[name] for name in STATE_FILENAMES}
    return {
        "status": "matched" if not any(differences.values()) else "mismatch",
        "differences": differences,
        "candidate_count": len(registry["candidates.json"]["candidates"]),
        "solution_count": len(registry["researched.json"].get("solutions", [])),
        "history_run_count": len(registry["discovery-history.json"].get("runs", [])),
        "state_writes": False,
    }


def rebuild(state_dir: Path, registry_dir: Path) -> dict:
    registry = read_registry(registry_dir)
    before = read_state(state_dir) if all((state_dir / name).exists() for name in STATE_FILENAMES) else None
    for name, value in registry.items():
        write_json_atomic(state_dir / name, value)
    after = read_state(state_dir)
    if after != registry:
        raise RuntimeError("rebuilt state does not match registry")
    return {
        "status": "rebuilt",
        "previous_state_present": before is not None,
        "candidate_count": len(registry["candidates.json"]["candidates"]),
        "solution_count": len(registry["researched.json"].get("solutions", [])),
        "history_run_count": len(registry["discovery-history.json"].get("runs", [])),
        "verified": True,
    }


def render_readme(candidates: dict) -> str:
    ordered = sorted(
        candidates["candidates"],
        key=lambda c: (-c.get("ranking", {}).get("total", -1), c.get("discovered_date", "9999-12-31"), c["slug"]),
    )
    lines = [
        "# Agent Software Factory candidate registry",
        "",
        "Canonical candidate data for local-cache rebuilds. Projects and Issue views are derived from these files.",
        "",
        "| Rank | Candidate | Repository | License | Total | Eligible | Discovered |",
        "| ---: | --- | --- | --- | ---: | --- | --- |",
    ]
    rank = 0
    for candidate in ordered:
        ranking = candidate.get("ranking", {})
        eligible = ranking.get("eligible", False)
        if eligible:
            rank += 1
            rank_value = rank
        else:
            rank_value = "—"
        slug = candidate["slug"]
        repository = candidate.get("canonical_url") or candidate.get("url")
        license_name = candidate.get("verification", {}).get("license", "—")
        score = ranking.get("total", "—")
        lines.append(
            f"| {rank_value} | [{candidate['name']}](candidates/{slug}.json) | {repository} | {license_name} | {score} | {eligible} | {candidate.get('discovered_date', '—')} |"
        )
    return "\n".join(lines) + "\n"


def export_state(state_dir: Path, registry_dir: Path) -> dict:
    state = read_state(state_dir)
    candidates = state["candidates.json"]
    slugs = [candidate["slug"] for candidate in candidates["candidates"]]
    if len(slugs) != len(set(slugs)):
        raise ValueError("state contains duplicate candidate slugs")
    candidate_dir = registry_dir / "candidates"
    candidate_dir.mkdir(parents=True, exist_ok=True)
    for candidate in candidates["candidates"]:
        write_json_atomic(candidate_dir / f"{candidate['slug']}.json", candidate)
    for path in candidate_dir.glob("*.json"):
        if path.name != "index.json" and path.stem not in slugs:
            path.unlink()
    write_json_atomic(candidate_dir / "index.json", {
        "description": candidates["description"],
        "ordered_slugs": slugs,
    })
    write_json_atomic(registry_dir / "researched.json", state["researched.json"])
    write_json_atomic(registry_dir / "discovery-history.json", state["discovery-history.json"])
    write_json_atomic(registry_dir / "registry.json", {
        "schema_version": 1,
        "authority": "github_registry",
        "source_repository": SOURCE_REPOSITORY,
        "registry_repository": REGISTRY_REPOSITORY,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "candidates": len(slugs),
            "solutions": len(state["researched.json"].get("solutions", [])),
            "orphaned_entries": len(state["researched.json"].get("orphaned_entries", [])),
            "discovery_runs": len(state["discovery-history.json"].get("runs", [])),
        },
    })
    (registry_dir / "README.md").write_text(render_readme(candidates), encoding="utf-8")
    registry = read_registry(registry_dir)
    if registry != state:
        raise RuntimeError("exported registry does not match state")
    return {
        "status": "exported",
        "candidate_count": len(slugs),
        "solution_count": len(state["researched.json"].get("solutions", [])),
        "history_run_count": len(state["discovery-history.json"].get("runs", [])),
        "verified": True,
        "state_writes": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["verify", "rebuild", "export"])
    parser.add_argument("--registry-dir", type=Path, required=True)
    parser.add_argument("--state-dir", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "verify":
        result = compare(args.state_dir, args.registry_dir)
    elif args.command == "rebuild":
        result = rebuild(args.state_dir, args.registry_dir)
    else:
        result = export_state(args.state_dir, args.registry_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        raise SystemExit(f"REGISTRY_SYNC_STOPPED: {exc}") from exc
