import type { DeploySkill } from './deploySkills'

export const openHandsDeploySkillEn: DeploySkill = {
  slug: 'openhands-agent-canvas',
  title: 'OpenHands Agent Canvas deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including host preparation, CLI / source / Docker routes, GitHub automation, acceptance, and troubleshooting.',
  version: 'OpenHands Agent Canvas v1.43.0', verifyDate: '2026-11-20', fileName: 'openhands-agent-canvas-en.md', accent: 'pink',
  routes: [{ id: 'A', label: 'Official CLI' }, { id: 'B', label: 'Global npm' }, { id: 'C', label: 'Source development' }, { id: 'D', label: 'Headless + Docker' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Environment & secrets', '05 Exact commands', '06 GitHub PR automation', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: `---
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
    nohup env UV_CACHE_DIR=/srv/openhands/.uv-cache \
      uvx --python 3.13 --from openhands-agent-server \
      openhands-agent-server --host 127.0.0.1 > /srv/openhands/agent-server.log 2>&1 &

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
`,
}

export const miniSweAgentDeploySkillEn: DeploySkill = {
  slug: 'mini-swe-agent',
  title: 'mini-SWE-agent deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including environment preparation, local confirmation, hardened Docker, trajectory acceptance, and troubleshooting.',
  version: 'mini-SWE-agent v2.4.6', verifyDate: '2026-11-21', fileName: 'mini-swe-agent-en.md', accent: 'green',
  routes: [{ id: 'A', label: 'Local confirmation' }, { id: 'B', label: 'Hardened Docker' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Model & secret environment', '05 Exact commands', '06 Automation integration', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: `---
name: mini-swe-agent-deploy
description: Deploy or reproduce mini-SWE-agent v2.4.6 as a single-task execution kernel. Use when a coding Agent must install the package, choose local confirmation or hardened Docker, configure model and budget limits, read trajectories, or connect an outer Issue-to-patch pipeline. Includes exact commands, eight acceptance gates, and troubleshooting. Covers only v2.4.6 verified on 2026-11-21; recheck v2 migration guidance before using another version.
---

# mini-SWE-agent deployment execution manual

> Target version: **mini-swe-agent 2.4.6**; facts verified: **2026-11-21**.
> Evidence: the pinned package was installed in an isolated temporary directory; import, version, and python -m minisweagent --help succeeded. No model, Docker route, or real repository repair was executed.
> Hard boundaries: model keys stay out of containers, GitHub Tokens stay out of containers, and no secret enters YAML or Git. Submitted is not test success and never grants merge permission.

## 01 · Scope and version contract

Use mini as a transparent single-task Agent loop, not as an Issue queue, approval system, or multi-tenant platform. Pin mini-swe-agent==2.4.6 and save pip freeze. v2 changes configuration loading, model parsing, and legacy entry points; do not copy v1 commands or YAML without migration.

## 02 · Choose a deployment route

| Route | When to use | Security boundary | Evidence level |
| --- | --- | --- | --- |
| A · Local + confirm | Read the loop on a disposable demo repository | No filesystem isolation; human confirmation only | Package / CLI checked; task not executed |
| B · Docker + constraints | Recommended reproduction and outer automation | Offline container, dropped capabilities, resource limits | Deployment template; Docker not executed |

Do not use local for production or untrusted repositories. If a task needs online dependency installation, prebuild the image or design a domain-level egress proxy rather than opening unrestricted networking.

## 03 · Dependencies and directories

- Python >= 3.10; example uses 3.12.
- bash locally or inside the container.
- mini-swe-agent 2.4.6, pydantic >= 2.0, and litellm >= 1.75.5 excluding 1.82.7 / 1.82.8.
- Optional Docker / Podman; Singularity / Apptainer for relevant benchmark environments.
- Git / gh / jq only for the outer automation example; no persistent HTTP port is required.

    mkdir -p /srv/agent-factory/{workspace/project,runs}
    cd /srv/agent-factory
    python3.12 -m venv .venv
    source .venv/bin/activate
    python -m pip install --upgrade pip
    python -m pip install 'mini-swe-agent==2.4.6'
    python -c 'import minisweagent; print(minisweagent.__version__)'
    python -m minisweagent --help

Create workspace/project before mounting it. Keep factory.local.yaml, factory.docker.yaml, and runs/ under /srv/agent-factory. Use a dependency-complete, digest-pinned image for real projects.

## 04 · Model, secrets, and global budget

    export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'
    export ANTHROPIC_API_KEY='injected-by-a-secret-manager'
    export MSWEA_CONFIGURED=true
    export MSWEA_GLOBAL_CALL_LIMIT=100
    export MSWEA_GLOBAL_COST_LIMIT=10.00

Use the provider-prefixed model name. Inject keys through host process environment or a secret manager. Do not write them into YAML, Git, logs, images, or the container. Set both global and per-task limits, plus provider-side budgets and alerts.

## 05 · Exact commands by route

### A · Local confirmation

factory.local.yaml:

    agent:
      step_limit: 80
      cost_limit: 3.0
      wall_time_limit_seconds: 1800
      max_consecutive_format_errors: 3
      mode: confirm
    environment:
      cwd: /srv/agent-factory/workspace/project
      timeout: 120
      env:
        PAGER: cat
        MANPAGER: cat
        PIP_PROGRESS_BAR: 'off'
        TQDM_DISABLE: '1'

Run:

    cd /srv/agent-factory
    source .venv/bin/activate
    mini -c mini.yaml -c /srv/agent-factory/factory.local.yaml \
      -t 'Reproduce first, make the smallest fix, and run related tests. Do not commit or push.' \
      -o /srv/agent-factory/runs/local-demo.traj.json

Always load mini.yaml explicitly when using -c. Local subprocesses inherit the host; confirm is not a sandbox.

### B · Hardened Docker

factory.docker.yaml:

    agent:
      step_limit: 80
      cost_limit: 3.0
      wall_time_limit_seconds: 1800
      max_consecutive_format_errors: 3
      mode: yolo
      confirm_exit: false
    environment:
      environment_class: docker
      image: python:3.12-bookworm
      cwd: /workspace
      timeout: 120
      container_timeout: 2h
      pull_timeout: 300
      run_args:
        - --rm
        - --network
        - none
        - --cap-drop
        - ALL
        - --security-opt
        - no-new-privileges
        - --pids-limit
        - '256'
        - --memory
        - 2g
        - --cpus
        - '2'
        - -v
        - /srv/agent-factory/workspace/project:/workspace:rw

Run:

    cd /srv/agent-factory
    source .venv/bin/activate
    docker info >/dev/null
    docker pull python:3.12-bookworm
    mini -c mini.yaml -c /srv/agent-factory/factory.docker.yaml \
      -t 'Inspect the repository, fix the described issue, and run tests. Do not use network, commit, or push.' \
      -o /srv/agent-factory/runs/docker-demo.traj.json \
      --yolo --exit-immediately

Use yolo only inside the constrained sandbox. The offline container cannot install online dependencies or push code.

## 06 · Outer automation integration

v2 removed the dedicated github_issue.py. An outer scheduler must fetch the Issue, create a new run ID and clean workspace, invoke mini, and inspect the trajectory. gh and jq are outer dependencies, not built-in mini components.

    gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
    mini -c mini.yaml -c factory.docker.yaml \
      -t "$(cat "runs/$RUN_ID.issue.txt")" \
      -o "runs/$RUN_ID.traj.json" --yolo --exit-immediately
    jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
    git -C workspace/project diff --check
    git -C workspace/project diff > "runs/$RUN_ID.patch"

Treat Issue text as untrusted. Separate trigger and write permissions. Keep GitHub Token outside the container. Apply the patch in a clean environment, run full CI and secret scanning, then request human review. Never auto-merge.

## 07 · Eight acceptance gates

1. Repeatable version: import reports 2.4.6 and pip freeze is saved.
2. Explainable configuration: startup includes mini.yaml plus custom YAML and a provider-prefixed model.
3. Disposable workspace: only a copy is mounted; unrelated host paths and Docker socket are not writable.
4. Secret safety: trajectory, patch, and logs contain no API key; the container has no model secret by default.
5. Effective limits: command timeout, per-task cost / steps, and wall-clock limits are exercised separately.
6. Readable trajectory: JSON includes version, configuration, messages, model statistics, and explicit exit_status.
7. Reviewable change: git diff --check passes and the patch has only intended files, without binaries or temporary scripts.
8. Independent delivery: clean-environment CI passes and a human, not the Agent, grants merge approval.

Preserve four outcomes distinctly: Submitted means claimed completion and requires acceptance; LimitsExceeded and TimeExceeded are not success; RepeatedFormatError indicates tool-contract failure.

## 08 · Troubleshooting

### Missing templates after using -c
Once -c is supplied, the default mini.yaml is not loaded automatically. Use mini -c mini.yaml -c factory.local.yaml. For text parsing, keep action_regex and templates consistent.

### AuthenticationError with a configured key
Check provider prefix, variable name, environment order, and provider-side authentication without printing the secret. Issue #558 was open at verification time. Do not fix authentication by injecting the key into the container.

### cd or export disappears next turn
Each action uses a fresh subshell by design. Use cd /workspace && pytest in one action, configure environment.cwd, or explicitly load a workspace environment file.

### Docker pull timeout or execution failure
Check network, architecture, daemon permission, and bash inside the image. Run docker info / pull / exec manually. pull_timeout defaults to 120 seconds; ordinary command environment.timeout defaults to 30 seconds.

### CI waits for input or does not exit
Mini defaults to confirm and asks on submission. Use --yolo --exit-immediately only in a constrained sandbox, retaining cost, step, and wall-clock limits.

### LimitsExceeded / TimeExceeded
Narrow task and tests, inspect the trajectory for loops, then adjust limits with evidence. cost_limit=0 means unlimited and is not a routine fix.

### Old mini -v / github_issue.py tutorial fails
v2 removed the Visual UI, dedicated github_issue script, key rotation, and old model classes. Follow the official v2 migration guide. If staying on v1, pin mini-swe-agent~=1.0 and keep its configuration separate.

## 09 · Risks, upgrades, and backup

High risks: unisolated local shell and Issue / repository prompt injection. Medium risks: default containers are not least privilege, dependency supply chain, and trajectory leakage. Package metadata remains Alpha; benchmark claims do not prove quality on your repository.

Before upgrades, back up custom YAML, runs/, dependency locks, test scripts, and image digests without plaintext secrets. Install the target in a new virtual environment and retain 2.4.6 for rollback. Compare the same small non-sensitive task for trajectory structure, protocols, configuration keys, cost, tests, and exit statuses.

Set per-task and global cost / call limits plus provider budgets and alerts. Encrypt any indispensable secret backup separately. Restrict runs/ permissions, define retention, and redact traces before sharing. Highly adversarial workloads need stronger isolation than the Docker example.

Sources: https://github.com/SWE-agent/mini-swe-agent · https://mini-swe-agent.com/latest/quickstart/ · https://mini-swe-agent.com/latest/advanced/control_flow/ · https://mini-swe-agent.com/latest/advanced/environments/ · https://mini-swe-agent.com/latest/advanced/yaml_configuration/ · https://mini-swe-agent.com/latest/advanced/global_configuration/ · https://mini-swe-agent.com/latest/advanced/v2_migration/
`,
}

export const sweAgentDeploySkillEn: DeploySkill = {
  slug: 'swe-agent',
  title: 'SWE-agent (legacy) deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including source installation, hardened Docker, Modal, batch benchmarks, trajectory inspection, and migration boundaries.',
  version: 'SWE-agent v1.1.0 (legacy)', verifyDate: '2026-11-21', fileName: 'swe-agent-legacy-en.md', accent: 'yellow',
  routes: [{ id: 'A', label: 'Hardened Docker' }, { id: 'B', label: 'Modal cloud' }, { id: 'C', label: 'Batch benchmarks' }, { id: 'D', label: 'Trajectory review' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Model & secret environment', '05 Exact commands', '06 Automation integration', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: `---
name: swe-agent-legacy-deploy
description: Reproduce or maintain the legacy SWE-agent v1.1.0 framework for historical pipelines, ACI research, and batch experiments. Use when a coding Agent must perform editable source installation, configure hardened Docker or Modal, run SWE-bench batches, inspect trajectories, or migrate from older YAML. Includes exact commands, eight acceptance gates, and troubleshooting. The official project is in maintenance mode and recommends mini-SWE-agent; evaluate mini first for new platforms.
---

# SWE-agent v1.1.0 legacy deployment execution manual

> Target version: **SWE-agent v1.1.0**, commit **0f3acafacabc0def8cc76b4e48acb4b6cf302cb9**; facts verified: **2026-11-21**.
> Evidence: source was cloned and installed in an isolated temporary directory; sweagent --help, run --help, run-batch --help, and trajectory-viewer help succeeded. No model, Docker, real Issue repair, or SWE-bench run was executed.
> Hard boundaries: model keys stay on the host, GitHub Tokens stay out of containers, and no secret enters YAML or Git. run-batch produces predictions, not proof of correctness; merge remains human-controlled.

## 01 · Scope and version contract

Use SWE-agent v1.1.0 for historical compatibility, ACI research, and controlled batch experiments. The official README and documentation recommend mini-SWE-agent for new work. Pin the v1.1.0 tag and commit, save the dependency lock, and do not present the legacy framework as the default base for a new production factory.

v1.1.0 changes trajectory messages to query, renames several windowed tool bundles, removes review_on_submit in favor of review_on_submit_m, and adds SWE-bench multilingual / multimodal plus SWE-smith support. Do not apply older parsing scripts or YAML unchanged.

## 02 · Choose a deployment route

| Route | When to use | Main boundary | Evidence level |
| --- | --- | --- | --- |
| A · Source + hardened Docker | Reproduce one historical repository task | Host uploads local repo; offline constrained container | Install / CLI checked; Docker and model not executed |
| B · Local repo + Modal | Host has no Docker and cloud execution is allowed | Source and output enter a cloud sandbox | Command template; Modal not executed |
| C · run-batch | SWE-bench or historical Issue experiments | Concurrency amplifies cost and runtime load | CLI help checked; benchmark not executed |
| D · inspect / inspector | Review existing .traj / preds / logs | Read-only analysis of sensitive traces | Help entry checked; no real trace supplied |

Evaluate mini-SWE-agent before starting a new platform. Do not fall back to unisolated local execution merely because Docker is unavailable.

## 03 · Dependencies and directories

- Python >= 3.11; example uses 3.11.
- sweagent 1.1.0 through editable source installation.
- SWE-ReX >= 1.2.0; version 1.4.0 resolved during the check.
- Default Docker image python:3.11; pin a tag / digest for real runs.
- Optional Modal / Fargate; litellm model integration.
- Inspector uses a web port; ordinary CLI repair tasks need no persistent port.

    mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
    cd /srv/agent-factory
    python3.11 -m venv .venv
    source .venv/bin/activate
    git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
    cd vendor/SWE-agent
    git rev-parse HEAD
    python -m pip install --upgrade pip
    python -m pip install --editable .
    sweagent --help
    python -m sweagent run --help

Keep .venv, vendor/SWE-agent, factory.docker.yaml, workspace/project, and runs under /srv/agent-factory. Without editable installation, SWE_AGENT_CONFIG_DIR, SWE_AGENT_TOOLS_DIR, and SWE_AGENT_TRAJECTORY_DIR must point to the source tree; prefer the official source route.

## 04 · Model and secret environment

    export ANTHROPIC_API_KEY='injected-by-a-secret-manager'
    export OPENAI_API_KEY='injected-by-a-secret-manager'

Prefer host process environment or a secret manager. Optional .env must be chmod 600 and ignored by Git. Public repositories normally need no GITHUB_TOKEN. For private repositories, prefetch on the host and pass env.repo.type=local; do not put a long-lived token into a clone URL executed inside an untrusted container.

Set per-instance and total model cost limits plus provider-side budgets and alerts. Never print keys into logs or trajectories.

## 05 · Exact commands by route

### A · Hardened Docker

factory.docker.yaml:

    env:
      deployment:
        type: docker
        image: python:3.11
        pull: missing
        remove_container: true
        docker_args:
          - --network
          - none
          - --cap-drop
          - ALL
          - --security-opt
          - no-new-privileges
          - --pids-limit
          - '256'
          - --memory
          - 2g
          - --cpus
          - '2'
      repo:
        type: local
        path: /srv/agent-factory/workspace/project
        base_commit: HEAD
    problem_statement:
      type: text
      text: 'Reproduce first, make the smallest fix, and run related tests. Do not commit, push, or use network.'
    agent:
      model:
        name: claude-3-7-sonnet-latest
        per_instance_cost_limit: 2.00
        total_cost_limit: 5.00
      tools:
        execution_timeout: 30
        install_timeout: 300
        total_execution_timeout: 1800
        max_consecutive_execution_timeouts: 3

Run:

    cd /srv/agent-factory/vendor/SWE-agent
    source /srv/agent-factory/.venv/bin/activate
    docker info >/dev/null
    docker pull python:3.11
    sweagent run \
      --config config/default.yaml \
      --config /srv/agent-factory/factory.docker.yaml \
      --output_dir /srv/agent-factory/runs/docker-single

Load default and custom YAML together. SWE-ReX uploads the local repository, so the container can remain offline.

### B · Modal cloud

    cd /srv/agent-factory/vendor/SWE-agent
    source /srv/agent-factory/.venv/bin/activate
    modal token new
    cat > /srv/agent-factory/runs/task.md <<'EOF'
    Reproduce first, make the smallest fix, and run related tests. Do not commit or push.
    EOF
    sweagent run \
      --config config/default.yaml \
      --agent.model.name=claude-3-7-sonnet-latest \
      --agent.model.per_instance_cost_limit=2.00 \
      --env.deployment.type=modal \
      --env.repo.path=/srv/agent-factory/workspace/project \
      --problem_statement.path=/srv/agent-factory/runs/task.md \
      --output_dir=/srv/agent-factory/runs/modal-single

Complete Modal authentication independently. Confirm cloud region, logs, retention, and data policy before uploading source. Model keys remain on the host; repository and observations enter the cloud runtime.

### C · Batch benchmarks

    sweagent run-batch \
      --config config/default.yaml \
      --agent.model.name=claude-3-7-sonnet-latest \
      --agent.model.per_instance_cost_limit=2.00 \
      --instances.type=swe_bench \
      --instances.subset=lite \
      --instances.split=dev \
      --instances.slice=:3 \
      --num_workers=3 \
      --output_dir=/srv/agent-factory/runs/swebench-smoke
    sweagent merge-preds /srv/agent-factory/runs/swebench-smoke

Smoke-test three instances before expanding slice and workers. Instance sources include swe_bench, file, huggingface, and expert_file. preds.json requires external evaluation.

### D · Trajectory review

    sweagent inspect /srv/agent-factory/runs/docker-single/**/*.traj
    sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001
    sweagent quick-stats /srv/agent-factory/runs/docker-single

Bind inspector locally by default. Trajectories can contain source, paths, and secrets; restrict access and redact before sharing.

## 06 · Outer automation integration

An outer scheduler owns Issue intake, repository prefetch, clean workspaces, retries, CI, and delivery. Issue text is untrusted and public triggers require maintainer approval.

    gh issue view 123 --repo "$GITHUB_REPOSITORY" > "$ROOT/runs/$RUN_ID.md"
    git -C "$ROOT/workspace/project" status --porcelain | grep -q . && exit 2
    sweagent run --config config/default.yaml \
      --config "$ROOT/factory.docker.yaml" \
      --problem_statement.path="$ROOT/runs/$RUN_ID.md" \
      --output_dir="$ROOT/runs/$RUN_ID"

Then locate .traj, require info.exit_status == submitted and a non-empty info.submission, apply the submission to a clean copy, run full CI and secret scanning, and request human review. Never auto-merge.

Private-repository red line: GithubRepoConfig can interpolate GITHUB_TOKEN into a git remote URL inside the container. Use host prefetch plus env.repo.type=local or a separately designed short-lived least-privilege credential boundary.

## 07 · Eight acceptance gates

1. Repeatable version: tag and CLI report v1.1.0 and the dependency lock is saved.
2. Explainable configuration: default and custom YAML, model, parser, and tool bundle match expectations.
3. Isolated execution: Docker has no network, dropped capabilities, no-new-privileges, and resource limits; no local execution for untrusted repositories.
4. Secret safety: YAML, Git, container environment, and trajectories contain no model key; GitHub Token stays outside the container.
5. Effective limits: execution_timeout, install_timeout, total_execution_timeout, and cost limits are exercised.
6. Readable trajectory: .traj includes query, thought, action, observation, model_stats, and exit_status.
7. Reviewable patch: submission is non-empty and a clean-copy git apply --check plus tests pass.
8. Independent evaluation and merge: run-batch only produces preds.json; SWE-bench / CI and human approval remain outside the Agent.

## 08 · Troubleshooting

### sweagent missing or wrong version
Check which python and which sweagent in the same venv. Reinstall from v1.1.0 source with pip install --editable ., then run python -m sweagent --help. Avoid unexpected PyPI packages.

### Missing config / tools / trajectories on import
Non-editable installation lacks the repository top-level directories. Prefer editable source or set SWE_AGENT_CONFIG_DIR, SWE_AGENT_TOOLS_DIR, and SWE_AGENT_TRAJECTORY_DIR to the source tree.

### Docker socket permission / docker not found
Docker is the default backend. Verify docker run hello-world and fix daemon / user-group access on the host. Use Modal if policy permits; do not use unisolated local as a shortcut.

### Model 401 / 404 / cost errors
Check key presence, provider-prefixed model, base URL, and litellm cost table without printing secrets. For local models, set cost limit to 0 and configure max_input_tokens.

### No valid model action
Default parser is function_calling. Use a tool-calling model or set agent.tools.parse_function.type=thought_action and ensure templates expose tool documentation.

### Legacy review_on_submit / tool bundle missing
Migrate to review_on_submit_m and the new windowed bundle names using the v1.1.0 changelog. Do not reuse v0.7 / v1.0 YAML unchanged.

### Partial batch and stale / missing preds.json
Inspect run_batch_exit_statuses.yaml and instance logs. Use sweagent remove-unfinished, then sweagent merge-preds in the experiment directory. Do not assume every prediction is current.

## 09 · Risks, migration, and backup

Highest risks: treating a maintenance-mode project as a new foundation, token leakage through container-side git URLs, and Issue / repository prompt injection. Additional risks: local-model parser mismatch, trace leakage, and assuming benchmark results transfer to private repositories.

Pin v1.1.0 and its lock; back up YAML, runs/, task lists, image digests, and experiment notes without plaintext secrets. Evaluate mini-SWE-agent first for new requirements. Across versions, compare trajectory fields, tool names, parsers, SWE-ReX interfaces, cost, and patch quality on the same small task. Retain the old environment until the new route passes acceptance.

Set per-instance and total cost limits plus provider budgets and alerts. Smoke-test batches with slice=:3 and num_workers=3. Protect trajectories and preds as sensitive research assets with restricted access, retention, and redaction.

Sources: https://github.com/SWE-agent/SWE-agent · https://swe-agent.com/latest/installation/changelog/ · https://swe-agent.com/latest/background/architecture/ · https://swe-agent.com/latest/background/aci/ · https://swe-agent.com/latest/installation/source/ · https://swe-agent.com/latest/usage/hello_world/ · https://swe-agent.com/latest/usage/batch_mode/ · https://swe-agent.com/latest/usage/trajectories/ · https://github.com/SWE-agent/SWE-ReX
`,
}
