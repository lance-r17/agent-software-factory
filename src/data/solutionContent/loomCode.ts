const zh = {
  INSTALL_CODE: `# 本页实际执行的 B 级源码核验；不需要模型或 GitHub 凭据
git clone --filter=blob:none https://github.com/valkor-ai/loom.git /tmp/loom-fc4c0ba
cd /tmp/loom-fc4c0ba
git checkout fc4c0bab2176e502ddd29677bc2aae0880f5fd5d
test "$(git rev-parse HEAD)" = fc4c0bab2176e502ddd29677bc2aae0880f5fd5d

bash -n install.sh /tmp/loom-fc4c0ba/scripts/install-local-claude-code.sh /tmp/loom-fc4c0ba/scripts/install-local-opencode.sh
node --check plugins/claude-code/hooks/loom-workflow-guard.js
node --check plugins/opencode/.opencode/plugins/loom.js
node --check /tmp/loom-fc4c0ba/scripts/rust-test.mjs
python3 -m json.tool plugins/claude-code/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/codex/.codex-plugin/plugin.json >/dev/null

# 隔离 Python 依赖；helper 会覆盖子进程 PYTHONPATH，所以再准备临时 user-site
python3 -m pip install --target /tmp/loom-pydeps pytest jieba rank-bm25 scikit-learn
mkdir -p /tmp/loom-pyuser/lib/python3.12/site-packages
cp -a /tmp/loom-pydeps/. /tmp/loom-pyuser/lib/python3.12/site-packages/
PYTHONUSERBASE=/tmp/loom-pyuser \\
  PYTHONPATH=/tmp/loom-pydeps:/tmp/loom-fc4c0ba/src/python \\
  PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -q tests/python
# 本页结果：7 passed；未修改上游源码或测试`,
  CONFIG_CODE: `# 官方 Release 安装路线；本页因发布包连续下载失败而未执行
# 安装器按 OS / CPU 下载 Release，校验 .sha256，安装 Rust MCP 和隔离 Python runtime
curl -fsSL https://github.com/valkor-ai/loom/releases/latest/download/install.sh \\
  | bash -s -- --agent codex
# 也可使用 --agent claude-code、--agent opencode 或 --agent all

# 安装或升级后必须打开新的 Agent 会话，再执行只读冒烟
# Codex：@loom status
# Claude Code / OpenCode：/loom status
# 新项目返回 STATE_NOT_INITIALIZED 是有效结果，表示插件可用且尚未开始交付

# 正常由 Agent 注册并启动 MCP；不要手工常驻 MCP server
# 模型登录留在所选 Agent 中，不把 key 写进 .loom、YAML、Git、日志或容器`,
  DATA_CODE: `Request manifest {
  requestReadPlan: {
    groups: [{ selectors, purpose, whenToRead }]
  },
  outputContract: {
    writeTargets,
    resultFile
  },
  executionRules,
  recommendedTool
}

TaskResult {
  status,
  changedFiles,
  verificationResults,
  executionContinuity,
  runtimeDeliveryEvidence: { unverifiedItems }
}

# 通过 loom.recordTaskResultFile 提交 outputContract.resultFile
# readFieldGroup 只读取声明的字段组；fullLogRef 在紧凑诊断不足时按需展开
# deliveryGraph(projectRoot) -> nodes + edges + mermaid；只读，不迁移状态`,
  LOCAL_ROUTE_CODE: `# 官方插件交付路线；本页未配置模型，未执行真实交付
# 在目标项目的新 Agent 会话中使用，不要在 shell 中直接运行这些 Agent 命令

# Codex
@loom build Add a team settings page
@loom continue
@loom review

# Claude Code / OpenCode 使用等价形式
/loom build Add a team settings page
/loom continue
/loom review

# build 按需初始化项目 .loom/；不要手工编造状态文件
# 中断、换会话或工具完成后不再前进时，优先 continue
# review / repair 的更新必须重新验证；completed 仍需外层 CI 与人工验收`,
  DEPLOY_ROUTE_CODE: `# 官方本地预览路线；本页未安装 Docker runtime，也未执行 deploy
# 前置：已经安装并验证 Loom 插件，当前项目有可检查的交付状态
# Codex：@loom deploy
# Claude Code / OpenCode：/loom deploy

# Loom 通过 deployPrepare / Run / Up / Status / Inspect / Validate / Logs / Repair
# 准备 Compose 拓扑、环境规则、日志与修复边界；按 MCP 返回的下一动作执行
# 不要绕过状态机手工编造 deploy 结果，也不要把模型 key 或 GitHub Token 注入容器

# 当前只支持本地 Docker Compose preview，不支持生产部署
# 对外发布仍需外层 HTTPS、认证、密钥管理、可信 CI、制品审查与人工批准`,
  AUTOMATION_CODE: `# 外层自动化合同形状，不是 Loom CLI；本站未执行真实模型交付
approved_task:
  repository: /srv/workspaces/approved-project
  goal: Implement the approved team-settings acceptance contract
  write_scope: approved task contracts only
  verification: tests + runtime checks + human acceptance
  limits: bounded tasks + bounded repair loops + provider budget

# 调度器只启动受支持 Agent 的受控会话，由插件调用 Loom MCP
# Agent 内：@loom build <已批准目标>，随后按状态 @loom continue / review / deploy
# 不手工启动 MCP，不把聊天文本当作仓库授权，不自动 merge 或关闭 Issue

# 外层保存：固定 Loom commit、Agent / 模型 ID、依赖指纹、.loom artifacts、
# changedFiles、TaskResult、验证命令、fullLogRef、评审与修复历史、人工决定
# 模型 key 和 GitHub Token 不进 .loom、YAML、Git、日志、快照或容器`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `# Level-B source checks actually executed for this analysis; no model or GitHub credentials needed
git clone --filter=blob:none https://github.com/valkor-ai/loom.git /tmp/loom-fc4c0ba
cd /tmp/loom-fc4c0ba
git checkout fc4c0bab2176e502ddd29677bc2aae0880f5fd5d
test "$(git rev-parse HEAD)" = fc4c0bab2176e502ddd29677bc2aae0880f5fd5d

bash -n install.sh /tmp/loom-fc4c0ba/scripts/install-local-claude-code.sh /tmp/loom-fc4c0ba/scripts/install-local-opencode.sh
node --check plugins/claude-code/hooks/loom-workflow-guard.js
node --check plugins/opencode/.opencode/plugins/loom.js
node --check /tmp/loom-fc4c0ba/scripts/rust-test.mjs
python3 -m json.tool plugins/claude-code/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/codex/.codex-plugin/plugin.json >/dev/null

# Isolate Python dependencies; the helper overwrites child PYTHONPATH, so add a temporary user-site
python3 -m pip install --target /tmp/loom-pydeps pytest jieba rank-bm25 scikit-learn
mkdir -p /tmp/loom-pyuser/lib/python3.12/site-packages
cp -a /tmp/loom-pydeps/. /tmp/loom-pyuser/lib/python3.12/site-packages/
PYTHONUSERBASE=/tmp/loom-pyuser \\
  PYTHONPATH=/tmp/loom-pydeps:/tmp/loom-fc4c0ba/src/python \\
  PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -q tests/python
# Result here: 7 passed; no upstream source or test was modified`,
  CONFIG_CODE: `# Official Release installation route; not executed here after repeated package-download failures
# The installer selects an OS / CPU Release, verifies .sha256, and installs Rust MCP plus isolated Python
curl -fsSL https://github.com/valkor-ai/loom/releases/latest/download/install.sh \\
  | bash -s -- --agent codex
# Also supported: --agent claude-code, --agent opencode, or --agent all

# Open a new Agent session after installation or upgrade, then run the read-only smoke check
# Codex: @loom status
# Claude Code / OpenCode: /loom status
# STATE_NOT_INITIALIZED is valid for a new project: the plugin works and no delivery has started

# The Agent normally registers and starts MCP; do not run a manual persistent MCP server
# Keep model login in the selected Agent; never place keys in .loom, YAML, Git, logs, or containers`,
  DATA_CODE: `Request manifest {
  requestReadPlan: {
    groups: [{ selectors, purpose, whenToRead }]
  },
  outputContract: {
    writeTargets,
    resultFile
  },
  executionRules,
  recommendedTool
}

TaskResult {
  status,
  changedFiles,
  verificationResults,
  executionContinuity,
  runtimeDeliveryEvidence: { unverifiedItems }
}

# Submit outputContract.resultFile through loom.recordTaskResultFile
# readFieldGroup reads declared groups only; expand fullLogRef when compact diagnostics are insufficient
# deliveryGraph(projectRoot) -> nodes + edges + mermaid; read-only, with no state transition`,
  LOCAL_ROUTE_CODE: `# Official plugin delivery route; no model was configured and no real delivery was executed here
# Use these Agent commands in a new session for the target project, not directly in a shell

# Codex
@loom build Add a team settings page
@loom continue
@loom review

# Equivalent Claude Code / OpenCode form
/loom build Add a team settings page
/loom continue
/loom review

# build initializes project .loom/ when needed; never invent state files manually
# Prefer continue after interruption, a new session, or a successful tool action that does not advance
# Verify again after review / repair changes; completed still needs outer CI and human acceptance`,
  DEPLOY_ROUTE_CODE: `# Official local-preview route; Docker and deploy were not executed here
# Prerequisites: a verified Loom plugin and inspectable delivery state in the current project
# Codex: @loom deploy
# Claude Code / OpenCode: /loom deploy

# Loom uses deployPrepare / Run / Up / Status / Inspect / Validate / Logs / Repair
# to prepare Compose topology, environment rules, logs, and repair boundaries; follow MCP next actions
# Never bypass the state machine to invent deploy results or inject model keys / GitHub Tokens into containers

# Current support is local Docker Compose preview only, not production deployment
# Public release still needs outer HTTPS, authentication, secret management, trusted CI, artifact review, and human approval`,
  AUTOMATION_CODE: `# Outer automation contract shape, not a Loom CLI; no real model delivery was executed here
approved_task:
  repository: /srv/workspaces/approved-project
  goal: Implement the approved team-settings acceptance contract
  write_scope: approved task contracts only
  verification: tests + runtime checks + human acceptance
  limits: bounded tasks + bounded repair loops + provider budget

# The scheduler starts only a controlled session for a supported Agent; its plugin calls Loom MCP
# Inside the Agent: @loom build <approved goal>, then @loom continue / review / deploy as routed
# Never start MCP manually, treat chat text as repository authorization, auto-merge, or close Issues

# Retain the pinned Loom commit, Agent / model IDs, dependency fingerprints, .loom artifacts,
# changedFiles, TaskResults, verification commands, fullLogRef, review / repair history, and human decisions
# Keep model keys and GitHub Tokens out of .loom, YAML, Git, logs, snapshots, and containers`,
} satisfies CodeShape<typeof zh>

export const loomCode = { zh, en }
