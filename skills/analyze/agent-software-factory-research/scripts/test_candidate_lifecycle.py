from __future__ import annotations

import unittest

from candidate_lifecycle import candidate_issue_action


class CandidateLifecycleTests(unittest.TestCase):
    def test_pending_candidate_stays_open(self):
        candidate = {"slug": "agent", "status": "pending", "ranking": {"eligible": True}}
        result = candidate_issue_action(candidate, {"solutions": []})
        self.assertEqual(result["action"], "open")

    def test_researched_candidate_closes_only_after_registry_merge(self):
        candidate = {"slug": "agent", "status": "pending", "ranking": {"eligible": True}}
        result = candidate_issue_action(candidate, {"solutions": [{"slug": "agent"}]})
        self.assertEqual(result["action"], "close")
        self.assertEqual(result["state_reason"], "completed")
        self.assertEqual(result["after"], "registry_pr_merged")

    def test_duplicate_closes_as_duplicate(self):
        candidate = {"slug": "agent", "status": "duplicate"}
        result = candidate_issue_action(candidate, {"solutions": []})
        self.assertEqual(result["state_reason"], "duplicate")
        self.assertEqual(result["after"], "comment")

    def test_rejected_or_archived_closes_not_planned(self):
        for candidate in ({"slug": "agent", "status": "rejected"}, {"slug": "agent", "lifecycle": "archived"}):
            result = candidate_issue_action(candidate, {"solutions": []})
            self.assertEqual(result["action"], "close")
            self.assertEqual(result["state_reason"], "not_planned")

    def test_legacy_ineligible_closes_not_planned(self):
        candidate = {"slug": "legacy", "status": "pending", "ranking": {"eligible": False}}
        result = candidate_issue_action(candidate, {"solutions": []})
        self.assertEqual(result["action"], "close")
        self.assertEqual(result["state_reason"], "not_planned")


if __name__ == "__main__":
    unittest.main()
