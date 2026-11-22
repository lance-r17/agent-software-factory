#!/usr/bin/env python3
"""Validate Agent Skill packages and the website's raw Markdown registry."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required: python3 -m pip install PyYAML") from exc

ALLOWED_FIELDS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
IMPORT_PATTERN = re.compile(r"from\s+['\"]\.\./\.\./(skills/deploy/[^'\"]+?SKILL\.md)\?raw['\"]")
REFERENCE_PATTERN = re.compile(r"\]\((references/[^)\s]+)\)")
SCRIPT_PATTERN = re.compile(r"(?<![\w/.-])(scripts/[A-Za-z0-9_.-]+)")


def validate_skill(path: Path, root: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    relative = str(path.relative_to(root))
    content = path.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        return [f"{relative}: missing opening YAML frontmatter"], warnings
    parts = content.split("---", 2)
    if len(parts) != 3:
        return [f"{relative}: missing closing YAML frontmatter"], warnings
    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError as exc:
        return [f"{relative}: invalid YAML: {exc}"], warnings
    if not isinstance(frontmatter, dict):
        return [f"{relative}: frontmatter must be a map"], warnings

    unexpected = set(frontmatter) - ALLOWED_FIELDS
    if unexpected:
        errors.append(f"{relative}: unsupported fields {sorted(unexpected)}")
    name = frontmatter.get("name")
    description = frontmatter.get("description")
    if not isinstance(name, str) or not NAME_PATTERN.fullmatch(name):
        errors.append(f"{relative}: invalid skill name {name!r}")
    elif name != path.parent.name:
        errors.append(f"{relative}: name {name!r} does not match directory {path.parent.name!r}")
    if not isinstance(description, str) or not description.strip():
        errors.append(f"{relative}: description must be a non-empty string")
    elif len(description) > 1024:
        errors.append(f"{relative}: description exceeds 1024 characters")
    metadata = frontmatter.get("metadata", {})
    if not isinstance(metadata, dict) or any(
        not isinstance(key, str) or not isinstance(value, str) for key, value in metadata.items()
    ):
        errors.append(f"{relative}: metadata must map strings to strings")
    compatibility = frontmatter.get("compatibility")
    if compatibility is not None and (not isinstance(compatibility, str) or len(compatibility) > 500):
        errors.append(f"{relative}: compatibility must be a string of at most 500 characters")
    if len(content.splitlines()) > 500:
        warnings.append(f"{relative}: SKILL.md exceeds the recommended 500 lines")

    for reference in REFERENCE_PATTERN.findall(content):
        target = path.parent / reference
        if len(Path(reference).parts) != 2 or not target.is_file():
            errors.append(f"{relative}: missing or nested reference {reference}")
    for script in set(SCRIPT_PATTERN.findall(content)):
        if not (path.parent / script).is_file():
            errors.append(f"{relative}: missing script {script}")
    return errors, warnings


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    root = args.repo_root.resolve()
    skills_root = root / "skills"
    if not skills_root.is_dir():
        raise SystemExit(f"Missing skills directory: {skills_root}")

    errors: list[str] = []
    warnings: list[str] = []
    skill_files = sorted(skills_root.rglob("SKILL.md"))
    if not skill_files:
        errors.append("No SKILL.md files found")
    for path in skill_files:
        skill_errors, skill_warnings = validate_skill(path, root)
        errors.extend(skill_errors)
        warnings.extend(skill_warnings)

    registered: list[str] = []
    for registry in ("src/data/deploySkills.ts", "src/data/deploySkillsEn.ts"):
        path = root / registry
        if not path.is_file():
            errors.append(f"Missing registry: {registry}")
            continue
        content = path.read_text(encoding="utf-8")
        if re.search(r"content\s*:\s*`", content):
            errors.append(f"{registry}: inline Markdown template content remains")
        imports = IMPORT_PATTERN.findall(content)
        if len(imports) != len(set(imports)):
            errors.append(f"{registry}: duplicate raw imports")
        registered.extend(imports)

    actual = sorted(str(path.relative_to(root)) for path in (skills_root / "deploy").rglob("SKILL.md"))
    for relative in sorted(set(registered) - set(actual)):
        errors.append(f"Registry references missing file: {relative}")
    for relative in sorted(set(actual) - set(registered)):
        errors.append(f"Deploy Skill is not registered by the website: {relative}")

    result = {
        "valid": not errors,
        "repo_root": str(root),
        "skills": len(skill_files),
        "deploy_skills": len(actual),
        "registered_deploy_skills": len(set(registered)),
        "errors": errors,
        "warnings": warnings,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
