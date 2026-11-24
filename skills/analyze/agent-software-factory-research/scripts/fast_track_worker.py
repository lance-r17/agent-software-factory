#!/usr/bin/env python3
"""Poll fast-track Issues, publish reviews, and run authorized imports."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from candidate_utils import load_json, write_json_atomic
from fast_track import (
    STATUS_LABELS,
    import_approved_issue,
    issue_labels,
    review_issue,
)
from repository_resolver import load_resolution_fixture
from fast_track import load_evidence_fixture


class GitHubIssueClient:
    def __init__(self, repository: str, token: str):
        if repository.count("/") != 1 or not token:
            raise ValueError("repository and a non-empty GitHub token are required")
        self.repository = repository
        self.token = token
        self.base = f"https://api.github.com/repos/{repository}"

    def request(self, method: str, path: str, payload: Mapping[str, Any] | None = None) -> Any:
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "agent-software-factory-fast-track-worker",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        if data is not None:
            headers["Content-Type"] = "application/json"

        def open_request() -> Any:
            with urlopen(Request(f"{self.base}{path}", data=data, headers=headers, method=method), timeout=30) as response:
                content = response.read()
            return json.loads(content.decode("utf-8")) if content else None

        for attempt in range(2):
            try:
                return open_request()
            except (URLError, TimeoutError, ConnectionError):
                if attempt == 0:
                    time.sleep(0.2)
                    continue
                raise
        raise RuntimeError("unreachable GitHub request state")

    def list_issues(self, required_labels: list[str]) -> list[dict[str, Any]]:
        query = urlencode({"state": "open", "labels": ",".join(required_labels), "per_page": 100})
        result = self.request("GET", f"/issues?{query}")
        if not isinstance(result, list):
            raise RuntimeError("GitHub Issue list response must be an array")
        return [item for item in result if isinstance(item, dict) and "pull_request" not in item]

    def get_issue(self, number: int) -> dict[str, Any]:
        result = self.request("GET", f"/issues/{number}")
        if not isinstance(result, dict):
            raise RuntimeError("GitHub Issue response must be an object")
        return result

    def update_labels(self, number: int, labels: list[str]) -> dict[str, Any]:
        result = self.request("PATCH", f"/issues/{number}", {"labels": labels})
        if not isinstance(result, dict):
            raise RuntimeError("GitHub label update response must be an object")
        return result

    def comment(self, number: int, body: str) -> None:
        self.request("POST", f"/issues/{number}/comments", {"body": body})


def _reviewing_labels(issue: Mapping[str, Any]) -> list[str]:
    labels = issue_labels(issue)
    labels.difference_update(STATUS_LABELS)
    labels.update({"candidate:fast-track", "status:reviewing"})
    return sorted(labels)


def _failure_labels(issue: Mapping[str, Any]) -> list[str]:
    labels = issue_labels(issue)
    labels.difference_update(STATUS_LABELS)
    labels.update({"candidate:fast-track", "status:needs-evidence"})
    return sorted(labels)


def run_worker(
    client: GitHubIssueClient,
    *,
    candidates_path: Path,
    researched_path: Path,
    history_path: Path,
    work_dir: Path,
    resolver_fixture_path: Path | None = None,
    evidence_fixture_path: Path | None = None,
    today: str,
    trusted_authors: set[str],
) -> dict[str, Any]:
    work_dir.mkdir(parents=True, exist_ok=True)
    resolver_fixture = load_resolution_fixture(resolver_fixture_path) if resolver_fixture_path else None
    evidence_fixture = load_evidence_fixture(evidence_fixture_path)
    queue = client.list_issues(["candidate:fast-track", "status:queued"])
    queue.extend(client.list_issues(["candidate:fast-track", "status:approved", "approval:maintainer"]))
    numbers = []
    for item in queue:
        number = item.get("number")
        if isinstance(number, int) and number not in numbers:
            numbers.append(number)

    results = []
    for number in numbers:
        issue = client.get_issue(number)
        try:
            if "status:approved" not in issue_labels(issue):
                issue = client.update_labels(number, _reviewing_labels(issue))
            review = review_issue(
                issue, load_json(candidates_path), load_json(researched_path),
                resolver_fixture=resolver_fixture, evidence_fixture=evidence_fixture,
                today=today, trusted_authors=trusted_authors,
            )
            write_json_atomic(work_dir / f"issue-{number}-review.json", review)
            issue = client.update_labels(number, review["labels"])
            if review["decision"] != "approved" or not review["import_eligible"]:
                client.comment(number, review["comment"])
                results.append({"number": number, "decision": review["decision"], "imported": False})
                continue

            result = import_approved_issue(
                issue, review,
                candidates_path=candidates_path, researched_path=researched_path, history_path=history_path,
                resolver_fixture_path=resolver_fixture_path, evidence_fixture_path=evidence_fixture_path,
                today=today, trusted_authors=trusted_authors,
            )
            write_json_atomic(work_dir / f"issue-{number}-import.json", result)
            client.update_labels(number, result["labels"])
            client.comment(number, result["comment"])
            results.append({"number": number, "decision": result["decision"], "imported": result["decision"] == "imported"})
        except Exception as exc:
            latest = client.get_issue(number)
            client.update_labels(number, _failure_labels(latest))
            client.comment(number, "Fast Track 自动处理未完成，已转为 `status:needs-evidence`。请等待维护者检查运行记录并重新排队；系统未将本次处理视为入池成功。")
            results.append({"number": number, "decision": "processing_failed", "error": str(exc), "imported": False})

    return {
        "status": "completed",
        "processed_count": len(results),
        "results": results,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "work_dir": str(work_dir),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", default="lance-r17/agent-software-factory")
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--researched", type=Path, required=True)
    parser.add_argument("--history", type=Path, required=True)
    parser.add_argument("--work-dir", type=Path, default=Path("/tmp/asf-fast-track-worker"))
    parser.add_argument("--resolver-fixture", type=Path)
    parser.add_argument("--evidence-fixture", type=Path)
    parser.add_argument("--trusted-author", action="append", dest="trusted_authors")
    parser.add_argument("--date", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("FAST_TRACK_WORKER_STOPPED: GITHUB_TOKEN is required in the host environment")
    client = GitHubIssueClient(args.repository, token)
    result = run_worker(
        client,
        candidates_path=args.candidates, researched_path=args.researched, history_path=args.history,
        work_dir=args.work_dir, resolver_fixture_path=args.resolver_fixture,
        evidence_fixture_path=args.evidence_fixture, today=args.date,
        trusted_authors=set(args.trusted_authors or ["lance-r17"]),
    )
    write_json_atomic(args.output, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, HTTPError, json.JSONDecodeError) as exc:
        raise SystemExit(f"FAST_TRACK_WORKER_STOPPED: {exc}") from exc
