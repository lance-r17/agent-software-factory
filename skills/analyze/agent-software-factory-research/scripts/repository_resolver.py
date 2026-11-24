#!/usr/bin/env python3
"""Resolve repository redirects and metadata before candidate deduplication."""

from __future__ import annotations

import json
from pathlib import Path
import time
from typing import Any, Mapping
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from candidate_utils import canonicalize_repo_url


class RepositoryResolutionError(ValueError):
    """Raised when a repository URL cannot be verified safely."""


def _repository_parts(url: str) -> tuple[str, str]:
    canonical = canonicalize_repo_url(url)
    parts = urlsplit(canonical)
    segments = [segment for segment in parts.path.split("/") if segment]
    if len(segments) < 2:
        raise RepositoryResolutionError(f"repository URL must include owner and repository: {url}")
    return segments[0], segments[1]


def _request_json(url: str, timeout: float) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "agent-software-factory-research",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, dict):
        raise RepositoryResolutionError(f"unexpected repository metadata payload: {url}")
    return payload


def _request_final_url(url: str, timeout: float) -> str:
    headers = {"User-Agent": "agent-software-factory-research"}
    errors = []
    for method in ("HEAD", "GET"):
        def open_request() -> str:
            request = Request(url, headers=headers, method=method)
            with urlopen(request, timeout=timeout) as response:
                return response.geturl()

        try:
            return _retry_once(open_request, f"GitHub repository {method} redirect request")
        except RepositoryResolutionError as exc:
            errors.append(f"{method}: {exc}")
    raise RepositoryResolutionError(f"could not resolve repository URL: {url}; {'; '.join(errors)}")


def _retry_once(operation, description: str):
    try:
        return operation()
    except (TimeoutError, URLError, ConnectionError) as exc:
        time.sleep(0.2)
        try:
            return operation()
        except Exception as retry_exc:
            raise RepositoryResolutionError(f"{description} failed after one retry: {retry_exc}") from retry_exc


def _resolution_from_fixture(canonical: str, record: Mapping[str, Any]) -> dict[str, Any]:
    if record.get("error"):
        raise RepositoryResolutionError(str(record["error"]))
    resolved = canonicalize_repo_url(str(record.get("resolved_url") or canonical))
    redirected = record.get("redirected")
    return {
        "original_url": canonical,
        "resolved_url": resolved,
        "redirected": resolved != canonical if redirected is None else bool(redirected),
        "fork": record.get("fork"),
        "parent_url": record.get("parent_url"),
        "source_repo_url": record.get("source_repo_url"),
        "archived": record.get("archived"),
        "license": record.get("license"),
        "name": record.get("name"),
        "description": record.get("description") or "",
        "default_branch": record.get("default_branch") or "main",
        "pushed_at": record.get("pushed_at"),
        "language": record.get("language"),
        "resolver": record.get("resolver") or "fixture",
        "warnings": list(record.get("warnings", [])),
    }


def load_resolution_fixture(path: Path) -> dict[str, dict[str, Any]]:
    """Load deterministic resolver responses for offline tests."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RepositoryResolutionError(f"Expected a JSON object in {path}")
    raw = payload.get("resolutions", {})
    if not isinstance(raw, dict):
        raise RepositoryResolutionError("resolver fixture must contain a resolutions object")
    fixture: dict[str, dict[str, Any]] = {}
    for url, record in raw.items():
        if not isinstance(record, dict):
            raise RepositoryResolutionError(f"resolver fixture entry must be an object: {url}")
        fixture[canonicalize_repo_url(url)] = dict(record)
    return fixture


def resolve_repository_url(
    url: str,
    *,
    fixture: Mapping[str, Mapping[str, Any]] | None = None,
    cache: dict[str, dict[str, Any]] | None = None,
    timeout: float = 8.0,
) -> dict[str, Any]:
    """Resolve a repository to its current canonical URL and metadata.

    GitHub API metadata is preferred. If the API is unavailable or rate-limited,
    an HTML HEAD/GET redirect fallback is used for URL identity, while reviewer
    supplied metadata remains responsible for fields the fallback cannot prove.
    """
    canonical = canonicalize_repo_url(url)
    if fixture is not None:
        record = fixture.get(canonical)
        if record is None:
            raise RepositoryResolutionError(f"resolver fixture has no entry for {canonical}")
        return _resolution_from_fixture(canonical, record)
    if cache is not None and canonical in cache:
        return dict(cache[canonical])

    host = (urlsplit(canonical).hostname or "").lower()
    if host != "github.com":
        result = {
            "original_url": canonical,
            "resolved_url": canonical,
            "redirected": False,
            "fork": None,
            "parent_url": None,
            "source_repo_url": None,
            "archived": None,
            "license": None,
            "resolver": "canonical_only",
            "warnings": [f"no repository resolver configured for host: {host}"],
        }
        if cache is not None:
            cache[canonical] = dict(result)
        return result

    owner, repository = _repository_parts(canonical)
    api_url = f"https://api.github.com/repos/{owner}/{repository}"
    api_error: Exception | None = None
    try:
        payload = _retry_once(lambda: _request_json(api_url, timeout), "GitHub repository metadata request")
        resolved = canonicalize_repo_url(str(payload.get("html_url") or canonical))
        parent = payload.get("parent") if isinstance(payload.get("parent"), dict) else {}
        source = payload.get("source") if isinstance(payload.get("source"), dict) else {}
        license_info = payload.get("license") if isinstance(payload.get("license"), dict) else {}
        result = {
            "original_url": canonical,
            "resolved_url": resolved,
            "redirected": resolved != canonical,
            "fork": payload.get("fork"),
            "parent_url": parent.get("html_url"),
            "source_repo_url": source.get("html_url"),
            "archived": payload.get("archived"),
            "license": license_info.get("spdx_id"),
            "name": payload.get("name"),
            "description": payload.get("description") or "",
            "default_branch": payload.get("default_branch") or "main",
            "pushed_at": payload.get("pushed_at"),
            "language": payload.get("language"),
            "resolver": "github_api",
            "warnings": [],
        }
    except Exception as exc:  # fall back to redirect identity below
        api_error = exc

    if api_error is not None:
        try:
            final_url = _retry_once(lambda: _request_final_url(canonical, timeout), "GitHub repository redirect request")
            resolved = canonicalize_repo_url(final_url)
            result = {
                "original_url": canonical,
                "resolved_url": resolved,
                "redirected": resolved != canonical,
                "fork": None,
                "parent_url": None,
                "source_repo_url": None,
                "archived": None,
                "license": None,
                "resolver": "html_redirect_fallback",
                "warnings": [f"GitHub API metadata unavailable: {api_error}"],
            }
        except Exception as fallback_exc:
            raise RepositoryResolutionError(
                f"repository URL could not be resolved: {canonical}; API error: {api_error}; redirect error: {fallback_exc}"
            ) from fallback_exc

    if cache is not None:
        cache[canonical] = dict(result)
    return result
