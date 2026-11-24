from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

from candidate_utils import write_json_atomic
from registry_sync import compare, export_state, rebuild


class RegistrySyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="registry-sync-test-")
        self.root = Path(self.temporary.name)
        self.state = self.root / "state"
        self.registry = self.root / "registry"
        self.state.mkdir()
        self.registry.mkdir()
        self.candidates = {
            "description": "test candidate pool",
            "candidates": [
                {
                    "slug": "legacy", "name": "Legacy", "url": "https://github.com/example/legacy",
                    "discovered_date": "2026-11-21", "status": "pending",
                    "ranking": {"eligible": False, "reason": "official_repository_not_checked"},
                },
                {
                    "slug": "agent-one", "name": "Agent One", "url": "https://github.com/example/agent-one",
                    "canonical_url": "https://github.com/example/agent-one", "discovered_date": "2026-11-24", "status": "pending",
                    "verification": {"license": "MIT", "license_source": "repository_metadata"},
                    "ranking": {"eligible": True, "total": 82.5},
                },
            ],
        }
        self.researched = {"solutions": [{"slug": "done", "name": "Done"}], "orphaned_entries": [], "latest_website_version": "abc1234"}
        self.history = {"runs": [{"date": "2026-11-24", "added": ["agent-one"], "duplicates": [], "rejected": [], "source_errors": []}]}
        self.write_state(self.state)

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def write_json(path: Path, value: dict):
        write_json_atomic(path, value)

    def write_state(self, directory: Path):
        directory.mkdir(parents=True, exist_ok=True)
        self.write_json(directory / "candidates.json", self.candidates)
        self.write_json(directory / "researched.json", self.researched)
        self.write_json(directory / "discovery-history.json", self.history)

    def test_export_and_failure_recovery_rebuild_exact_state(self):
        exported = export_state(self.state, self.registry)
        self.assertEqual(exported["candidate_count"], 2)
        self.assertTrue(exported["verified"])
        recovered = self.root / "recovered"
        recovered.mkdir()
        for name in ("candidates.json", "researched.json", "discovery-history.json"):
            self.write_json(recovered / name, {})
        result = rebuild(recovered, self.registry)
        self.assertEqual(result["status"], "rebuilt")
        for name in ("candidates.json", "researched.json", "discovery-history.json"):
            self.assertEqual((recovered / name).read_bytes(), (self.state / name).read_bytes())
        self.assertEqual(compare(recovered, self.registry)["status"], "matched")

    def test_export_removes_stale_candidate_and_ranks_readme(self):
        stale = self.registry / "candidates" / "stale.json"
        self.write_json(stale, {"slug": "stale"})
        export_state(self.state, self.registry)
        self.assertFalse(stale.exists())
        readme = (self.registry / "README.md").read_text()
        self.assertLess(readme.index("Agent One"), readme.index("Legacy"))
        self.assertIn("82.5", readme)

    def test_verify_mismatch_does_not_write_state_or_registry(self):
        export_state(self.state, self.registry)
        state_before = (self.state / "candidates.json").read_bytes()
        registry_before = (self.registry / "candidates" / "agent-one.json").read_bytes()
        changed = json.loads((self.registry / "candidates" / "agent-one.json").read_text())
        changed["name"] = "Changed"
        self.write_json(self.registry / "candidates" / "agent-one.json", changed)
        result = compare(self.state, self.registry)
        self.assertEqual(result["status"], "mismatch")
        self.assertTrue(result["differences"]["candidates.json"])
        self.assertEqual((self.state / "candidates.json").read_bytes(), state_before)
        self.assertNotEqual((self.registry / "candidates" / "agent-one.json").read_bytes(), registry_before)

    def test_invalid_order_stops_rebuild_without_writes(self):
        export_state(self.state, self.registry)
        recovered = self.root / "recovered"
        recovered.mkdir()
        sentinel = {"sentinel": True}
        self.write_json(recovered / "candidates.json", sentinel)
        index = json.loads((self.registry / "candidates" / "index.json").read_text())
        index["ordered_slugs"].append("legacy")
        self.write_json(self.registry / "candidates" / "index.json", index)
        with self.assertRaisesRegex(ValueError, "duplicate slugs"):
            rebuild(recovered, self.registry)
        self.assertEqual(json.loads((recovered / "candidates.json").read_text()), sentinel)

    def test_export_rejects_duplicate_state_slugs(self):
        self.candidates["candidates"].append(dict(self.candidates["candidates"][0]))
        self.write_state(self.state)
        with self.assertRaisesRegex(ValueError, "duplicate candidate slugs"):
            export_state(self.state, self.registry)


if __name__ == "__main__":
    unittest.main()
