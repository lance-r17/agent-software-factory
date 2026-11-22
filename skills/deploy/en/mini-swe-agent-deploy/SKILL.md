---
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
    mini -c mini.yaml -c /srv/agent-factory/factory.local.yaml       -t 'Reproduce first, make the smallest fix, and run related tests. Do not commit or push.'       -o /srv/agent-factory/runs/local-demo.traj.json

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
    mini -c mini.yaml -c /srv/agent-factory/factory.docker.yaml       -t 'Inspect the repository, fix the described issue, and run tests. Do not use network, commit, or push.'       -o /srv/agent-factory/runs/docker-demo.traj.json       --yolo --exit-immediately

Use yolo only inside the constrained sandbox. The offline container cannot install online dependencies or push code.

## 06 · Outer automation integration

v2 removed the dedicated github_issue.py. An outer scheduler must fetch the Issue, create a new run ID and clean workspace, invoke mini, and inspect the trajectory. gh and jq are outer dependencies, not built-in mini components.

    gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
    mini -c mini.yaml -c factory.docker.yaml       -t "$(cat "runs/$RUN_ID.issue.txt")"       -o "runs/$RUN_ID.traj.json" --yolo --exit-immediately
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
