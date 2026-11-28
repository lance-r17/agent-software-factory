---
name: scion-deploy
description: Deploy and accept Scion v0.3.0. Use for pinning the Release and tag commit, verifying SHA256SUMS, preparing Go, Git, and container Runtimes, starting a local Workstation, configuring role templates and harness configs, selecting isolated workspaces, connecting to a Hosted Hub, and enforcing state, secret, backup, cost, and human-delivery gates. Not for unauthorized model calls, automatic merge, Issue closure, branch deletion, or direct production release.
---

# Scion v0.3.0 deployment and acceptance

## 0. Version contract and evidence boundaries

- Official repository: https://github.com/GoogleCloudPlatform/scion
- Pinned Release: `v0.3.0`, published 2026-11-11.
- Pinned tag commit: `7035829be4f38efe1ef43faed34404fbd78141e4`.
- Module: `github.com/GoogleCloudPlatform/scion`; the pinned `go.mod` declares `go 1.26.1`.
- License: Apache-2.0, based on `LICENSE` at the pinned commit.
- Facts verified: 2026-11-28.
- The project remains pre-1.0; APIs, configuration, harness support, and Runtime behavior may change. The official project states that it is not an officially supported Google product.
- This analysis performed level-C official documentation and source review only. GitHub API reads pinned the tag commit and retrieved the README, go.mod, Concepts, installation and template guides, settings example, and LICENSE.
- Actual failure here: the first pinned-source shallow clone failed during TLS handshake; the single permitted retry timed out and left no usable checkout.
- Environment here: no `go` command, Node `20.20.2`, and Git `2.39.5`. Git is below the `2.48` worktree requirement.
- Not tested: Release installation, `scion version` / `doctor` / `server start`, Web onboarding, container Runtimes, real Agents, models, worktrees / clones, Hosted / HA, Kubernetes, Cloud Run, benchmarks, or production deployment.

Official commands in this manual are not successful execution records here. Report only executed steps, outputs, and open items. Never equate a visible CLI, an opening Web UI, or Agent `completed` with accepted end-to-end delivery.

## 1. Hard prerequisites

Check the selected route before running any real model task:

```bash
# All routes
uname -s && uname -m
git --version
scion version        # Run only after installing the pinned Release

# worktree-per-agent requires Git >=2.48.0 on the Broker host
# Source builds require Go >=1.26; pinned go.mod declares 1.26.1
go version

# Check the selected local Runtime separately; a client binary does not prove a usable daemon
docker version
podman version
```

Keep Projects, artifacts, shared exchange, and secret flows separate:

```bash
sudo install -d -m 750 /srv/scion/{projects,artifacts,shared,secrets}
# secrets marks an independent flow boundary; never commit real keys or bake them into images
```

A real Agent also needs a supported harness, controlled images, model authorization, least-privilege repository credentials, and explicit concurrency, duration, delegation, model-call, and cost limits. The default installation set includes Claude and Gemini; Codex, OpenCode, Pi, Antigravity, and other opt-in bundles need separate checks and are not functionally interchangeable.

## 2. Choose a route

| Route | Use case | Main risk | Network / ports |
| --- | --- | --- | --- |
| A · Pinned Release | Artifact, SHA256SUMS, CLI, and prerequisite checks | Wrong architecture, missing hash verification, overread CLI success | Official Release downloads only |
| B · Workstation | Local Hub + Runtime Broker + Web | Loopback exposure, Runtime and model credentials | Official quick start `127.0.0.1:8080/onboarding` |
| C · Roles and workspaces | Templates, skills, isolated workspaces, and small tasks | Parallel contamination, remote-skill supply chain, unbounded model cost | Determined by harness, Project, and Runtime |
| D · Hosted Hub | Single-node or HA team control plane | Identity, TLS, secrets, Broker networking, persistent state | Settings-example Hub `9810`, Broker `9800`; production uses actual configuration |

Run A before B. Start a small C task only after model-free read-only checks and authorization. Design and accept D independently for single-node or HA; never inherit Workstation acceptance. Settings-example ports are not the Workstation port 8080 quick-start URL.

## 3. Route A: pinned Release and artifact verification

Choose the artifact matching the host architecture in an isolated directory. This example uses `linux-amd64`; replace filenames and recheck for every other architecture:

```bash
mkdir -p /tmp/scion-verify && cd /tmp/scion-verify
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/SHA256SUMS
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/scion-linux-amd64.tar.gz
sha256sum -c SHA256SUMS --ignore-missing

tar -xzf scion-linux-amd64.tar.gz
./scion version
./scion --help
./scion doctor
```

Only after checksum and pinned-version verification should a maintainer choose an installation location. Never place an unverified binary directly on a shared PATH. Review every `doctor` item; it proves neither model quality, repository authorization, nor production safety.

### Optional: complete build from pinned source

```bash
git clone --branch v0.3.0 --depth 1 https://github.com/GoogleCloudPlatform/scion.git
cd scion
git rev-parse HEAD
# Must equal 7035829be4f38efe1ef43faed34404fbd78141e4
make all
./build/scion version
```

Use an official Release / Homebrew or `make all` for the complete Web UI. `go install` builds only the Go binary and neither builds nor embeds the Web frontend. Never interpret a blank Web UI after `go install` as proof of a repository routing fault, or a CLI build as Web acceptance.

## 4. Route B: local Workstation

The community Homebrew tap recommended by the official README:

```bash
brew tap homebrew-scion/scion
brew install homebrew-scion/scion/scion
scion version
scion doctor
```

Start the local combo server on trusted loopback:

```bash
scion server start
# Open the official quick start: http://127.0.0.1:8080/onboarding
```

Onboarding handles Runtime detection, identity, images, and the first workspace. Confirm the actual Runtime, image origins, networking, and credentials item by item instead of accepting privileged defaults.

Initialize each approved Git Project separately:

```bash
git --version                 # worktree-per-agent requires >=2.48.0
cd /path/to/approved-project
printf '\n.scion/agents/\n' >> .gitignore
scion init
scion list
```

If onboarding already initializes the Project, do not create duplicate configuration. For machine mode, first use the pinned installation guide to check `scion init --machine` inputs and write scope. `.scion` may enter Project version control, but worktrees, logs, and secrets must not slip into commits.

## 5. Route C: role templates, harness configs, and workspaces

Separate role from environment:

- `scion-agent.yaml`, instructions, skills, and model-size aliases in a template directory define the role.
- Settings, Profiles, and harness configs define images, resources, volumes, Runtimes, authentication, concrete models, and execution mechanics.
- Environment keys such as `image` inside templates are ignored with warnings; never pretend that this drift applied configuration.
- Skill Bank / GitHub URIs, `provision.py`, MCP, home files, symlinks, and images are supply-chain inputs and need pinned origins plus review.

Create and inspect a reviewer role:

```bash
cd /path/to/approved-project
scion templates create code-reviewer
scion templates show code-reviewer
scion harness-config list
# Review .scion/templates/code-reviewer/ and the selected harness config before continuing
```

Choose the workspace for the required isolation:

| Mode | Behavior | Critical limit |
| --- | --- | --- |
| `shared-plain` | Multiple Agents share a directory | No per-Agent working-tree isolation; coordinate every write |
| `worktree-per-agent` | Separate worktree per Agent | Git >=2.48; unsupported on Kubernetes |
| `clone-per-agent` | Independent clone per Agent | Hub route injects `GITHUB_TOKEN`, not a host SSH private key |
| `empty-per-agent` | Private empty directory | Exchange files through explicit shared dirs |

Start a small task only after outer approval of goal, scope, budget, and acceptance contract:

```bash
scion start reviewer "Review the approved change without merging" --type code-reviewer
scion list
scion logs reviewer
scion message reviewer "Report open questions and verification evidence"
# For deliberate human takeover: scion attach reviewer
scion stop reviewer
```

`stop` leads to a fresh session by default. `suspend` / `resume` can continue a session only when the harness supports it and the Agent home persists. Nonzero crashes, resource limits, waiting for input, and offline state are different conditions.

```bash
# Verify separately only with a supported harness + persistent home
scion suspend reviewer
scion resume reviewer
```

Before deleting an Agent, confirm commits are pushed, shared files retained, and questions answered. `running`, `completed`, `stopped`, and `suspended` never prove passing tests, accepted PRs, or production release.

## 6. Route D: Hosted Hub

A Hosted administrator must first deploy using the official single-node / HA guides. This route is only a user-connection shape, not a complete HA installation script:

```bash
# Connect only to a maintainer-provided HTTPS Hub; paste no token into commands, Git, or the website
scion hub add team https://scion-hub.example.com
scion use --hub team
scion whoami
scion project list
scion runtime-broker status
```

Single-node Hosted can use one Hub + SQLite and accept restart / redeploy downtime. HA Hosted requires replicated Hubs, Postgres, object storage, and load balancing. Both modes require:

- OAuth / identity provider, access policy, TLS, secret backend, and credential rotation.
- `public_url` and the container-facing `agent_endpoint`; Agents managed by every Broker must reach the latter.
- No plaintext HTTP for bearer tokens or fetched secrets, and no development auth / `dev_mode` in production.
- Separate backup and tested restoration for Hub DB, object storage, Agent homes, workspaces, and outer artifacts.
- Real limits on Runtimes, mounts, outbound networking, model budgets, logs, and concurrency.

No Hosted / HA component was deployed here. Successful user connection does not prove backend, identity, storage, Broker, or production acceptance.

## 7. State, automation, and evidence gates

Scion separates container-lifecycle Phase, Agent Activity, and free-text Detail. Distinguish at least:

- Phase: `created`, `provisioning`, `cloning`, `starting`, `running`, `stopping`, `stopped`, `suspended`, `error`, `halted`.
- Activity: `initializing`, `working`, `thinking`, `executing`, `waiting_for_input`, `blocked`, `completed`, `limits_exceeded`, `stalled`, `offline`, `crashed`.
- Detail: current tool, message, or task summary; free text is not independent factual proof.

Outer automation dispatches approved goals only to registered Projects and selects templates, harness configs, workspaces, resources, limits, and acceptance contracts. Public text never directly obtains privileged Agents, secret reads, or Hosted dispatch.

Retain the pinned version and commit, artifact hashes, Runtime / image / template / harness-config fingerprints, Project / Agent IDs, ancestry, state transitions, messages, branches, commits, model and tool usage, test commands, exit states, cost, open items, and human decisions for every run.

Outer systems still own trusted CI, secret scanning, clean-copy rechecks, PR review, and authorization. Create or update PRs only; never auto-merge, close Issues, delete branches, or release production directly.

## 8. Eight acceptance gates

1. **Version**: `v0.3.0`, `7035829`, Release filenames, SHA256SUMS, Go / Git, Runtime, images, and configuration fingerprints agree and are retained.
2. **Installation**: `version`, `help`, `doctor`, and the complete Web UI come from actual execution; source builds use `make all` and never borrow `go install` conclusions.
3. **Services**: Workstation, Hub, Broker, and the actual Runtime pass separately; ports, URLs, authentication, and network paths have real evidence.
4. **Roles**: Templates, inheritance, Skill URIs, model aliases, harness configs, and precedence are reviewed; environment keys are not misplaced in templates.
5. **Isolation**: Workspace mode, homes, shared dirs, mounts, networking, and secret visibility match approved scope; parallel Agents never overwrite one another.
6. **State**: `stop`, `suspend`, `resume`, `error`, `limits_exceeded`, and `stalled` are verified separately for each harness and persistent-home condition.
7. **Evidence**: Branches, commits, shared files, logs, model usage, tests, exit states, cost, and open items are retained; stopping and recovery paths work.
8. **Delivery**: Review PRs only after clean outer checks and secret scanning; humans own merge, Issue closure, Agent cleanup, rollback, and production deployment.

## 9. Troubleshooting

- **Source clone TLS failure or timeout**: Retain the error and retry network transfer at most once; never disable TLS or host verification. An official Release with verified hashes is an alternative, while API reads are not source builds.
- **Go is absent or Git is too old**: Install Go 1.26+ for source builds and Git 2.48+ for worktrees. Never skip version checks or apply clone-mode results to worktrees.
- **Blank Web UI after `go install`**: This is the documented unembedded-frontend boundary. Use Release / Homebrew or `make all` in a pinned clone; never weaken route checks.
- **Agent commands report no Hub**: Every Agent now runs through a Hub, and the old Hub-less local mode was removed. Run `scion server start` for Workstation or select an approved shared Hub.
- **Worktree creation fails or falls back to a clone**: Check Broker-host Git, workspace mode, and Runtime; Kubernetes does not support worktrees. Never assume automatic fallback after failure; inspect and repair actual state.
- **An old harness uses builtin provisioning**: The v0.3.0 guide says the compiled-in Go builtin implementation was removed, and opt-in bundles need `container-script`. Follow the pinned guide for `harness-config upgrade --activate-script` or reinstall, repairing Project, Hub, and Broker copies separately.
- **An Agent is `offline`, `stalled`, or hits limits**: Start with `scion look` and `scion logs`, then inspect heartbeats, tokens, events, and limits. `blocked` means intentional waiting. Use documented message, resume, or start recovery instead of deleting Agents with unpushed work.
- **A session does not continue after suspend**: Check harness resume support and home persistence; ephemeral Kubernetes / Cloud Run homes do not qualify. Never reuse Docker recovery conclusions across Runtimes.
- **Hosted Agents cannot reach the Hub**: Check `public_url`, the container-facing `agent_endpoint`, Broker networking, certificates, and access policy. Never disable TLS verification as the fix.

## 10. Upgrades, backups, and cost control

Before upgrading, pin the Scion Release, tag commit, artifact hashes, Go / Node / Git, Runtime, images, templates, and harness-config fingerprints. Read Release and migration notes, focusing on builtin-provisioner migration, configuration tiers, environment keys, model aliases, and Runtime-specific limits.

Back up Hub SQLite / Postgres, object storage, templates, Agent homes, workspaces, branches, shared artifacts, and outer artifacts; never back up plaintext secrets. Test restoration regularly in an isolated copy instead of only checking file existence.

In a copy, recheck CLI, authentication, Broker, model-free read-only checks, a small task, worktree / clone behavior, messages, and stop / suspend / resume. Retain old artifacts and evidence until the new route passes independently; outer human processes define production release, rollback, and Agent cleanup.

Bound concurrency, delegation depth, task duration, model calls, repair rounds, provider budget, and log growth. Preserve state and stop automatic retries after repeated failures. Before deletion, confirm commits are pushed, shared files retained, and unanswered questions resolved; `completed` is not deletion or delivery evidence.

## 11. Security red lines and official sources

- Never place model keys, GitHub Tokens, OAuth secrets, broker tokens, private keys, or other secrets in templates, YAML, Git, state, logs, snapshots, the website, or container images.
- Never distribute host SSH private keys or long-lived credentials to containers; use dedicated, short-lived, least-privilege secret injection.
- Never let public input create privileged Agents, let multiple Agents share a working tree without coordination, or permit unbounded delegation, model calls, restarts, or cost.
- Never treat Phase / Activity / Detail, heartbeats, Web state, or `completed` as trusted CI, quality, security, or human-delivery proof.
- Never auto-merge, close Issues, delete branches, or deploy production directly. Never modify upstream source, disable TLS, or fabricate model / container / benchmark evidence to pass checks.

Official sources:

- https://github.com/GoogleCloudPlatform/scion
- https://github.com/GoogleCloudPlatform/scion/releases/tag/v0.3.0
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/README.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/go.mod
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/concepts.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/getting-started/install.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/local/templates.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/settings.yaml.example
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/LICENSE
