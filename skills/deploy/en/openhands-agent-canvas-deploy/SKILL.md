---
name: openhands-agent-canvas-deploy
description: Deploy, verify, and upgrade OpenHands Agent Canvas v1.43.0, the self-hosted coding-Agent control center. Use for installation, self-hosting, troubleshooting, or integration with the official software-factory pipeline. Choose one of four deployment routes according to its trust boundary.
metadata:
  verified_at: "2026-11-21"
  upstream_version: "1.43.0"
  upstream_license: "MIT (main repository; enterprise/ has separate licensing)"
---

# OpenHands Agent Canvas v1.43.0 deployment manual

You are the executing AI Agent. Do not invent commands, skip prerequisite checks, or cross security boundaries. Facts were verified on 2026-11-21; if the current date is materially later, check the official Releases for a newer version before execution.

## 0. Hard prerequisites: stop and report if any fail

1. `node --version` must be >= v24. Upgrade Node first if it is older.
2. `uv --version` must work: the local Agent Server runs through uvx, so uv is a hard prerequisite.
3. Routes B / C / D require a successful `docker info`.
4. Port contract: expose only 8000 (ingress). Internal 3001 (static), 18000 (agent server), and 18001 (automation) must not be exposed externally.

## 1. Choose one deployment route after confirming with the user

| Route | Appropriate scenario | Trust boundary |
| --- | --- | --- |
| A · Local npm full stack | Experimentation and debugging on a trusted personal machine | No isolation; the Agent inherits all current-user privileges |
| B · Single Docker container | Recommended starting point for local isolation | The Agent sees only directories mounted into /projects |
| C · Container per conversation | Unattended runs and software factories | Independent hardened container per conversation: non-root, cap-drop ALL, loopback only |
| D · Persistent VM service | Team or public self-hosting | Three layers: firewall + API key + nginx TLS |

When uncertain, choose B. Public networks require D. Software factories require C or D, using the per-conversation container capability available since 1.24.0.

## 2. Route A · Local npm full stack

```bash
npm install -g @openhands/agent-canvas
agent-canvas --version   # Expected output: 1.43.0
agent-canvas --info      # Inspect version and stack configuration
agent-canvas             # Start the full stack and open http://localhost:8000
```

After startup, configure the model in Settings → LLM and choose a project with Open Workspace. Stop with Ctrl+C. Upgrade with `npm install -g @openhands/agent-canvas@1.43.0`.

Warning: the official documentation explicitly states that this mode has no sandbox. The Agent reads and writes the filesystem and executes shell commands with your account privileges. Do not run automation on untrusted repositories in this mode.

## 3. Route B · Single Docker container

```bash
mkdir -p ~/projects
docker run -it \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \
  -v openhands-data:/home/openhands/.openhands \
  -v "$HOME/projects:/projects" \
  ghcr.io/openhands/agent-canvas:1.43.0
# Open http://localhost:8000/canvas in a browser
```

Pin the tag instead of latest; the official troubleshooting guide records latest images missing files and crash-looping. Use `AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true` only with a 127.0.0.1 binding, and remove it before LAN exposure.

## 4. Route C · Container per conversation

```bash
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas
# Optional: allow each conversation to choose a Local / Docker runtime
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
```

Resource defaults: 4g memory, 2.0 CPUs, 512 PIDs, and container reclamation after 1200 idle seconds. Verify isolation:

```bash
# Ask the Agent to execute inside the conversation
id
printf 'PWD=%s\nHOME=%s\n' "$PWD" "$HOME"
# Expected: PWD=/workspace and HOME=/var/openhands/.openhands, not the host home

# Verify container hardening from the host
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# Expected: CapDrop=[ALL], no-new-privileges, and ports bound only to 127.0.0.1
```

## 5. Route D · Persistent VM service

```bash
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"   # Save in a secret manager immediately
npx @openhands/agent-canvas --public
```

Persistent systemd service at `/etc/systemd/system/agent-canvas.service`:

```ini
[Service]
Environment=LOCAL_BACKEND_API_KEY=<your-key>
ExecStart=npx @openhands/agent-canvas --public
Restart=on-failure
RestartSec=5
```

Allow only SSH (restricted to your IP) and 443 through the firewall. nginx terminates TLS and forwards to 127.0.0.1:8000, including WebSocket headers. Then run `systemctl enable --now agent-canvas`. Public mode does not inject the key into the page.

## 6. Secrets and state for every route

- Session keys (LOCAL_BACKEND_API_KEY / api-key.txt) control who can connect to the backend; model keys (Settings → LLM) control which model provider is called. They cannot replace each other.
- Secrets do not belong in Git, image layers, or YAML.
- State locations: npm uses ~/.openhands. Docker uses the openhands-data volume (/home/openhands/.openhands inside the container), with the session key in agent-canvas/api-key.txt.
- Do not bind-mount ~/.openhands on Linux: the container user is UID 10001 and may report unable to open database file. Use a named volume.
- Recover the Docker-generated session key with `docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`.
- Without AUTOMATION_KV_SECRET, the launcher pins the first session key to automation-kv-secret.txt.

## 7. Optional: integrate the official software factory

1. Configure the model in Settings → LLM using a provider key, OpenHands key, ACP sign-in, or local endpoint.
2. Save three fine-grained GitHub PATs in Settings → Secrets:
   - FACTORY_GITHUB_TRIAGE_TOKEN: Contents read + Issues read/write, without code-write permission.
   - FACTORY_GITHUB_DEVELOPER_TOKEN: Contents / Issues / PRs read/write + Actions and statuses read, without workflow write by default.
   - FACTORY_GITHUB_REVIEWER_TOKEN: Contents / Actions read + Issues / PRs / statuses read/write, without push permission.
3. Create three Agent Profiles in Settings → Agent. Select only each profile’s own secret, and disable MCP servers, model switching, and sub-Agents.
4. Install four templates in order under Automate → Templates with Check frequency */5 * * * *: Triage → Issue to PR (trigger label ready-for-dev, branch prefix factory/issue) → Code Review (label openhands-review) → Delivery Watchdog.
5. Enable only after all are created, and walk through the full flow with one small Issue first.

Red line: the watchdog is a deterministic checker that reuses the developer token and starts no Agent. Merge requires green watchdog checks, GitHub branch protection, and human approval. No Agent may merge by itself.

## 8. Eight acceptance gates: stop at the first failure

1. Repeatable version: `agent-canvas --version` reports 1.43.0; Docker uses a fixed tag rather than latest.
2. Full stack is healthy: the UI opens, the default backend shows connected, and containers are not crash-looping.
3. Session keys are controlled: deployments beyond localhost use --public or manual key entry; pages never embed secrets.
4. Workspace matches expectations: the Agent sees only /projects or an explicitly opened directory; PWD/HOME checks pass.
5. Container hardening is active: docker inspect confirms CapDrop=ALL, no-new-privileges, and loopback-only ports.
6. Model path works: a simple conversation traverses the event stream, and 401 key errors are distinguished from provider configuration errors.
7. Automation can be paused: every automation can be disabled independently; stop scheduling before investigating failures.
8. Merge is outside the Agent: deterministic watchdog checks, GitHub branch protection, and final human approval are all present.

## 9. Troubleshooting

1. `agent-canvas` is not found: find the prefix with `npm prefix -g`, add `$(npm prefix -g)/bin` to PATH, or bypass global installation with `npx @openhands/agent-canvas`.
2. Missing uv / uvx: install uv using its official guide, open a new terminal, and verify with `uv --version`.
3. unable to open database file on Linux: use the named openhands-data volume, or copy old state into a volume and chown it to 10001 with a one-off root container. Never make the state directory world-writable.
4. Image crash-loops with ERR_MODULE_NOT_FOUND: pin a known-good tag (1.43.0) or immutable digest, and pull again after a fix is released.
5. Browser asks for an API key: retrieve api-key.txt as described in section 6. It needs the session key, not a model key.
6. LLM Provider NOT provided / no model response: check provider, model, base URL, and key in Settings → LLM; confirm endpoint reachability for local models such as Ollama / LM Studio.
7. ACP Agent credentials do not work for Claude Code / Codex and similar tools: sign-ins live on the backend host. Sign in again on that host or configure its API key, then restart the conversation.
8. macOS desktop first launch reports that the app is damaged: run `xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"`. The app is unsigned and official issue #16774 tracks signature progress; do not disable Gatekeeper.

## 10. Upgrades and backups

```bash
# Upgrade: state lives outside the package / image, so upgrades do not move data
docker pull ghcr.io/openhands/agent-canvas:1.43.0
docker stop <container> && docker run …   # Reuse the openhands-data volume

# Back up the state volume
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'
```

Upgrade order: record the current version and image digest → back up the state volume and project directory → read cross-version Release notes → run existing automations in a test environment → move to production while retaining the old image until the new version is stable.

## 11. Security red lines for every route

- Never use AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true with a non-127.0.0.1 binding.
- Never process untrusted repositories in unsandboxed npm mode.
- Never consolidate the three factory tokens; the reviewer never receives push permission.
- No Agent may hold merge permission. Treat all GitHub Issue text as untrusted input.
- On multi-user servers, do not treat container.memory / cpus environment variables as limits because conversation-start requests can override them.

## Sources and verification scope: verified 2026-11-21

- github.com/OpenHands/OpenHands: README, docs/SELF_HOSTING.md, and Release v1.43.0.
- docs.openhands.dev: agent-canvas/setup, agent-canvas/architecture, backend-setup/docker-execution, use-cases/software-factory, and agent-canvas/troubleshooting.
- Verification scope: the npm registry showed 1.43.0 as latest, released on 2026-11-20. The verification environment had Node v20, below the requirement of 24, and no Docker. The service was not started, no model was called, and the software-factory walkthrough was not reproduced; the commands above are official-source material.
