---
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

1. `node --version` 必须 >= v24，低于 24 先升级再继续。
2. `uv --version` 必须可用：本地 Agent Server 经 uvx 运行，uv 是硬性前置。
3. 路线 B / C / D 需要 `docker info` 正常返回。
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

```bash
npm install -g @openhands/agent-canvas
agent-canvas --version   # 期望输出 1.43.0
agent-canvas --info      # 查看版本与栈配置
agent-canvas             # 启动全栈，浏览器打开 http://localhost:8000
```

启动后：Settings → LLM 配置模型；Open Workspace 指定项目目录。停止用 Ctrl+C；升级执行 `npm install -g @openhands/agent-canvas@1.43.0`。

警告：官方明确提醒此模式没有沙箱，Agent 以你的账户权限读写文件系统、执行 shell。不要在不可信仓库上跑自动化任务。

## 3. 路线 B · Docker 单容器

```bash
mkdir -p ~/projects
docker run -it \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \
  -v openhands-data:/home/openhands/.openhands \
  -v "$HOME/projects:/projects" \
  ghcr.io/openhands/agent-canvas:1.43.0
# 浏览器打开 http://localhost:8000/canvas
```

要点：固定 tag，不用 latest（官方排障页记录过 latest 镜像缺文件导致崩溃循环）；AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true 只允许配合 127.0.0.1 绑定使用，发布到局域网前必须去掉。

## 4. 路线 C · 每会话一容器

```bash
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas
# 可选：允许每个会话自行选择 Local / Docker 运行时
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
```

资源默认值：内存 4g、CPU 2.0、PID 512、空闲 1200 秒回收容器。验证隔离：

```bash
# 让 Agent 在会话内执行
id
printf 'PWD=%s\nHOME=%s\n' "$PWD" "$HOME"
# 期望 PWD=/workspace，HOME=/var/openhands/.openhands（不是宿主 home）

# 宿主侧复核容器加固
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# 期望 CapDrop=[ALL]、no-new-privileges、端口只绑 127.0.0.1
```

## 5. 路线 D · VM 常驻服务

```bash
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"   # 立即存入密钥管理器
npx @openhands/agent-canvas --public
```

systemd 常驻（/etc/systemd/system/agent-canvas.service）：

```ini
[Service]
Environment=LOCAL_BACKEND_API_KEY=<your-key>
ExecStart=npx @openhands/agent-canvas --public
Restart=on-failure
RestartSec=5
```

防火墙只放行 SSH（限你的 IP）与 443；nginx 终结 TLS 后转发 127.0.0.1:8000（含 WebSocket 头），然后 `systemctl enable --now agent-canvas`。--public 模式不会把 key 注入页面。

## 6. 密钥与状态（所有路线通用）

- 两套凭证互不能替代：会话密钥（LOCAL_BACKEND_API_KEY / api-key.txt）控制“谁能连后端”；模型密钥（Settings → LLM）控制“调哪家模型”。
- 密钥不进 Git、不进镜像层、不写进 YAML。
- 状态位置：npm 路线在 ~/.openhands；Docker 路线在 openhands-data 卷（容器内 /home/openhands/.openhands，会话密钥在 agent-canvas/api-key.txt）。
- Linux 上不要把 ~/.openhands 绑定挂载进容器：容器用户是 UID 10001，会报 unable to open database file。改用命名卷。
- 找回 Docker 自动生成的会话密钥：`docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`。
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

1. 版本可重复：`agent-canvas --version` 输出 1.43.0；Docker 用固定 tag 而非 latest。
2. 栈全部上线：UI 可开、默认后端显示已连接、容器不处于重启循环。
3. 会话密钥受控：localhost 以外部署必须走 --public 或手动输入 key，页面不内嵌密钥。
4. 工作区即预期：Agent 只能看到 /projects 或显式打开的目录，PWD/HOME 检查通过。
5. 容器加固在位：docker inspect 确认 CapDrop=ALL、no-new-privileges、端口仅 127.0.0.1。
6. 模型链路可用：一次简单会话完整走完事件流；能区分 401（key）与 provider 配置错误。
7. 自动化可暂停：每个 automation 可单独停用，出问题先停调度再排查。
8. 合并不在 Agent 手里：watchdog 确定性校验 + GitHub 分支保护 + 人工最终审批三者都在。

## 9. 常见故障速查

1. `agent-canvas` 命令找不到：`npm prefix -g` 找到前缀，把 `$(npm prefix -g)/bin` 加入 PATH；或用 `npx @openhands/agent-canvas` 绕过全局安装。
2. 启动报缺少 uv / uvx：按 uv 官方指南安装后重开终端，`uv --version` 验证。
3. Linux 上 unable to open database file：改用命名卷 openhands-data；或用一次性 root 容器把旧状态拷入卷并 chown 到 10001。不要把状态目录设成全用户可写。
4. 镜像启动即崩溃循环（ERR_MODULE_NOT_FOUND）：固定到已知可用 tag（1.43.0）或按 digest 固定，补丁发布后重新 pull。
5. 浏览器要求输入 API key：见第 6 节取回 api-key.txt；它要的是会话密钥，不是模型 key。
6. LLM Provider NOT provided / 模型无响应：Settings → LLM 逐项核对 provider、model、base URL、key；本地模型（Ollama / LM Studio）确认端点可达。
7. ACP Agent（Claude Code / Codex 等）凭证不生效：登录态在后端所在机器；在后端环境重新登录或配置对应 API key，改完重启会话。
8. macOS 桌面版首次打开报“已损坏”：`xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"`（未签名，官方 issue #16774 跟踪）；不要因此关闭 Gatekeeper。

## 10. 升级与备份

```bash
# 升级（状态在包 / 镜像之外，升级不动数据）
docker pull ghcr.io/openhands/agent-canvas:1.43.0
docker stop <container> && docker run …   # 复用 openhands-data 卷

# 备份状态卷
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'
```

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
