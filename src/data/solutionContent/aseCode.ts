const zh = {
  INSTALL_CODE: `# 本页实际执行的 B 级发布包核验；不需要模型或 GitHub 凭据
node --version                 # 宿主 v20.20.2，不满足 ASE >=22.22.0
npm view @rse/ase@2.1.6 version dist.tarball engines

npm install --prefix /tmp/ase-verify \\
  --ignore-scripts --no-audit --no-fund @rse/ase@2.1.6
ASE=/tmp/ase-verify/node_modules/@rse/ase/bin/ase

# 宿主 Node 过低，因此只在本次核验中临时使用 Node 22.22.0
npx --yes --package node@22.22.0 node "$ASE" --version
npx --yes --package node@22.22.0 node "$ASE" --help
npx --yes --package node@22.22.0 node "$ASE" agent fleet --help
npx --yes --package node@22.22.0 node "$ASE" setup mcp list

# 在临时测试仓库生成 enterprise Fleet 配置；不启动 Agent
mkdir -p /tmp/ase-verify/project && cd /tmp/ase-verify/project
git init -q
npx --yes --package node@22.22.0 node "$ASE" agent fleet init --lifecycle enterprise
test -s .ase/fleet.yaml
# 本页结果：ASE 2.1.6；上述命令成功；未启动 Fleet`,
  CONFIG_CODE: `# 官方安装与插件注册路线；本页只核验 npm 包和 CLI，未修改宿主 Agent
node --version                 # 必须 >=22.22.0
npm --version                  # 必须 >=10.0.0
npm install -g @rse/ase@2.1.6

# 主要支持 Claude Code；Copilot / Codex 为 reduced support
ase setup install --tool claude --scope project
ase setup status --tool claude
ase setup mcp list

# 打开新的 Agent 会话，让插件、hooks、skills 与 MCP 注册生效
# 模型登录留在 Agent 自己的凭据流程；可选外部 MCP 服务可能收费
# 不把 key 写进 .ase、fleet.yaml、Git、任务附件、日志或容器`,
  DATA_CODE: `Task plan JSON {
  header: {
    Type: "text/vnd.ase.task",
    Id, Status, After, Source, Changeset, Target
  },
  body:   "# TASK + Markdown plan sections",
  attachment: [{ Type, Desc, Data | File }]
}

# 默认 ase:./.ase/task：客户端进程内访问本地存储，不启动服务
# 服务端：ase task store start；默认 127.0.0.1 + 随机持久化端口
# 所有请求需要 bearer token；该 token 拥有全部项目的完整访问权
# ETag / If-Match 防止静默覆盖；412 后按 header / body / attachment 合并

solo:       OPEN → SHELVED / CLOSED / CANCELLED
team:       PLANNING → IMPLEMENTING → IMPLEMENTED
enterprise: DRAFTED → PLANNING → PLANNED → IMPLEMENTING
            → IMPLEMENTED → QUALIFYING → QUALIFIED
            → INTEGRATING → INTEGRATED`,
  LOCAL_ROUTE_CODE: `# 官方交互式任务路线；本页未配置模型，以下命令未执行
# 在 Claude Code 会话中使用，不是 shell 命令
/ase-task-edit -A team-settings: "Add an approved team settings page"
/ase-task-grill team-settings
/ase-task-implement --draft team-settings
/ase-task-integrate --draft team-settings

# 审核 draft 后再进行实际实现；固定任务 ID 与变更集归属
/ase-task-implement team-settings
/ase-task-view team-settings

# 官方还可用 ase task board / ase task board --web 观察任务
# 每个变更仍需外层测试、干净副本复验、秘密扫描和人工交付决定
# 不自动 merge、不关闭 Issue，不把 INTEGRATED 当生产发布`,
  DEPLOY_ROUTE_CODE: `# enterprise Fleet 官方路线；本页只实际执行 init，未执行 start
cd /path/to/approved-project
ase agent fleet init -t claude --lifecycle enterprise

# 先审查 .ase/fleet.yaml：角色、模型、repo / cwd、parallel、timeout、budget
# 默认 qualifier.mode=judge：给出判定，资格状态仍由人决定
# 多 Agent 不应无协调地共用同一 Git working copy

# 获得真实模型与仓库授权后才可执行：
ase agent fleet start
ase agent fleet status
ase agent fleet log -f
ase agent fleet stop

# 本页未调用模型、未启动 relay / Fleet、未修复真实 Issue
# relay token、模型 key 和 GitHub Token 不得写入 YAML、Git 或网站`,
  AUTOMATION_CODE: `# 外层自动化合同形状，不是 ASE CLI；未执行真实模型交付
approved_task:
  project_id: approved-project
  lifecycle: enterprise
  goal: Implement the approved team-settings acceptance contract
  write_scope: one assigned task and its declared changeset
  qualification: human decision required
  limits: bounded parallel + timeout + provider budget

# 调度器只向已注册项目分配明确任务，不让公开文本直接获得高权限
# ASE 保存任务与生命周期；外层系统仍负责可信 CI、秘密扫描和最终授权
# 保存：@rse/ase 版本、tag commit、Node / npm、Agent / 模型 ID、
# 任务 header / body / attachments、状态迁移、成本、日志与人工决定

# 非 loopback Task Store 必须配置 TLS；bearer token 是全项目权限
# 模型 key、GitHub Token 与 relay token 不进 YAML、Git、日志或快照`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `# Level-B Release-package checks actually executed here; no model or GitHub credentials needed
node --version                 # Host v20.20.2, below ASE >=22.22.0
npm view @rse/ase@2.1.6 version dist.tarball engines

npm install --prefix /tmp/ase-verify \\
  --ignore-scripts --no-audit --no-fund @rse/ase@2.1.6
ASE=/tmp/ase-verify/node_modules/@rse/ase/bin/ase

# The host Node is too old, so these checks temporarily use Node 22.22.0
npx --yes --package node@22.22.0 node "$ASE" --version
npx --yes --package node@22.22.0 node "$ASE" --help
npx --yes --package node@22.22.0 node "$ASE" agent fleet --help
npx --yes --package node@22.22.0 node "$ASE" setup mcp list

# Generate an enterprise Fleet configuration in a temporary test repository; start no Agents
mkdir -p /tmp/ase-verify/project && cd /tmp/ase-verify/project
git init -q
npx --yes --package node@22.22.0 node "$ASE" agent fleet init --lifecycle enterprise
test -s .ase/fleet.yaml
# Result here: ASE 2.1.6; all commands above succeeded; no Fleet was started`,
  CONFIG_CODE: `# Official installation and plugin-registration route; only the npm package and CLI were checked here
node --version                 # Must be >=22.22.0
npm --version                  # Must be >=10.0.0
npm install -g @rse/ase@2.1.6

# Claude Code is the primary target; Copilot / Codex have reduced support
ase setup install --tool claude --scope project
ase setup status --tool claude
ase setup mcp list

# Open a new Agent session so plugin, hooks, skills, and MCP registration take effect
# Keep model login in the Agent credential flow; optional external MCP services may charge fees
# Never place keys in .ase, fleet.yaml, Git, task attachments, logs, or containers`,
  DATA_CODE: `Task plan JSON {
  header: {
    Type: "text/vnd.ase.task",
    Id, Status, After, Source, Changeset, Target
  },
  body:   "# TASK + Markdown plan sections",
  attachment: [{ Type, Desc, Data | File }]
}

# Default ase:./.ase/task: in-process local storage, with no server
# Server: ase task store start; defaults to 127.0.0.1 + a persisted random port
# Every request needs a bearer token; that token grants full access to every project
# ETag / If-Match prevents silent overwrites; a 412 merge works by header / body / attachment

solo:       OPEN → SHELVED / CLOSED / CANCELLED
team:       PLANNING → IMPLEMENTING → IMPLEMENTED
enterprise: DRAFTED → PLANNING → PLANNED → IMPLEMENTING
            → IMPLEMENTED → QUALIFYING → QUALIFIED
            → INTEGRATING → INTEGRATED`,
  LOCAL_ROUTE_CODE: `# Official interactive task route; no model was configured and these commands were not executed here
# Use inside a Claude Code session, not in a shell
/ase-task-edit -A team-settings: "Add an approved team settings page"
/ase-task-grill team-settings
/ase-task-implement --draft team-settings
/ase-task-integrate --draft team-settings

# Review the draft before real implementation; pin the task ID and changeset ownership
/ase-task-implement team-settings
/ase-task-view team-settings

# Official task observation is also available through ase task board / ase task board --web
# Every change still needs outer tests, a clean-copy recheck, secret scanning, and a human delivery decision
# Never auto-merge, close Issues, or interpret INTEGRATED as production release`,
  DEPLOY_ROUTE_CODE: `# Official enterprise Fleet route; only init was executed here, never start
cd /path/to/approved-project
ase agent fleet init -t claude --lifecycle enterprise

# Review .ase/fleet.yaml first: roles, model, repo / cwd, parallel, timeout, and budget
# Default qualifier.mode=judge: it emits a verdict while a human still decides qualification
# Multiple Agents must not share one Git working copy without coordination

# Only after real model and repository authorization:
ase agent fleet start
ase agent fleet status
ase agent fleet log -f
ase agent fleet stop

# No model, relay / Fleet startup, or real Issue repair was executed here
# Relay tokens, model keys, and GitHub Tokens never belong in YAML, Git, or the website`,
  AUTOMATION_CODE: `# Outer automation contract shape, not an ASE CLI; no real model delivery was executed here
approved_task:
  project_id: approved-project
  lifecycle: enterprise
  goal: Implement the approved team-settings acceptance contract
  write_scope: one assigned task and its declared changeset
  qualification: human decision required
  limits: bounded parallel + timeout + provider budget

# The scheduler assigns explicit tasks only to registered projects; public text gets no direct privileges
# ASE stores tasks and lifecycle; outer systems still own trusted CI, secret scanning, and final authorization
# Retain @rse/ase version, tag commit, Node / npm, Agent / model IDs,
# task header / body / attachments, transitions, cost, logs, and human decisions

# A non-loopback Task Store requires TLS; its bearer token has all-project privileges
# Keep model keys, GitHub Tokens, and relay tokens out of YAML, Git, logs, and snapshots`,
} satisfies CodeShape<typeof zh>

export const aseCode = { zh, en }
