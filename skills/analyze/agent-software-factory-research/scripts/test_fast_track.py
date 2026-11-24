from __future__ import annotations

import copy
import json
from pathlib import Path
import tempfile
import unittest

from fast_track import (
    import_approved_issue,
    parse_issue_repository,
    review_issue,
    sha256_file,
)


REPOSITORY = "https://github.com/tencent/loopforge"
README = """# LoopForge

A coding agent for autonomous software engineering and delivery.

## Installation

```bash
docker compose up
```

## Usage

The multi-agent workflow uses roles, SOP orchestration, pull request review,
human approval, sandbox execution, tests, and benchmark evidence. See docs/
for architecture and documentation about security and permission boundaries.
""" + "Additional reproducible documentation. " * 80


def pages_body(repository: str = REPOSITORY) -> str:
    return f"""### 仓库 URL
{repository}

### 许可证文件证据（可选）
无

### 补充说明（可选）
无

---
由 GitHub Pages Fast Track 入口生成。"""


class FakeIssueClient:
    def __init__(self, issue):
        self.issues = {issue["number"]: copy.deepcopy(issue)}
        self.comments = []

    def list_issues(self, required_labels):
        result = []
        for issue in self.issues.values():
            labels = {label["name"] for label in issue["labels"]}
            if set(required_labels).issubset(labels):
                result.append(copy.deepcopy(issue))
        return result

    def get_issue(self, number):
        return copy.deepcopy(self.issues[number])

    def update_labels(self, number, labels):
        self.issues[number]["labels"] = [{"name": label} for label in labels]
        return self.get_issue(number)

    def comment(self, number, body):
        self.comments.append({"number": number, "body": body})


class FastTrackTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="fast-track-test-")
        self.root = Path(self.temporary.name)
        self.candidates_path = self.root / "candidates.json"
        self.researched_path = self.root / "researched.json"
        self.history_path = self.root / "discovery-history.json"
        self.resolver_fixture_path = self.root / "resolver.json"
        self.evidence_fixture_path = self.root / "evidence.json"
        self.write(self.candidates_path, {"candidates": []})
        self.write(self.researched_path, {"solutions": [], "orphaned_entries": []})
        self.write(self.history_path, {"runs": []})
        self.resolver_record = {
            "resolved_url": REPOSITORY,
            "archived": False,
            "fork": False,
            "license": "MIT",
            "name": "LoopForge",
            "description": "Coding agent for software delivery",
            "default_branch": "main",
            "pushed_at": "2026-11-20T00:00:00Z",
            "resolver": "fixture",
        }
        self.write(self.resolver_fixture_path, {"resolutions": {REPOSITORY: self.resolver_record}})
        self.write(self.evidence_fixture_path, {"repositories": {REPOSITORY: {
            "readme": README,
            "latest_release": {"tag_name": "v1.0.0", "html_url": f"{REPOSITORY}/releases/tag/v1.0.0"},
        }}})
        self.issue = {
            "number": 101,
            "html_url": "https://github.com/lance-r17/agent-software-factory/issues/101",
            "body": pages_body(),
            "labels": [{"name": "candidate:fast-track"}, {"name": "status:queued"}],
            "user": {"login": "lance-r17"},
            "author_association": "OWNER",
        }

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def write(path: Path, value: dict):
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def review(self, issue=None):
        from repository_resolver import load_resolution_fixture
        from fast_track import load_evidence_fixture
        return review_issue(
            copy.deepcopy(issue or self.issue),
            json.loads(self.candidates_path.read_text()),
            json.loads(self.researched_path.read_text()),
            resolver_fixture=load_resolution_fixture(self.resolver_fixture_path),
            evidence_fixture=load_evidence_fixture(self.evidence_fixture_path),
            today="2026-11-24",
            trusted_authors={"lance-r17"},
        )

    def approve(self, issue=None):
        approved_issue = copy.deepcopy(issue or self.issue)
        review = self.review(approved_issue)
        self.assertEqual(review["decision"], "approved", review["reasons"])
        approved_issue["labels"] = [{"name": "candidate:fast-track"}, {"name": "status:approved"}]
        return approved_issue, review

    def import_issue(self, issue, review):
        return import_approved_issue(
            issue, review,
            candidates_path=self.candidates_path,
            researched_path=self.researched_path,
            history_path=self.history_path,
            resolver_fixture_path=self.resolver_fixture_path,
            evidence_fixture_path=self.evidence_fixture_path,
            today="2026-11-24",
            trusted_authors={"lance-r17"},
        )

    def test_pages_and_issue_form_bodies_parse_identically(self):
        form_issue = copy.deepcopy(self.issue)
        form_issue["body"] = pages_body().replace("无\n\n### 补充说明", "_No response_\n\n### 补充说明", 1)
        self.assertEqual(parse_issue_repository(self.issue), (REPOSITORY, None))
        self.assertEqual(parse_issue_repository(form_issue), (REPOSITORY, None))

    def test_missing_or_multiple_repository_values_need_evidence(self):
        missing = copy.deepcopy(self.issue)
        missing["body"] = "### 补充说明（可选）\n无"
        self.assertEqual(self.review(missing)["decision"], "needs_evidence")
        multiple = copy.deepcopy(self.issue)
        multiple["body"] = pages_body().replace(REPOSITORY, f"{REPOSITORY}\nhttps://github.com/example/other")
        result = self.review(multiple)
        self.assertEqual(result["decision"], "needs_evidence")
        self.assertIn("status:needs-evidence", result["labels"])
        duplicated_section = copy.deepcopy(self.issue)
        duplicated_section["body"] = f"### 仓库 URL\n{REPOSITORY}\n\n### 仓库 URL\nhttps://github.com/example/other"
        self.assertEqual(self.review(duplicated_section)["decision"], "needs_evidence")

    def test_non_github_and_repository_subpages_are_rejected(self):
        for value in ("https://example.com/owner/repo", "https://github.com/owner/repo/issues"):
            issue = copy.deepcopy(self.issue)
            issue["body"] = pages_body(value)
            self.assertEqual(self.review(issue)["decision"], "rejected")

    def test_green_review_has_evidence_based_scores_and_no_state_writes(self):
        before = sha256_file(self.candidates_path)
        result = self.review()
        self.assertEqual(result["decision"], "approved", result["reasons"])
        self.assertTrue(result["import_eligible"])
        self.assertEqual(result["candidate"]["verification"]["license"], "MIT")
        self.assertEqual(result["candidate"]["discovery"]["source"], "github_issue")
        self.assertGreaterEqual(result["scores"]["factory_fit"], 4)
        self.assertIn("stars are not used", result["score_evidence"]["risk_penalty"][0])
        self.assertEqual(sha256_file(self.candidates_path), before)
        self.assertIn("status:approved", result["labels"])

    def test_unknown_license_requires_manual_root_file_review(self):
        self.resolver_record["license"] = "NOASSERTION"
        self.write(self.resolver_fixture_path, {"resolutions": {REPOSITORY: self.resolver_record}})
        result = self.review()
        self.assertEqual(result["decision"], "needs_evidence")
        self.assertIn("license:manual-review", result["labels"])
        self.assertFalse(result["import_eligible"])

    def test_unsupported_license_and_archived_repository_are_rejected(self):
        for changes, reason in (({"license": "FSL-1.1-MIT"}, "unsupported_license"), ({"archived": True}, "archived_repository")):
            record = dict(self.resolver_record, **changes)
            self.write(self.resolver_fixture_path, {"resolutions": {REPOSITORY: record}})
            result = self.review()
            self.assertEqual(result["decision"], "rejected")
            self.assertTrue(any(reason in item for item in result["reasons"]))

    def test_fork_and_resolver_failure_need_evidence(self):
        self.resolver_record["fork"] = True
        self.write(self.resolver_fixture_path, {"resolutions": {REPOSITORY: self.resolver_record}})
        self.assertEqual(self.review()["decision"], "needs_evidence")
        self.write(self.resolver_fixture_path, {"resolutions": {REPOSITORY: {"error": "simulated outage"}}})
        result = self.review()
        self.assertEqual(result["decision"], "needs_evidence")
        self.assertIn("repository_resolution_failed", result["reasons"][0])

    def test_duplicate_repository_is_idempotent(self):
        self.write(self.candidates_path, {"candidates": [{
            "slug": "loopforge", "url": REPOSITORY, "canonical_url": REPOSITORY,
        }]})
        result = self.review()
        self.assertEqual(result["decision"], "duplicate")
        self.assertEqual(result["duplicate_match"]["slug"], "loopforge")
        self.assertIn("status:duplicate", result["labels"])

    def test_external_submission_requires_maintainer_approval(self):
        external = copy.deepcopy(self.issue)
        external["user"] = {"login": "external-user"}
        external["author_association"] = "NONE"
        review = self.review(external)
        self.assertEqual(review["decision"], "approved")
        self.assertFalse(review["import_eligible"])
        external["labels"] = [{"name": "candidate:fast-track"}, {"name": "status:approved"}]
        with self.assertRaisesRegex(RuntimeError, "approval:maintainer"):
            self.import_issue(external, review)

    def test_changed_issue_body_invalidates_previous_review(self):
        issue, review = self.approve()
        issue["body"] = pages_body("https://github.com/example/another-agent")
        with self.assertRaisesRegex(RuntimeError, "body changed"):
            self.import_issue(issue, review)

    def test_formal_import_writes_expected_state_and_ranking(self):
        issue, review = self.approve()
        researched_before = sha256_file(self.researched_path)
        result = self.import_issue(issue, review)
        self.assertEqual(result["decision"], "imported")
        self.assertEqual(result["import"]["status"], "imported")
        self.assertTrue(result["import"]["researched_unchanged"])
        self.assertEqual(sha256_file(self.researched_path), researched_before)
        candidates = json.loads(self.candidates_path.read_text())["candidates"]
        self.assertEqual([item["slug"] for item in candidates], ["loopforge"])
        self.assertEqual(candidates[0]["verification"]["license_source"], "repository_metadata")
        self.assertTrue(candidates[0]["ranking"]["eligible"])
        history = json.loads(self.history_path.read_text())["runs"]
        self.assertEqual(history[-1]["added"], ["loopforge"])

    def test_repeated_import_does_not_write_state_again(self):
        issue, review = self.approve()
        self.import_issue(issue, review)
        issue["labels"] = [{"name": "candidate:fast-track"}, {"name": "status:imported"}]
        before = {path.name: sha256_file(path) for path in (self.candidates_path, self.researched_path, self.history_path)}
        result = self.import_issue(issue, review)
        self.assertEqual(result["import"]["status"], "already_recorded")
        after = {path.name: sha256_file(path) for path in (self.candidates_path, self.researched_path, self.history_path)}
        self.assertEqual(before, after)

    def test_external_with_maintainer_approval_can_import(self):
        external = copy.deepcopy(self.issue)
        external["user"] = {"login": "external-user"}
        external["author_association"] = "NONE"
        review = self.review(external)
        external["labels"] = [
            {"name": "candidate:fast-track"}, {"name": "status:approved"}, {"name": "approval:maintainer"},
        ]
        result = self.import_issue(external, review)
        self.assertEqual(result["decision"], "imported")


    def run_worker(self, client):
        from fast_track_worker import run_worker
        return run_worker(
            client,
            candidates_path=self.candidates_path,
            researched_path=self.researched_path,
            history_path=self.history_path,
            work_dir=self.root / "worker",
            resolver_fixture_path=self.resolver_fixture_path,
            evidence_fixture_path=self.evidence_fixture_path,
            today="2026-11-24",
            trusted_authors={"lance-r17"},
        )

    def test_worker_processes_trusted_issue_and_stops_after_import(self):
        client = FakeIssueClient(self.issue)
        result = self.run_worker(client)
        self.assertEqual(result["processed_count"], 1)
        self.assertEqual(result["results"][0]["decision"], "imported")
        labels = {label["name"] for label in client.issues[101]["labels"]}
        self.assertIn("status:imported", labels)
        self.assertEqual(len(client.comments), 1)
        before = sha256_file(self.candidates_path)
        second = self.run_worker(client)
        self.assertEqual(second["processed_count"], 0)
        self.assertEqual(sha256_file(self.candidates_path), before)

    def test_worker_waits_for_external_approval_then_imports_when_labeled(self):
        external = copy.deepcopy(self.issue)
        external["user"] = {"login": "external-user"}
        external["author_association"] = "NONE"
        client = FakeIssueClient(external)
        first = self.run_worker(client)
        self.assertEqual(first["results"][0]["decision"], "approved")
        self.assertFalse(first["results"][0]["imported"])
        self.assertEqual(json.loads(self.candidates_path.read_text())["candidates"], [])
        labels = {label["name"] for label in client.issues[101]["labels"]}
        self.assertIn("status:approved", labels)

        client.issues[101]["labels"].append({"name": "approval:maintainer"})
        second = self.run_worker(client)
        self.assertEqual(second["results"][0]["decision"], "imported")
        self.assertEqual(json.loads(self.candidates_path.read_text())["candidates"][0]["slug"], "loopforge")


if __name__ == "__main__":
    unittest.main()
