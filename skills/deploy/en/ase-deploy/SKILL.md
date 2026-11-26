---
name: ase-deploy
description: Deploy and accept Agentic Software Engineering (ASE) 2.1.6. Use for pinning the Release and commit, isolated npm installation, Node 22.22 CLI checks, supported Agent plugin setup, named tasks, and an optional Agent Fleet, with Task Store, secret, working-copy, budget, backup, and human-delivery gates. Not for unauthorized model calls, automatic merge, Issue closure, or production deployment.
---

# ASE 2.1.6 deployment and acceptance

## 0. Version contract and evidence boundaries

- Official repository: https://github.com/rse/ase
- Pinned Release: `2.1.6`.
- Pinned tag commit: `8c1c95952edc75cb8d4fe5a87efecbdb1267680a`.
- A newer master was also observed at `5420d8966eab96bc9bfd4f205029dc14de5b99e8`; never conflate it with the Release above.
- Package: `@rse/ase`; the main package requires Node `>=22.22.0` and npm `>=10.0.0`.
- License: Apache-2.0, based on `LICENSE.txt` at the pinned commit.
- Facts verified: 2026-11-27.
- Actually tested: isolated Release installation added 790 packages; temporary Node 22.22.0 returned `ASE 2.1.6` and passed top-level help, Fleet help, and `setup mcp list`; enterprise `fleet init` generated `.ase/fleet.yaml` in a temporary Git repository.
- The first `fleet init` failed without project context; a retry after `git init` in the temporary directory succeeded. No upstream source was modified.
- Host Node was 20.20.2 and did not satisfy the main package. `@gitbeaker/rest@44.1.10` separately declares Node `>=24.16.0`; its GitLab path was not tested.
- Not tested: host plugin installation, real model tasks, optional paid services, MCP / Task Store / relay startup, Fleet start, real Issue repair, benchmarks, or production deployment.

Never present official capabilities, generated configuration, commands in this manual, or task state as successful end-to-end execution. Report only executed steps, outputs, and explicit unverified items.

## 1. Hard prerequisites

Normal interactive use needs a supported Agent. Claude Code is the primary target; GitHub Copilot CLI and OpenAI Codex CLI have reduced support. Never assume equivalent harness functionality.

```bash
node --version       # >=22.22.0; check dependency engines for any GitLab integration too
npm --version        # >=10.0.0
git --version
claude --version || true
```

Prepare dedicated directories with restricted permissions:

```bash
sudo install -d -m 750 /srv/ase/{workspaces,worktrees,artifacts,secrets}
# secrets marks an independent secret-flow boundary; put no real key in Git, containers, or the website
```

The default Task Store is project-local `./.ase/task` and needs no server. Fleet configuration is `.ase/fleet.yaml`; runtime state and logs live under `.ase/agent/`. Isolate user-level configuration and state with `ASE_CONFIG_DIR` and `ASE_STATE_DIR`.

## 2. Choose a route

| Route | Use case | Main risk | Network / ports |
| --- | --- | --- | --- |
| A · Release checks | Pin version, install, check CLI, MCP list, and Fleet init | Main CLI success does not prove every integration | npm package and temporary Node downloads |
| B · Official plugin | Register plugin, hooks, skills, and MCP | Agent configuration writes, model and optional-service credentials | Determined by Agent and optional MCP services |
| C · Named tasks | Alternatives, grilling, drafts, implementation, integration | Model cost, Git writes, sensitive attachments | Determined by project and external services |
| D · Agent Fleet | Multi-role relay, supervision, restarts, and phase progression | Concurrent contamination, restart cost, logs, all-project tokens | Relay / Task Store need separate governance |

Run A before B. Open small bounded writes in C only after read-only registration checks. Enable D only after separate working copies, budgets, human qualification gates, and a stop path are explicit.

## 3. Route A: pinned Release checks in isolation

No model or GitHub credentials are needed. All paths below are temporary verification directories:

```bash
node --version
npm view @rse/ase@2.1.6 version dist.tarball engines
npm install --prefix /tmp/ase-verify \
  --ignore-scripts --no-audit --no-fund @rse/ase@2.1.6
ASE=/tmp/ase-verify/node_modules/@rse/ase/bin/ase

npx --yes --package node@22.22.0 node "$ASE" --version
npx --yes --package node@22.22.0 node "$ASE" --help
npx --yes --package node@22.22.0 node "$ASE" agent fleet --help
npx --yes --package node@22.22.0 node "$ASE" setup mcp list
```

Generate enterprise configuration in a temporary test repository without starting Agents:

```bash
mkdir -p /tmp/ase-verify/project
cd /tmp/ase-verify/project
git init -q
npx --yes --package node@22.22.0 node "$ASE" agent fleet init --lifecycle enterprise
test -s .ase/fleet.yaml
```

Inspect at least:

```bash
grep -nE '^(rebooter|condenser|griller|researcher|implementer|qualifier|integrator|editor|estimator):' .ase/fleet.yaml
grep -A3 '^qualifier:' .ase/fleet.yaml
```

The checks here confirmed enterprise roles and `qualifier.mode=judge`, retaining human qualification decisions. These commands prove neither a real Fleet, model quality, production safety, nor every dependency integration.

For source-level review, clone separately and pin the full commit. Never apply newer master files or skill counts to 2.1.6.

## 4. Route B: official plugin and read-only status

Check Node / npm, package provenance, and scope before approving Agent configuration writes:

```bash
npm install -g @rse/ase@2.1.6
ase setup install --tool claude --scope project
ase setup status --tool claude
ase setup mcp list
```

The official scopes are `user`, `project`, and `local`. Use `--tool copilot` or `--tool codex` for those harnesses, but validate their reduced support feature by feature instead of reusing Claude Code acceptance.

Open a new Agent session after installation or upgrade so plugin, hooks, skills, and MCP registration load. `ase setup status` is read-only and reports plugin, MCP, output style, hooks, statusline, and telemetry registration across scopes.

Keep model login in the Agent credential flow. Optional external model / search MCP services may charge fees; review purpose, outbound data, cost, and secrets individually. A successful `setup mcp list` is not a reason to activate them.

## 5. Route C: named tasks, drafts, and real implementation

Run real model tasks only after authorization, plugin smoke checks, and a small no-write task. These are Claude Code session commands, not shell commands:

```text
/ase-task-edit -A team-settings: "Add an approved team settings page"
/ase-task-grill team-settings
/ase-task-implement --draft team-settings
/ase-task-integrate --draft team-settings
```

Review the plan and draft first. Permit real implementation only after scope, dependencies, tests, Source / Changeset / Target, and budget are confirmed:

```text
/ase-task-implement team-settings
/ase-task-view team-settings
```

The official CLI also provides `ase task board` and `ase task board --web` for observation. A board is not quality proof.

Recommended sequence:

1. Use a named task and alternative-approach funnel to clarify the goal instead of jumping to an unbounded patch.
2. Use grilling / research to expose open decisions, evidence gaps, and risks; a human confirms scope.
3. Record After, Effort, Source, Changeset, Target, and the acceptance contract.
4. Generate and review a draft attachment before permitting real working-copy changes.
5. Test and review before the qualification gate; the default judge does not decide for the human.
6. After integration, rerun required checks and retain tasks, attachments, cost, and logs.
7. Deliver only after an outer clean-copy recheck, trusted CI, secret scanning, and human PR review.

No model was configured and none of these real task commands was executed here. Real calls may incur fees and repository changes; bound concurrency, task time, repair rounds, and provider budget.

## 6. Route D: Agent Fleet

Prerequisites: the plugin and named tasks passed in an isolated environment, real model and repository privileges are explicitly approved, and every Agent has a separate working copy.

```bash
cd /path/to/approved-project
ase agent fleet init -t claude --lifecycle enterprise
```

Review `.ase/fleet.yaml` first:

- Relay address, port, TLS, and token source.
- `default.tool`, `model`, `parallel`, `timeout`, `budget`, `repo`, and `tempdir`.
- Enterprise roles `rebooter`, `condenser`, `griller`, `researcher`, `implementer`, `qualifier`, `integrator`, `editor`, and `estimator`.
- The implementer defaults to two parallel tasks; `qualifier.mode=judge` emits a verdict while humans retain qualification state.
- `integrator.mode` can be merge, rebase, or squash and must match the outer delivery policy.

Only after real-run authorization:

```bash
ase agent fleet start
ase agent fleet status
ase agent fleet log -f
ase agent fleet stop
```

The Fleet starts each member in its own process and process group, restarting exited members with consecutive backoff up to five minutes. Termination stops Agents first, returns in-progress tasks, and then stops relay. A forcibly killed Fleet can leave orphaned members; the next start or stop handles them from runtime state.

**Only one Agent should directly use a Git working copy.** Configure `repo` or separate `cwd` / worktrees for other Agents; task state does not coordinate parallel file writes.

Only `fleet init` was executed here. No `start`, running `status`, log following, or operational `stop` was tested.

## 7. Task Store and automation gates

Task JSON consists of `header`, `body`, and `attachment`. The default `ase:./.ase/task` runs built-in storage inside the client process. A separate Task REST server is distinct from `ase service` and its `/mcp` and `/command` endpoints.

```bash
# Defaults to loopback; allocates and persists a random port, and generates a token if none is supplied
ase task store start
ase task store status
ase task store stop
```

Remote mode requires these boundaries:

- Every request needs a bearer token; the effective token is persisted in user-level `store.yaml`.
- The token grants full access to all projects, with no per-project or per-operation authorization.
- Non-loopback deployment should use TLS, either through official certificate options or loopback behind a TLS reverse proxy.
- Browser cross-origin access needs explicit CORS origins; WebSocket authenticates through a token query parameter, so URL and log leakage matters even more.
- Clients use `ase://` / `ases://` configuration; never make `?insecure` the normal certificate path.

Conditional saves use ETag / If-Match. After a 412, merge by header key, Markdown body section, and attachment. Resolve same-part conflicts manually instead of force-overwriting.

Outer automation submits approved tasks only and owns:

- Agent, lifecycle, task ID, project scope, model, and budget selection.
- Actual repository, tool, network, process, and container restrictions; task fields are not a sandbox.
- Retention of diffs, verification commands and order, exit states, usage, open items, reviews, and human decisions.
- Stopping automatic retries and escalating after repeated failures or impossible verification.
- Controlled PR creation or update only; maintainers own merge, Issue closure, and production release.

## 8. Eight acceptance gates

1. **Version**: 2.1.6, 8c1c959, npm tarball, Node / npm, Agent / plugin scope, and dependency fingerprints agree and are retained.
2. **Installation**: CLI, setup status, and MCP list come from execution; main-package and every actual integration engine requirement is satisfied.
3. **Tasks**: Project ID, task ID, lifecycle, After, Source / Changeset / Target, attachments, and ETags are correct.
4. **Evidence**: Diffs, tests, command order, exit states, usage, logs, and open items match actual execution.
5. **Isolation**: Parallel Agents use separate working copies; conditional-save failures and conflicts are never silently overwritten.
6. **Qualification**: Humans review default judge verdicts before qualification; required checks run again after integration.
7. **Fleet**: Concurrency, timeouts, budgets, restarts, and logs have limits; status / log / stop and orphaned-process paths are verified.
8. **Delivery**: Review PRs only after clean outer checks and secret scanning; humans own merge, Issue closure, and production deployment.

## 9. Troubleshooting

- **Node is too old**: Check main and actual dependency engines. Never hide the GitBeaker warning or extend temporary Node 22 main-CLI success into a GitLab compatibility claim.
- **fleet init reports no project context**: Run from an approved Git-project root. Here, `git init` in the temporary directory fixed it; never initialize a real repository merely to bypass the check.
- **Skills or hooks are absent after installation**: Check setup status and scope, then open a new Agent session; verify each harness separately.
- **A task save returns 412**: Retain base and latest versions, merge by part, and save conditionally with the new ETag; resolve same-part conflicts manually.
- **Remote board 401 / CORS failure**: Check bearer token and explicit origins. The token has all-project privileges, so rotate it and review every project after leakage.
- **Plaintext non-loopback service**: Keep loopback behind a TLS proxy or configure official TLS; never disable certificate verification to hide configuration problems.
- **Fleet restarts repeatedly**: Test a bounded foreground run, inspect model, configuration, repo / cwd, budget, and logs; stop when needed and handle orphaned members.
- **Agents contaminate one another**: Give one Agent direct use of a working copy and use repo or separate cwd / worktrees for others.
- **INTEGRATED is mistaken for release**: It is internal task state only; outer CI, secret scanning, PR review, and human merge remain required.

## 10. Upgrades, backups, and security red lines

Before upgrading, pin the ASE Release, tag commit, npm package, Node / npm, Agent / model IDs, plugin scope, optional MCP services, and dependency fingerprints. Read Release and migration notes; back up `.ase` tasks, attachments, Fleet configuration, user-level configuration, and outer artifacts. In a copy, recheck CLI, setup status, a small task, conditional saves, boards, and the Fleet lifecycle.

Back up tasks, attachments, dependency fingerprints, and human decisions, never plaintext secrets. Requirements, diffs, model output, usage, screenshots, `store.yaml`, and Fleet logs can contain secrets and need access control, redaction, encryption, and retention.

Security red lines:

- Never place model keys, GitHub Tokens, relay tokens, or Task Store tokens in YAML, Git, task attachments, logs, state, snapshots, the website, or containers.
- Never treat task state, qualifier=judge, boards, or INTEGRATED as independent security or quality proof.
- Never let multiple Agents share a working copy without coordination, and never permit unbounded restarts, repair, model calls, or cost.
- Never auto-merge, close Issues, delete branches, or directly deploy production.
- Never modify upstream source, hide engine warnings, disable TLS, or fabricate model / Fleet / benchmark evidence to pass checks.

## 11. Official sources

- https://github.com/rse/ase
- https://github.com/rse/ase/releases/tag/2.1.6
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/README.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/tool/package.json
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/docs/building-blocks.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/docs/task-api.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/tool/man/ase-agent-fleet.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/LICENSE.txt
