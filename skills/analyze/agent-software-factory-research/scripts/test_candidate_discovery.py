#!/usr/bin/env python3
"""Offline fixture tests for candidate discovery, ranking, and selection."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from candidate_utils import canonicalize_repo_url

HERE = Path(__file__).resolve().parent
DISCOVER = HERE / "discover_candidates.py"
RANK = HERE / "rank_candidates.py"
SELECT = HERE / "select_candidate.py"


def candidate(name="New Agent", slug="new-agent", url="https://github.com/example/new-agent"):
    return {
        "slug": slug,
        "name": name,
        "url": url,
        "review": {"approved": True, "topic_relevant": True, "notes": "Official code with a distinct repair workflow."},
        "discovery": {"source": "github", "query": "software engineering agent", "source_url": url},
        "verification": {"official_repository_checked": True, "license": "MIT", "archived": False, "checked_at": "2026-11-23"},
        "scores": {
            "relevance": 5, "factory_fit": 4, "novelty": 4, "documentation": 4,
            "reproducibility": 4, "maintenance": 3, "evidence": 5, "risk_penalty": 1,
        },
        "selection_reason": "Official code with a distinct repair workflow.",
    }


class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.candidates = self.root / "candidates.json"
        self.researched = self.root / "researched.json"
        self.history = self.root / "history.json"
        self.input = self.root / "input.json"
        self.resolver_fixture = self.root / "resolver-fixture.json"
        self.write(self.candidates, {"candidates": [{
            "slug": "existing", "name": "Existing", "url": "https://github.com/example/existing",
            "discovered_date": "2026-11-21", "status": "pending",
        }]})
        self.write(self.researched, {
            "solutions": [{"slug": "recorded", "sources": ["https://github.com/example/recorded"]}],
            "orphaned_entries": [{"slug": "orphan", "sources": ["https://github.com/example/orphan"]}],
        })

    def tearDown(self):
        self.temp.cleanup()

    @staticmethod
    def write(path, value):
        path.write_text(json.dumps(value, indent=2) + "\n")

    def run_script(self, script, *args, expected=0):
        result = subprocess.run([sys.executable, str(script), *map(str, args)], text=True, capture_output=True)
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        return json.loads(result.stdout) if result.stdout.strip().startswith("{") else result.stdout

    def import_input(self, values, *extra, resolutions=None):
        self.write(self.input, {"candidates": values, "source_errors": [{"source": "openalex", "error": "429"}]})
        fixture = {"resolutions": {}}
        for raw in values:
            if not isinstance(raw, dict) or not raw.get("url"):
                continue
            verification = raw.get("verification", {})
            fixture["resolutions"][raw["url"]] = {
                "resolved_url": raw["url"],
                "fork": raw.get("fork", False),
                "parent_url": raw.get("parent_url"),
                "source_repo_url": raw.get("source_repo_url"),
                "archived": verification.get("archived", False),
                "license": verification.get("license"),
            }
            for parent in (raw.get("parent_url"), raw.get("source_repo_url")):
                if parent:
                    fixture["resolutions"].setdefault(parent, {
                        "resolved_url": parent,
                        "fork": False,
                        "archived": False,
                        "license": "MIT",
                    })
        if resolutions:
            fixture["resolutions"].update(resolutions)
            for record in resolutions.values():
                for parent in (record.get("parent_url"), record.get("source_repo_url")):
                    if parent:
                        fixture["resolutions"].setdefault(parent, {
                            "resolved_url": parent,
                            "fork": False,
                            "archived": False,
                            "license": record.get("license") or "MIT",
                        })
        self.write(self.resolver_fixture, fixture)
        return self.run_script(
            DISCOVER, "--input", self.input, "--candidates", self.candidates,
            "--researched", self.researched, "--history", self.history,
            "--date", "2026-11-23", "--resolver-fixture", self.resolver_fixture, *extra,
        )

    def test_canonical_url_variants(self):
        expected = "https://github.com/example/new-agent"
        for value in [
            "https://github.com/Example/New-Agent.git",
            "github.com/example/new-agent/",
            "https://www.github.com/example/new-agent?tab=readme#top",
        ]:
            self.assertEqual(canonicalize_repo_url(value), expected)

    def test_dry_run_has_zero_state_writes(self):
        before = self.candidates.read_bytes()
        result = self.import_input([candidate()], "--dry-run")
        self.assertEqual(result["added_count"], 1)
        self.assertEqual(self.candidates.read_bytes(), before)
        self.assertFalse(self.history.exists())
        self.assertEqual(result["source_errors"][0]["error"], "429")

    def test_import_then_duplicate_is_idempotent(self):
        first = self.import_input([candidate()])
        self.assertEqual(first["added_count"], 1)
        second = self.import_input([candidate(url="https://github.com/Example/New-Agent.git")])
        self.assertEqual(second["added_count"], 0)
        self.assertEqual(second["duplicate_count"], 1)
        data = json.loads(self.candidates.read_text())
        self.assertEqual(len(data["candidates"]), 2)
        self.assertEqual(len(json.loads(self.history.read_text())["runs"]), 2)

    def test_fork_defaults_to_parent_and_dedupes_recorded_source(self):
        raw = candidate(name="Fork", slug="fork", url="https://github.com/someone/fork")
        raw.update({"fork": True, "parent_url": "https://github.com/example/recorded"})
        result = self.import_input([raw])
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["duplicate_count"], 1)

    def test_unreviewed_or_archived_without_exception_is_rejected(self):
        unreviewed = candidate(slug="unreviewed", url="https://github.com/example/unreviewed")
        unreviewed["review"]["approved"] = False
        archived = candidate(slug="archived", url="https://github.com/example/archived")
        archived["verification"]["archived"] = True
        before = self.candidates.read_bytes()
        result = self.import_input([unreviewed, archived])
        self.assertEqual(result["rejected_count"], 2)
        self.assertEqual(self.candidates.read_bytes(), before)

    def test_ranked_selection_is_deterministic_and_legacy_default_is_unchanged(self):
        first = candidate(name="First", slug="first", url="https://github.com/example/first")
        second = candidate(name="Second", slug="second", url="https://github.com/example/second")
        self.import_input([first, second])
        data = json.loads(self.candidates.read_text())
        data["candidates"][1]["scores"]["relevance"] = 3
        data["candidates"][2]["scores"]["relevance"] = 5
        self.write(self.candidates, data)
        self.run_script(RANK, "--candidates", self.candidates, "--date", "2026-11-23", "--write")
        selected = self.run_script(
            SELECT, "--candidates", self.candidates, "--researched", self.researched,
            "--date", "2026-11-23", "--strategy", "ranked",
        )
        self.assertEqual(selected["candidate"]["slug"], "second")
        self.assertEqual(selected["strategy"], "ranked")
        self.assertTrue(selected["compared_candidates"])
        legacy = self.run_script(
            SELECT, "--candidates", self.candidates, "--researched", self.researched, "--date", "2026-11-23",
        )
        self.assertEqual(legacy["candidate"]["slug"], "existing")

    def test_ranked_tie_break_prefers_earlier_discovery_then_slug(self):
        alpha = candidate(name="Alpha", slug="alpha", url="https://github.com/example/alpha")
        beta = candidate(name="Beta", slug="beta", url="https://github.com/example/beta")
        self.import_input([beta, alpha])
        self.run_script(RANK, "--candidates", self.candidates, "--date", "2026-11-23", "--write")
        selected = self.run_script(
            SELECT, "--candidates", self.candidates, "--researched", self.researched,
            "--date", "2026-11-23", "--strategy", "ranked",
        )
        self.assertEqual(selected["candidate"]["slug"], "alpha")

    def test_ranked_mode_does_not_fallback_silently_to_legacy_pool(self):
        result = self.run_script(
            SELECT, "--candidates", self.candidates, "--researched", self.researched,
            "--date", "2026-11-23", "--strategy", "ranked",
        )
        self.assertEqual(result["status"], "empty")
        self.assertEqual(result["reason"], "no_ranked_pending_candidates")

    def test_orphan_source_url_is_deduplicated(self):
        raw = candidate(name="Orphan mirror", slug="orphan-mirror", url="https://github.com/example/orphan.git")
        result = self.import_input([raw])
        self.assertEqual(result["duplicate_count"], 1)
        self.assertEqual(result["duplicates"][0]["matched_slug"], "orphan")

    def test_redirect_resolves_before_deduping_known_repository(self):
        researched = json.loads(self.researched.read_text())
        researched["solutions"].append({"slug": "openhands", "sources": ["https://github.com/OpenHands/OpenHands"]})
        self.write(self.researched, researched)
        raw = candidate(
            name="OpenDevin stale URL",
            slug="opendevin-old-url",
            url="https://github.com/OpenDevin/OpenDevin",
        )
        result = self.import_input([raw], resolutions={
            "https://github.com/OpenDevin/OpenDevin": {
                "resolved_url": "https://github.com/OpenHands/OpenHands",
                "fork": False,
                "archived": False,
                "license": "MIT",
            },
        })
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["duplicate_count"], 1)
        self.assertEqual(result["duplicates"][0]["matched_slug"], "openhands")

    def test_redirect_records_final_url_previous_url_and_resolver(self):
        raw = candidate(
            name="RenseiAI agentfactory stale URL",
            slug="donmai-libraries",
            url="https://github.com/RenseiAI/agentfactory",
        )
        result = self.import_input([raw], "--dry-run", resolutions={
            "https://github.com/RenseiAI/agentfactory": {
                "resolved_url": "https://github.com/RenseiAI/donmai-libraries",
                "fork": False,
                "archived": False,
                "license": "MIT",
            },
        })
        self.assertEqual(result["added_count"], 1)
        item = result["candidates"][0]
        self.assertEqual(item["canonical_url"], "https://github.com/renseiai/donmai-libraries")
        self.assertIn("https://github.com/renseiai/agentfactory", item["previous_urls"])
        self.assertEqual(item["verification"]["resolved_url"], "https://github.com/renseiai/donmai-libraries")
        self.assertEqual(item["verification"]["url_resolution"], "fixture")

    def test_noassertion_license_is_rejected(self):
        raw = candidate(name="No Assertion", slug="no-assertion", url="https://github.com/example/no-assertion")
        raw["verification"]["license"] = "NOASSERTION"
        result = self.import_input([raw])
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["rejected_count"], 1)
        self.assertIn("SPDX", result["rejected"][0]["reason"])

    def test_review_conflict_is_rejected(self):
        raw = candidate(name="Conflicting review", slug="conflicting-review", url="https://github.com/example/conflicting-review")
        raw["review"]["notes"] = "Rejected: not admitted without a verified open-source license"
        result = self.import_input([raw])
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["rejected_count"], 1)
        self.assertIn("conflicts", result["rejected"][0]["reason"])

    def test_resolver_failure_rejects_candidate_and_records_source_error(self):
        raw = candidate(name="Resolver failure", slug="resolver-failure", url="https://github.com/example/resolver-failure")
        result = self.import_input([raw], resolutions={
            "https://github.com/example/resolver-failure": {"error": "simulated resolver outage"},
        })
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["rejected_count"], 1)
        self.assertTrue(any(error["source"] == "repository_resolver" for error in result["source_errors"]))

    def test_fork_metadata_from_resolver_defaults_to_parent(self):
        raw = candidate(name="Resolver fork", slug="resolver-fork", url="https://github.com/someone/metagpt")
        raw.pop("parent_url", None)
        result = self.import_input([raw], resolutions={
            "https://github.com/someone/metagpt": {
                "resolved_url": "https://github.com/someone/metagpt",
                "fork": True,
                "parent_url": "https://github.com/example/recorded",
                "archived": False,
                "license": "MIT",
            },
        })
        self.assertEqual(result["added_count"], 0)
        self.assertEqual(result["duplicate_count"], 1)
        self.assertEqual(result["duplicates"][0]["matched_slug"], "recorded")

    def test_rank_excludes_duplicate_canonical_urls(self):
        first = candidate(name="First duplicate", slug="first-duplicate", url="https://github.com/example/same")
        second = candidate(name="Second duplicate", slug="second-duplicate", url="https://github.com/example/same")
        for item in (first, second):
            item["status"] = "pending"
            item["discovered_date"] = "2026-11-23"
        self.write(self.candidates, {"candidates": [first, second]})
        result = self.run_script(RANK, "--candidates", self.candidates, "--date", "2026-11-23")
        self.assertEqual(result["candidates"], [])
        self.assertEqual(
            sorted(item["reason"] for item in result["excluded"]),
            ["duplicate_canonical_url", "duplicate_canonical_url"],
        )

    def test_history_limit_and_no_temp_files(self):
        self.import_input([candidate()], "--history-limit", "1")
        other = candidate(name="Other", slug="other", url="https://github.com/example/other")
        self.import_input([other], "--history-limit", "1")
        self.assertEqual(len(json.loads(self.history.read_text())["runs"]), 1)
        self.assertFalse(list(self.root.glob("*.tmp")))


if __name__ == "__main__":
    unittest.main()
