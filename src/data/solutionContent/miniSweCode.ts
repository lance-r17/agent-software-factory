// Operational commands and locale-specific comments for mini-SWE-agent.

const zhCode = {
  INSTALL_CODE: `# Linux / macOS；本页示例选用 Python 3.12
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# 只验证包和入口，不会调用模型
python -c 'import minisweagent; print(minisweagent.__version__)'
python -m minisweagent --help`,
  ENV_CODE: `# 模型名必须带 provider 前缀；这里沿用官方文档示例
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'
export ANTHROPIC_API_KEY='由密钥管理器注入，不要写进 YAML 或 Git'
export MSWEA_CONFIGURED=true

# 进程级总闸门；单任务闸门在 YAML 中继续收紧
export MSWEA_GLOBAL_CALL_LIMIT=100
export MSWEA_GLOBAL_COST_LIMIT=10.00`,
  LOCAL_YAML: `# /srv/agent-factory/factory.local.yaml
# 必须与内置 mini.yaml 一起加载：-c mini.yaml -c factory.local.yaml
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
    TQDM_DISABLE: '1'`,
  LOCAL_RUN: `cd /srv/agent-factory
source .venv/bin/activate
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.local.yaml \
  -t '先复现问题，再做最小修改；运行相关测试，不要提交或推送。' \
  -o /srv/agent-factory/runs/local-demo.traj.json`,
  DOCKER_YAML: `# /srv/agent-factory/factory.docker.yaml
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
    - /srv/agent-factory/workspace/project:/workspace:rw`,
  DOCKER_RUN: `cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm

# 先用无依赖的小型仓库演示；真实项目应换成已装依赖、固定 digest 的镜像
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.docker.yaml \
  -t '检查当前仓库，修复任务描述的问题，运行测试；不要联网、提交或推送。' \
  -o /srv/agent-factory/runs/docker-demo.traj.json \
  --yolo --exit-immediately`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

# gh / jq 是外层流水线依赖，不是 mini 的内建组件
gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \
  -t "$(cat "runs/$RUN_ID.issue.txt")" \
  -o "runs/$RUN_ID.traj.json" \
  --yolo --exit-immediately

# 进程退出不等于任务成功；先检查显式退出状态
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# 下一步：在隔离环境运行完整 CI，再交人工审阅；不要自动 merge。`,
  TRAJECTORY_CODE: `jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json`,
}

const enCode = {
  INSTALL_CODE: `# Linux / macOS; this example uses Python 3.12
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# Verify the package and entry point only; this does not call a model
python -c 'import minisweagent; print(minisweagent.__version__)'
python -m minisweagent --help`,
  ENV_CODE: `# The model name needs a provider prefix; this follows the official example
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'
export ANTHROPIC_API_KEY='injected-by-a-secret-manager-never-written-to-yaml-or-git'
export MSWEA_CONFIGURED=true

# Process-wide guardrails; tighten the per-task limits in YAML as well
export MSWEA_GLOBAL_CALL_LIMIT=100
export MSWEA_GLOBAL_COST_LIMIT=10.00`,
  LOCAL_YAML: `# /srv/agent-factory/factory.local.yaml
# Load together with the built-in mini.yaml: -c mini.yaml -c factory.local.yaml
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
    TQDM_DISABLE: '1'`,
  LOCAL_RUN: `cd /srv/agent-factory
source .venv/bin/activate
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.local.yaml \
  -t 'Reproduce the issue first, make the smallest fix, and run related tests. Do not commit or push.' \
  -o /srv/agent-factory/runs/local-demo.traj.json`,
  DOCKER_YAML: `# /srv/agent-factory/factory.docker.yaml
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
    - /srv/agent-factory/workspace/project:/workspace:rw`,
  DOCKER_RUN: `cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm

# Demonstrate on a small repository without dependencies; real projects should use
# an image with dependencies preinstalled and an immutable digest
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.docker.yaml \
  -t 'Inspect this repository, fix the described issue, and run tests. Do not use the network, commit, or push.' \
  -o /srv/agent-factory/runs/docker-demo.traj.json \
  --yolo --exit-immediately`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

# gh / jq belong to the outer pipeline; they are not built into mini
gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \
  -t "$(cat "runs/$RUN_ID.issue.txt")" \
  -o "runs/$RUN_ID.traj.json" \
  --yolo --exit-immediately

# Process exit is not task success; check the explicit exit status first
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# Next: run full CI in an isolated environment and request human review; never auto-merge.`,
  TRAJECTORY_CODE: `jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json`,
}

export const miniSweCode = { zh: zhCode, en: enCode }
