"""Shared candidate JSON, URL, and atomic-state helpers."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit, urlunsplit

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SUPPORTED_HOSTS = {"github.com", "www.github.com", "gitee.com", "www.gitee.com"}
UNKNOWN_LICENSES = {"", "NONE", "NOASSERTION", "UNKNOWN", "UNVERIFIED"}
SUPPORTED_SPDX_LICENSES = {
    "0BSD",
    "AGPL-3.0",
    "Apache-2.0",
    "Artistic-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "BSL-1.0",
    "CC-BY-4.0",
    "CC-BY-SA-4.0",
    "CC0-1.0",
    "CPL-1.0",
    "ECL-2.0",
    "EPL-2.0",
    "EUPL-1.2",
    "GPL-2.0",
    "GPL-3.0",
    "ISC",
    "LGPL-2.1",
    "LGPL-3.0",
    "MIT",
    "MIT-0",
    "MPL-2.0",
    "PostgreSQL",
    "Python-2.0",
    "Ruby",
    "Unlicense",
    "Zlib",
}


def normalize_spdx_license(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("a verified SPDX license is required")
    normalized = value.strip()
    if normalized.upper() in UNKNOWN_LICENSES:
        raise ValueError("a verified SPDX license is required")
    for license_id in SUPPORTED_SPDX_LICENSES:
        if normalized.lower() == license_id.lower():
            return license_id
    raise ValueError(f"unsupported or unverified SPDX license: {normalized}")


def load_json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object in {path}")
    return value


def write_json_atomic(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def canonicalize_repo_url(value: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("repository URL must be a non-empty string")
    raw = value.strip()
    if "://" not in raw:
        raw = "https://" + raw
    parts = urlsplit(raw)
    host = (parts.hostname or "").lower()
    if host not in SUPPORTED_HOSTS:
        raise ValueError(f"unsupported repository host: {host or raw}")
    segments = [segment for segment in parts.path.split("/") if segment]
    if len(segments) < 2:
        raise ValueError(f"repository URL must include owner and repository: {value}")
    owner = segments[0].lower()
    repository = segments[1].lower()
    if repository.endswith(".git"):
        repository = repository[:-4]
    if not owner or not repository:
        raise ValueError(f"invalid repository URL: {value}")
    normalized_host = "github.com" if "github.com" in host else "gitee.com"
    return urlunsplit(("https", normalized_host, f"/{owner}/{repository}", "", ""))


def slug_from_url(value: str) -> str:
    repository = canonicalize_repo_url(value).rstrip("/").rsplit("/", 1)[-1]
    slug = re.sub(r"[^a-z0-9]+", "-", repository.lower()).strip("-")
    if not SLUG_PATTERN.fullmatch(slug):
        raise ValueError(f"cannot derive a valid slug from {value}")
    return slug


def repository_urls(item: dict) -> set[str]:
    values = [item.get("url"), item.get("canonical_url")]
    values.extend(item.get("aliases", []))
    values.extend(item.get("previous_urls", []))
    result = set()
    for value in values:
        if not isinstance(value, str) or not value:
            continue
        try:
            result.add(canonicalize_repo_url(value))
        except ValueError:
            continue
    return result


def known_index(candidates: dict, researched: dict) -> tuple[set[str], dict[str, str]]:
    slugs = {
        item.get("slug") for item in candidates.get("candidates", []) if item.get("slug")
    }
    urls: dict[str, str] = {}
    for item in candidates.get("candidates", []):
        for url in repository_urls(item):
            urls[url] = item.get("slug", "unknown")
    for section in ("solutions", "orphaned_entries"):
        for item in researched.get(section, []):
            slug = item.get("slug")
            if slug:
                slugs.add(slug)
            for url in repository_urls(item):
                urls[url] = slug or "unknown"
            for source in item.get("sources", []):
                try:
                    canonical = canonicalize_repo_url(source)
                except ValueError:
                    continue
                urls[canonical] = slug or "unknown"
    return slugs, urls
