#!/usr/bin/env python3
"""Validate and rank pending candidates with an explainable deterministic score."""

from __future__ import annotations

import argparse
from datetime import date as current_date
import json
from pathlib import Path

from candidate_utils import load_json, write_json_atomic

WEIGHTS = {
    "relevance": 0.25,
    "factory_fit": 0.15,
    "novelty": 0.15,
    "documentation": 0.10,
    "reproducibility": 0.15,
    "maintenance": 0.05,
    "evidence": 0.15,
}
SCORE_FIELDS = tuple(WEIGHTS) + ("risk_penalty",)


def evaluate(candidate: dict, ranked_at: str) -> tuple[dict, dict | None]:
    slug = candidate.get("slug", "unknown")
    verification = candidate.get("verification", {})
    if candidate.get("status") != "pending":
        return {"slug": slug, "eligible": False, "reason": "status_not_pending"}, None
    if verification.get("official_repository_checked") is not True:
        return {"slug": slug, "eligible": False, "reason": "official_repository_not_checked"}, None
    if not verification.get("license"):
        return {"slug": slug, "eligible": False, "reason": "license_missing"}, None
    if verification.get("archived") is True and not verification.get("archived_exception"):
        return {"slug": slug, "eligible": False, "reason": "archived_without_exception"}, None
    if not candidate.get("selection_reason"):
        return {"slug": slug, "eligible": False, "reason": "selection_reason_missing"}, None
    scores = candidate.get("scores", {})
    values = {}
    for field in SCORE_FIELDS:
        value = scores.get(field)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 5:
            return {"slug": slug, "eligible": False, "reason": f"invalid_score:{field}"}, None
        values[field] = float(value)
    breakdown = {
        field: round(values[field] * weight * 20, 2) for field, weight in WEIGHTS.items()
    }
    risk_deduction = round(values["risk_penalty"] * 4, 2)
    total = round(sum(breakdown.values()) - risk_deduction, 2)
    ranking = {
        "eligible": True,
        "total": total,
        "score_breakdown": breakdown,
        "risk_deduction": risk_deduction,
        "ranked_at": ranked_at,
    }
    return {"slug": slug, "eligible": True, "total": total}, ranking


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--date", default=current_date.today().isoformat())
    parser.add_argument("--write", action="store_true", help="Atomically persist ranking metadata")
    args = parser.parse_args()
    data = load_json(args.candidates)
    candidates = data.get("candidates", [])
    if not isinstance(candidates, list):
        raise SystemExit("candidates must be an array")
    ranked = []
    excluded = []
    updated = dict(data)
    updated_candidates = []
    for original in candidates:
        candidate = dict(original)
        summary, ranking = evaluate(candidate, args.date)
        if ranking is None:
            excluded.append(summary)
            if args.write:
                candidate["ranking"] = {"eligible": False, "reason": summary["reason"], "ranked_at": args.date}
        else:
            ranked.append((summary["total"], candidate.get("discovered_date", "9999-12-31"), candidate["slug"], candidate, ranking))
            if args.write:
                candidate["ranking"] = ranking
        updated_candidates.append(candidate)
    ordered = sorted(ranked, key=lambda item: (-item[0], item[1], item[2]))
    if args.write:
        updated["candidates"] = updated_candidates
        write_json_atomic(args.candidates, updated)
    print(json.dumps({
        "status": "ranked" if args.write else "dry_run",
        "ranked_at": args.date,
        "candidates": [{
            "slug": candidate["slug"],
            "name": candidate.get("name"),
            "total": ranking["total"],
            "score_breakdown": ranking["score_breakdown"],
            "risk_deduction": ranking["risk_deduction"],
            "selection_reason": candidate.get("selection_reason"),
        } for _, _, _, candidate, ranking in ordered],
        "excluded": excluded,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
