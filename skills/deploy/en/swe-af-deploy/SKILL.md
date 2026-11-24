---
name: swe-af-deploy
description: Deploy or verify SWE-AF with a pinned commit, least privilege, and explicit budgets. Covers offline Python tests, Python Compose, the Go node, single-Issue delegation, recovery, troubleshooting, and safety boundaries for integrating an AgentField multi-Agent engineering team into a software factory. Not for automatic merge or unattended production release.
---

# SWE-AF deployment and acceptance manual

## 0. Version contract and evidence boundary

- Official repository: `https://github.com/Agent-Field/SWE-AF`
- Pinned commit: `0de536488f279c982fc03f5f5660011a7501e0cb`
- Page version: `main@0de5364`; facts verified: `2026-11-24`
- License: Apache-2.0.
- No latest official GitHub Release is available; the `0.1.0` in `pyproject.toml` is not presented as a Release here.
- Tested: isolated Python 3.12 installation, `compileall`, core imports, `pip check`, and `2641 passed, 1 skipped`.
- Known warning: the pinned `claude-agent-sdk==0.1.20` is currently yanked upstream; successful installation does not remove this maintenance risk.
- Not tested: real models, AgentField services, Docker, Go, Railway, real Issue repair, checkpoint recovery, PRs, CI repair, or benchmarks.
- The official PR #179 example reporting 10/10 Issues, 217 tests, and $19.23 is project material, never a result from this run.

## 1. Hard prerequisites

Prepare only what the selected route needs:

| Item | Requirement | Check |
| --- | --- | --- |
| Pinned source | HEAD must equal the commit above | `git rev-parse HEAD` |
| Python route | Python 3.12+ | `python3.12 --version` |
| Go route | Working Go toolchain; not tested here | `go version` |
| Container route | Docker 20.10+, Compose 2.0+, BuildKit | `docker version && docker compose version` |
| Control plane | AgentField; Python requires `agentfield>=0.1.145` | Record the resolved version |
| Runtime | AForge / Claude Code / OpenCode / Codex; Command Code is Python-only | Install only the selected CLI |
| Ports | CP 8080; Python 8003/8004; Go 8005/8006 | Check conflicts and avoid public exposure |
| Workspace | Dedicated `/workspaces` or explicit `SWE_WORKSPACE_ROOT` | Writable by a dedicated account with quota |
| Credentials | One selected model provider; GH_TOKEN only when needed | Secret-process injection, never Git |

Create a dedicated runtime account and directories. Never run a full build directly on a host containing personal CLI logins, long-lived tokens, production repositories, or a Docker socket.

```bash
sudo install -d -m 700 -o swe-af -g swe-af /srv/agent-factory
sudo -iu swe-af
cd /srv/agent-factory
git clone https://github.com/Agent-Field/SWE-AF.git vendor/SWE-AF
cd vendor/SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb
test "$(git rev-parse HEAD)" = "0de536488f279c982fc03f5f5660011a7501e0cb"
```

## 2. Choose one route

| Route | Use when | Output | Primary boundary |
| --- | --- | --- | --- |
| A · Offline Python verification | Upgrade review, dependency audit, CI preflight | Compilation, import, and unit-test evidence | Does not prove model builds or Go |
| B · Python Compose | Official control plane plus planner and fast nodes | Services on 8080/8003/8004, workspace, artifacts, optional PR | Privilege and cost; not started here |
| C · Go node | Adopt the current `af install` default implementation | Go planner and fast on 8005/8006 | Not built here; beta-engine defaults differ |
| D · Single-Issue delegation | An outer planner already exists and only the coding loop is needed | Isolated branch, commits, files_changed, verification | No push or PR by default; caller owns merge |

Run A first, then select only the required route among B, C, and D. Never start same-named Python and Go nodes together merely for feature coverage.

## 3. Route A: pinned source and offline Python verification

These are the command shapes actually executed in this analysis. Use an isolated virtual environment without system site-packages:

```bash
cd /srv/agent-factory/vendor/SWE-AF
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m compileall -q swe_af
python -m pip check
python -c "import swe_af; import swe_af.app; import agentfield; print(agentfield.__version__)"
```

This run resolved `agentfield 0.1.146`. Retain the full dependency fingerprint:

```bash
python -m pip freeze > /srv/agent-factory/artifacts/python-requirements.freeze.txt
python --version > /srv/agent-factory/artifacts/python-version.txt
```

Before tests, ensure the process inherits no real model or GitHub credentials. Clear every relevant variable in your environment, not only these examples:

```bash
env \
  -u ANTHROPIC_API_KEY -u CLAUDE_CODE_OAUTH_TOKEN \
  -u OPENROUTER_API_KEY -u OPENAI_API_KEY -u GOOGLE_API_KEY \
  -u MINIMAX_API_KEY -u INFRON_API_KEY -u RUNCRATE_API_KEY \
  -u CHEAPERINFERENCE_API_KEY -u GH_TOKEN -u EXA_API_KEY \
  .venv/bin/python -m pytest -q | tee /srv/agent-factory/artifacts/pytest.txt
```

Pass criteria: correct pinned commit, successful installation and imports, no broken requirements from `pip check`, and no failed tests. Keep yanked and test warnings in the report rather than deleting them.

## 4. Route B: Python Compose full stack

> Official route; not started in this analysis. It builds an image containing multiple Agent CLIs and can execute generated code and shell commands.

### 4.1 Configuration

```bash
cd /srv/agent-factory/vendor/SWE-AF
cp .env.example .env
chmod 600 .env
```

Configure only the selected model provider. Pin the runtime explicitly so the presence of OpenRouter cannot silently switch to AForge:

```dotenv
# Example keys, not real values; let your local secret process write them
SWE_DEFAULT_RUNTIME=open_code
SWE_DEFAULT_MODEL=<an-approved-model-supported-by-this-runtime>
OPENROUTER_API_KEY=<written-by-the-secret-process>
```

Boundaries:

- Use `GH_TOKEN` only for private clones, push, or PRs; leave it unset for local public-repository work.
- Remove the official Compose `${HOME}/.codex` volume when Codex subscription auth is unnecessary. Do not rely on read-only mode or directory permissions to reduce what an Agent can read.
- For containers or remote deployment, set `AGENT_CALLBACK_URL` to an address reachable from the control plane; Python planner defaults to `http://swe-agent:8003`.
- `build-db` is a shared ephemeral test database. Serialize database-dependent builds or create one database per build.
- Never mount a Docker socket or production directory, and never expose an unauthenticated control plane publicly.

### 4.2 Startup and health checks

```bash
docker compose config --quiet
docker compose up -d --build
curl -f http://localhost:8080/api/v1/health
curl -f http://localhost:8003/health
curl -f http://localhost:8004/health
docker compose ps
```

Retain non-sensitive state and logs. Logs may contain secrets, so review before sharing:

```bash
docker compose ps > /srv/agent-factory/artifacts/compose-ps.txt
docker compose logs --no-color swe-agent swe-fast > /srv/agent-factory/artifacts/node.log
```

### 4.3 Full build for an approved goal

> Official API shape only; not executed here. A full build can produce hundreds to thousands of model calls.

```bash
curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.build \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "input": {
    "goal": "Add the already approved authentication change",
    "repo_path": "/workspaces/approved-project",
    "config": {
      "runtime": "open_code",
      "models": {"default": "<approved-model-id>"},
      "max_coding_iterations": 2,
      "max_advisor_invocations": 1,
      "max_replans": 1,
      "max_ci_fix_cycles": 1,
      "enable_learning": false
    }
  }
}
JSON
```

Query the returned `execution_id`:

```bash
curl http://localhost:8080/api/v1/executions/<execution_id>
curl http://localhost:8080/api/v1/executions/<execution_id>/notes
```

`completed_with_debt` is not a complete pass. Review original acceptance criteria, failed and skipped lists, technical debt, branch diffs, and independent CI.

## 5. Route C: Go node

> This environment has no Go toolchain; no Go build or test was executed here.

After pinning source, select `//go` explicitly instead of depending on future root-manifest redirection:

```bash
cd /srv/agent-factory/vendor/SWE-AF
af install "$PWD//go"
af run swe-planner
curl -f http://localhost:8005/health
```

The Go fast node defaults to 8006. Set distinct `NODE_ID` values when sharing a control plane with Python; otherwise both register as `swe-planner` and `swe-fast`.

Add source verification in a dedicated Go environment:

```bash
cd /srv/agent-factory/vendor/SWE-AF/go
GOWORK=off go build ./...
GOWORK=off go vet ./...
GOWORK=off go test ./...
go version > /srv/agent-factory/artifacts/go-version.txt
```

`af install` and Desktop enable the beta coding engine with `SWE_PRO_ENGINE=1`; clones, Compose, and bare binaries disable it by default. During upgrades, review the engine, model pools, callbacks, and `SWE_PRO_MAX_COST`. Go does not support `command_code`.

## 6. Route D: single-Issue delegation

Use this when an outer system has already planned the task. The target repository needs at least one commit; uncommitted changes do not enter the Issue branch.

```bash
cat > /srv/agent-factory/approved-issue.json <<'JSON'
{
  "input": {
    "issue": {
      "title": "Add bounded retry to fetch_user",
      "description": "Wrap the existing HTTP call with at most three retries.",
      "acceptance_criteria": ["A retry-then-success test passes"],
      "files_to_modify": ["src/api/client.py"],
      "testing_strategy": "pytest tests/api/test_client.py"
    },
    "repo_path": "/workspaces/approved-project",
    "base_branch": "main",
    "config": {
      "runtime": "open_code",
      "models": {"default": "<approved-model-id>"},
      "enable_github_pr": false,
      "max_coding_iterations": 2,
      "agent_timeout_seconds": 900,
      "agent_max_turns": 30
    }
  }
}
JSON

curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \
  -H "Content-Type: application/json" \
  -d @/srv/agent-factory/approved-issue.json
```

Accept the returned `success`, `outcome`, `branch`, `commits`, `files_changed`, `verification`, and `debt_items`. Even `success=false` can return a branch containing commits; a run without commits may delete its branch. By default, nothing is pushed and no PR is opened. The caller inspects the diff, merges, and runs CI.

## 7. Recovery, state, and automation gates

A full build stores state under the target repository’s `.artifacts/`:

```text
.artifacts/
├── plan/           # PRD, architecture, Issue specifications, planning logs
├── execution/      # checkpoint.json, per-Issue state, Agent output
└── verification/   # Acceptance-criterion results
```

Back up artifacts, branches, and dependency fingerprints before recovery. Checkpoints do not freeze the previous runtime; after an upgrade, pass the old `config.runtime` or set a deployment override:

```bash
# Official reasoner shape; invoke asynchronously through the control plane
# swe-planner.resume_build(repo_path, artifacts_dir=".artifacts", config={
#   "runtime": "<previous-build-runtime>",
#   "models": {"default": "<compatible-model>"}
# })
```

An outer scheduler must:

1. Accept only human-approved goals or Issues.
2. Choose `build` or `implement_issue` according to whether decomposition is needed.
3. Set provider budget, application iteration / replan / CI limits, concurrency, and process timeout.
4. Retain execution_id, checkpoint, branch, commits, tests, technical debt, and cost.
5. Run independent CI, secret scanning, and vulnerability scanning on a clean copy before human PR review.
6. Never auto-merge, close Issues, or deploy production automatically.

## 8. Eight acceptance gates

- [ ] Commit, node implementation, Python / Go, AgentField SDK, runtime CLIs, and dependency fingerprints agree.
- [ ] `SWE_DEFAULT_RUNTIME`, request `config.runtime`, model IDs, and provider credentials match.
- [ ] Control plane, node health, and `AGENT_CALLBACK_URL` are reachable; ports are not publicly exposed without authentication.
- [ ] Model keys and GH_TOKEN are absent from Git, request bodies, images, logs, checkpoints, and the website.
- [ ] Workspace is isolated by build_id, with bounded network, files, processes, concurrency, timeouts, and budget.
- [ ] PRD, Issue DAG, checkpoint, recovery record, original ACs, failed and skipped lists, and technical debt are complete.
- [ ] Branch diffs, generated files, tests, and CI-repair history pass clean-environment review; an unrun reviewer is not approval.
- [ ] A controlled process may only create or update a PR; maintainers own merge, Issue closure, and production deployment.

## 9. Troubleshooting

### 9.1 `go: not found`

This was the actual local result. It is not an upstream test failure. Install and pin a Go toolchain before running section 5; until then, never claim the Go route passed.

### 9.2 `claude-agent-sdk==0.1.20` yanked warning

This was the actual installation warning. Retain the evidence and assess an upgrade; never silently change the dependency. After upgrading, rerun all Python tests and the selected-runtime smoke check.

### 9.3 Upgrade switches to AForge or changes billing

With OpenRouter present and no explicit runtime, automatic selection chooses AForge; restoring an old checkpoint does not freeze runtime either. Set `SWE_DEFAULT_RUNTIME` or `config.runtime` explicitly and inspect models plus provider billing.

### 9.4 `504 agent_unreachable`

Check whether `AGENT_CALLBACK_URL` is reachable from the control-plane container. Never use another container’s localhost, disable TLS, or weaken host verification.

### 9.5 Dual-implementation registration conflict

Python and Go use the same default NODE_ID values. Keep only one implementation, or assign distinct NODE_ID values and verify call routing.

### 9.6 Codex `bwrap: No permissions to create a new namespace`

Official documentation states that Codex workspace-write needs Linux user namespaces. Enable them in a controlled dedicated environment or choose another explicitly configured runtime; never switch to unrestricted host execution.

### 9.7 A build completes with missing functionality

Inspect `DAGState.accumulated_debt`, `adaptation_history`, failed and skipped lists, and final `VerificationResult`. Debt-bearing completion or reduced scope needs renewed maintainer approval.

### 9.8 Behavior changes after recovery

Check runtime, model, SDK, CLI, target base commit, and configuration for changes. Recovery is not idempotent replay; retain previous evidence and rerun acceptance.

## 10. Upgrades, backups, and security red lines

Upgrades:

1. Pin old and new commits, node implementation, SDK, CLIs, image digests, and complete dependencies.
2. Review manifest redirection, automatic runtime selection, model defaults, NODE_ID, ports, and the beta-engine switch.
3. Compare plans, invocation volume, debt, tests, CI, cost, and human outcomes on the same small approved task.
4. Use the old runtime explicitly for old checkpoints; retain the old environment and branches until the new route passes acceptance.

Backups: retain `.artifacts`, platform state, branches and commits, dependency fingerprints, and human decisions; never back up plaintext secrets. Apply access control, redaction, disk quotas, and retention to workspaces, logs, and raw model output.

Security red lines:

- Worktrees are not a system sandbox; `SWE_FENCE` is optional and limited to its declared scope.
- Never mount a Docker socket, production directory, or unnecessary CLI login.
- Never write model keys or GitHub tokens into Git, YAML, the website, request JSON, logs, or state.
- Never use skip, xfail, commented-out tests, or weakened assertions to obtain green CI.
- Never auto-merge, auto-close Issues, or automatically deploy production.

## 11. Official sources

- Repository and license: `https://github.com/Agent-Field/SWE-AF`
- Pinned commit: `https://github.com/Agent-Field/SWE-AF/commit/0de536488f279c982fc03f5f5660011a7501e0cb`
- README: `https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/README.md`
- Architecture: `https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/docs/ARCHITECTURE.md`
- Python package: `https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/pyproject.toml`
- Go node: `https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/go/README.md`
- Deployment: `https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/docs/deployment.md`
- Project example: `https://github.com/Agent-Field/agentfield/pull/179`
