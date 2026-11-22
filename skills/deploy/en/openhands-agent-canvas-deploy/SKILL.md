---
name: openhands-agent-canvas-deploy
description: Deploy or reproduce OpenHands Agent Canvas v1.43.0 on a local or self-hosted Linux host. Use when a coding Agent must choose an installation route, start the client and Agent Server, configure Docker execution, or integrate an Issue-to-PR pipeline. Includes exact commands, eight acceptance gates, and troubleshooting. Covers only v1.43.0 verified on 2026-11-20; do not apply to other versions without rechecking official documentation.
---

# OpenHands Agent Canvas deployment execution manual

> Target version: OpenHands / @openhands/canvas **v1.43.0**; facts verified: **2026-11-20**.
> Evidence: package version and CLI help were checked locally. No model, Docker route, or real repository repair was executed.
> Hard boundaries: no secrets in YAML or Git; model keys stay on the host; GitHub Tokens do not enter untrusted containers. An Agent may create a candidate patch but may not approve or merge it.

## 01 · Scope and version contract

Record the npm package, source commit, Agent Server / SDK, model, runtime image, and dependency lock in the change ticket. Do not silently follow latest. The Canvas desktop client lives in openhands/app and is distributed as @openhands/canvas; do not confuse it with the separate OpenHands-Cloud web client.

## 02 · Choose a deployment route

| Route | When to use | Main prerequisites | Evidence level |
| --- | --- | --- | --- |
| A · Official CLI | First local run; official installation path | Network, supported Python / uv, model key | Structured from official docs; not executed end to end |
| B · Global npm | Run the pinned desktop package directly | Node.js >= 22.13, npm | Package version and CLI help checked locally |
| C · Source development | Modify the Electron / React client | Git, uv, Node.js, Python | Source entry points checked; full GUI not executed |
| D · Headless + Docker | Self-hosted service and isolated execution | Docker, uv / Python 3.13, model key | Integration template; Docker and model not executed |

Stop and choose another route if the host has no graphical session, Docker is unavailable, or organization policy forbids source code entering a cloud or model provider.

## 03 · Dependencies and directories

- Node.js >= 22.13 for @openhands/canvas 1.43.0.
- uv / Python for source and server routes; the uvx example uses Python 3.13.
- Docker for containerized runtime; verify docker run hello-world before involving the Agent.
- A model provider key; GitHub credentials only if an outer integration needs them.

Create directories before mounting them:

    mkdir -p /srv/openhands/.openhands /srv/openhands/.uv-cache
    cd /srv/openhands
    chmod 700 . .openhands

Suggested layout: .env (chmod 600, never committed), .openhands/ for state, OpenHands/ for optional pinned source, and agent-server.log for service output. Use only a disposable repository copy.

## 04 · Environment and secret boundaries

    # /srv/openhands/.env — template only; replace through a secret manager
    ANTHROPIC_API_KEY=replace-with-your-key
    GITHUB_TOKEN=replace-with-a-fine-grained-token
    SANDBOX_TIMEOUT=120

Run chmod 600 .env and add it to .gitignore. Never print keys into logs. Bind the local API to 127.0.0.1 unless a separately authenticated deployment is designed. Keep model and GitHub credentials scoped to their own trust boundaries.

## 05 · Exact commands by route

### A · Official CLI

    curl -fsSL https://raw.githubusercontent.com/OpenHands/OpenHands/main/openhands-cli/install.sh -o /tmp/openhands-install.sh
    # Review the script or pin an immutable revision before execution
    bash /tmp/openhands-install.sh

The install script and a separate uvx Agent Server are different entry points. Record configuration paths and inspect processes after installation.

### B · Global npm (checked route)

    node --version
    npm install -g @openhands/canvas@1.43.0
    openhands --help
    openhands

A visible desktop window is not proof that the Agent Server or model is ready. Verify each process separately.

### C · Source development

    cd /srv/openhands
    git clone --depth 1 --branch v1.43.0 https://github.com/OpenHands/OpenHands.git
    cd OpenHands
    uv sync
    uv run pre-commit install
    uv run python -m openhands.agent_server

In another terminal, run the React / Electron client with npm install and npm run dev:react. The default development server port is 12000. Front-end rendering and API readiness are separate checks.

### D · Headless + Docker integration template

    export OPENHANDS_DIR=/srv/openhands/.openhands
    nohup env UV_CACHE_DIR=/srv/openhands/.uv-cache       uvx --python 3.13 --from openhands-agent-server       openhands-agent-server --host 127.0.0.1 > /srv/openhands/agent-server.log 2>&1 &

Then start the pinned client. Review current official Docker documentation for the exact image, mounts, and runtime flags for v1.43.0. This is not a claimed one-command desktop deployment.

Service inspection:

    ps aux | grep -E 'openhands|uvicorn'
    ss -lntp | grep 12000
    tail -n 120 /srv/openhands/agent-server.log

Do not assume a public /health endpoint exists; a 404 there is not by itself a process failure.

## 06 · GitHub PR automation boundary

An outer orchestrator, not Canvas, owns triggers, retries, CI, and merge policy. Treat Issue and comment text as untrusted. Require maintainer approval for public repositories and forks. Use a fresh run ID and clean repository copy for every attempt.

A workflow template may use an issue_comment trigger and an OpenHands resolver, but exact flags must be checked against the pinned release. Restrict GITHUB_TOKEN to required repository operations; preserve branch protection and required human reviews. Success means candidate diff + clean-environment CI + secret scanning + human approval, never process exit alone.

## 07 · Eight acceptance gates

1. Repeatable version: package, source, SDK, model, image, and dependency lock are recorded.
2. Explainable processes: Electron, React, Agent Server, and Docker ownership and logs are known.
3. Disposable workspace: only the intended copy is writable; unrelated host paths and Docker socket are not casually exposed.
4. Secret safety: configuration, logs, trajectories, diffs, and commits contain no plaintext key.
5. Effective limits: command timeout, cancellation, task budget, and container resources are exercised safely.
6. Readable evidence: conversation, plan, actions, observations, versions, and final status can be reconstructed.
7. Reviewable patch: git diff --check passes and only intended files changed.
8. Independent delivery: clean-checkout CI and human approval happen outside the Agent; no automatic merge.

## 08 · Troubleshooting

### CLI installed but no desktop window
Check node --version, npm prefix -g, PATH, and graphical-session dependencies. On a headless host, use an API / source topology instead of forcing Electron.

### UI opens but no conversation starts
Inspect Agent Server process, configuration, port 12000, and logs. Check model-variable presence without printing its value.

### Model 401 / 404
Verify provider, exact model identifier, base URL, and account entitlement. Test a minimal official client call outside the container. Never paste the key into an Issue.

### Docker permission or missing-command errors
Run docker info and docker run hello-world first. Fix daemon / user-group permissions on the host. Do not mount the Docker socket into an untrusted workload to silence an error.

### Root-owned mounted directory
Create and permission host paths before launch, use a dedicated copy, and record container UID / GID. Avoid recursive chmod on a real repository.

### Repeated plan / action loop
Pause, narrow the task, inspect the last observation, and retry in a fresh workspace. Do not conceal loops with unlimited cost or steps.

### GitHub workflow does not trigger or push
Inspect event payload, comment filter, token permissions, fork policy, and branch protection. Never disable reviews to make a demo pass.

## 09 · Risks, upgrades, and backup

High risks: untrusted shell execution, prompt injection, credential crossover, and accidental public exposure of a local execution API. Medium risks: client / server / SDK / image drift and trace leakage. Containerization alone is not least privilege.

Before upgrades, back up configuration, state, locks, image digests, and benchmark tasks, excluding plaintext secrets. Install into a new environment, keep the known-good version for rollback, and compare the same non-sensitive task across versions. Roll out only after full CI.

Set provider-side budgets and alerts in addition to application limits. Record model, prompt, image digest, duration, retries, and cost. Treat trajectories as sensitive internal logs with access control, retention, and redaction.

Sources: https://github.com/OpenHands/OpenHands · https://github.com/OpenHands/OpenHands/tree/main/openhands/app · https://www.npmjs.com/package/@openhands/canvas · https://docs.openhands.dev/openhands/usage/quick-start · https://docs.openhands.dev/openhands/usage/runtimes/local · https://docs.openhands.dev/openhands/usage/runtimes/docker · https://docs.openhands.dev/openhands/usage/security
