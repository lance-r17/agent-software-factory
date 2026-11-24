const zh = {
  INSTALL_CODE: `# 本页实际执行的 B 级核验；不需要模型或 GitHub 凭据
python3.12 -m venv /tmp/omnigent-v023-venv
/tmp/omnigent-v023-venv/bin/python -m pip install \\
  --only-binary=:all: omnigent==0.23.0

/tmp/omnigent-v023-venv/bin/python -m pip check
/tmp/omnigent-v023-venv/bin/python -m compileall -q /tmp/omnigent-v0.23.0/omnigent
/tmp/omnigent-v023-venv/bin/omnigent --version
/tmp/omnigent-v023-venv/bin/omni --version
/tmp/omnigent-v023-venv/bin/omnigent run --help
/tmp/omnigent-v023-venv/bin/omnigent server --help

# 固定官方源码并解析 Polly；不启动模型会话
git clone --depth 1 --branch v0.23.0 \\
  https://github.com/omnigent-ai/omnigent.git /tmp/omnigent-v0.23.0
cd /tmp/omnigent-v0.23.0
git rev-parse HEAD  # 033963227a3b54803ae00c5ef0f0f6fe97f5549d`,
  CONFIG_CODE: `# 本地路线：Python >= 3.12；uv 是官方推荐安装器
uv tool install --python 3.12 'omnigent==0.23.0'
omnigent --version

# 交互式选择实际使用的一个 provider；不要把真实 key 写进 YAML 或命令行
omnigent setup

# 默认本地服务与 Web UI：127.0.0.1:6767
# 仅显式转发当前会话需要的变量名，而不是继承整个 shell 环境
OMNIGENT_SESSION_ENV_PASSTHROUGH=TERMINAL_PANE_SOCKET \\
  omnigent run examples/polly/

# 官方默认启用匿名遥测；按官方 Usage Telemetry 文档评估并选择退出
# 公开或共享部署不要使用无认证的单用户模式`,
  DATA_CODE: `Agent YAML {
  name, prompt | instructions,
  executor: { harness, model, auth },
  tools: { function | mcp | agent | handoff },
  policies: { function + handler + factory_params },
  os_env, terminals, params, async, cancellable
}

Polly 运行登记 {
  .polly/registry.json,
  worktree_path + branch,
  conversation_id + PR URL,
  blocking findings + follow-ups
}

评审快照 {
  immutable diff path,
  base_sha + head_sha,
  acceptance contract
}

# ACP session/prompt 可携带 params._meta["ai.omnigent/inputItemId"]
# 对应持久化用户条目；不要把它当作认证或授权凭据`,
  LOCAL_ROUTE_CODE: `# 官方本地路线；本站只核验安装与 CLI，未启动模型会话
git clone --depth 1 --branch v0.23.0 \\
  https://github.com/omnigent-ai/omnigent.git
cd omnigent
uv tool install --python 3.12 'omnigent==0.23.0'

omnigent setup
omnigent run examples/polly/
# 或显式无头提示；会真实调用已配置模型并可能产生费用
# omnigent run examples/polly/ -p 'Review the approved task contract'

# 另开终端检查本地服务；停止时保留或清理状态前先做备份
omnigent server status
omnigent stop`,
  DOCKER_ROUTE_CODE: `# 官方 Docker 服务路线，本站未执行
cd deploy/docker
./bootstrap.sh                 # 生成 Postgres 与 cookie 密钥到 .env
chmod 600 .env
docker compose config --quiet
docker compose up -d
docker compose logs -f omnigent

# 服务默认发布在 http://localhost:8000
curl -f http://localhost:8000/v1/info

# 首次启动在 Web UI 创建管理员；不要把管理员密码写进 Git
# 公网部署必须配置 HTTPS、外部 base URL 与合适的账号 / OIDC 模式
# 危险：docker compose down -v 会删除数据库和 artifact 卷`,
  POLLY_ROUTE_CODE: `# 官方 Polly 示例，本站未调用模型、未创建 PR
# 前置：至少两个可用且不同供应商的 worker 才能独立交叉评审
# 每个实现任务使用独立 worktree 和分支；实现者打开自己的 PR
# Polly 不 merge；评审者只读固定 diff + 验收合同，不编辑代码

omnigent run examples/polly/

# 只对文件范围不重叠、无顺序依赖的任务使用 fanout
# 先跑 tests / lint / typecheck，再把 diff 交给不同供应商 reviewer
# blocking issue 回到同一实现者会话修复，然后重新生成快照并复验
# 若仅剩一个供应商、快照不可达或预算不足，停止并升级给人工`,
  AUTOMATION_CODE: `# 外层自动化只提交已批准任务；以下为配置与调用形状，本站未执行
# approved-agent.yaml 只声明必要工具、子 Agent 和策略
name: bounded_factory_agent
executor:
  harness: claude-sdk
policies:
  approve_os:
    type: function
    handler: omnigent.policies.builtins.safety.ask_on_os_tools
  cap_calls:
    type: function
    handler: omnigent.policies.builtins.safety.max_tool_calls_per_session
    factory_params:
      limit: 50

omnigent run approved-agent.yaml -p 'Process the approved acceptance contract'

# 外层仍须设置进程超时、provider 预算、并发、网络和 Git 权限
# 保存会话、任务登记、提交、固定 diff、测试与审批证据
# ALLOW / ASK 不能替代最终人工评审；不得自动 merge 或关闭 Issue`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `# Level-B checks actually executed for this analysis; no model or GitHub credentials needed
python3.12 -m venv /tmp/omnigent-v023-venv
/tmp/omnigent-v023-venv/bin/python -m pip install \\
  --only-binary=:all: omnigent==0.23.0

/tmp/omnigent-v023-venv/bin/python -m pip check
/tmp/omnigent-v023-venv/bin/python -m compileall -q /tmp/omnigent-v0.23.0/omnigent
/tmp/omnigent-v023-venv/bin/omnigent --version
/tmp/omnigent-v023-venv/bin/omni --version
/tmp/omnigent-v023-venv/bin/omnigent run --help
/tmp/omnigent-v023-venv/bin/omnigent server --help

# Pin the official source and parse Polly without starting a model session
git clone --depth 1 --branch v0.23.0 \\
  https://github.com/omnigent-ai/omnigent.git /tmp/omnigent-v0.23.0
cd /tmp/omnigent-v0.23.0
git rev-parse HEAD  # 033963227a3b54803ae00c5ef0f0f6fe97f5549d`,
  CONFIG_CODE: `# Local route: Python >= 3.12; uv is the officially recommended installer
uv tool install --python 3.12 'omnigent==0.23.0'
omnigent --version

# Interactively select only the provider you intend to use; never place real keys in YAML or command lines
omnigent setup

# Default local server and Web UI: 127.0.0.1:6767
# Forward only variable names required by this session instead of inheriting the whole shell environment
OMNIGENT_SESSION_ENV_PASSTHROUGH=TERMINAL_PANE_SOCKET \\
  omnigent run examples/polly/

# Anonymous telemetry is enabled by default; review the official Usage Telemetry guide and opt out if required
# Never use unauthenticated single-user mode for a public or shared deployment`,
  DATA_CODE: `Agent YAML {
  name, prompt | instructions,
  executor: { harness, model, auth },
  tools: { function | mcp | agent | handoff },
  policies: { function + handler + factory_params },
  os_env, terminals, params, async, cancellable
}

Polly run registry {
  .polly/registry.json,
  worktree_path + branch,
  conversation_id + PR URL,
  blocking findings + follow-ups
}

Review snapshot {
  immutable diff path,
  base_sha + head_sha,
  acceptance contract
}

# ACP session/prompt can carry params._meta["ai.omnigent/inputItemId"]
# It references a persisted user item; it is not an authentication or authorization credential`,
  LOCAL_ROUTE_CODE: `# Official local route; only installation and CLI were checked here, with no model session
git clone --depth 1 --branch v0.23.0 \\
  https://github.com/omnigent-ai/omnigent.git
cd omnigent
uv tool install --python 3.12 'omnigent==0.23.0'

omnigent setup
omnigent run examples/polly/
# Or send an explicit headless prompt; this really calls configured models and can incur cost
# omnigent run examples/polly/ -p 'Review the approved task contract'

# Check the local service from another terminal; back up state before retaining or removing it
omnigent server status
omnigent stop`,
  DOCKER_ROUTE_CODE: `# Official Docker server route; not executed by this site
cd deploy/docker
./bootstrap.sh                 # Mints Postgres and cookie secrets into .env
chmod 600 .env
docker compose config --quiet
docker compose up -d
docker compose logs -f omnigent

# The server is published at http://localhost:8000 by default
curl -f http://localhost:8000/v1/info

# Create the administrator in the Web UI on first boot; never commit the admin password
# Public deployments require HTTPS, an external base URL, and an appropriate accounts or OIDC mode
# Danger: docker compose down -v deletes the database and artifact volumes`,
  POLLY_ROUTE_CODE: `# Official Polly example; no model call or PR creation was performed here
# Prerequisite: at least two available workers from different vendors for independent cross-review
# Each implementation task gets its own worktree and branch; the implementer opens its own PR
# Polly never merges; reviewers read only the pinned diff and acceptance contract and never edit code

omnigent run examples/polly/

# Use fanout only for tasks with disjoint file scopes and no ordering dependency
# Run tests / lint / typecheck before sending the diff to a different-vendor reviewer
# Return blocking findings to the same implementer, then regenerate the snapshot and recheck
# Stop and escalate when only one vendor remains, the snapshot is inaccessible, or budget is insufficient`,
  AUTOMATION_CODE: `# The outer system submits approved work only; this configuration and call shape were not executed here
# approved-agent.yaml declares only necessary tools, sub-agents, and policies
name: bounded_factory_agent
executor:
  harness: claude-sdk
policies:
  approve_os:
    type: function
    handler: omnigent.policies.builtins.safety.ask_on_os_tools
  cap_calls:
    type: function
    handler: omnigent.policies.builtins.safety.max_tool_calls_per_session
    factory_params:
      limit: 50

omnigent run approved-agent.yaml -p 'Process the approved acceptance contract'

# The outer system still owns process timeout, provider budget, concurrency, network, and Git privileges
# Retain sessions, task registry, commits, pinned diffs, tests, and approval evidence
# ALLOW / ASK does not replace final human review; never auto-merge or close Issues`,
} satisfies CodeShape<typeof zh>

export const omnigentCode = { zh, en }
