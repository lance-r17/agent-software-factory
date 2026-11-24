#!/usr/bin/env python3
"""Review fast-track Issues and import approved candidates without storing credentials."""

from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from candidate_utils import (
    UNKNOWN_LICENSES,
    canonicalize_repo_url,
    known_index,
    load_json,
    normalize_spdx_license,
    slug_from_url,
    write_json_atomic,
)
from repository_resolver import (
    RepositoryResolutionError,
    load_resolution_fixture,
    resolve_repository_url,
)

SCRIPT_DIR = Path(__file__).resolve().parent
STATUS_LABELS = {
    "status:queued", "status:reviewing", "status:needs-evidence",
    "status:approved", "status:rejected", "status:duplicate", "status:imported",
}
DECISION_LABELS = {
    "approved": "status:approved",
    "needs_evidence": "status:needs-evidence",
    "rejected": "status:rejected",
    "duplicate": "status:duplicate",
    "imported": "status:imported",
}
DECISION_TEXT = {
    "approved": "绿灯：机器审查通过",
    "needs_evidence": "黄灯：需要补证或人工判断",
    "rejected": "红灯：不符合入池要求",
    "duplicate": "重复：已有候选或研究记录",
    "imported": "已正式入池",
}
OWNER_PATTERN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
REPOSITORY_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")
AGENT_TERMS = (
    "coding agent", "code agent", "software engineering agent", "ai agent",
    "agentic", "multi-agent", "autonomous agent", "编程 agent", "智能体", "多智能体",
)
FACTORY_TERMS = (
    "software", "code", "coding", "developer", "engineering", "pull request",
    "issue", "软件", "编程", "代码", "开发", "工程",
)
CAPABILITY_TERMS = {
    "role_orchestration": ("multi-agent", "multi agent", "role", "sop", "orchestrat", "多智能体", "角色", "编排"),
    "delivery_workflow": ("pipeline", "workflow", "pull request", "issue", "交付", "流水线", "工作流"),
    "execution_verification": ("test", "sandbox", "benchmark", "verify", "测试", "沙箱", "验证"),
    "human_control": ("human", "approval", "review", "人工", "审批", "评审"),
}
INSTALL_TERMS = ("install", "installation", "quickstart", "getting started", "安装", "快速开始")
USAGE_TERMS = ("usage", "quickstart", "getting started", "example", "使用", "示例")
SECURITY_TERMS = ("security", "permission", "sandbox", "approval", "安全", "权限", "沙箱", "审批")
TEST_TERMS = ("test", "benchmark", "evaluation", "测试", "基准", "评估")


class IssueInputError(ValueError):
    """The Issue needs a correctable input or additional evidence."""


class EvidenceError(ValueError):
    """Public repository evidence could not be collected completely."""


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def issue_labels(issue: Mapping[str, Any]) -> set[str]:
    result = set()
    for label in issue.get("labels", []):
        if isinstance(label, str):
            result.add(label)
        elif isinstance(label, dict) and isinstance(label.get("name"), str):
            result.add(label["name"])
    return result


def _issue_section(body: str, titles: set[str]) -> str | None:
    headings = list(re.finditer(r"^###\s+(.+?)\s*$", body, flags=re.MULTILINE))
    normalized_titles = {title.lower() for title in titles}
    sections = []
    for index, heading in enumerate(headings):
        if heading.group(1).strip().lower() not in normalized_titles:
            continue
        end = headings[index + 1].start() if index + 1 < len(headings) else len(body)
        sections.append(body[heading.end():end].strip())
    if len(sections) > 1:
        raise IssueInputError("issue_sections_must_be_unique")
    return sections[0] if sections else None


def _single_response(section: str | None) -> str:
    if section is None:
        raise IssueInputError("repository_url_missing")
    lines = []
    for raw in section.splitlines():
        line = raw.strip().strip("`").strip()
        if not line or line.startswith("<!--") or line in {"---", "***"}:
            continue
        lines.append(line)
    if len(lines) != 1:
        raise IssueInputError("repository_url_must_be_exactly_one_value")
    return lines[0]


def parse_github_root_url(value: str) -> str:
    raw = value.strip()
    if "://" not in raw:
        raw = "https://" + raw
    parts = urlsplit(raw)
    host = (parts.hostname or "").lower()
    if host not in {"github.com", "www.github.com"}:
        raise ValueError("only GitHub repository root URLs are supported")
    if parts.username or parts.password or parts.port:
        raise ValueError("repository URL must not contain credentials or a custom port")
    segments = [segment for segment in parts.path.split("/") if segment]
    if len(segments) != 2:
        raise ValueError("repository URL must be a root URL, not a branch, Issue, or file")
    owner, raw_repository = segments
    repository = re.sub(r"\.git$", "", raw_repository, flags=re.IGNORECASE)
    if not OWNER_PATTERN.fullmatch(owner) or not REPOSITORY_PATTERN.fullmatch(repository):
        raise ValueError("invalid GitHub owner or repository name")
    if repository in {".", ".."}:
        raise ValueError("invalid GitHub repository name")
    return canonicalize_repo_url(raw)


def parse_issue_repository(issue: Mapping[str, Any]) -> tuple[str, str | None]:
    body = issue.get("body")
    if not isinstance(body, str):
        raise IssueInputError("issue_body_missing")
    repository_section = _issue_section(body, {"仓库 URL", "Repository URL", "GitHub 仓库 URL", "GitHub repository URL"})
    repository = parse_github_root_url(_single_response(repository_section))
    evidence_section = _issue_section(body, {"许可证文件证据（可选）", "许可证文件证据", "License evidence", "License file evidence (optional)", "License file evidence"})
    evidence_value = evidence_section.strip() if evidence_section else ""
    evidence_url = None if evidence_value.lower() in {"", "无", "n/a", "_no response_"} else evidence_value
    return repository, evidence_url


def _request(url: str, *, raw: bool = False, allow_404: bool = False) -> Any:
    headers = {
        "Accept": "application/vnd.github.raw+json" if raw else "application/vnd.github+json",
        "User-Agent": "agent-software-factory-fast-track",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    def open_request() -> Any:
        with urlopen(Request(url, headers=headers), timeout=15) as response:
            content = response.read()
        return content.decode("utf-8") if raw else json.loads(content.decode("utf-8"))

    for attempt in range(2):
        try:
            return open_request()
        except HTTPError as exc:
            if allow_404 and exc.code == 404:
                return None
            raise EvidenceError(f"GitHub evidence request failed with HTTP {exc.code}: {url}") from exc
        except (URLError, TimeoutError, ConnectionError) as exc:
            if attempt == 0:
                time.sleep(0.2)
                continue
            raise EvidenceError(f"GitHub evidence request failed after one retry: {url}: {exc}") from exc
    raise EvidenceError(f"GitHub evidence request failed: {url}")


def load_evidence_fixture(path: Path | None) -> dict[str, Any] | None:
    if path is None:
        return None
    payload = load_json(path)
    repositories = payload.get("repositories")
    if not isinstance(repositories, dict):
        raise ValueError("evidence fixture must contain a repositories object")
    return repositories


def fetch_repository_evidence(
    resolution: Mapping[str, Any], fixture: Mapping[str, Any] | None,
) -> dict[str, Any]:
    canonical = canonicalize_repo_url(str(resolution["resolved_url"]))
    if fixture is not None:
        record = fixture.get(canonical)
        if not isinstance(record, dict):
            raise EvidenceError(f"evidence fixture has no entry for {canonical}")
        readme = record.get("readme")
        if not isinstance(readme, str) or not readme.strip():
            raise EvidenceError("fixture README is missing")
        release = record.get("latest_release")
        return {
            "readme": readme,
            "latest_release": release if isinstance(release, dict) else None,
            "readme_url": record.get("readme_url") or f"{canonical}#readme",
        }

    parts = urlsplit(canonical)
    owner, repository = [segment for segment in parts.path.split("/") if segment]
    base = f"https://api.github.com/repos/{owner}/{repository}"
    readme = _request(f"{base}/readme", raw=True)
    release = _request(f"{base}/releases/latest", allow_404=True)
    return {
        "readme": readme,
        "latest_release": release if isinstance(release, dict) else None,
        "readme_url": f"{canonical}#readme",
    }


def _contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def _maintenance_score(pushed_at: object, today: str) -> tuple[int, str]:
    if not isinstance(pushed_at, str) or not pushed_at.strip():
        return 1, "last push timestamp unavailable"
    try:
        pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00")).date()
        current = datetime.fromisoformat(today).date()
    except ValueError as exc:
        raise EvidenceError("invalid repository pushed_at timestamp") from exc
    days = max(0, (current - pushed).days)
    if days <= 30:
        return 5, f"last push {days} days before review"
    if days <= 90:
        return 4, f"last push {days} days before review"
    if days <= 180:
        return 3, f"last push {days} days before review"
    if days <= 365:
        return 2, f"last push {days} days before review"
    return 1, f"last push {days} days before review"


def score_repository(
    resolution: Mapping[str, Any], evidence: Mapping[str, Any], today: str,
) -> tuple[dict[str, int], dict[str, list[str]], list[str], bool]:
    description = resolution.get("description") if isinstance(resolution.get("description"), str) else ""
    readme = evidence["readme"]
    text = f"{description}\n{readme}".lower()
    topic_relevant = _contains_any(text, AGENT_TERMS) and _contains_any(text, FACTORY_TERMS)
    capabilities = [name for name, terms in CAPABILITY_TERMS.items() if _contains_any(text, terms)]
    capability_count = len(capabilities)
    release = evidence.get("latest_release")

    documentation = 1
    documentation_evidence = ["README retrieved"]
    if len(readme) >= 2000:
        documentation += 1
        documentation_evidence.append("README length is at least 2,000 characters")
    if len(readme) >= 8000:
        documentation += 1
        documentation_evidence.append("README length is at least 8,000 characters")
    if _contains_any(text, INSTALL_TERMS) and _contains_any(text, USAGE_TERMS):
        documentation += 1
        documentation_evidence.append("installation and usage sections are documented")
    if "docs/" in text or "documentation" in text or "文档" in text or "架构" in text:
        documentation += 1
        documentation_evidence.append("additional documentation or architecture material is linked")

    reproducibility = 1
    reproducibility_evidence = ["README retrieved from the resolved repository"]
    if _contains_any(text, INSTALL_TERMS):
        reproducibility += 1
        reproducibility_evidence.append("installation instructions are present")
    if "```" in readme:
        reproducibility += 1
        reproducibility_evidence.append("executable-style code blocks are present")
    if "docker" in text or "compose" in text or "容器" in text:
        reproducibility += 1
        reproducibility_evidence.append("container-based reproduction is documented")
    if _contains_any(text, USAGE_TERMS):
        reproducibility += 1
        reproducibility_evidence.append("usage or examples are documented")

    maintenance, maintenance_evidence = _maintenance_score(resolution.get("pushed_at"), today)
    evidence_score = 3 + (1 if release else 0) + (1 if _contains_any(text, TEST_TERMS) else 0)
    risk_penalty = 1 + (0 if release else 1) + (0 if _contains_any(text, SECURITY_TERMS) else 1)

    scores = {
        "relevance": 5 if capability_count >= 2 else 4,
        "factory_fit": min(5, capability_count + 1),
        "novelty": min(5, capability_count + 2),
        "documentation": min(5, documentation),
        "reproducibility": min(5, reproducibility),
        "maintenance": maintenance,
        "evidence": min(5, evidence_score),
        "risk_penalty": min(5, risk_penalty),
    }
    score_evidence = {
        "relevance": ["Agent and software-delivery terminology matched in official repository text"],
        "factory_fit": [f"documented capability groups: {', '.join(capabilities) or 'none'}"],
        "novelty": [f"score derived from {capability_count} distinct documented capability groups"],
        "documentation": documentation_evidence,
        "reproducibility": reproducibility_evidence,
        "maintenance": [maintenance_evidence],
        "evidence": ["repository metadata and README verified", *(["latest release verified"] if release else []), *(["test or benchmark evidence found"] if _contains_any(text, TEST_TERMS) else [])],
        "risk_penalty": ["release and security-control documentation reviewed; stars are not used"],
    }
    return scores, score_evidence, capabilities, topic_relevant


def _base_report(issue: Mapping[str, Any], trusted_authors: set[str], today: str) -> dict[str, Any]:
    labels = issue_labels(issue)
    author = issue.get("user") if isinstance(issue.get("user"), dict) else {}
    login = author.get("login") if isinstance(author.get("login"), str) else "unknown"
    association = issue.get("author_association") if isinstance(issue.get("author_association"), str) else "NONE"
    trusted = login in trusted_authors and association in {"OWNER", "MEMBER", "COLLABORATOR"}
    body = issue.get("body") if isinstance(issue.get("body"), str) else ""
    number = issue.get("number")
    if isinstance(number, bool) or not isinstance(number, int) or number < 1:
        raise ValueError("issue number must be a positive integer")
    issue_url = issue.get("html_url")
    if not isinstance(issue_url, str) or not issue_url.startswith("https://github.com/"):
        raise ValueError("issue html_url must be a GitHub URL")
    return {
        "schema_version": 1,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_date": today,
        "issue": {
            "number": number,
            "url": issue_url,
            "body_sha256": sha256_text(body),
            "author": login,
            "author_association": association,
            "trusted_submission": trusted,
        },
        "decision": "needs_evidence",
        "reasons": [],
        "evidence": [],
        "labels": sorted(labels),
        "import_eligible": False,
    }


def _desired_labels(report: dict[str, Any], decision: str, *, license_manual: bool = False) -> list[str]:
    labels = set(report["labels"])
    labels.difference_update(STATUS_LABELS)
    labels.add(DECISION_LABELS[decision])
    labels.add("candidate:fast-track")
    if license_manual:
        labels.add("license:manual-review")
    return sorted(labels)


def _finalize(report: dict[str, Any], decision: str, reasons: list[str], *, license_manual: bool = False) -> dict[str, Any]:
    report["decision"] = decision
    report["reasons"] = reasons
    report["labels"] = _desired_labels(report, decision, license_manual=license_manual)
    if decision == "approved":
        report["import_eligible"] = bool(
            report["issue"]["trusted_submission"] or "approval:maintainer" in issue_labels_from_names(report["labels"])
        )
    report["issue_action"] = {
        "duplicate": {"action": "close", "state_reason": "duplicate", "after": "comment"},
        "rejected": {"action": "close", "state_reason": "not_planned", "after": "comment"},
        "imported": {"action": "close", "state_reason": "completed", "after": "registry_pr_merged"},
    }.get(decision, {"action": "open", "state_reason": None, "after": None})
    if decision == "duplicate" and report.get("duplicate_match", {}).get("slug"):
        report["issue_action"]["duplicate_of_candidate_slug"] = report["duplicate_match"]["slug"]
    report["comment"] = render_review_comment(report)
    return report


def issue_labels_from_names(labels: list[str]) -> set[str]:
    return set(labels)


def render_review_comment(report: Mapping[str, Any]) -> str:
    issue = report["issue"]
    repository = report.get("repository", {})
    candidate = report.get("candidate", {})
    verification = candidate.get("verification", {}) if isinstance(candidate, dict) else {}
    lines = [
        "## Fast Track 机器审查",
        "",
        f"- 结论：{DECISION_TEXT[report['decision']]}",
        f"- 仓库：{repository.get('resolved_url', repository.get('input_url', '未解析'))}",
        f"- Issue 正文 SHA-256：`{issue['body_sha256']}`",
        f"- 审查日期：{report['review_date']}",
    ]
    if report.get("reasons"):
        lines.append(f"- 原因：{', '.join(report['reasons'])}")
    if verification:
        lines.append(f"- 许可证：{verification.get('license')}（{verification.get('license_source')}）")
    if report.get("scores"):
        lines.extend(["", "### 机器评分", ""])
        for field, value in report["scores"].items():
            lines.append(f"- `{field}`：{value}")
    if report["decision"] == "approved":
        lines.extend(["", "符合受信自动导入条件。" if report.get("import_eligible") else "等待维护者添加 `approval:maintainer` 后才能导入。"])
    issue_action = report.get("issue_action", {})
    if issue_action.get("after") == "comment":
        lines.extend(["", f"处理已完成，可作为 {issue_action['state_reason']} 关闭；registry 数据不受影响。"])
    elif issue_action.get("after") == "registry_pr_merged":
        lines.extend(["", "registry PR 合并后，本 Fast Track Issue 可作为 completed 关闭；Candidate Issue 继续保持 open。"])
    else:
        lines.extend(["", "提交或机器审查通过不等于已入池；正式导入前会重新校验 Issue 正文和仓库状态。"])
    return "\n".join(lines)


def review_issue(
    issue: Mapping[str, Any],
    candidates_data: dict,
    researched_data: dict,
    *,
    resolver_fixture: Mapping[str, Any] | None = None,
    evidence_fixture: Mapping[str, Any] | None = None,
    today: str,
    trusted_authors: set[str],
) -> dict[str, Any]:
    if "candidate:fast-track" not in issue_labels(issue):
        raise ValueError("issue is missing candidate:fast-track")
    report = _base_report(issue, trusted_authors, today)
    try:
        repository, license_evidence_url = parse_issue_repository(issue)
    except IssueInputError as exc:
        return _finalize(report, "needs_evidence", [str(exc)])
    except ValueError as exc:
        report["repository"] = {"input_url": "invalid"}
        return _finalize(report, "rejected", [str(exc)])

    report["repository"] = {"input_url": repository}
    if license_evidence_url:
        report["license_evidence_url"] = license_evidence_url
    try:
        resolution = resolve_repository_url(repository, fixture=resolver_fixture)
    except RepositoryResolutionError as exc:
        return _finalize(report, "needs_evidence", [f"repository_resolution_failed: {exc}"])

    resolved = canonicalize_repo_url(resolution["resolved_url"])
    report["repository"] = {
        "input_url": repository,
        "resolved_url": resolved,
        "resolver": resolution.get("resolver"),
        "redirected": bool(resolution.get("redirected")),
    }
    report["evidence"].append({"check": "repository_resolution", "result": "passed", "source_url": resolved})
    if resolution.get("resolver") not in {"github_api", "fixture"}:
        return _finalize(report, "needs_evidence", ["repository_metadata_unavailable"])

    known_slugs, known_urls = known_index(candidates_data, researched_data)
    slug = slug_from_url(resolved)
    duplicate_url = next((url for url in {repository, resolved} if url in known_urls), None)
    if slug in known_slugs or duplicate_url:
        report["duplicate_match"] = {
            "slug": slug if slug in known_slugs else known_urls[duplicate_url],
            "url": duplicate_url or resolved,
        }
        report["comment"] = ""
        finalized = _finalize(report, "duplicate", ["candidate_already_known"])
        report["comment"] = render_review_comment(finalized) + f"\n\n已有候选：`{finalized['duplicate_match']['slug']}`。"
        return finalized

    if resolution.get("fork") is True:
        return _finalize(report, "needs_evidence", ["fork_requires_manual_official_repository_review"])
    if resolution.get("archived") is True:
        return _finalize(report, "rejected", ["archived_repository"])
    if resolution.get("archived") is not False:
        return _finalize(report, "needs_evidence", ["archive_status_unavailable"])
    report["evidence"].append({"check": "archive_status", "result": "not_archived", "source_url": resolved})

    raw_license = resolution.get("license")
    if not isinstance(raw_license, str) or raw_license.strip().upper() in UNKNOWN_LICENSES:
        return _finalize(report, "needs_evidence", ["license_metadata_unknown_requires_manual_root_file_review"], license_manual=True)
    try:
        license_name = normalize_spdx_license(raw_license)
    except ValueError:
        return _finalize(report, "rejected", [f"unsupported_license: {raw_license}"])
    report["evidence"].append({"check": "license", "result": license_name, "source_url": f"{resolved}/blob/{resolution.get('default_branch') or 'main'}/LICENSE"})

    try:
        evidence = fetch_repository_evidence(resolution, evidence_fixture)
        scores, score_evidence, capabilities, topic_relevant = score_repository(resolution, evidence, today)
    except EvidenceError as exc:
        return _finalize(report, "needs_evidence", [str(exc)])
    if not topic_relevant:
        return _finalize(report, "needs_evidence", ["agent_software_factory_topic_evidence_not_found"])

    name = resolution.get("name") if isinstance(resolution.get("name"), str) else slug
    capability_text = ", ".join(capabilities)
    selection_reason = (
        f"Fast Track Issue #{report['issue']['number']} machine review: official GitHub metadata and "
        f"{license_name} license verified; README documents {capability_text}. Scores use repository, "
        "documentation, release, and maintenance evidence; stars are not used."
    )
    candidate = {
        "slug": slug,
        "name": name,
        "url": resolved,
        "review": {"decision": "approved", "approved": True, "topic_relevant": True, "notes": selection_reason},
        "discovery": {"source": "github_issue", "query": repository, "source_url": report["issue"]["url"]},
        "verification": {
            "official_repository_checked": True,
            "license": license_name,
            "archived": False,
            "checked_at": today,
        },
        "scores": scores,
        "selection_reason": selection_reason,
    }
    report["candidate"] = candidate
    report["scores"] = scores
    report["score_evidence"] = score_evidence
    report["evidence"].extend([
        {"check": "readme", "result": "retrieved", "source_url": evidence["readme_url"]},
        {"check": "maintenance", "result": score_evidence["maintenance"][0], "source_url": resolved},
        {"check": "latest_release", "result": evidence.get("latest_release", {}).get("tag_name") if evidence.get("latest_release") else "none", "source_url": evidence.get("latest_release", {}).get("html_url") if evidence.get("latest_release") else resolved},
    ])
    return _finalize(report, "approved", [])


def _run_json(command: list[str]) -> dict[str, Any]:
    completed = subprocess.run(command, text=True, capture_output=True, timeout=180)
    if completed.returncode:
        raise RuntimeError(f"command failed ({completed.returncode}): {completed.stderr.strip() or completed.stdout.strip()}")
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"command did not return JSON: {completed.stdout[:500]}") from exc
    if not isinstance(result, dict):
        raise RuntimeError("command JSON result must be an object")
    return result


def _same_approved_candidate(previous: Mapping[str, Any], current: Mapping[str, Any]) -> bool:
    before = previous.get("candidate")
    after = current.get("candidate")
    if not isinstance(before, dict) or not isinstance(after, dict):
        return False
    fields = ("slug", "name", "url", "scores", "selection_reason", "discovery")
    if any(before.get(field) != after.get(field) for field in fields):
        return False
    before_verification = before.get("verification", {})
    after_verification = after.get("verification", {})
    return all(before_verification.get(field) == after_verification.get(field) for field in ("license", "archived", "checked_at"))


@contextmanager
def _import_lock(state_path: Path):
    digest = sha256_text(str(state_path.parent.resolve()))[:16]
    lock_path = Path("/tmp") / f"asf-fast-track-import-{digest}.lock"
    with lock_path.open("w") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError("another fast-track import is already running for this state directory") from exc
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def import_approved_issue(
    issue: Mapping[str, Any],
    previous_review: Mapping[str, Any],
    *,
    candidates_path: Path,
    researched_path: Path,
    history_path: Path,
    resolver_fixture_path: Path | None = None,
    evidence_fixture_path: Path | None = None,
    today: str,
    trusted_authors: set[str],
) -> dict[str, Any]:
    if previous_review.get("decision") != "approved":
        raise RuntimeError("only an approved review can be imported")
    previous_issue = previous_review.get("issue", {})
    if previous_issue.get("number") != issue.get("number") or previous_issue.get("url") != issue.get("html_url"):
        raise RuntimeError("review belongs to a different Issue")
    body = issue.get("body") if isinstance(issue.get("body"), str) else ""
    if previous_issue.get("body_sha256") != sha256_text(body):
        raise RuntimeError("Issue body changed after review; a new review is required")

    resolver_fixture = load_resolution_fixture(resolver_fixture_path) if resolver_fixture_path else None
    evidence_fixture = load_evidence_fixture(evidence_fixture_path)
    candidates_data = load_json(candidates_path)
    researched_data = load_json(researched_path)
    current = review_issue(
        issue, candidates_data, researched_data,
        resolver_fixture=resolver_fixture, evidence_fixture=evidence_fixture,
        today=today, trusted_authors=trusted_authors,
    )
    if current["decision"] == "duplicate" and issue_labels(issue) & {"status:duplicate", "status:imported"}:
        current["import"] = {"status": "already_recorded", "state_writes": False}
        return current
    if current["decision"] != "approved":
        raise RuntimeError(f"repository no longer passes review: {current['decision']}: {current['reasons']}")
    if not _same_approved_candidate(previous_review, current):
        raise RuntimeError("repository evidence or scores changed after review; a new review is required")
    labels = issue_labels(issue)
    if "status:approved" not in labels:
        raise RuntimeError("Issue must have status:approved before import")
    if not current["issue"]["trusted_submission"] and "approval:maintainer" not in labels:
        raise RuntimeError("external submissions require approval:maintainer")

    before = {
        "candidates": sha256_file(candidates_path),
        "researched": sha256_file(researched_path),
        "history": sha256_file(history_path) if history_path.exists() else None,
    }
    with _import_lock(candidates_path), tempfile.TemporaryDirectory(prefix="fast-track-import-") as temporary:
        curated_path = Path(temporary) / "curated.json"
        write_json_atomic(curated_path, {"candidates": [current["candidate"]], "source_errors": []})
        common = [
            sys.executable, str(SCRIPT_DIR / "discover_candidates.py"), "import",
            "--input", str(curated_path), "--candidates", str(candidates_path),
            "--researched", str(researched_path), "--date", today,
        ]
        if resolver_fixture_path:
            common.extend(["--resolver-fixture", str(resolver_fixture_path)])
        dry_run = _run_json([*common, "--dry-run"])
        if dry_run["duplicate_count"] == 1 and dry_run["added_count"] == 0:
            duplicate = _finalize(current, "duplicate", ["candidate_already_known"])
            duplicate["import"] = {"status": "already_recorded", "state_writes": False, "dry_run": dry_run}
            return duplicate
        if not (
            dry_run["added_count"] == 1 and dry_run["duplicate_count"] == 0
            and dry_run["rejected_count"] == 0 and dry_run["source_errors"] == []
        ):
            raise RuntimeError(f"unexpected dry-run result: {json.dumps(dry_run, ensure_ascii=False)}")

        _run_json([*common, "--history", str(history_path)])
        ranking = _run_json([
            sys.executable, str(SCRIPT_DIR / "rank_candidates.py"),
            "--candidates", str(candidates_path), "--date", today, "--write",
        ])

    after = {
        "candidates": sha256_file(candidates_path),
        "researched": sha256_file(researched_path),
        "history": sha256_file(history_path) if history_path.exists() else None,
    }
    if after["researched"] != before["researched"]:
        raise RuntimeError("researched.json changed during fast-track import")
    if after["candidates"] == before["candidates"] or after["history"] == before["history"]:
        raise RuntimeError("formal import did not update both candidates and discovery history")

    slug = current["candidate"]["slug"]
    imported = _finalize(current, "imported", [])
    imported["import"] = {
        "status": "imported",
        "slug": slug,
        "dry_run": dry_run,
        "state_sha256_before": before,
        "state_sha256_after": after,
        "researched_unchanged": True,
    }
    ranked = next((item for item in ranking["candidates"] if item["slug"] == slug), None)
    if ranked:
        imported["import"]["ranking"] = {"total": ranked["total"]}
    imported["comment"] = render_review_comment(imported) + f"\n\n候选 `{slug}` 已完成原子导入与排名写入。"
    return imported


def _add_common_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--issue-json", type=Path, required=True, help="GitHub Issue JSON exported by the host")
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--researched", type=Path, required=True)
    parser.add_argument("--resolver-fixture", type=Path)
    parser.add_argument("--evidence-fixture", type=Path)
    parser.add_argument("--date", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--trusted-author", action="append", dest="trusted_authors")
    parser.add_argument("--output", type=Path, required=True, help="Review report destination outside state/")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    review_parser = subparsers.add_parser("review", help="Review one fast-track Issue without writing state")
    _add_common_arguments(review_parser)
    review_parser.add_argument("--curated-output", type=Path)
    import_parser = subparsers.add_parser("import", help="Revalidate and atomically import one approved Issue")
    _add_common_arguments(import_parser)
    import_parser.add_argument("--review", type=Path, required=True)
    import_parser.add_argument("--history", type=Path, required=True)
    args = parser.parse_args()

    issue = load_json(args.issue_json)
    trusted_authors = set(args.trusted_authors or ["lance-r17"])
    if args.command == "review":
        resolver_fixture = load_resolution_fixture(args.resolver_fixture) if args.resolver_fixture else None
        evidence_fixture = load_evidence_fixture(args.evidence_fixture)
        report = review_issue(
            issue, load_json(args.candidates), load_json(args.researched),
            resolver_fixture=resolver_fixture, evidence_fixture=evidence_fixture,
            today=args.date, trusted_authors=trusted_authors,
        )
        write_json_atomic(args.output, report)
        if args.curated_output:
            if report["decision"] != "approved":
                raise RuntimeError("curated output is available only for an approved review")
            write_json_atomic(args.curated_output, {"candidates": [report["candidate"]], "source_errors": []})
    else:
        report = import_approved_issue(
            issue, load_json(args.review),
            candidates_path=args.candidates, researched_path=args.researched, history_path=args.history,
            resolver_fixture_path=args.resolver_fixture, evidence_fixture_path=args.evidence_fixture,
            today=args.date, trusted_authors=trusted_authors,
        )
        write_json_atomic(args.output, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError, subprocess.SubprocessError) as exc:
        raise SystemExit(f"FAST_TRACK_STOPPED: {exc}") from exc
