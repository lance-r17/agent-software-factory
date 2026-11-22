// SWE-agent operational commands and locale-specific comments.

const zhCode = {
  INSTALL_CODE: `# 官方推荐路线：从源码做 editable 安装
mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
cd /srv/agent-factory
python3.11 -m venv .venv
source .venv/bin/activate

git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
cd vendor/SWE-agent
git rev-parse HEAD   # 本次核验：0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
python -m pip install --upgrade pip
python -m pip install --editable .

# 只验证包与 CLI 入口，不会启动 Docker 或调用模型
sweagent --help
python -m sweagent run --help`,
  ENV_CODE: `# 推荐由宿主进程环境或密钥管理器注入；不要写进 YAML 或 Git
export ANTHROPIC_API_KEY='由密钥管理器注入'
export OPENAI_API_KEY='由密钥管理器注入'

# 公共仓库通常不需要 GITHUB_TOKEN。
# 若必须访问私有仓库，先在宿主侧预取代码，再按 local repo 传入；
# 不要让长期 Token 随 clone URL 进入不可信容器。

# 可选：.env 也能被读取，但必须 chmod 600、加入 .gitignore
# 本手册优先使用进程环境，不创建 .env。`,
  DOCKER_YAML: `# /srv/agent-factory/factory.docker.yaml
# 与默认 config/default.yaml 一起加载；这里只覆盖安全边界与任务输入
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
  text: '先复现问题，再做最小修改；运行相关测试；不要提交、推送或联网。'
agent:
  model:
    name: claude-3-7-sonnet-latest
    per_instance_cost_limit: 2.00
    total_cost_limit: 5.00
  tools:
    execution_timeout: 30
    install_timeout: 300
    total_execution_timeout: 1800
    max_consecutive_execution_timeouts: 3`,
  DOCKER_RUN: `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11

# 仓库由 SWE-ReX 从宿主上传到容器，因此可以在 docker_args 中断网
sweagent run \\
  --config config/default.yaml \\
  --config /srv/agent-factory/factory.docker.yaml \\
  --output_dir /srv/agent-factory/runs/docker-single`,
  MODAL_RUN: `# 适合本机没有 Docker、但允许代码进入云端沙箱的场景
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# 先完成 Modal 自身的认证与环境检查；这不是 SWE-agent 的内建组件
modal token new
cat > /srv/agent-factory/runs/task.md <<'EOF'
先复现问题，再做最小修改；运行相关测试；不要提交或推送。
EOF

sweagent run \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --env.deployment.type=modal \\
  --env.repo.path=/srv/agent-factory/workspace/project \\
  --problem_statement.path=/srv/agent-factory/runs/task.md \\
  --output_dir=/srv/agent-factory/runs/modal-single`,
  BATCH_RUN: `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# 先跑 3 个实例的烟测；确认成本、轨迹与容器负载后再扩大 slice / workers
sweagent run-batch \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --instances.type=swe_bench \\
  --instances.subset=lite \\
  --instances.split=dev \\
  --instances.slice=:3 \\
  --num_workers=3 \\
  --output_dir=/srv/agent-factory/runs/swebench-smoke

# 若 preds.json 过期或缺失，可在实验目录重建
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke`,
  INSPECT_CODE: `# 终端查看单个轨迹
sweagent inspect /srv/agent-factory/runs/docker-single/**/*.traj

# 浏览器查看整个实验目录；默认只绑定本机时用 127.0.0.1 访问
sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001

# 快速汇总退出状态、成本与 API 调用
sweagent quick-stats /srv/agent-factory/runs/docker-single`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT/vendor/SWE-agent"
source "$ROOT/.venv/bin/activate"

# 外层系统取 Issue，先保存为文本；Issue 内容一律视为不可信输入
gh issue view 123 --repo "$GITHUB_REPOSITORY" > "$ROOT/runs/$RUN_ID.md"
git -C "$ROOT/workspace/project" status --porcelain | grep -q . && exit 2

# 复用加固 Docker 配置；模型 key 留在宿主，GitHub Token 不进容器
sweagent run \\
  --config config/default.yaml \\
  --config "$ROOT/factory.docker.yaml" \\
  --problem_statement.path="$ROOT/runs/$RUN_ID.md" \\
  --output_dir="$ROOT/runs/$RUN_ID"

# 进程退出不等于修复成功：先查轨迹，再检查补丁，最后由 CI 与人审决定
python - <<'PY' "$ROOT/runs/$RUN_ID"
import json, pathlib, sys
run = pathlib.Path(sys.argv[1])
trajs = list(run.rglob('*.traj'))
assert trajs, '没有轨迹文件'
info = json.loads(trajs[0].read_text())['info']
assert info.get('exit_status') == 'submitted', info.get('exit_status')
assert info.get('submission'), '没有 submission 补丁'
PY
# 下一步：把 submission 应用到干净副本，运行完整 CI，再交人工审阅。`,
  TRAJECTORY_CODE: `jq '{
  version: .info.swe_agent_version,
  rex: .info.swe_rex_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission_present: (.info.submission != null),
  steps: (.trajectory | length)
}' runs/docker-single/**/*.traj`,
}

const enCode = {
  INSTALL_CODE: `# Officially recommended route: editable installation from source
mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
cd /srv/agent-factory
python3.11 -m venv .venv
source .venv/bin/activate

git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
cd vendor/SWE-agent
git rev-parse HEAD   # Checked here: 0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
python -m pip install --upgrade pip
python -m pip install --editable .

# Verify package and CLI entry points only; this starts no Docker and calls no model
sweagent --help
python -m sweagent run --help`,
  ENV_CODE: `# Prefer host process environment or a secret manager; never write keys to YAML or Git
export ANTHROPIC_API_KEY='injected-by-a-secret-manager'
export OPENAI_API_KEY='injected-by-a-secret-manager'

# Public repositories normally do not need GITHUB_TOKEN.
# If a private repository is unavoidable, prefetch it on the host and pass it as
# a local repo; do not put a long-lived token into a clone URL inside an untrusted container.

# Optional: .env can also be read, but it must be chmod 600 and listed in .gitignore.
# This guide prefers process environment and does not create .env.`,
  DOCKER_YAML: `# /srv/agent-factory/factory.docker.yaml
# Load together with the default config/default.yaml; override only security boundaries and task input
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
  text: 'Reproduce first, make the smallest fix, and run related tests. Do not commit, push, or use the network.'
agent:
  model:
    name: claude-3-7-sonnet-latest
    per_instance_cost_limit: 2.00
    total_cost_limit: 5.00
  tools:
    execution_timeout: 30
    install_timeout: 300
    total_execution_timeout: 1800
    max_consecutive_execution_timeouts: 3`,
  DOCKER_RUN: `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11

# SWE-ReX uploads the repository from host to container, so docker_args can disable networking
sweagent run \\
  --config config/default.yaml \\
  --config /srv/agent-factory/factory.docker.yaml \\
  --output_dir /srv/agent-factory/runs/docker-single`,
  MODAL_RUN: `# For hosts without Docker where code may enter a cloud sandbox
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# Complete Modal authentication and environment checks first; Modal is not built into SWE-agent
modal token new
cat > /srv/agent-factory/runs/task.md <<'EOF'
Reproduce first, make the smallest fix, and run related tests. Do not commit or push.
EOF

sweagent run \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --env.deployment.type=modal \\
  --env.repo.path=/srv/agent-factory/workspace/project \\
  --problem_statement.path=/srv/agent-factory/runs/task.md \\
  --output_dir=/srv/agent-factory/runs/modal-single`,
  BATCH_RUN: `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# Smoke-test 3 instances first; expand slice / workers only after checking cost, traces, and container load
sweagent run-batch \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --instances.type=swe_bench \\
  --instances.subset=lite \\
  --instances.split=dev \\
  --instances.slice=:3 \\
  --num_workers=3 \\
  --output_dir=/srv/agent-factory/runs/swebench-smoke

# Rebuild preds.json in the experiment directory if it is stale or missing
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke`,
  INSPECT_CODE: `# Inspect one trajectory in the terminal
sweagent inspect /srv/agent-factory/runs/docker-single/**/*.traj

# Browse an experiment directory; when bound locally by default, open it through 127.0.0.1
sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001

# Summarize exit status, cost, and API calls
sweagent quick-stats /srv/agent-factory/runs/docker-single`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT/vendor/SWE-agent"
source "$ROOT/.venv/bin/activate"

# The outer system fetches the Issue and stores it as text; all Issue content is untrusted input
gh issue view 123 --repo "$GITHUB_REPOSITORY" > "$ROOT/runs/$RUN_ID.md"
git -C "$ROOT/workspace/project" status --porcelain | grep -q . && exit 2

# Reuse hardened Docker configuration; model key stays on host and GitHub Token stays out of the container
sweagent run \\
  --config config/default.yaml \\
  --config "$ROOT/factory.docker.yaml" \\
  --problem_statement.path="$ROOT/runs/$RUN_ID.md" \\
  --output_dir="$ROOT/runs/$RUN_ID"

# Process exit is not repair success: inspect trajectory, then patch, then let CI and humans decide
python - <<'PY' "$ROOT/runs/$RUN_ID"
import json, pathlib, sys
run = pathlib.Path(sys.argv[1])
trajs = list(run.rglob('*.traj'))
assert trajs, 'No trajectory file'
info = json.loads(trajs[0].read_text())['info']
assert info.get('exit_status') == 'submitted', info.get('exit_status')
assert info.get('submission'), 'No submission patch'
PY
# Next: apply submission to a clean copy, run full CI, and request human review.`,
  TRAJECTORY_CODE: `jq '{
  version: .info.swe_agent_version,
  rex: .info.swe_rex_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission_present: (.info.submission != null),
  steps: (.trajectory | length)
}' runs/docker-single/**/*.traj`,
}

export const sweCode = { zh: zhCode, en: enCode }
