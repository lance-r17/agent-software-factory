---
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
    sweagent run       --config config/default.yaml       --config /srv/agent-factory/factory.docker.yaml       --output_dir /srv/agent-factory/runs/docker-single

Load default and custom YAML together. SWE-ReX uploads the local repository, so the container can remain offline.

### B · Modal cloud

    cd /srv/agent-factory/vendor/SWE-agent
    source /srv/agent-factory/.venv/bin/activate
    modal token new
    cat > /srv/agent-factory/runs/task.md <<'EOF'
    Reproduce first, make the smallest fix, and run related tests. Do not commit or push.
    EOF
    sweagent run       --config config/default.yaml       --agent.model.name=claude-3-7-sonnet-latest       --agent.model.per_instance_cost_limit=2.00       --env.deployment.type=modal       --env.repo.path=/srv/agent-factory/workspace/project       --problem_statement.path=/srv/agent-factory/runs/task.md       --output_dir=/srv/agent-factory/runs/modal-single

Complete Modal authentication independently. Confirm cloud region, logs, retention, and data policy before uploading source. Model keys remain on the host; repository and observations enter the cloud runtime.

### C · Batch benchmarks

    sweagent run-batch       --config config/default.yaml       --agent.model.name=claude-3-7-sonnet-latest       --agent.model.per_instance_cost_limit=2.00       --instances.type=swe_bench       --instances.subset=lite       --instances.split=dev       --instances.slice=:3       --num_workers=3       --output_dir=/srv/agent-factory/runs/swebench-smoke
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
    sweagent run --config config/default.yaml       --config "$ROOT/factory.docker.yaml"       --problem_statement.path="$ROOT/runs/$RUN_ID.md"       --output_dir="$ROOT/runs/$RUN_ID"

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
