const zh = {
  INSTALL_CODE: `# 官方 Release 核验路线；本站未执行，不需要模型或 GitHub 凭据
# 在隔离目录选择匹配宿主架构的固定 v0.3.0 制品
mkdir -p /tmp/scion-verify && cd /tmp/scion-verify
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/SHA256SUMS
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/scion-linux-amd64.tar.gz
sha256sum -c SHA256SUMS --ignore-missing

tar -xzf scion-linux-amd64.tar.gz
./scion version
./scion --help
./scion doctor

# 源码构建的另一条官方路线（本站无 Go，未执行）
# go.mod 固定 go 1.26.1；完整 Web UI 必须用 make all 构建并嵌入
git clone --branch v0.3.0 --depth 1 https://github.com/GoogleCloudPlatform/scion.git
cd scion && git rev-parse HEAD
# 期望：7035829be4f38efe1ef43faed34404fbd78141e4
make all
./build/scion version

# 不把 go install 的 CLI 成功写成 Web UI 或端到端验收`,
  CONFIG_CODE: `# 官方 Workstation 路线；本站未安装或启动，以下命令均未执行
# 方式一：官方 README 推荐的社区 Homebrew tap
brew tap homebrew-scion/scion
brew install homebrew-scion/scion/scion

# 启动本机 combo server：Hub + Runtime Broker + Web
scion server start
# 官方快速入门 URL：http://127.0.0.1:8080/onboarding
# onboarding 处理 Runtime 检测、身份、镜像和首个 workspace

# 在每个已批准 Git 项目中单独初始化；先满足 worktree 的 Git 门槛
git --version                 # worktree-per-agent 要求 >=2.48.0
cd /path/to/approved-project
printf '\\n.scion/agents/\\n' >> .gitignore
scion init

# 无模型只读检查通过、镜像与凭据边界明确后，才启动真实小任务
scion list
scion doctor
# 模型 key 留在官方凭据流程，不写进 .scion、模板、Git 或容器镜像`,
  DATA_CODE: `Agent observation {
  identity: { project_id, agent_id, ancestry }
  phase:    created | provisioning | cloning | starting | running
            | stopping | stopped | suspended | error | halted
  activity: initializing | working | thinking | executing
            | waiting_for_input | blocked | completed
            | limits_exceeded | stalled | offline | crashed
  detail:   current tool, message, or task summary
}

# Workspace modes:
shared-plain         # 多 Agent 共享目录；无每 Agent 工作树隔离
worktree-per-agent   # Git >=2.48；Kubernetes 不支持
clone-per-agent      # 独立 clone；Hub 路线注入 GITHUB_TOKEN，而非宿主 SSH 私钥
empty-per-agent      # 私有空目录；共享文件走显式 shared dirs

# Template: scion-agent.yaml + instructions + skills + model size alias
# Environment: settings / Profile / harness-config
# completed / running / suspended 都不是测试通过或人工交付证明`,
  LOCAL_ROUTE_CODE: `# 官方模板与小任务路线；本站未执行真实 Agent 或模型
cd /path/to/approved-project

# 角色与环境分开：模板定义 reviewer 角色，harness-config 提供镜像、认证和模型映射
scion templates create code-reviewer
scion templates show code-reviewer
scion harness-config list

# 审查 .scion/templates/code-reviewer/ 后再使用；模板环境键会被忽略并警告
scion start reviewer "Review the approved change without merging" --type code-reviewer
scion list
scion logs reviewer
scion message reviewer "Report open questions and verification evidence"

# 需要直接接管时才 attach；停止、挂起和恢复分别验收
scion attach reviewer
scion stop reviewer
# 受支持 harness + 持久 home 才验证：scion suspend reviewer / scion resume reviewer

# 交付前保留 Agent 分支、提交、共享文件、测试和人工决定
# 不自动 merge；删除前确认没有未推送工作或未回答问题`,
  DEPLOY_ROUTE_CODE: `# Hosted 用户接入形状；管理员仍需按官方单节点 / HA 指南先部署
# 本站未部署 VM、Cloud Run、Kubernetes、Postgres 或 Hosted Hub

# 仅连接由维护者提供的 HTTPS Hub；不要在这里粘贴 token
scion hub add team https://scion-hub.example.com
scion use --hub team
scion whoami
scion project list
scion runtime-broker status

# 部署审查清单（不是完整 HA 安装脚本）：
# - 单节点：一个 Hub + SQLite，接受重启 / 重部署停机
# - HA：复制 Hub + Postgres + 对象存储 + 负载均衡
# - 明确 OAuth、访问策略、TLS、秘密后端、public_url 与 agent_endpoint
# - Broker 管理的所有 Agent 都必须能到达 agent_endpoint
# - 不用 HTTP 明文传播 bearer token / 秘密，不开启生产 dev_mode
# - 备份 Hub DB、对象存储、Agent home、workspace 和外层 artifacts

# 生产部署、回滚和 merge 由外层人工流程决定`,
  AUTOMATION_CODE: `# 外层自动化合同形状，不是 Scion CLI；本站未执行真实模型交付
approved_dispatch:
  project_id: registered-project-uuid
  template: code-reviewer
  harness_config: approved-harness
  workspace_mode: worktree-per-agent
  goal: Review only the approved change and report evidence
  limits: bounded turns + model calls + duration + delegation
  delivery: human PR review and merge required

# 调度器只向已注册 Project 分派明确任务，不让公开文本直接获得高权限
# Hub 保存状态并分派；Broker / Runtime 负责 provision 和执行事实
# 外层系统仍负责可信 CI、秘密扫描、成本、制品审查和最终授权

# 保存：v0.3.0 / 7035829、制品哈希、Runtime / 镜像 / 模板指纹、
# Agent identity / ancestry、状态迁移、消息、分支、成本、日志与人工决定
# 模型 key、GitHub Token、OAuth secret、broker token 与私钥不进模板、Git 或快照`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `# Official Release-verification route; not executed here and needs no model or GitHub credentials
# Choose the fixed v0.3.0 artifact matching the host architecture in an isolated directory
mkdir -p /tmp/scion-verify && cd /tmp/scion-verify
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/SHA256SUMS
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/scion-linux-amd64.tar.gz
sha256sum -c SHA256SUMS --ignore-missing

tar -xzf scion-linux-amd64.tar.gz
./scion version
./scion --help
./scion doctor

# Alternative official source-build route (Go is absent here; not executed)
# go.mod pins go 1.26.1; the complete Web UI must be built and embedded with make all
git clone --branch v0.3.0 --depth 1 https://github.com/GoogleCloudPlatform/scion.git
cd scion && git rev-parse HEAD
# Expected: 7035829be4f38efe1ef43faed34404fbd78141e4
make all
./build/scion version

# Never present go install CLI success as Web UI or end-to-end acceptance`,
  CONFIG_CODE: `# Official Workstation route; nothing below was installed, started, or executed here
# Option 1: the community Homebrew tap recommended by the official README
brew tap homebrew-scion/scion
brew install homebrew-scion/scion/scion

# Start the local combo server: Hub + Runtime Broker + Web
scion server start
# Official quick-start URL: http://127.0.0.1:8080/onboarding
# Onboarding handles Runtime detection, identity, images, and the first workspace

# Initialize each approved Git Project separately; satisfy the worktree Git floor first
git --version                 # worktree-per-agent requires >=2.48.0
cd /path/to/approved-project
printf '\\n.scion/agents/\\n' >> .gitignore
scion init

# Start a real small task only after model-free read-only checks, images, and credential boundaries pass
scion list
scion doctor
# Keep model keys in official credential flows, never in .scion, templates, Git, or container images`,
  DATA_CODE: `Agent observation {
  identity: { project_id, agent_id, ancestry }
  phase:    created | provisioning | cloning | starting | running
            | stopping | stopped | suspended | error | halted
  activity: initializing | working | thinking | executing
            | waiting_for_input | blocked | completed
            | limits_exceeded | stalled | offline | crashed
  detail:   current tool, message, or task summary
}

# Workspace modes:
shared-plain         # Multiple Agents share a directory; no per-Agent working-tree isolation
worktree-per-agent   # Git >=2.48; unsupported on Kubernetes
clone-per-agent      # Independent clone; Hub route injects GITHUB_TOKEN, not host SSH keys
empty-per-agent      # Private empty directory; exchange files through explicit shared dirs

# Template: scion-agent.yaml + instructions + skills + model size alias
# Environment: settings / Profile / harness-config
# completed / running / suspended never prove passing tests or accepted delivery`,
  LOCAL_ROUTE_CODE: `# Official template and small-task route; no real Agent or model execution occurred here
cd /path/to/approved-project

# Separate role from environment: templates define the reviewer; harness configs supply image, auth, and model mappings
scion templates create code-reviewer
scion templates show code-reviewer
scion harness-config list

# Review .scion/templates/code-reviewer/ before use; environment keys in templates are ignored with warnings
scion start reviewer "Review the approved change without merging" --type code-reviewer
scion list
scion logs reviewer
scion message reviewer "Report open questions and verification evidence"

# Attach only for deliberate takeover; verify stop, suspend, and resume separately
scion attach reviewer
scion stop reviewer
# Only with a supported harness + persistent home: scion suspend reviewer / scion resume reviewer

# Retain Agent branches, commits, shared files, tests, and human decisions before delivery
# Never auto-merge; confirm no unpushed work or unanswered questions before deletion`,
  DEPLOY_ROUTE_CODE: `# Hosted user-connection shape; an admin must first deploy using the official single-node / HA guides
# No VM, Cloud Run, Kubernetes, Postgres, or Hosted Hub was deployed here

# Connect only to a maintainer-provided HTTPS Hub; paste no token here
scion hub add team https://scion-hub.example.com
scion use --hub team
scion whoami
scion project list
scion runtime-broker status

# Deployment review checklist (not a complete HA installation script):
# - Single-node: one Hub + SQLite, accepting restart / redeploy downtime
# - HA: replicated Hubs + Postgres + object storage + load balancing
# - Define OAuth, access policy, TLS, secret backend, public_url, and agent_endpoint
# - Agents managed by every Broker must be able to reach agent_endpoint
# - Never propagate bearer tokens / secrets over plaintext HTTP or enable production dev_mode
# - Back up Hub DB, object storage, Agent homes, workspaces, and outer artifacts

# Outer human processes own production deployment, rollback, and merge`,
  AUTOMATION_CODE: `# Outer automation contract shape, not a Scion CLI; no real model delivery ran here
approved_dispatch:
  project_id: registered-project-uuid
  template: code-reviewer
  harness_config: approved-harness
  workspace_mode: worktree-per-agent
  goal: Review only the approved change and report evidence
  limits: bounded turns + model calls + duration + delegation
  delivery: human PR review and merge required

# The scheduler dispatches explicit tasks only to registered Projects; public text gets no direct privileges
# The Hub stores state and dispatches; Brokers / Runtimes own provisioning and execution facts
# Outer systems still own trusted CI, secret scanning, cost, artifact review, and final authorization

# Retain v0.3.0 / 7035829, artifact hashes, Runtime / image / template fingerprints,
# Agent identity / ancestry, transitions, messages, branches, cost, logs, and human decisions
# Keep model keys, GitHub Tokens, OAuth secrets, broker tokens, and private keys out of templates, Git, and snapshots`,
} satisfies CodeShape<typeof zh>

export const scionCode = { zh, en }
