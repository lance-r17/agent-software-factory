---
name: loom-deploy
description: Deploy and verify Loom 0.3.0, an open delivery harness. Use to pin main source, check scripts and Python algorithms, install a supported coding-Agent plugin, run the build / continue / review delivery loop and local Docker Compose preview, and enforce MCP contracts, state, secrets, recovery, backup, and human-delivery gates. Not for unauthorized model calls, automatic merges, Issue closure, or production deployment.
---

# Loom 0.3.0 deployment and acceptance

## 0. Version contract and evidence boundaries

- Official repository: https://github.com/valkor-ai/loom
- Version: both `package.json` and the Rust workspace are `0.3.0`.
- Pinned research commit: `fc4c0bab2176e502ddd29677bc2aae0880f5fd5d`, a main snapshot dated 2026-11-23.
- Release page: `v0.3.0`, published 2026-09-18; never conflate that Release tag with the pinned main commit above.
- License: Apache-2.0, according to the official repository and LICENSE.
- Verification date: 2026-11-26.
- Actually tested: static shell, plugin JavaScript, test-script, and plugin JSON syntax passed on pinned source; seven algorithm tests passed in isolated Python 3.12, as did a worker tokenization smoke check.
- The initial result was 4 passed / 3 failed because the helper overwrites child `PYTHONPATH`; a temporary user-site shared the isolated dependencies and the rerun passed all seven without modifying upstream source or tests.
- Not tested: Release SHA-256, official installer, CLI, Rust MCP / Cargo, real-model build / continue / review / deploy, Docker Compose, benchmarks, or production deployment.
- The first HTTP/2 Release download failed with exit 18 and the sole HTTP/1.1 retry with exit 52; retries stopped at the limit, so never claim installation verification succeeded.

Never turn official capabilities, the tool registry, commands in this manual, or a graphed delivery state into a generic claim of successful execution. Report only observed steps, outputs, and unverified items.

## 1. Hard prerequisites

Real delivery needs at least one supported coding Agent: Codex, Claude Code, or OpenCode. Algorithms require Python 3.11 or later, local source builds need Rust, and `loom deploy` additionally needs Docker.

```bash
python3 --version             # Algorithms: >= 3.11; 3.12 was used here
rustc --version || true       # Needed for local builds / Cargo tests; absent here
cargo --version || true
node --version || true        # Plugin JavaScript syntax checks
git --version
docker --version || true      # Local deploy preview only
docker compose version || true
```

Prepare directories and assign them to a dedicated account:

```bash
sudo install -d -m 750 /srv/loom/{vendor,workspaces,artifacts,secrets}
# /srv/loom/secrets marks an independent secret-flow boundary; place no real key in Git, containers, or the site
```

The official user-level runtime lives in `~/.loom`; each target project keeps delivery state in `<project>/.loom/`. Never invent project state manually. `build` initializes it when needed.

## 2. Choose a route

| Route | Use case | Main risks | Network / port |
| --- | --- | --- | --- |
| A · Offline source | Pin the commit and check static syntax plus Python algorithms | Proves nothing about Release, Rust, or delivery quality | Source and dependency downloads only |
| B · Official plugin | Release installation, MCP registration, and read-only status | Installer and package provenance, host Agent credentials | Release download; no manual MCP port |
| C · Delivery and recovery | build, continue, review, and TaskResult evidence | Model cost, repository writes, and sensitive state | Determined by Agent / project |
| D · Local preview | Loom-generated and validated Docker Compose preview | Container environment, logs, secrets, and production-boundary confusion | Determined by generated project topology |

Run A, then B. Open C's small write scope only after read-only `status` passes. D is local preview only and never inherits production-deployment capability.

## 3. Route A: pinned offline source verification

No model or GitHub credentials are needed.

```bash
git clone --filter=blob:none https://github.com/valkor-ai/loom.git /tmp/loom-fc4c0ba
cd /tmp/loom-fc4c0ba
git checkout fc4c0bab2176e502ddd29677bc2aae0880f5fd5d
test "$(git rev-parse HEAD)" = fc4c0bab2176e502ddd29677bc2aae0880f5fd5d

bash -n install.sh /tmp/loom-fc4c0ba/scripts/install-local-claude-code.sh /tmp/loom-fc4c0ba/scripts/install-local-opencode.sh
node --check plugins/claude-code/hooks/loom-workflow-guard.js
node --check plugins/opencode/.opencode/plugins/loom.js
node --check /tmp/loom-fc4c0ba/scripts/rust-test.mjs
python3 -m json.tool plugins/claude-code/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/codex/.codex-plugin/plugin.json >/dev/null
```

Isolate algorithm dependencies. The test helper overwrites child `PYTHONPATH` with `src/python`, so prepare a temporary `PYTHONUSERBASE` that gives parent and child the same dependencies:

```bash
python3 -m pip install --target /tmp/loom-pydeps \
  pytest jieba rank-bm25 scikit-learn
mkdir -p /tmp/loom-pyuser/lib/python3.12/site-packages
cp -a /tmp/loom-pydeps/. /tmp/loom-pyuser/lib/python3.12/site-packages/
PYTHONUSERBASE=/tmp/loom-pyuser \
  PYTHONPATH=/tmp/loom-pydeps:/tmp/loom-fc4c0ba/src/python \
  PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -q tests/python
```

Observed final result: `7 passed`. The worker tokenization smoke check also returned `ok: true` and the expected tokens. With a different Python minor version, use its corresponding user-site path and retain actual version and dependency fingerprints. Never modify tests or remove dependencies to manufacture a pass.

With Rust available, run the official tests separately:

```bash
npm run rust:test:full
# Or: cargo test --manifest-path src/rust/Cargo.toml
```

No Rust toolchain was available here, so this Cargo route was not executed. Python tests are not a substitute for a Rust build result.

## 4. Route B: official plugin and read-only smoke

The official installer detects OS / CPU, downloads a matching Release, verifies `.sha256`, installs Rust MCP and isolated Python, writes Agent MCP registration, refreshes the plugin, and runs `loom-setup doctor`.

Download and inspect the script in isolation before deciding whether to execute it:

```bash
curl -fsSL https://github.com/valkor-ai/loom/releases/latest/download/install.sh \
  -o /tmp/loom-install.sh
bash -n /tmp/loom-install.sh
less /tmp/loom-install.sh
# After explicitly approving installation on this machine:
bash /tmp/loom-install.sh --agent codex
# Also supported: --agent claude-code, --agent opencode, or --agent all
```

The source-validation route after a local fix is:

```bash
./install.sh --agent codex --local-build
```

This builds Rust MCP and the setup binary, creates the Release layout, and installs it; it was not executed here. After installation or upgrade, open a new Agent session in the target project and run:

```text
@loom status     # Codex
/loom status     # Claude Code / OpenCode
```

`STATE_NOT_INITIALIZED` is a valid smoke result for a new project: the plugin is available and no delivery has started. The Agent's MCP registration normally starts the Rust server; users do not start or persist another MCP server manually.

Keep model login inside the selected Agent's credential flow. Never place model keys or GitHub Tokens in `.loom/`, YAML, Git, logs, state, snapshots, or containers.

## 5. Route C: real delivery, review, and recovery

Run real delivery in the target project only after authorization, plugin smoke, and a small no-write task pass. These are Agent commands, not shell commands:

```text
@loom build Add a team settings page
@loom continue
@loom review
```

Claude Code / OpenCode form:

```text
/loom build Add a team settings page
/loom continue
/loom review
```

Delivery sequence:

1. Clarify and confirm scope; optional knowledge sources assist clarification rather than becoming requirements automatically.
2. Build repository context, a technical baseline, a planning contract, and an architecture artifact.
3. Task plans declare ownership, `requestReadPlan`, field groups, write boundaries, verification intent, and result templates.
4. The Agent executes bounded tasks and writes only contracted code and `outputContract.resultFile`.
5. Submit the TaskResult through `loom.recordTaskResultFile`; Loom validates, normalizes, persists, and returns the next action.
6. Review uses structured signals to route code, task-plan, or architecture repair, or manual review; every update needs verification again.
7. Prefer `continue` after interruption, a session change, or a successful tool action that does not advance; never rebuild state from chat memory.
8. `completed` still needs a clean outer recheck, trusted CI, secret scanning, and human acceptance.

No model was configured and none of these delivery commands was executed here. Real calls can incur cost and repository changes, so bound task count, repair rounds, timeouts, and provider budget.

## 6. Route D: local Docker Compose preview

Prerequisites: a verified plugin, inspectable delivery state in the project, installed Docker, and explicit authorization for the current user.

```text
@loom deploy     # Codex
/loom deploy     # Claude Code / OpenCode
```

Loom's MCP tool surface includes `deployPrepare`, `deployRun`, `deployUp`, `deployStatus`, `deployInspect`, `deployValidate`, `deployLogs`, `deployBootstrap`, `deployDown`, and `deployRepair`. Follow returned next actions and never bypass the state machine to invent preview results.

During acceptance, check:

1. Compose topology, project root, and write targets come from current delivery state.
2. Environment rules, runtime facts, ports, logs, and `fullLogRef` remain traceable.
3. Readiness, validation, and failure logs come from real commands; verify again after repair.
4. Containers have no model key, GitHub Token, host home, or unrelated credentials.
5. Back up required `.loom/` and outer artifacts before stopping or cleanup; never treat destructive commands as routine restarts.

**Current deploy supports local Docker Compose preview only, not production deployment.** Public release separately needs production architecture, HTTPS, authentication, secret management, trusted CI, artifact review, monitoring, backup, rollback, and human approval. Neither Docker nor deploy was executed here.

## 7. MCP contracts and automation gates

Core contract shape, simplified from pinned source and not a standalone JSON-file template:

```text
Request manifest {
  requestReadPlan: { groups: [{ selectors, purpose, whenToRead }] },
  outputContract: { writeTargets, resultFile },
  executionRules,
  recommendedTool
}

TaskResult {
  status,
  changedFiles,
  verificationResults,
  executionContinuity,
  runtimeDeliveryEvidence: { unverifiedItems }
}
```

`readFieldGroup` expands declared selectors only; follow `fullLogRef` to complete logs only when compact diagnostics are insufficient. `deliveryGraph(projectRoot)` returns `nodes`, `edges`, and `mermaid`, reads `.loom/` only, never changes state, and never reruns checks. It is a delivery-evidence graph, not a code call graph; missing stages should remain a partial graph.

The outer automation layer submits approved goals only and owns these controls:

- Select the supported Agent, pinned Loom commit, project scope, model, and budget.
- Restrict actual repository, tool, network, process, and container privileges; a request manifest is not a sandbox.
- Retain changedFiles, verification commands and order, exit status, fullLogRef, unverified items, and review / repair history.
- Stop automatic retries after repeated failure or impossible verification, preserve state, and escalate to a human.
- Only a controlled authorized flow may create or update a PR; maintainers own merge, Issue closure, and production release.

The official local SVG exporter uses this source command, requires Rust, and is not included in the Release installer:

```bash
cargo run --manifest-path src/rust/Cargo.toml -p mcp-server \
  --bin loom-delivery-graph -- /absolute/path/to/project /tmp/delivery.svg
```

The exporter was not executed here.

## 8. Eight acceptance gates

1. **Version**: 0.3.0, fc4c0ba, Agent plugin, Release SHA, Rust / Python, and algorithm dependency fingerprints match and are retained.
2. **Installation**: Release verification, doctor, and read-only status in a new session pass independently; `STATE_NOT_INITIALIZED` is interpreted correctly.
3. **Contracts**: selectors, writeTargets, and resultFile stay in scope; the matching MCP tool submits every TaskResult.
4. **Evidence**: changedFiles, command order, exit status, runtime evidence, fullLogRef, and unverifiedItems match actual execution.
5. **Recovery**: after interruption, `continue` in a new session finds the real next action from `.loom/` without repeating completed work or inventing state.
6. **Repair**: review findings route explicitly, rounds and budgets stay bounded, and failed checks plus necessary regressions run again after updates.
7. **Isolation**: secrets stay out of `.loom`, YAML, Git, logs, snapshots, and containers; local preview and production remain strictly separate.
8. **Delivery**: review PRs only after a clean outer recheck and secret scan; humans decide merge, Issue closure, and production deployment.

## 9. Troubleshooting

- **Release download fails**: retain real errors such as exit 18 / 52 and the retry count; never claim SHA or CLI success. After networking recovers, recheck the official package in a fresh isolated directory.
- **Pytest worker subprocesses fail**: check whether the helper overwrites `PYTHONPATH`; share isolated dependencies through a temporary `PYTHONUSERBASE` instead of modifying tests to hide the problem.
- **rustc is absent**: report source and Python evidence only; install supported Rust before Cargo and never describe algorithm results as MCP success.
- **Commands are invisible after installation**: open a new Agent session to load plugin and MCP registration, then run read-only status; never persist a second server manually.
- **STATE_NOT_INITIALIZED**: this can be normal for a new project; initialize on demand with build rather than inventing state.
- **Work stalls or repeats**: preserve `.loom/`, run continue, inspect TaskResults and open items, and follow next actions.
- **Preview fails**: inspect deployStatus / Inspect / Validate / Logs and repair boundaries; never treat local preview as production or inject more secrets as an experiment.
- **State or indexes are deleted**: distinguish uninstall from purge, verify backups first, and never treat purge as routine uninstall.

## 10. Upgrades, backups, and security red lines

Before upgrading, pin the Loom commit, Release, plugin, Agent / model IDs, Rust / Python, algorithm dependencies, and OS / CPU package fingerprints. Read Release and migration notes, back up project `.loom/` and user-level runtime, verify compatibility in a copy, then revalidate Release SHA, doctor, status, a small build, continue, review, and local preview in that order.

Back up project `.loom/`, outer artifacts, dependency fingerprints, and human decisions, never plaintext secrets. Requirements, source paths, model output, runtime facts, screenshots, and logs can contain secrets; apply access control, redaction, encryption, and retention.

Security red lines:

- Never write model keys or GitHub Tokens into `.loom/`, YAML, Git, logs, state, snapshots, the site, or containers.
- Never treat a request manifest, internal review, deliveryGraph, or `completed` as independent security proof.
- Never allow unbounded repository writes, unbounded repair loops, repeated automatic retries, or unauthorized model calls.
- Never auto-merge, close Issues, delete branches, or treat local Compose preview as production deployment.
- Never modify upstream tests, remove dependencies, disable TLS, or fabricate Release / Rust / Docker evidence to obtain a pass.

## 11. Official sources

- https://github.com/valkor-ai/loom
- https://github.com/valkor-ai/loom/releases/tag/v0.3.0
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/README.md
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/Cargo.toml
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/python/algorithms/pyproject.toml
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/mcp-server/tool_registry.rs
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/execution/task_execution.rs
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/docs/delivery-graph.md
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/install.sh
