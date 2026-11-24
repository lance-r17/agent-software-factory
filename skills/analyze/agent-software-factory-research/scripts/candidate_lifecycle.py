#!/usr/bin/env python3
"""Derive safe Issue lifecycle actions without changing registry data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from candidate_utils import load_json


def candidate_issue_action(candidate: dict, researched: dict) -> dict:
    slug = candidate.get("slug")
    if not isinstance(slug, str) or not slug:
        raise ValueError("candidate slug is required")
    if any(item.get("slug") == slug for item in researched.get("solutions", [])):
        return {
            "action": "close",
            "state_reason": "completed",
            "after": "registry_pr_merged",
            "reason": "研究已发布，等待 registry PR 合并后闭环。",
        }
    if candidate.get("status") == "duplicate":
        return {
            "action": "close",
            "state_reason": "duplicate",
            "after": "comment",
            "reason": "已有相同候选，评论链接后关闭。",
        }
    if candidate.get("status") in {"rejected", "archived"} or candidate.get("lifecycle") == "archived":
        return {
            "action": "close",
            "state_reason": "not_planned",
            "after": "comment",
            "reason": "候选已拒绝或归档，保留 registry 记录后关闭。",
        }
    if candidate.get("ranking", {}).get("eligible") is False:
        return {
            "action": "close",
            "state_reason": "not_planned",
            "after": "comment",
            "reason": "候选不符合当前排名资格，作为 legacy ineligible 闭环并保留记录。",
        }
    return {
        "action": "open",
        "state_reason": None,
        "after": None,
        "reason": "候选仍在活动生命周期中。",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--researched", type=Path, required=True)
    args = parser.parse_args()
    result = candidate_issue_action(load_json(args.candidate), load_json(args.researched))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise SystemExit(f"CANDIDATE_LIFECYCLE_STOPPED: {exc}") from exc
