---
name: omnigent-deploy
description: Deploy and verify Omnigent v0.23.0, a multi-Agent meta-harness. Use to pin official packages and source, choose local or Docker services, configure heterogeneous coding harnesses, run the Polly parallel-worktree and cross-vendor review example, and enforce secret, policy, sandbox, backup, and human-merge gates. Not for unauthorized model calls, automatic merges, or production release.
---

# Omnigent v0.23.0 deployment and acceptance

## 0. Version contract and evidence boundaries

- Official repository: https://github.com/omnigent-ai/omnigent
- Pinned Release: `v0.23.0`, published 2026-11-19.
- Pinned commit: `033963227a3b54803ae00c5ef0f0f6fe97f5549d`.
- License: Apache-2.0, according to GitHub repository metadata.
- Verification date: 2026-11-25.
- Actually tested: isolated Python 3.12 installation of the official wheel, with `omnigent`, `omnigent-client`, and `omnigent-ui-sdk` all at 0.23.0; `pip check`, pinned-source `compileall`, core imports, both `omnigent` / `omni` CLI names, and strict Polly spec parsing passed.
- Not tested: model calls, server startup, Docker, cloud sandboxes, real Issues, fanout, cross-vendor review, PRs, benchmarks, or production deployment.

Never turn official capability descriptions, the Polly example, or commands in this manual into a generic claim of successful execution. Report only the steps and outputs you actually observed.

## 1. Hard prerequisites

The core package requires Python 3.12+. The official recommendation is `uv tool install`; `pip` is also supported.

```bash
python3.12 --version
git --version
uv --version || true
node --version || true   # Node 22 LTS+ for local coding-harness CLIs
pnpm --version || true   # When building the Web UI
tmux -V || true          # Native-terminal harnesses
bwrap --version || true  # Linux native-terminal / Pi sandbox
docker --version || true
docker compose version || true
```

Install missing prerequisites for your chosen route. Never disable a sandbox or switch to uncontrolled host execution merely to make startup succeed. Native Windows mode does not provide the same filesystem and network isolation as bwrap or seatbelt.

Prepare directories:

```bash
sudo install -d -m 750 /srv/omnigent/{vendor,agents,workspaces,artifacts,secrets}
# Assign them to a dedicated service account; keep secrets out of Git, images, and websites
```

## 2. Choose a route

| Route | Use case | Main risks | Default port |
| --- | --- | --- | --- |
| A · Offline verification | Check package, CLI, pinned source, and Agent specs | Proves nothing about model or delivery quality | None |
| B · Local control layer | Evaluate CLI, Web UI, and execution harnesses on one machine | Execution, credentials, and workspaces are on the host | 6767 |
| C · Docker service | Team server with Postgres and persistent artifacts | Authentication, HTTPS, database migration, and volume backup | 8000 |
| D · Polly example | Parallel implementation, independent review, and PR delivery | Multi-model cost, write conflicts, and vendor capability differences | Inherits selected service |

Run A first, then B or C. Enable D's implementation privileges only after a no-write task passes.

## 3. Route A: pinned offline verification

No model or GitHub credentials are needed.

```bash
python3.12 -m venv /tmp/omnigent-v023-venv
/tmp/omnigent-v023-venv/bin/python -m pip install \
  --only-binary=:all: omnigent==0.23.0
/tmp/omnigent-v023-venv/bin/python -m pip check
/tmp/omnigent-v023-venv/bin/omnigent --version
/tmp/omnigent-v023-venv/bin/omni --version
/tmp/omnigent-v023-venv/bin/omnigent run --help
/tmp/omnigent-v023-venv/bin/omnigent server --help

git clone --depth 1 --branch v0.23.0 \
  https://github.com/omnigent-ai/omnigent.git /tmp/omnigent-v0.23.0
cd /tmp/omnigent-v0.23.0
test "$(git rev-parse HEAD)" = "033963227a3b54803ae00c5ef0f0f6fe97f5549d"
/tmp/omnigent-v023-venv/bin/python -m compileall -q omnigent
```

Parse Polly strictly without expanding server environment variables and with the policy-handler allowlist enabled:

```bash
/tmp/omnigent-v023-venv/bin/python - <<'PY'
from pathlib import Path
from omnigent.spec import load
spec = load(
    Path('/tmp/omnigent-v0.23.0/examples/polly'),
    expand_env=False,
    enforce_handler_allowlist=True,
)
assert spec.name == 'polly'
assert len(spec.sub_agents) == 7
print('Polly spec: passed; sub-agents:', ', '.join(a.name for a in spec.sub_agents))
PY
```

Observed in this analysis: installation, dependency, compilation, CLI, and spec checks passed. The first full dependency installation from local source timed out; the official PyPI wheel at the same version then succeeded. Never remove dependencies to hide an installation failure.

## 4. Route B: local control layer

### 4.1 Install and configure models

```bash
uv tool install --python 3.12 'omnigent==0.23.0'
omnigent --version
omnigent setup
```

Configure only the provider you will use in `setup`. Supply real keys through the interactive secret flow or local secret manager, never through Agent YAML, command lines, Git, logs, or this manual.

Anonymous telemetry is enabled by default. Read the official Usage Telemetry guide and opt out when organizational policy requires it. Do not claim that telemetry contains no data; evaluate only the officially documented scope.

### 4.2 Start a reviewed Agent

```bash
git clone --depth 1 --branch v0.23.0 \
  https://github.com/omnigent-ai/omnigent.git
cd omnigent
omnigent run examples/polly/
```

The local server and Web UI default to `127.0.0.1:6767`. Check from another terminal:

```bash
omnigent server status
curl -f http://127.0.0.1:6767/v1/info
```

Forward only variable names required by the current session:

```bash
OMNIGENT_SESSION_ENV_PASSTHROUGH=TERMINAL_PANE_SOCKET \
  omnigent run examples/polly/
```

Do not pass the entire host environment to a runner. Routine stop:

```bash
omnigent stop
```

## 5. Route C: Docker service

The official stack contains Omnigent Server and Postgres with a persistent artifact volume. Compose enables accounts authentication by default.

```bash
cd deploy/docker
./bootstrap.sh
chmod 600 .env
docker compose config --quiet
docker compose up -d
docker compose logs -f omnigent
curl -f http://localhost:8000/v1/info
```

Create the administrator in the Web UI on first boot; never commit the admin password. A public deployment requires at least:

1. HTTPS and `OMNIGENT_ACCOUNTS_BASE_URL=https://omnigent.example.com`.
2. Accounts or OIDC; never unauthenticated single-user mode.
3. In header mode, a trusted proxy that strips spoofed client identity headers, verified with a forged-request test.
4. Checks for database migration, `/v1/info`, artifact writes, account invitation, and sign-out.
5. No `.env`, model key, GitHub Token, or workspace baked into an image.

Dangerous command:

```bash
# Deletes the database and artifact volumes; use only with explicit data-destruction approval
docker compose down -v
```

Omit `-v` for routine stops.

## 6. Route D: Polly parallel engineering example

### 6.1 Admission requirements

- A maintainer has approved the task, acceptance contract, repository scope, budget, and timeout.
- Workers from at least two different vendors are actually available; otherwise independent cross-vendor review cannot be claimed.
- Fanout is limited to tasks with disjoint file scopes and no ordering dependency.
- Each implementer owns only its worktree, branch, and PR; reviewers never edit code.
- Neither Polly nor an executor has auto-merge permission.

### 6.2 Workflow

1. Create `.worktrees/<task_id>` and `polly/<task_id>`, then record them in `.polly/registry.json`.
2. Send the task, worktree path, acceptance contract, and green gates to an implementer; record its `conversation_id`.
3. The implementer runs tests / lint / typecheck and opens its own PR.
4. Save an immutable diff for the base / head commits; never regenerate the diff through model output.
5. Give a different-vendor reviewer only the pinned diff and contract, returning blocking / non-blocking / suggestions.
6. Return blocking findings to the same implementer, update the original PR, regenerate the snapshot, and recheck.
7. Once clean, hand the PR and evidence to maintainers; never run `git merge` or `gh pr merge`.

Official entry point:

```bash
omnigent run examples/polly/
# Real models and PR operations can incur cost and external writes; execute only with authorization
```

## 7. Agent contracts and automation gates

Agent YAML can declare `executor`, `tools`, `policies`, `os_env`, `terminals`, and sub-agents. Untrusted bundles require `expand_env=False` and a handler allowlist to prevent server-process secret expansion or unapproved handler loading.

Minimal policy example:

```yaml
name: bounded_factory_agent
executor:
  harness: claude-sdk
policies:
  approve_os:
    type: function
    handler: omnigent.policies.builtins.safety.ask_on_os_tools
  cap_calls:
    type: function
    handler: omnigent.policies.builtins.safety.max_tool_calls_per_session
    factory_params:
      limit: 50
```

The outer system still owns process timeout, provider budget, concurrency, network, and Git repository and branch scope. Policies evaluate in session → Agent → server order, with DENY taking precedence. Ordinary tool-call DENY / ASK does not block the `sys_agent_start` probe, so a tool policy cannot replace Agent-launch admission.

Attachment extension and size limits are not content scans. Hiding a built-in Agent is not access control either. Retain bundle hashes, run fingerprints, sessions, registries, base / head commits, diffs, tests, reviews, costs, and human decisions for the outer factory.

## 8. Eight acceptance gates

1. **Version**: all three Python packages are 0.23.0, source HEAD is 0339632, and harness CLI plus dependency fingerprints are retained.
2. **Specs**: Agent bundles parse strictly; untrusted input receives no environment expansion or unapproved handler.
3. **Service**: local :6767 or Docker :8000 is healthy, and database migration, artifacts, accounts / OIDC, and HTTPS are verified.
4. **Secrets**: only required variables are forwarded; YAML, Git, images, logs, snapshots, and websites contain no secrets.
5. **Execution**: workspace, network, sandbox, tool-call count, process timeout, and provider budget controls are tested and effective.
6. **Parallelism**: fanout file scopes do not conflict, and the registry contains every worktree, branch, session, and PR.
7. **Review**: deterministic gates pass first, a different-vendor reviewer uses a pinned diff, and blocking findings are rechecked after clearing.
8. **Delivery**: PRs remain under review; maintainers own merge, Issue closure, and production deployment.

## 9. Troubleshooting

- **Source installation timed out**: use the official wheel at the same version with `--only-binary=:all:`; retain the failure and never remove dependencies.
- **CLI or sandbox missing**: check Node, pnpm, tmux, bwrap, and the specific harness; never switch to unisolated host execution.
- **Model credentials are invisible**: inspect the restricted environment and `env_passthrough`; declare only variable names needed by the current provider.
- **Header identity spoofing**: fix proxy inbound-header scrubbing and test it; use correctly configured accounts or OIDC with HTTPS on public routes.
- **Startup was not blocked by policy**: ordinary DENY / ASK does not apply to the official start probe; restrict admission and sandbox transformation instead.
- **Independent review is impossible**: prepare a shared pinned diff and arrange a second vendor; otherwise escalate to a human without fabricating review.
- **Docker data was deleted**: `down -v` is destructive; restore from a verified backup and omit `-v` for routine stops.

## 10. Upgrades, backups, and security red lines

Before upgrading, pin Omnigent, client, ui-sdk, harness CLIs, Node / Python, images, and the dependency tree. Read Release and capability changes, parse bundles again, and compare login, models, approvals, cancellation, and cost on the same no-write task. For Docker, back up and verify database / artifact restoration before migration.

Back up the database, artifacts, Agent bundles, registries, branches and commits, and dependency fingerprints, never plaintext secrets. Sessions, logs, diffs, workspaces, and model output can contain source and secrets; apply access control, redaction, and retention.

Security red lines: never mount the host Docker socket; never expose a home directory or all CLI credentials to a session; never auto-merge, close Issues, or release production; never present official examples, policy ALLOW, or internal reviewers as independent production acceptance.

## 11. Official sources

- https://github.com/omnigent-ai/omnigent
- https://github.com/omnigent-ai/omnigent/releases/tag/v0.23.0
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/README.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/pyproject.toml
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/docs/AGENT_YAML_SPEC.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/docs/POLICIES.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/config.yaml
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/skills/fanout/SKILL.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/skills/cross-review/SKILL.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/deploy/docker/README.md
