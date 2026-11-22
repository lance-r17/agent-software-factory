export type DeploySkill = {
  slug: string
  fileName: string
  title: string
  description: string
  version: string
  verifyDate: string
  accent: 'pink' | 'green' | 'blue' | 'yellow'
  routes: { id: string; label: string }[]
  outline: string[]
  content: string
}

export const openHandsDeploySkill: DeploySkill = {
  slug: 'openhands-agent-canvas',
  fileName: 'openhands-agent-canvas-deploy.md',
  title: 'OpenHands Agent Canvas 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v1.43.0',
  verifyDate: '2026-11-21',
  accent: 'pink',
  routes: [
    { id: 'A', label: 'npm 本地全栈' },
    { id: 'B', label: 'Docker 单容器' },
    { id: 'C', label: '每会话一容器' },
    { id: 'D', label: 'VM 常驻服务' },
  ],
  outline: [
    '0 · 硬性前置检查（Node ≥ 24 / uv / Docker）',
    '1 · 四条部署路线选择表',
    '2 · 路线 A：npm 本地全栈',
    '3 · 路线 B：Docker 单容器',
    '4 · 路线 C：每会话一容器',
    '5 · 路线 D：VM 常驻服务',
    '6 · 密钥与状态管理',
    '7 · 可选：官方软件工厂接入',
    '8 · 八道验收闸门',
    '9 · 常见故障速查（8 条）',
    '10 · 升级与备份',
    '11 · 安全红线与来源',
  ],
  content: `---
name: openhands-agent-canvas-deploy
description: 部署、验证与升级 OpenHands Agent Canvas v1.43.0（自托管编码 Agent 控制中心）。当任务是安装、自托管、排障或接入官方软件工厂流水线时使用；一个文件内含四条部署路线，按信任边界选择其一执行。
metadata:
  verified_at: "2026-11-21"
  upstream_version: "1.43.0"
  upstream_license: "MIT（主仓库；enterprise/ 目录另有许可）"
---

# OpenHands Agent Canvas v1.43.0 部署手册

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过前置检查、不越过安全红线。事实核验日期 2026-11-21；若当前日期明显更晚，先核对官方 Release 是否有更新版本再执行。

## 0. 硬性前置检查（不通过就停下并报告）

1. \`node --version\` 必须 >= v24，低于 24 先升级再继续。
2. \`uv --version\` 必须可用：本地 Agent Server 经 uvx 运行，uv 是硬性前置。
3. 路线 B / C / D 需要 \`docker info\` 正常返回。
4. 端口约定：对外只暴露 8000（ingress）；内部 3001（static）、18000（agent server）、18001（automation）不对外放行。

## 1. 选择部署路线（与用户确认后只执行一条）

| 路线 | 适用场景 | 信任边界 |
| --- | --- | --- |
| A · npm 本地全栈 | 个人可信机器上体验与调试 | 无隔离，Agent 继承当前用户全部权限 |
| B · Docker 单容器 | 本机隔离的推荐起点 | Agent 只能看到挂载进 /projects 的目录 |
| C · 每会话一容器 | 无人值守与软件工厂 | 每会话独立加固容器：非 root、cap-drop ALL、仅 127.0.0.1 |
| D · VM 常驻服务 | 团队或公网自托管 | 防火墙 + API key + nginx TLS 三层叠加 |

拿不准时默认选 B；公开网络必须选 D；软件工厂必须 C 或 D（要求 >= 1.24.0 的每会话容器能力）。

## 2. 路线 A · npm 本地全栈

\`\`\`bash
npm install -g @openhands/agent-canvas
agent-canvas --version   # 期望输出 1.43.0
agent-canvas --info      # 查看版本与栈配置
agent-canvas             # 启动全栈，浏览器打开 http://localhost:8000
\`\`\`

启动后：Settings → LLM 配置模型；Open Workspace 指定项目目录。停止用 Ctrl+C；升级执行 \`npm install -g @openhands/agent-canvas@1.43.0\`。

警告：官方明确提醒此模式没有沙箱，Agent 以你的账户权限读写文件系统、执行 shell。不要在不可信仓库上跑自动化任务。

## 3. 路线 B · Docker 单容器

\`\`\`bash
mkdir -p ~/projects
docker run -it \\
  --restart unless-stopped \\
  -p 127.0.0.1:8000:8000 \\
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \\
  -v openhands-data:/home/openhands/.openhands \\
  -v "$HOME/projects:/projects" \\
  ghcr.io/openhands/agent-canvas:1.43.0
# 浏览器打开 http://localhost:8000/canvas
\`\`\`

要点：固定 tag，不用 latest（官方排障页记录过 latest 镜像缺文件导致崩溃循环）；AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true 只允许配合 127.0.0.1 绑定使用，发布到局域网前必须去掉。

## 4. 路线 C · 每会话一容器

\`\`\`bash
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas
# 可选：允许每个会话自行选择 Local / Docker 运行时
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
\`\`\`

资源默认值：内存 4g、CPU 2.0、PID 512、空闲 1200 秒回收容器。验证隔离：

\`\`\`bash
# 让 Agent 在会话内执行
id
printf 'PWD=%s\\nHOME=%s\\n' "$PWD" "$HOME"
# 期望 PWD=/workspace，HOME=/var/openhands/.openhands（不是宿主 home）

# 宿主侧复核容器加固
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# 期望 CapDrop=[ALL]、no-new-privileges、端口只绑 127.0.0.1
\`\`\`

## 5. 路线 D · VM 常驻服务

\`\`\`bash
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"   # 立即存入密钥管理器
npx @openhands/agent-canvas --public
\`\`\`

systemd 常驻（/etc/systemd/system/agent-canvas.service）：

\`\`\`ini
[Service]
Environment=LOCAL_BACKEND_API_KEY=<your-key>
ExecStart=npx @openhands/agent-canvas --public
Restart=on-failure
RestartSec=5
\`\`\`

防火墙只放行 SSH（限你的 IP）与 443；nginx 终结 TLS 后转发 127.0.0.1:8000（含 WebSocket 头），然后 \`systemctl enable --now agent-canvas\`。--public 模式不会把 key 注入页面。

## 6. 密钥与状态（所有路线通用）

- 两套凭证互不能替代：会话密钥（LOCAL_BACKEND_API_KEY / api-key.txt）控制“谁能连后端”；模型密钥（Settings → LLM）控制“调哪家模型”。
- 密钥不进 Git、不进镜像层、不写进 YAML。
- 状态位置：npm 路线在 ~/.openhands；Docker 路线在 openhands-data 卷（容器内 /home/openhands/.openhands，会话密钥在 agent-canvas/api-key.txt）。
- Linux 上不要把 ~/.openhands 绑定挂载进容器：容器用户是 UID 10001，会报 unable to open database file。改用命名卷。
- 找回 Docker 自动生成的会话密钥：\`docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt\`。
- AUTOMATION_KV_SECRET 未设置时，启动器会把首个会话密钥钉到 automation-kv-secret.txt。

## 7. 可选：接入官方软件工厂（四段流水线）

1. Settings → LLM 配好模型（provider key / OpenHands key / ACP 登录 / 本地端点均可）。
2. Settings → Secrets 保存三个细粒度 GitHub PAT：
   - FACTORY_GITHUB_TRIAGE_TOKEN：Contents 读 + Issues 读写（不给写代码权限）；
   - FACTORY_GITHUB_DEVELOPER_TOKEN：Contents / Issues / PR 读写 + Actions 与状态读（默认不加 Workflows 写）；
   - FACTORY_GITHUB_REVIEWER_TOKEN：Contents / Actions 读 + Issues / PR / 状态读写（不能 push）。
3. Settings → Agent 建三个 Agent Profile，各自只勾选自己的 secret，关掉 MCP 服务器、模型切换与子 Agent。
4. Automate → Templates 依次安装四个模板，Check frequency */5 * * * *：Triage → Issue to PR（触发标签 ready-for-dev，分支前缀 factory/issue）→ Code Review（标签 openhands-review）→ Delivery Watchdog。
5. 全部创建后再统一启用；先用一个小 Issue 走通全流程。

红线：watchdog 是确定性检查器（复用 developer token、不启动任何 Agent）；合并必须同时满足 watchdog 全绿、GitHub 分支保护与人工审批，不允许 Agent 自行合并。

## 8. 验收清单（八道闸门，任一不过先停下定位）

1. 版本可重复：\`agent-canvas --version\` 输出 1.43.0；Docker 用固定 tag 而非 latest。
2. 栈全部上线：UI 可开、默认后端显示已连接、容器不处于重启循环。
3. 会话密钥受控：localhost 以外部署必须走 --public 或手动输入 key，页面不内嵌密钥。
4. 工作区即预期：Agent 只能看到 /projects 或显式打开的目录，PWD/HOME 检查通过。
5. 容器加固在位：docker inspect 确认 CapDrop=ALL、no-new-privileges、端口仅 127.0.0.1。
6. 模型链路可用：一次简单会话完整走完事件流；能区分 401（key）与 provider 配置错误。
7. 自动化可暂停：每个 automation 可单独停用，出问题先停调度再排查。
8. 合并不在 Agent 手里：watchdog 确定性校验 + GitHub 分支保护 + 人工最终审批三者都在。

## 9. 常见故障速查

1. \`agent-canvas\` 命令找不到：\`npm prefix -g\` 找到前缀，把 \`$(npm prefix -g)/bin\` 加入 PATH；或用 \`npx @openhands/agent-canvas\` 绕过全局安装。
2. 启动报缺少 uv / uvx：按 uv 官方指南安装后重开终端，\`uv --version\` 验证。
3. Linux 上 unable to open database file：改用命名卷 openhands-data；或用一次性 root 容器把旧状态拷入卷并 chown 到 10001。不要把状态目录设成全用户可写。
4. 镜像启动即崩溃循环（ERR_MODULE_NOT_FOUND）：固定到已知可用 tag（1.43.0）或按 digest 固定，补丁发布后重新 pull。
5. 浏览器要求输入 API key：见第 6 节取回 api-key.txt；它要的是会话密钥，不是模型 key。
6. LLM Provider NOT provided / 模型无响应：Settings → LLM 逐项核对 provider、model、base URL、key；本地模型（Ollama / LM Studio）确认端点可达。
7. ACP Agent（Claude Code / Codex 等）凭证不生效：登录态在后端所在机器；在后端环境重新登录或配置对应 API key，改完重启会话。
8. macOS 桌面版首次打开报“已损坏”：\`xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"\`（未签名，官方 issue #16774 跟踪）；不要因此关闭 Gatekeeper。

## 10. 升级与备份

\`\`\`bash
# 升级（状态在包 / 镜像之外，升级不动数据）
docker pull ghcr.io/openhands/agent-canvas:1.43.0
docker stop <container> && docker run …   # 复用 openhands-data 卷

# 备份状态卷
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \\
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'
\`\`\`

升级顺序：记录当前版本与镜像 digest → 备份状态卷与项目目录 → 读跨版本 Release notes → 测试环境跑通现有自动化 → 切生产并保留旧镜像直到新版本稳定。

## 11. 安全红线（任何路线都不得违反）

- 不把 AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true 用于非 127.0.0.1 绑定。
- 不在无沙箱的 npm 模式下处理不可信仓库。
- 不合并三个工厂 token 的权限；reviewer 永远拿不到 push 权。
- 不让任何 Agent 持有合并权限；GitHub Issue 文本一律视为不可信输入。
- 多人可达的服务器不把 container.memory / cpus 环境变量当作上限（会话启动请求可覆盖它们）。

## 来源与核验范围（核验日期 2026-11-21）

- github.com/OpenHands/OpenHands：README、docs/SELF_HOSTING.md、Release v1.43.0
- docs.openhands.dev：agent-canvas/setup、agent-canvas/architecture、backend-setup/docker-execution、use-cases/software-factory、agent-canvas/troubleshooting
- 核验范围：npm registry 已实测 1.43.0 为最新版（发布于 2026-11-20）；核验环境 Node v20 低于要求的 24 且无 Docker，未实际启动服务、未调用模型、未复现软件工厂走查——上述命令为官方资料整理。
`,
}

export const miniSweAgentDeploySkill: DeploySkill = {
  slug: 'mini-swe-agent',
  fileName: 'mini-swe-agent-deploy.md',
  title: 'mini-SWE-agent 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置两条路线选择表、YAML 模板、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v2.4.6',
  verifyDate: '2026-11-21',
  accent: 'green',
  routes: [
    { id: 'A', label: '本地确认模式' },
    { id: 'B', label: 'Docker 沙箱' },
  ],
  outline: [
    '0 · 硬性前置检查（Python ≥ 3.10 / bash）',
    '1 · 两条部署路线选择表',
    '2 · 安装与入口自检',
    '3 · 模型、密钥与总预算',
    '4 · 路线 A：本地确认模式',
    '5 · 路线 B：Docker 沙箱',
    '6 · 可选：外层自动化接入',
    '7 · 八道验收闸门',
    '8 · 常见故障速查（7 条）',
    '9 · 升级与备份',
    '10 · 安全红线与来源',
  ],
  content: `---
name: mini-swe-agent-deploy
description: 部署并运行 mini-SWE-agent v2.4.6（百行级软件工程 Agent 内核）。当任务是安装、配置、跑通本地或 Docker 沙箱路线、或接入外层自动化流水线时使用；一个文件内含两条部署路线，按隔离需求选择其一执行。
metadata:
  verified_at: "2026-11-21"
  upstream_version: "2.4.6"
  upstream_license: "MIT（包元数据仍标 Alpha）"
---

# mini-SWE-agent v2.4.6 部署手册

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过自检、不越过安全红线。命令以 Linux + /srv/agent-factory 为例，路径可按用户要求替换但保持结构。事实核验日期 2026-11-21。

## 0. 硬性前置检查（不通过就停下并报告）

1. Python >= 3.10（示例用 3.12）：\`python3.12 --version\`。
2. bash 可用（local 与容器内都需要）。
3. 路线 B 需要 \`docker info\` 正常返回。
4. 外层自动化另需 git、gh、jq（它们不是 mini 的内建组件）。
5. 本方案是纯 CLI：不启动 HTTP 服务，无需开放任何端口。

## 1. 选择部署路线（与用户确认后执行；建议先 A 跑通再迁 B）

| 路线 | 适用场景 | 隔离与交互 |
| --- | --- | --- |
| A · 本地确认模式 | 学习控制流、调试、一次性仓库副本 | 无文件系统隔离；confirm 模式人工逐步确认 |
| B · Docker 沙箱 | 无人值守前的最小限权形态 | 断网 + cap-drop ALL + no-new-privileges + 资源上限 |

红线：不要在生产目录使用路线 A；confirm 只是确认器，不是沙箱。

## 2. 安装与入口自检（两条路线共用）

\`\`\`bash
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# 只验证包和入口，不会调用模型
python -c 'import minisweagent; print(minisweagent.__version__)'   # 期望 2.4.6
python -m minisweagent --help
\`\`\`

同时把 \`pip freeze\` 输出保存到 runs/，保证环境可重复。

## 3. 模型、密钥与总预算

\`\`\`bash
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'   # 模型名必须带 provider 前缀
export ANTHROPIC_API_KEY='由密钥管理器注入，不要写进 YAML 或 Git'
export MSWEA_CONFIGURED=true
export MSWEA_GLOBAL_CALL_LIMIT=100     # 进程级总闸门
export MSWEA_GLOBAL_COST_LIMIT=10.00
\`\`\`

## 4. 路线 A · 本地确认模式

/srv/agent-factory/factory.local.yaml：

\`\`\`yaml
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
\`\`\`

运行：

\`\`\`bash
cd /srv/agent-factory
source .venv/bin/activate
mini \\
  -c mini.yaml \\
  -c /srv/agent-factory/factory.local.yaml \\
  -t '先复现问题，再做最小修改；运行相关测试，不要提交或推送。' \\
  -o /srv/agent-factory/runs/local-demo.traj.json
\`\`\`

注意：一旦使用 -c，内置默认配置不会自动作为基底加载，必须同时写 -c mini.yaml。

## 5. 路线 B · Docker 沙箱

/srv/agent-factory/factory.docker.yaml：

\`\`\`yaml
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
\`\`\`

运行：

\`\`\`bash
cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm
mini \\
  -c mini.yaml \\
  -c /srv/agent-factory/factory.docker.yaml \\
  -t '检查当前仓库，修复任务描述的问题，运行测试；不要联网、提交或推送。' \\
  -o /srv/agent-factory/runs/docker-demo.traj.json \\
  --yolo --exit-immediately
\`\`\`

要点：模板主动断网，不能在线安装依赖或推送代码；真实项目预构建依赖镜像并固定 digest；先建目录再挂载，避免 Docker 自动创建 root 拥有的目录；容器内默认不放模型 key、不挂 Docker socket。

## 6. 可选：外层自动化接入（Issue 到补丁）

v2 已移除专用 github_issue.py，由外层调度器取 Issue 再调用 mini CLI：

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \\
  -t "$(cat "runs/$RUN_ID.issue.txt")" \\
  -o "runs/$RUN_ID.traj.json" \\
  --yolo --exit-immediately

# 进程退出不等于任务成功：先检查显式退出状态
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# 下一步：在隔离环境运行完整 CI，再交人工审阅；不要自动 merge
\`\`\`

读取轨迹验收字段：

\`\`\`bash
jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json
\`\`\`

## 7. 验收清单（八道闸门）

1. 版本可重复：import 版本为 2.4.6，pip freeze 已保存，不直接跟随 latest。
2. 配置可解释：启动日志同时包含 mini.yaml 与自定义 YAML，模型名带 provider 前缀。
3. 工作区可丢弃：只挂仓库副本，宿主其他目录与 Docker socket 不可写。
4. 密钥不进补丁：轨迹、patch、日志扫描无 API key；容器内默认无模型密钥。
5. 限制确实生效：分别演练命令超时、单任务成本 / 步数限制与墙钟限制。
6. 轨迹可读取：JSON 含版本、配置、消息、模型统计与明确的 exit_status。
7. 变更可审查：git diff --check 通过，补丁仅含预期文件，无二进制与临时脚本。
8. 测试与合并分离：干净环境重跑 CI；Agent 不掌握合并权限，人工最终批准。

## 8. 常见故障速查

1. 使用 -c 后提示模板或配置缺失：v2 不自动叠加默认配置，改为 mini -c mini.yaml -c factory.local.yaml …。
2. API key 已设置仍 AuthenticationError：核对 provider 前缀、密钥变量名与环境加载顺序；官方 issue #558 核验时仍为 open；不要把“容器里也放 key”当作修复手段。
3. 上一轮 cd / export 下一轮消失：每个动作都是新 subshell，这是设计不是 bug；同一动作内写 cd … && …，或配置 environment.cwd。
4. Docker 拉镜像超时或容器无法执行：先手动 docker info / docker pull / docker exec 验证；pull_timeout 默认 120 秒可调高；普通命令超时由 environment.timeout 控制（默认 30 秒）。
5. CI 中一直等待输入或任务结束不退出：默认 confirm 且提交时询问；只在限权沙箱中使用 --yolo --exit-immediately，不要在宿主机开 yolo。
6. exit_status 是 LimitsExceeded / TimeExceeded：先缩小任务与测试范围再调上限；cost_limit=0 表示不限制，不是修复手段。
7. 旧教程里的 mini -v / github_issue.py 不存在：v2 已移除；按官方 v2 迁移指南处理；确需留在 v1 时固定 mini-swe-agent~=1.0，不要把 v1 配置套到本手册。

## 9. 升级与备份

1. 备份自定义 YAML、runs/、pip freeze 输出与镜像 digest；不提交 .env。
2. 在新虚拟环境安装目标版本，保留 2.4.6 环境可回滚。
3. 用无敏感数据的小型仓库跑同一任务，比较轨迹结构、成本与测试结果。
4. 核对 Model / Environment 协议、配置键、完成信号与退出状态后再切换。
5. 升级时锁定全量依赖并审 Release：官方曾排除遭 compromised 的 litellm 1.82.7 / 1.82.8，不要只更新 Agent 包。

## 10. 安全红线（任何路线都不得违反）

- local 路线只用于一次性仓库副本；生产任务采用更强沙箱，confirm 不能替代隔离。
- Issue 与仓库文档是不可信输入：触发与写权限分离；GitHub Token 不进容器，推送由外层独立步骤完成。
- 不允许 Agent 自动合并：Submitted 只是自称完成，必须 diff 检查 + 完整 CI + 人工审阅。
- runs/ 可能含私有源码、路径与误打印的密钥：限制权限、设定保留期、公开分享前脱敏。

## 来源与核验范围（核验日期 2026-11-21）

- github.com/SWE-agent/mini-swe-agent：README、Release v2.4.6、pyproject.toml、main 提交记录
- mini-swe-agent.com：quickstart、advanced/control_flow、advanced/environments、advanced/yaml_configuration、advanced/global_configuration、advanced/v2_migration
- 核验范围：mini-swe-agent==2.4.6 已在隔离临时目录安装、导入并运行 --help（实测）；未调用模型、未运行 Docker 路线、未执行真实仓库修复。
`,
}


export const sweAgentDeploySkill: DeploySkill = {
  slug: 'swe-agent',
  fileName: 'swe-agent-deploy.md',
  title: 'SWE-agent 遗产版部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明维护期适用场景，正文内置四条路线选择表、源码安装命令、密钥边界、八道验收闸门与迁移红线。用于复现历史 SWE-agent pipeline；新项目默认改用 mini-SWE-agent。',
  version: 'v1.1.0',
  verifyDate: '2026-11-21',
  accent: 'blue',
  routes: [
    { id: 'A', label: '源码安装 + 加固 Docker' },
    { id: 'B', label: '本地仓库 + Modal' },
    { id: 'C', label: 'run-batch 批量基准' },
    { id: 'D', label: '轨迹审查与统计' },
  ],
  outline: [
    '0 · 硬性前置检查（Python ≥ 3.11 / Docker 或 Modal）',
    '1 · 四条路线选择表',
    '2 · 源码安装与 CLI 自检',
    '3 · 密钥与仓库边界',
    '4 · 路线 A：源码安装 + 加固 Docker',
    '5 · 路线 B：本地仓库 + Modal',
    '6 · 路线 C：run-batch 批量基准',
    '7 · 路线 D：轨迹审查与统计',
    '8 · 八道验收闸门',
    '9 · 常见故障速查（7 条）',
    '10 · 升级、迁移与备份',
    '11 · 安全红线与来源',
  ],
  content: `---
name: swe-agent-deploy
description: 部署、验证与迁移 SWE-agent v1.1.0（维护期完整 ACI 框架）。当任务是复现历史 SWE-bench pipeline、研究 ACI 工具束、审查旧轨迹或维护既有 v1.x 配置时使用；新建生产 Agent 平台不要选它，优先 mini-SWE-agent。
metadata:
  verified_at: "2026-11-21"
  upstream_version: "1.1.0"
  upstream_commit: "0f3acafacabc0def8cc76b4e48acb4b6cf302cb9"
  upstream_license: "MIT"
---

# SWE-agent v1.1.0 部署手册（遗产版）

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过自检、不越过安全红线。事实核验日期 2026-11-21。官方 README 与文档已声明 mini-SWE-agent 取代 SWE-agent，SWE-agent 处于 maintenance-only 模式；本手册只用于历史兼容、研究对照和既有 pipeline 复现。

## 0. 硬性前置检查（不通过就停下并报告）

1. Python >= 3.11：\`python3.11 --version\`。
2. Git 可用，并能固定到 v1.1.0：\`git --version\`。
3. 路线 A / C 需要 \`docker info\` 与 \`docker pull python:3.11\` 正常；路线 B 需要已认证 Modal。
4. 模型 key 由宿主进程环境或密钥管理器注入，不写进 YAML、Git、镜像层或容器命令。
5. 处理不可信仓库时禁止 local deployment；至少使用 Docker 或云沙箱，并保持断网与资源上限。

## 1. 选择路线（与用户确认后只执行一条）

| 路线 | 适用场景 | 信任边界 |
| --- | --- | --- |
| A · 源码安装 + 加固 Docker | 单仓库复现、历史 pipeline 验证 | 宿主持有模型 key；本地仓库上传到断网容器 |
| B · 本地仓库 + Modal | 本机没有 Docker，允许云端执行 | 代码与命令输出进入 Modal sandbox |
| C · run-batch 批量基准 | SWE-bench / 历史 Issue 批量实验 | 并发放大成本与 Docker / 云负载 |
| D · 轨迹审查与统计 | 分析已有 .traj / preds.json | 只读本地轨迹，不启动 Agent |

默认新部署先走 A 的 1 个小型仓库 smoke run；没有 Docker 且允许云端才选 B；研究实验再选 C；D 可与其他路线组合。

## 2. 源码安装与 CLI 自检（所有路线共用）

\`\`\`bash
mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
cd /srv/agent-factory
python3.11 -m venv .venv
source .venv/bin/activate

git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
cd vendor/SWE-agent
git rev-parse HEAD   # 期望 0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
python -m pip install --upgrade pip
python -m pip install --editable .

# 只验证入口，不启动 Docker、不调用模型
sweagent --help
python -m sweagent run --help
python -m sweagent run-batch --help
\`\`\`

同时保存 \`pip freeze\` 到 runs/。如果坚持非 editable 安装，必须额外设置 \`SWE_AGENT_CONFIG_DIR\`、\`SWE_AGENT_TOOLS_DIR\`、\`SWE_AGENT_TRAJECTORY_DIR\` 指向源码树；否则导入时可能断言 config / tools / trajectories 缺失。

## 3. 密钥与仓库边界

\`\`\`bash
export ANTHROPIC_API_KEY='由密钥管理器注入'
export OPENAI_API_KEY='由密钥管理器注入'
# 公共仓库通常不需要 GITHUB_TOKEN
\`\`\`

红线：模型 key 不进容器、GitHub Token 不进容器、密钥不写进 YAML 或 Git。访问私有仓库时，先在宿主侧用受控凭证预取到 workspace/project，再以 \`env.repo.type=local\` 上传；不要让长期 Token 通过 clone URL 进入容器。

## 4. 路线 A · 源码安装 + 加固 Docker

/srv/agent-factory/factory.docker.yaml：

\`\`\`yaml
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
    max_consecutive_execution_timeouts: 3
\`\`\`

运行：

\`\`\`bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11
sweagent run \\
  --config config/default.yaml \\
  --config /srv/agent-factory/factory.docker.yaml \\
  --output_dir /srv/agent-factory/runs/docker-single
\`\`\`

要点：local repo 由 SWE-ReX 从宿主上传，因此容器可断网；真实项目要预构建依赖镜像并固定 digest；断网路线不能在线安装依赖或推送代码。

## 5. 路线 B · 本地仓库 + Modal

\`\`\`bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
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
  --output_dir=/srv/agent-factory/runs/modal-single
\`\`\`

要点：这条路线的目的是绕开本机 Docker，不是降低安全要求。代码、命令输出与轨迹会进入云端；先确认组织允许的数据区域、日志可见性与保留策略。

## 6. 路线 C · run-batch 批量基准

\`\`\`bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
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

# preds.json 缺失或过期时在实验目录重建
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke
\`\`\`

要点：先用 3 个实例烟测。检查成本、轨迹、Docker 负载和 exit statuses 后，再扩大 slice 与 num_workers。run-batch 产出预测，不运行 SWE-bench 评测；评测是外层独立步骤。

## 7. 路线 D · 轨迹审查与统计

\`\`\`bash
# 终端查看单个轨迹或目录
sweagent inspect /srv/agent-factory/runs/docker-single

# 浏览器查看实验目录；只在本机访问
sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001

# 快速汇总退出状态、成本与 API 调用
sweagent quick-stats /srv/agent-factory/runs/docker-single

# 用 jq 抽取验收字段
jq '{
  version: .info.swe_agent_version,
  rex: .info.swe_rex_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission_present: (.info.submission != null),
  steps: (.trajectory | length)
}' /srv/agent-factory/runs/docker-single/**/*.traj
\`\`\`

注意：v1.1.0 的轨迹字段是 \`query\`，不再是旧版 \`messages\`。跨版本分析脚本必须先确认版本。

## 8. 验收清单（八道闸门）

1. 版本可重复：git tag 为 v1.1.0，commit 匹配；\`sweagent --help\` 显示 1.1.0；保存 pip freeze。
2. 配置可解释：启动日志包含默认 config/default.yaml 与自定义 YAML；模型名、解析器、工具束与成本限制符合预期。
3. 执行面隔离：Docker 参数含断网、cap-drop、no-new-privileges 与 CPU / 内存 / PID 上限；不使用 local 处理不可信仓库。
4. 密钥不越界：YAML、Git、容器环境与轨迹扫描无模型 key；GitHub Token 不进容器。
5. 限制确实生效：分别演练单命令 30 秒、安装 300 秒、总执行 1800 秒和成本上限。
6. 轨迹可读取：.traj 含 query、thought、action、observation、model_stats、exit_status 与 submission。
7. 补丁可审查：submission 非空；应用到干净副本后 \`git apply --check\` 与相关测试通过。
8. 评测与合并分离：run-batch 只产出 preds.json；SWE-bench / CI 与人工最终批准在 Agent 之外。

## 9. 常见故障速查

1. \`sweagent\` 找不到或版本不对：确认 \`which python\` 与 \`which sweagent\` 同属一个 venv；从 v1.1.0 源码重新 \`pip install --editable .\`。
2. 导入时报 config / tools / trajectories 不存在：非 editable 安装缺顶层目录；改走源码 editable，或设置三个 \`SWE_AGENT_*_DIR\`。
3. Docker socket 权限或 docker: not found：先 \`docker run hello-world\`；修 daemon 权限，或改 Modal 路线，不要退到无沙箱 local。
4. 模型 401 / 404 / 成本统计报错：检查 provider、模型名、base URL 与 key 是否存在（不打印密钥）；本地模型用 provider 前缀、成本限制设 0、设置 max_input_tokens。
5. 模型不返回合法动作：默认解析器是 function_calling；换支持工具调用的模型，或把 \`agent.tools.parse_function.type\` 改为 \`thought_action\` 并更新模板。
6. 旧配置提示 review_on_submit 或工具束不存在：v1.1.0 重命名工具束并移除 review_on_submit；改用 review_on_submit_m 与新 bundle 名。
7. 批处理 preds.json 缺失或过期：看 run_batch_exit_statuses.yaml；用 \`sweagent remove-unfinished\` 清理，再运行 \`sweagent merge-preds\`。

## 10. 升级、迁移与备份

1. 新需求先评估 mini-SWE-agent；SWE-agent 只为历史兼容、研究对照和必须复现的旧 pipeline 保留。
2. 备份自定义 YAML、runs/、任务清单、pip freeze、镜像 digest 与实验说明；不备份明文密钥。
3. 跨版本前核对 trajectory 字段、工具束名、解析器、SWE-ReX 接口与实例配置。
4. 用同一小任务比较 SWE-agent 与 mini 的成本、轨迹结构、补丁质量与故障路径。
5. 保留旧源码环境与实验输出，直到新路线通过完整验收；不要直接删除历史 runs/。

## 11. 安全红线（任何路线都不得违反）

- 模型 key 不进容器、GitHub Token 不进容器、密钥不写进 YAML 或 Git。
- 不用 local deployment 处理不可信仓库；local 只用于完全可信、可丢弃的实验环境。
- 不让长期 GITHUB_TOKEN 随 clone URL 进入容器；私有仓库先由宿主预取，再用 local repo 上传。
- 不允许 Agent 自动合并；submission 必须经干净环境 CI、补丁审查与人工批准。
- runs/、trajectories/、preds.json 可能含私有源码、路径与误打印密钥；限权、设定保留期、公开前脱敏。
- 不把维护期框架包装成新平台默认；新平台默认使用 mini-SWE-agent 或其他活跃维护方案。

## 来源与核验范围（核验日期 2026-11-21）

- github.com/SWE-agent/SWE-agent：README、v1.1.0 tag、pyproject.toml、tools / sweagent 源码
- swe-agent.com/latest/：installation/source、installation/changelog、background/architecture、background/aci、usage/hello_world、usage/batch_mode、usage/trajectories、config/env、installation/keys
- 核验范围：v1.1.0 源码已克隆核对 commit；已在隔离环境 editable 安装并运行 sweagent / run / run-batch / inspect / inspector 帮助命令（实测）。当前环境无 Docker、无模型密钥，未执行真实 Issue 修复、未调用模型、未运行 SWE-bench 或 Modal。
`,
}


export const agentlessDeploySkill: DeploySkill = {
  slug: 'agentless',
  fileName: 'agentless-deploy.md',
  title: 'Agentless 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置依赖漂移修复、五条复现路线、密钥边界、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v1.5.0',
  verifyDate: '2026-11-22',
  accent: 'blue',
  routes: [
    { id: 'A', label: '兼容环境' },
    { id: 'B', label: '层级定位' },
    { id: 'C', label: '多样本修复' },
    { id: 'D', label: '验证选择' },
    { id: 'E', label: '成本审计' },
  ],
  outline: [
    '0 · 硬性前置检查（Python 3.11 / 固定 v1.5.0）',
    '1 · 官方依赖漂移与实测兼容锁',
    '2 · 五条复现路线选择表',
    '3 · 源码安装与 11 个入口自检',
    '4 · 模型、数据集与目录边界',
    '5 · 官方 SWE-bench 阶段命令',
    '6 · 外层自动化接入门禁',
    '7 · 八道验收闸门',
    '8 · 常见故障速查（8 条）',
    '9 · 升级、备份与成本控制',
    '10 · 安全红线与来源',
  ],
  content: `---
name: agentless-deploy
description: 部署并验证 OpenAutoCoder/Agentless v1.5.0（三阶段无自由工具循环的软件修复流水线）。当任务是安装历史版本、修复 SWE-bench 依赖漂移、运行定位 / 修复 / 验证选择、审计 JSONL 结果，或把 Agentless 接入外层软件工厂时使用；一个文件内含依赖锁定、五条路线、八道验收闸门与故障速查。不要把 Agentless 当作开箱即用的 GitHub Issue bot。
metadata:
  verified_at: "2026-11-22"
  upstream_version: "v1.5.0"
  upstream_commit: "b150f28465a77a81a7f4776384957a4271f5bd69"
  upstream_license: "MIT"
---

# Agentless v1.5.0 部署执行手册

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过依赖锁定、不把官方 benchmark 声明冒充本地实测。事实核验日期 2026-11-22；若当前日期明显更晚，先核对官方 Release、SWE-bench、Modal 与 OpenAI SDK 是否又发生兼容变化。

## 0. 硬性前置检查（不通过就停下并报告）

1. Python 使用 3.11：\`python3.11 --version\`。
2. git、curl、pip、 Hugging Face 数据集访问可用；真实模型阶段另需 provider key。
3. 官方 requirements.txt 未锁版本；禁止直接宣称“按官方安装即可复现”。
4. 本方案是 CLI 流水线：不启动常驻 HTTP 服务，无需开放端口。
5. Agentless 原生输入是 SWE-bench 式实例，不是任意 GitHub Issue；接工厂前先建实例适配层。

## 1. 官方依赖漂移与实测兼容锁

官方 v1.5.0 的 \`requirements.txt\` 内容未锁定，并把 \`swebench\` 指向 GitHub 主分支。2026-11-22 实际解析结果会先得到 \`swebench 5.2\`，随后 \`agentless/test/run_regression_tests.py\` 导入旧常量 \`KEY_INSTANCE_ID\` 失败。

本次隔离 Python 3.11 环境实测通过的组合：

- \`swebench==2.1.8\`
- \`modal==0.77.0\`
- 由 pip 解析的兼容传递依赖，包括 click 8.1.8、grpclib 0.4.7、protobuf 6.33.6、synchronicity 0.9.16

先按官方 requirements 安装，再显式补装以上两个兼容锁，最后必须跑 \`python -m pip check\`。

## 2. 选择复现路线（与用户确认后只执行一条主线）

| 路线 | 适用场景 | 证据等级 |
| --- | --- | --- |
| A · 兼容环境 | 安装、锁依赖、验证 CLI 可加载 | 本次实测 |
| B · 层级定位 | 官方 SWE-bench 文件 / 元素 / 行级定位 | 官方资料；未调用模型 |
| C · 多样本修复 | 从定位上下文生成候选补丁 | 官方资料；未调用模型 |
| D · 验证选择 | 回归、复现测试与多数投票 | 官方资料；未运行基准 |
| E · 成本审计 | 统计 output.jsonl token 与估算成本 | 入口实测；无真实 output |

默认先做 A；没有模型 key、数据集访问和评测预算时，不要跳级执行 B–D。

## 3. 源码安装与入口自检（路线 A）

\`\`\`bash
mkdir -p /srv/agent-factory/{workspace,runs,vendor}
cd /srv/agent-factory

git clone --depth 1 --branch v1.5.0 https://github.com/OpenAutoCoder/Agentless.git vendor/Agentless
cd vendor/Agentless
git rev-parse HEAD   # 期望 b150f28465a77a81a7f4776384957a4271f5bd69

python3.11 -m venv /srv/agent-factory/.venv
source /srv/agent-factory/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install 'swebench==2.1.8' 'modal==0.77.0'
python -m pip check
export PYTHONPATH=/srv/agent-factory/vendor/Agentless
python -m compileall -q agentless

python agentless/fl/localize.py --help
python agentless/fl/retrieve.py --help
python agentless/fl/combine.py --help
python agentless/repair/repair.py --help
python agentless/repair/rerank.py --help
python agentless/test/select_regression_tests.py --help
python agentless/test/run_regression_tests.py --help
python agentless/test/generate_reproduction_tests.py --help
python agentless/test/run_reproduction_tests.py --help
python agentless/test/run_tests.py --help
python dev/util/cost.py --help
\`\`\`

同时保存 \`pip freeze\`、源码包哈希、命令输出和当前日期到 runs/。任何一项失败，先停下记录环境，不要改源码绕过。

## 4. 模型、数据集与目录边界

\`\`\`bash
export OPENAI_API_KEY='由密钥管理器注入'
\`\`\`

- 官方 README 示例使用 OpenAI；源码 \`util/model.py\` 支持 \`openai\` 与 \`deepseek\` backend。
- DeepSeek 路径复用 OpenAI-compatible client；未改源码前仍默认读取 \`OPENAI_API_KEY\`，不要误以为 \`DEEPSEEK_API_KEY\` 会被自动读取。
- 数据集默认为 \`princeton-nlp/SWE-bench_Lite\`；可用 \`--dataset princeton-nlp/SWE-bench_Verified\`。
- 官方支持模型选项包括 \`gpt-4o-2024-05-13\`、\`gpt-4o-mini-2024-07-18\`、\`deepseek-coder\`；入口脚本会校验 deepseek 模型必须配合 \`--backend deepseek\`。
- \`results/\`、\`embedding/\`、\`playground/\` 可能包含私有源码、路径、日志和模型输出；生产接入时移到受控工作区并设置保留期。

## 5. 官方 SWE-bench 阶段命令（路线 B–D）

### 5.1 文件级定位、检索与合并

\`\`\`bash
cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless
mkdir -p results/swe-bench-lite

python agentless/fl/localize.py --file_level \\
  --output_folder results/swe-bench-lite/file_level \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --file_level --irrelevant \\
  --output_folder results/swe-bench-lite/file_level_irrelevant \\
  --num_threads 10 --skip_existing

python agentless/fl/retrieve.py --index_type simple \\
  --filter_type given_files \\
  --filter_file results/swe-bench-lite/file_level_irrelevant/loc_outputs.jsonl \\
  --output_folder results/swe-bench-lite/retrieval_embedding \\
  --persist_dir embedding/swe-bench_simple \\
  --num_threads 10

python agentless/fl/combine.py \\
  --retrieval_loc_file results/swe-bench-lite/retrieval_embedding/retrieve_locs.jsonl \\
  --model_loc_file results/swe-bench-lite/file_level/loc_outputs.jsonl \\
  --top_n 3 \\
  --output_folder results/swe-bench-lite/file_level_combined
\`\`\`

### 5.2 元素级与编辑位置定位

\`\`\`bash
python agentless/fl/localize.py --related_level \\
  --output_folder results/swe-bench-lite/related_elements \\
  --top_n 3 --compress_assign --compress \\
  --start_file results/swe-bench-lite/file_level_combined/combined_locs.jsonl \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --fine_grain_line_level \\
  --output_folder results/swe-bench-lite/edit_location_samples \\
  --top_n 3 --compress --temperature 0.8 --num_samples 4 \\
  --start_file results/swe-bench-lite/related_elements/loc_outputs.jsonl \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --merge \\
  --output_folder results/swe-bench-lite/edit_location_individual \\
  --top_n 3 --num_samples 4 \\
  --start_file results/swe-bench-lite/edit_location_samples/loc_outputs.jsonl
\`\`\`

### 5.3 多样本修复

\`\`\`bash
python agentless/repair/repair.py \\
  --loc_file results/swe-bench-lite/edit_location_individual/loc_merged_0-0_outputs.jsonl \\
  --output_folder results/swe-bench-lite/repair_sample_1 \\
  --loc_interval --top_n=3 --context_window=10 \\
  --max_samples 10 --cot --diff_format --gen_and_process \\
  --num_threads 2
\`\`\`

官方示例对 4 组编辑位置各生成 10 个样本，合计每题 40 个候选。第一次真实运行应先用 \`--target_id\` 与更少样本收窄范围。

### 5.4 回归、复现与选择

\`\`\`bash
python agentless/test/run_regression_tests.py \\
  --run_id generate_regression_tests \\
  --output_file results/swe-bench-lite/passing_tests.jsonl

python agentless/test/select_regression_tests.py \\
  --passing_tests results/swe-bench-lite/passing_tests.jsonl \\
  --output_folder results/swe-bench-lite/select_regression

python agentless/test/generate_reproduction_tests.py \\
  --max_samples 40 \\
  --output_folder results/swe-bench-lite/reproduction_test_samples \\
  --num_threads 10

python agentless/repair/rerank.py \\
  --patch_folder results/swe-bench-lite/repair_sample_1/ \\
  --num_samples 10 --deduplicate --regression --reproduction
\`\`\`

\`rerank.py\` 输出 \`all_preds.jsonl\`。这只是交给 SWE-bench 或 CI 的候选预测，不是修复成功证明。

## 6. 成本与证据审计（路线 E）

\`\`\`bash
cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
python dev/util/cost.py --output_file results/swe-bench-lite/repair_sample_1/output.jsonl

python - <<'PY'
import json
from collections import Counter
path = 'results/swe-bench-lite/repair_sample_1/all_preds.jsonl'
rows = [json.loads(line) for line in open(path, encoding='utf-8')]
counts = Counter(row['instance_id'] for row in rows)
assert rows and all(count == 1 for count in counts.values())
assert all('model_patch' in row for row in rows)
print({'instances': len(counts), 'non_empty_patches': sum(bool(r['model_patch']) for r in rows)})
PY
\`\`\`

记录：数据集、target_id / slice、模型、backend、温度、样本数、num_threads、依赖锁、结果哈希与成本。没有这些字段，后续无法解释分数差异。

## 7. 外层自动化接入门禁

Agentless 原生读取 SWE-bench 数据集字段。接入软件工厂时，外层系统必须先把人工批准的 Issue 映射为 \`instance_id\`、\`repo\`、\`base_commit\`、\`problem_statement\`，并准备可丢弃仓库副本。

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="20261122-agentless-smoke"
TARGET_ID="django__django-10914"

cd "$ROOT/vendor/Agentless"
source "$ROOT/.venv/bin/activate"
export PYTHONPATH="$ROOT/vendor/Agentless"

python agentless/fl/localize.py --file_level \\
  --target_id "$TARGET_ID" \\
  --output_folder "$ROOT/runs/$RUN_ID/file_level" \\
  --num_threads 1
\`\`\`

红线：Issue 文本不可信；外层系统负责触发审批、并发限制、预算、CI 与人工合并。Agentless 不持有 push 或 merge 权限。

## 8. 八道验收闸门

1. 版本可重复：v1.5.0、commit b150f284、Python 3.11、pip freeze 与源码包哈希已保存。
2. 依赖不失配：\`swebench==2.1.8\`、\`modal==0.77.0\`，\`pip check\` 无破损依赖。
3. 入口可加载：11 个 CLI 帮助命令全部通过。
4. 密钥不越界：Git、YAML、结果文件、日志与容器命令中无明文模型 key。
5. 范围可收窄：首次真实运行使用 target_id、低样本数和受控数据集切片。
6. 证据可追踪：loc、repair、regression、reproduction、rerank 各阶段 JSONL 与日志完整。
7. 补丁可审查：all_preds.jsonl 每实例一个补丁；应用到干净副本后测试通过。
8. 评测与合并分离：SWE-bench / CI 与人工审批在 Agentless 外完成；不自动合并。

## 9. 常见故障速查

1. \`ImportError: cannot import name 'KEY_INSTANCE_ID'\`：直接安装官方 requirements 解析到了新 SWE-bench；补装 \`swebench==2.1.8\` 与 \`modal==0.77.0\`。
2. \`AttributeError: module 'modal' has no attribute 'Mount'\`：只固定 swebench 不够；Modal 也需固定到 0.77.0 并让 pip 重解传递依赖。
3. \`pip check\` 报 click / grpclib / protobuf / synchronicity：不要手工逐个乱降级；重新以两个顶层约束让 resolver 解出一致组合。
4. OpenAI 401 / 模型不可用：检查 key 是否存在、账户权限、模型名与 provider；不要打印密钥。
5. DeepSeek 断言失败：同时使用 \`--model deepseek-coder --backend deepseek\`；未改源码前仍注意 OPENAI_API_KEY 读取逻辑。
6. 定位为空：核对 instance_id、base_commit、PROJECT_FILE_LOC、top_n 与 localization_logs；先跑 file_level。
7. 补丁无法解析：看 repair_logs，保留 diff_format / gen_and_process，增大 context_window 或换稳定模型；不要手工改 output.jsonl。
8. all_preds 缺失或字段不对：检查 rerank 输入的 normalized patch、regression 与 reproduction 结果文件是否同 instance_id 对齐。

## 10. 升级、备份与成本控制

- 升级前备份：源码包哈希、pip freeze、运行命令、结果 JSONL、模型 / 数据集版本；不备份明文密钥。
- 升级时先核对 SWE-bench、Modal、OpenAI SDK 与 datasets 字段，再用同一 target_id 做新旧对比。
- 成本先用小样本烟测，再扩大 num_threads、num_samples、num_workers。
- 用 \`dev/util/cost.py\` 分阶段统计 token 与估算成本；provider 侧另设预算和告警。
- results/、embedding/、playground/ 需限权、脱敏、设置保留期和磁盘配额。

## 11. 安全红线（任何路线都不得违反）

- 模型 key 不进 Git、YAML、结果文件、日志或不可信容器。
- 不把 Agentless 包装成开箱即用的 GitHub Issue bot。
- 不让 Agentless 或外层 Agent 自动 merge；最终补丁必须经干净环境 CI 与人工批准。
- 不把官方 SWE-bench 历史分数写成当前实测；官方资料与实际执行验证必须分开。
- 不手工编辑中间 JSONL 来掩盖解析、定位或测试失败。

## 来源与核验范围（核验日期 2026-11-22）

- github.com/OpenAutoCoder/Agentless：README、Release v1.5.0、README_swebench.md、requirements.txt、agentless 源码
- arxiv.org/abs/2407.01489：Agentless 论文
- huggingface.co/datasets/princeton-nlp/SWE-bench_Lite 与 SWE-bench_Verified
- 实测范围：官方 v1.5.0 源码包、Python 3.11 隔离环境、pip 依赖解析、compileall、pip check、11 个 CLI 帮助入口。未调用模型，未执行真实 Issue 修复，未运行 SWE-bench 端到端。
  `,
}
