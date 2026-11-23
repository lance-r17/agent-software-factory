---
name: metagpt-deploy
description: Deploy or verify MetaGPT from fixed v0.8.1 source, with a tested Python 3.11 compatibility set, documentation-first and full-generation routes, serialized recovery, secret and execution isolation, outer automation gates, acceptance, troubleshooting, upgrades, and backups. For researching role-based SOP software-production pipelines; not for unapproved requirements, direct production writes, or unattended merges.
---

# MetaGPT v0.8.1 deployment and verification

## 0. Version contract and evidence boundaries

- Official repository: `https://github.com/FoundationAgents/MetaGPT`
- Fixed version: `v0.8.1`
- Fixed commit: `c036574507e7616c02512e7c8ad88dd847783afa`
- Official license: MIT.
- Official installation declaration: Python 3.9+; this manual only tested Python 3.11.
- Verification date: 2026-11-23; level B covers source, dependencies, compilation, core imports, and CLI help only.
- No real model call, project generation, generated-code execution, QA, Team recovery, paper, or benchmark was executed.

Actual results:

1. The original `lancedb==0.4.0` in `requirements.txt` did not resolve from either the official PyPI index or the current mirror, so the original installation failed.
2. Replacing only that line with `lancedb==0.14.0` in a temporary requirements copy completed dependency installation and `--no-deps` package installation.
3. `compileall` and core imports of `generate_repo`, `Team`, `Message`, and `Document` passed.
4. Newly resolved `click==8.5.1` made `metagpt --help` fail with `Secondary flag is not valid for non-boolean flag`; pinning `click==8.1.7` made it pass.
5. Pinning `huggingface-hub==0.30.2` removed its indirect conflict with Click 8.1.7.
6. `pip check` must still report: `metagpt 0.8.1 has requirement lancedb==0.4.0, but you have lancedb 0.14.0.` This is a known compatibility deviation, not a completely clean pass.

## 1. Hard prerequisites

- Use a dedicated account and disposable directories; do not experiment in a personal home directory or production repository.
- Prepare Python 3.11, Git, and sufficient disk. Full generation also needs an independent model-provider budget and timeout.
- No resident port is required. MetaGPT is a CLI / Python library, not a default web service.
- A local secret process writes real model keys into restricted `config2.yaml`; never place them in Git, command lines, logs, messages, state, or this manual.
- Run full generation and QA only in a disposable VM or equivalent isolation. MetaGPT’s Environment is a message-collaboration environment, not a sandbox.
- Do not mount the host Docker socket or grant push, merge, production-deployment, or Issue-closing rights.
- Mermaid CLI, Playwright, and pyppeteer are optional diagram tools; do not install browser tooling globally on a host for the core flow.

Recommended directories:

```text
/srv/agent-factory/
├── vendor/MetaGPT/       # Fixed source and .venv
├── run-home/.metagpt/    # Separate, restricted config2.yaml
├── workspace/            # Disposable artifacts; manage the actual project-root default explicitly
├── runs/                 # Approvals, commands, dependency and artifact fingerprints
└── ci-copies/            # Independent outer acceptance copies
```

## 2. Choose a route

| Route | Purpose | Model calls | Code execution | Status in this manual |
| --- | --- | --- | --- | --- |
| A · Offline verification | Fixed source, compilation, imports, and CLI | No | Source compilation and help only | Executed with the compatibility set |
| B · Documentation first | PRD, design, and tasks without code generation | Yes | No Engineer or QA | Not executed |
| C · Full generation | Coding, review, and optional QA | Yes | Yes; QA executes generated tests | Not executed |
| D · Serialized recovery | Continue from existing Team state | Usually | Depends on original switches | Not executed |

Run A before B. Consider C only after isolation, budgets, backups, and outer CI are ready. D is not an acceptance shortcut.

## 3. Route A: fixed source and compatibility installation

```bash
mkdir -p /srv/agent-factory/vendor
cd /srv/agent-factory/vendor
git clone --depth 1 --branch v0.8.1 https://github.com/FoundationAgents/MetaGPT.git
cd MetaGPT
git rev-parse HEAD
# Must print c036574507e7616c02512e7c8ad88dd847783afa

python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip

cp requirements.txt /tmp/metagpt-v081-requirements.txt
sed -i 's/^lancedb==0.4.0$/lancedb==0.14.0/' /tmp/metagpt-v081-requirements.txt
python -m pip install -r /tmp/metagpt-v081-requirements.txt
python -m pip install --no-deps -e .
python -m pip install click==8.1.7 huggingface-hub==0.30.2

python -m compileall -q metagpt
python -m pip freeze > /srv/agent-factory/runs/metagpt-v081-pip-freeze.txt
```

This is a compatibility experiment, not a new officially supported lockfile. Do not modify the fixed source to hide the deviation; replacements belong only in the temporary requirements copy and virtual environment.

## 4. Offline configuration, core imports, and CLI checks

Module import initializes configuration, and `YOUR_API_KEY` is rejected. Offline checks use isolated HOME and a non-networked placeholder configuration; never reuse it for a real model run.

```bash
export META_RUN_HOME=/srv/agent-factory/run-home
mkdir -p "$META_RUN_HOME/.metagpt"
cat > "$META_RUN_HOME/.metagpt/config2.yaml" <<'YAML'
llm:
  api_type: openai
  model: offline-verification-model
  base_url: http://127.0.0.1:9/v1
  api_key: offline-verification-placeholder
YAML
chmod 600 "$META_RUN_HOME/.metagpt/config2.yaml"

HOME="$META_RUN_HOME" python -c 'from importlib.metadata import version; from metagpt.software_company import generate_repo; from metagpt.team import Team; from metagpt.schema import Message, Document; print(version("metagpt")); print("core imports passed")'
HOME="$META_RUN_HOME" metagpt --help
python -m pip check || true
```

Review the final output manually: only the reviewed LanceDB declaration mismatch is allowed. If any other conflict appears, stop and record it; the `|| true` suffix must never be treated as a pass. Before a real run, replace the configuration in this isolated HOME rather than retaining the offline placeholder.

## 5. Real model configuration

The official entry point initializes `~/.metagpt/config2.yaml`; an existing file is first renamed with a `.bak` suffix. Run it under the dedicated account:

```bash
HOME=/srv/agent-factory/run-home metagpt --init-config
chmod 600 /srv/agent-factory/run-home/.metagpt/config2.yaml
```

A local secret process should edit the configuration:

```yaml
llm:
  api_type: "openai"
  model: "choose-a-model-available-to-your-account"
  base_url: "https://api.openai.com/v1"
  api_key: "written-by-your-local-secret-process"
```

Home `~/.metagpt/config2.yaml` overrides project `config/config2.yaml`. Do not leave different real keys in multiple locations. Before execution, check file permissions and field presence without printing the key.

## 6. Route B: documentation first

The official defaults enable implementation and code review, so disable both explicitly:

```bash
cd /srv/agent-factory/vendor/MetaGPT
source .venv/bin/activate
HOME=/srv/agent-factory/run-home metagpt "Write a CLI snake game" \
  --project-name approved_snake_docs \
  --no-implement --no-code-review --no-run-tests \
  --investment 1 --n-round 5
```

The expected team is ProductManager, Architect, and ProjectManager, producing requirement, PRD, system-design, and task documents. A real run calls models and writes workspace; this manual does not claim it was executed. Inspect:

```bash
find workspace/approved_snake_docs -maxdepth 4 -type f | sort
```

If artifacts are missing, structured output fails to parse, or budget is exhausted, retain logs and stop. Do not enable implementation to compensate for a failed documentation flow.

## 7. Route C: isolated full generation and optional QA

Run only inside a disposable VM or equivalent isolation, with an approved requirement, low budget, fewer rounds, and an outer process timeout:

```bash
HOME=/srv/agent-factory/run-home timeout 30m metagpt "Write a CLI snake game" \
  --project-name approved_snake_full \
  --implement --code-review --run-tests \
  --investment 1 --n-round 8
```

Boundaries:

- Official defaults are `implement=true`, `code_review=true`, and `run_tests=false`.
- `--run-tests` hires QaEngineer to write tests, execute Python tests, and debug from results.
- Never sync workspace directly to production; copy it to `ci-copies/` for clean CI, security scanning, and human review.
- This manual does not adopt `--privileged` from the official Docker guide. The fixed dependencies also do not prove that the official image builds reproducibly today.

## 8. Route D: serialized recovery

The official recovery path must exist and end with `team`. Back up `team.json`, role state, ProjectRepo, configuration, and dependency fingerprints first:

```bash
cp -a workspace/storage/team /srv/agent-factory/runs/team-backup-before-recovery
HOME=/srv/agent-factory/run-home metagpt \
  --recover-path workspace/storage/team \
  --investment 1 --n-round 3
```

Recovery reads the original idea from Team. Model, configuration, file, or budget changes can alter results; recovery is not idempotent replay. This route was not tested and still requires outer CI and human review.

## 9. Outer automation gates

The native CLI is not a GitHub Issue listener. An outer scheduler must:

1. Accept only maintainer-approved requirements; never trigger privileged runs from unreviewed public text.
2. Pin the version, argument array, isolated HOME, workspace, budget, rounds, and timeout; do not use `shell=True`.
3. Collect exit status, configuration fingerprint, messages, Team state, file tree, test output, and artifact hashes.
4. Send a read-only artifact copy to clean CI, secret scanning, and vulnerability scanning.
5. Let only a controlled process create a branch or PR; MetaGPT receives no push, merge, deployment, or Issue-closing rights.

Documentation-first example:

```python
from pathlib import Path
import os
import subprocess

root = Path("/srv/agent-factory")
command = [
    str(root / "vendor/MetaGPT/.venv/bin/metagpt"),
    "Create a CLI snake game",
    "--project-name", "approved_snake_docs",
    "--no-implement", "--no-code-review", "--no-run-tests",
    "--investment", "1", "--n-round", "5",
]
subprocess.run(
    command,
    cwd=root / "vendor/MetaGPT",
    env={**os.environ, "HOME": str(root / "run-home")},
    timeout=1800,
    check=True,
)
```

## 10. Acceptance gates

- [ ] `git rev-parse HEAD` exactly matches the fixed commit.
- [ ] Retain `pip freeze`, the temporary requirements diff, and the Python version.
- [ ] Retain actual output for `compileall`, core imports, and `metagpt --help`.
- [ ] `pip check` contains only the reviewed LanceDB deviation; no other conflict remains.
- [ ] Real keys are absent from Git, command lines, logs, messages, state, and artifacts.
- [ ] The first real run is documentation-first, with low budget, fewer rounds, isolated HOME, and disposable workspace.
- [ ] Full generation and QA run only in disposable isolation, without a Docker socket or production credentials.
- [ ] Artifacts enter a PR only after clean-copy project CI, security scans, a file manifest, and human review.

## 11. Troubleshooting

### `No matching distribution for lancedb==0.4.0`

This was a real failure. Follow route A and substitute 0.14.0 in the temporary copy; retain the pip check deviation and never claim the original official installation passed.

### `Secondary flag is not valid for non-boolean flag`

This was a real compatibility failure between Typer 0.9.0 and newly resolved Click. Pin `click==8.1.7`; if Hub 2.x conflicts, use the tested `huggingface-hub==0.30.2`, then rerun CLI and pip check.

### Import reports `Please set your API key in config2.yaml`

Configuration initializes during module import. Use an offline placeholder for verification; a real run writes isolated home configuration through a secret process without printing the key.

### A documentation route starts writing code

Check that all three switches are present: `--no-implement --no-code-review --no-run-tests`. Disabling tests alone does not remove the Engineer.

### QA does not execute

The official default is `run_tests=false`. Add `--run-tests` only after isolation is ready, then inspect `tests/` and `test_outputs/`.

### Workspace or configuration permission errors

Use a dedicated account, isolated HOME, and controlled project directory. Check `config2.yaml`, `.bak`, workspace, and recovery paths. Never copy configuration from an unknown archive.

### Mermaid diagrams fail

Accept core documents and code first. If diagrams are required, choose one of Mermaid CLI, Playwright, or pyppeteer and pin its browser; do not install optional tools globally on a production host.

## 12. Upgrades, backups, and security red lines

Upgrades:

1. Retain the old tag, commit, Python, pip freeze, compatibility diff, configuration backup, and artifact hashes.
2. Inspect provider, Pydantic, Typer, Click, LanceDB, and configuration-format changes.
3. Use the same approved requirement to compare roles, artifacts, cost, failures, and human-review outcomes across versions.
4. Keep the old environment until the new route passes A, B, and isolated C acceptance.

Backups: retain Team, ProjectRepo, commands, model, and dependency fingerprints without plaintext keys; apply disk quotas, redaction, and retention. Limit investment, n_round, process timeout, and provider budgets together.

Security red lines: never treat Environment as a sandbox, run unapproved requirements, execute generated tests on a production host, mount a Docker socket, or automatically push, merge, deploy, or close Issues.

## 13. Official sources

- `https://github.com/FoundationAgents/MetaGPT`
- `https://github.com/FoundationAgents/MetaGPT/releases/tag/v0.8.1`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/README.md`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/setup.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/requirements.txt`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/software_company.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/team.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/roles/role.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/environment/base_env.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/schema.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/utils/project_repo.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/docs/tutorial/usage.md`
- `https://arxiv.org/abs/2308.00352`
