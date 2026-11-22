#!/usr/bin/env python3
"""Select exactly one unresearched candidate without modifying state."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

SUCCESS_STATUSES = {"published_as_preview_version", "saved_as_preview_version"}
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Cannot read valid JSON from {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise SystemExit(f"Expected a JSON object in {path}")
    return value


def emit(status: str, date: str, **extra: object) -> None:
    print(json.dumps({"status": status, "date": date, **extra}, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--researched", type=Path, required=True)
    parser.add_argument("--date", default=datetime.now(ZoneInfo("Asia/Shanghai")).date().isoformat())
    parser.add_argument("--slug", help="Explicitly select one pending candidate from the pool")
    args = parser.parse_args()

    candidate_data = load_json(args.candidates)
    researched = load_json(args.researched)
    solutions = researched.get("solutions", [])
    orphaned = researched.get("orphaned_entries", [])
    candidates = candidate_data.get("candidates", [])
    if not all(isinstance(items, list) for items in (solutions, orphaned, candidates)):
        raise SystemExit("solutions, orphaned_entries, and candidates must be arrays")

    for item in solutions:
        if item.get("date") == args.date and item.get("status") in SUCCESS_STATUSES:
            emit("stop", args.date, reason="daily_quota", existing_slug=item.get("slug"))
            return

    recorded = {item.get("slug") for item in solutions + orphaned if item.get("slug")}
    pending = []
    seen_pending = set()
    for item in candidates:
        slug = item.get("slug")
        if item.get("status") != "pending" or not isinstance(slug, str):
            continue
        if not SLUG_PATTERN.fullmatch(slug):
            raise SystemExit(f"Invalid candidate slug: {slug!r}")
        if slug in seen_pending:
            raise SystemExit(f"Duplicate pending candidate slug: {slug}")
        seen_pending.add(slug)
        if slug not in recorded:
            pending.append(item)

    if args.slug:
        if args.slug in recorded:
            raise SystemExit(f"Slug is already recorded: {args.slug}")
        matches = [item for item in pending if item.get("slug") == args.slug]
        if not matches:
            raise SystemExit(f"Pending candidate not found: {args.slug}")
        selected = matches[0]
    elif pending:
        selected = pending[0]
    else:
        emit("empty", args.date, reason="no_unrecorded_pending_candidates")
        return

    emit("selected", args.date, candidate=selected)


if __name__ == "__main__":
    main()
