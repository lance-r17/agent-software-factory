---
name: scion-deploy
description: 部署并验收 Scion v0.3.0。用于固定 Release 与 tag 提交、核验 SHA256SUMS、准备 Go／Git／容器 Runtime、启动本机 Workstation、配置角色模板与 harness-config、选择隔离 workspace、接入 Hosted Hub，以及落实状态、密钥、备份、成本和人工交付门禁。不用于无授权模型调用、自动 merge、关闭 Issue、删除分支或直接生产发布。
---

# Scion v0.3.0 部署与验收

## 0. 版本合同与证据边界

- 官方仓库：https://github.com/GoogleCloudPlatform/scion
- 固定 Release：`v0.3.0`，发布于 2026-11-11。
- 固定 tag 提交：`7035829be4f38efe1ef43faed34404fbd78141e4`。
- 模块：`github.com/GoogleCloudPlatform/scion`；固定 `go.mod` 声明 `go 1.26.1`。
- 许可证：Apache-2.0，依据固定提交的 `LICENSE`。
- 事实核验日期：2026-11-28。
- 项目仍为 pre-1.0；API、配置、harness 支持和 Runtime 行为可能变化。官方声明它不是正式支持的 Google 产品。
- 本次仅完成 C 级官方文档与源码读取。通过 GitHub API 固定 tag 提交并读取 README、go.mod、Concepts、安装与模板文档、设置样例和 LICENSE。
- 本次真实失败：固定源码浅克隆第一次出现 TLS 握手错误，按上限重试一次后超时，没有可用源码工作区。
- 本次环境：`go` 不存在，Node `20.20.2`，Git `2.39.5`。Git 低于 worktree 路线要求的 `2.48`。
- 未实测：Release 安装、`scion version`／`doctor`／`server start`、Web onboarding、容器 Runtime、真实 Agent、模型、worktree／clone、Hosted／HA、Kubernetes、Cloud Run、benchmark 或生产部署。

本手册中的官方命令不是本站成功记录。只报告实际执行的步骤、输出和未验证项；不得把 CLI 出现、Web 可打开或 Agent `completed` 写成端到端交付通过。

## 1. 硬性前置检查

按路线核对，而不是先执行真实模型任务：

```bash
# 所有路线
uname -s && uname -m
git --version
scion version        # 安装固定 Release 后再执行

# worktree-per-agent：Broker 所在主机必须满足 Git >=2.48.0
# 源码构建：Go >=1.26；固定 go.mod 为 1.26.1
go version

# 本机 Runtime 按实际选择单独检查，不能把客户端存在当作守护进程可用
docker version
podman version
```

准备专用目录，项目、产物、共享交换和秘密流程分开：

```bash
sudo install -d -m 750 /srv/scion/{projects,artifacts,shared,secrets}
# secrets 只表示独立密钥流程边界；不要在这里写入真实 key 后提交或打进镜像
```

真实 Agent 至少还需要：受支持 harness、受控镜像、模型授权、最小权限仓库凭据，以及明确的并发、时长、委派、模型调用和成本上限。默认安装集合包含 Claude 与 Gemini；Codex、OpenCode、Pi、Antigravity 等 opt-in bundle 需逐项核验，不假定功能等价。

## 2. 路线选择

| 路线 | 适用场景 | 主要风险 | 网络／端口 |
| --- | --- | --- | --- |
| A · 固定 Release | 制品、SHA256SUMS、CLI 和前置条件核验 | 架构选错、哈希未验、CLI 成功被过度解释 | 只下载官方 Release |
| B · Workstation | 本机 Hub + Runtime Broker + Web | loopback 暴露、Runtime 与模型凭据 | 官方快速入口 `127.0.0.1:8080/onboarding` |
| C · 角色与 workspace | 模板、技能、隔离工作区和小任务 | 并行污染、远程技能供应链、无界模型成本 | 由 harness、项目与 Runtime 决定 |
| D · Hosted Hub | 单节点或 HA 团队控制面 | 身份、TLS、秘密、Broker 网络和持久状态 | 设置样例 Hub `9810`、Broker `9800`；生产应按实际配置 |

先 A，再 B；只有无模型只读检查和授权通过后才做 C 的小任务。D 必须按单节点／HA 单独设计与验收，不能继承 Workstation 结论。设置样例端口不是 Workstation 的 8080 快速入口。

## 3. 路线 A：固定 Release 与制品核验

在隔离目录选择与宿主架构匹配的制品。以下以 `linux-amd64` 为例，其他架构必须替换文件名并重新核对：

```bash
mkdir -p /tmp/scion-verify && cd /tmp/scion-verify
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/SHA256SUMS
curl -fLO https://github.com/GoogleCloudPlatform/scion/releases/download/v0.3.0/scion-linux-amd64.tar.gz
sha256sum -c SHA256SUMS --ignore-missing

tar -xzf scion-linux-amd64.tar.gz
./scion version
./scion --help
./scion doctor
```

只有校验成功且输出与固定版本一致后，才由维护者决定安装位置。不要把未核验二进制直接放入共享 PATH。`doctor` 的每项输出都要审查；它不能证明模型质量、仓库权限或生产安全。

### 可选：固定源码完整构建

```bash
git clone --branch v0.3.0 --depth 1 https://github.com/GoogleCloudPlatform/scion.git
cd scion
git rev-parse HEAD
# 必须等于 7035829be4f38efe1ef43faed34404fbd78141e4
make all
./build/scion version
```

需要完整 Web UI 时使用官方 Release／Homebrew 或 `make all`。`go install` 只构建 Go 二进制，不构建或嵌入 Web 前端；不能用它安装后的空白 Web UI 推断仓库路由有故障，也不能把 CLI 构建成功写成 Web 验收成功。

## 4. 路线 B：本机 Workstation

官方 README 推荐的社区 Homebrew tap：

```bash
brew tap homebrew-scion/scion
brew install homebrew-scion/scion/scion
scion version
scion doctor
```

启动本机组合服务，保持可信 loopback：

```bash
scion server start
# 浏览器打开官方快速入门：http://127.0.0.1:8080/onboarding
```

onboarding 用于 Runtime 检测、身份、镜像和首个 workspace。逐项确认实际 Runtime、镜像来源、网络与凭据，不直接接受高权限默认值。

在每个已批准 Git 项目中单独初始化：

```bash
git --version                 # worktree-per-agent 要求 >=2.48.0
cd /path/to/approved-project
printf '\n.scion/agents/\n' >> .gitignore
scion init
scion list
```

如果 onboarding 自动完成初始化，不重复制造配置；若需机器模式，先按固定安装文档核对 `scion init --machine` 的输入和写入范围。`.scion` 可能进入项目版本控制，但 worktree、日志和秘密不应误入提交。

## 5. 路线 C：角色模板、harness-config 与 workspace

角色和环境分开：

- 模板目录的 `scion-agent.yaml`、instructions、skills 和模型尺寸别名定义角色。
- settings、Profile 和 harness-config 定义镜像、资源、卷、Runtime、认证、具体模型与运行环境。
- 把 `image` 等环境键写进模板会被忽略并警告；不要用这种漂移假装配置生效。
- Skill Bank／GitHub URI、`provision.py`、MCP、home 文件、符号链接和镜像都属于供应链，必须固定来源并审查。

创建并审查 reviewer 角色：

```bash
cd /path/to/approved-project
scion templates create code-reviewer
scion templates show code-reviewer
scion harness-config list
# 人工审查 .scion/templates/code-reviewer/ 与所选 harness-config 后再继续
```

按隔离需求选择 workspace：

| 模式 | 行为 | 关键限制 |
| --- | --- | --- |
| `shared-plain` | 多 Agent 共享目录 | 没有每 Agent 工作树隔离；写入必须协调 |
| `worktree-per-agent` | 每 Agent 独立 worktree | Git ≥2.48；Kubernetes 不支持 |
| `clone-per-agent` | 每 Agent 独立 clone | Hub 路线注入 `GITHUB_TOKEN`，不是宿主 SSH 私钥 |
| `empty-per-agent` | 私有空目录 | 通过显式 shared dirs 交换文件 |

只在外层批准目标、范围、预算和验收合同后启动小任务：

```bash
scion start reviewer "Review the approved change without merging" --type code-reviewer
scion list
scion logs reviewer
scion message reviewer "Report open questions and verification evidence"
# 需要人工接管时：scion attach reviewer
scion stop reviewer
```

`stop` 默认导致新会话；`suspend`／`resume` 只有在 harness 支持且 Agent home 持久时才可能延续会话。非零崩溃、资源限制、等待输入与离线是不同状态，不得混写为同一失败。

```bash
# 仅在受支持 harness + 持久 home 的小任务中分别验证
scion suspend reviewer
scion resume reviewer
```

删除 Agent 前确认提交已推送、共享文件已保存、问题已回答。`running`、`completed`、`stopped`、`suspended` 都不是测试通过、PR 接受或生产发布证明。

## 6. 路线 D：Hosted Hub

Hosted 管理员必须先按官方单节点／HA 指南完成部署。本路线只给出用户接入形状，不是完整 HA 安装脚本：

```bash
# 仅连接维护者提供的 HTTPS Hub；不要把 token 粘贴进命令、Git 或网站
scion hub add team https://scion-hub.example.com
scion use --hub team
scion whoami
scion project list
scion runtime-broker status
```

单节点 hosted 可使用一个 Hub + SQLite，并接受重启／重部署停机。HA hosted 需要复制 Hub、Postgres、对象存储和负载均衡。两种模式都要明确：

- OAuth／身份提供方、访问策略、TLS、秘密后端和凭据轮换。
- `public_url` 与容器实际使用的 `agent_endpoint`；每个 Broker 管理的 Agent 都必须可达后者。
- 不用明文 HTTP 传播 bearer token 或获取的秘密；生产环境不启用开发认证／`dev_mode`。
- Hub DB、对象存储、Agent home、workspace 和外层 artifacts 分别备份并验证恢复。
- Runtime、挂载、出站网络、模型预算、日志和并发有实际限制。

本站未部署任何 Hosted／HA 组件。完成用户接入不等于后端、身份、存储、Broker 或生产验收通过。

## 7. 状态、自动化与证据门禁

Scion 把容器生命周期 Phase、Agent 活动 Activity 和自由文本 Detail 分开。至少区分：

- Phase：`created`、`provisioning`、`cloning`、`starting`、`running`、`stopping`、`stopped`、`suspended`、`error`、`halted`。
- Activity：`initializing`、`working`、`thinking`、`executing`、`waiting_for_input`、`blocked`、`completed`、`limits_exceeded`、`stalled`、`offline`、`crashed`。
- Detail：当前工具、消息或任务摘要；自由文本不是独立事实证明。

外层自动化只向已注册 Project 分派已批准目标，并选择模板、harness-config、workspace、资源、限制与验收合同。公开文本不得直接获得高权限 Agent、秘密读取或 Hosted 分派能力。

每次运行保存：固定版本与提交、制品哈希、Runtime／镜像／模板／harness-config 指纹、Project／Agent ID、ancestry、状态迁移、消息、分支、提交、模型与工具用量、测试命令、退出状态、成本、未验证项和人工决定。

外层系统仍负责可信 CI、秘密扫描、干净副本复验、PR 审核和授权。只创建或更新 PR；不自动 merge、不关闭 Issue、不删除分支、不直接发布生产。

## 8. 八道验收闸门

1. **版本**：`v0.3.0`、`7035829`、Release 文件名、SHA256SUMS、Go／Git、Runtime、镜像和配置指纹一致且已保存。
2. **安装**：`version`、`help`、`doctor` 和完整 Web UI 均来自实际执行；源码路线使用 `make all`，不混用 `go install` 结论。
3. **服务**：Workstation、Hub、Broker 与实际 Runtime 分别验证；端口、URL、认证和网络路径有真实证据。
4. **角色**：模板、继承、Skill URI、模型别名、harness-config 和配置优先级经过审查；环境键没有误放进模板。
5. **隔离**：workspace 模式、home、shared dirs、挂载、网络和秘密可见性符合批准范围；并行 Agent 不互相覆盖。
6. **状态**：`stop`、`suspend`、`resume`、`error`、`limits_exceeded`、`stalled` 按 harness 和持久 home 条件分别验证。
7. **证据**：分支、提交、共享文件、日志、模型用量、测试、退出状态、成本和未验证项完整保存，停止与恢复路径有效。
8. **交付**：外层干净副本复验和秘密扫描通过后再审 PR；merge、Issue close、Agent 清理、回滚和生产部署由人决定。

## 9. 常见故障

- **源码 clone TLS 失败或超时**：保留错误，网络传输最多重试一次；不关闭 TLS 或主机校验。可改用官方 Release 并核验哈希，不把 API 读取写成源码构建。
- **本机没有 Go 或 Git 过旧**：源码构建准备 Go 1.26+；worktree 准备 Git 2.48+。不要跳过版本检查或把 clone 模式结果套用到 worktree。
- **`go install` 后 Web UI 空白**：这是官方已说明的前端未嵌入边界。改用 Release／Homebrew 或固定克隆 `make all`，不要弱化路由检查。
- **Agent 命令提示没有 Hub**：当前版本所有 Agent 经 Hub 运行，旧无 Hub 本地模式已移除。Workstation 执行 `scion server start`；共享环境选择已批准 Hub。
- **worktree 创建失败或退回 clone**：检查 Broker 主机 Git、workspace 模式和 Runtime；Kubernetes 不支持 worktree。失败时不假定自动回退，按实际状态修复。
- **旧 harness 使用 builtin provisioner**：v0.3.0 文档说明编译进 Go 的 builtin 实现已移除；opt-in bundle 需 `container-script`。按固定文档执行 `harness-config upgrade --activate-script` 或重装，并分别修复项目、Hub、Broker 副本。
- **Agent `offline`、`stalled` 或达到 limits**：先用 `scion look`、`scion logs` 检查 heartbeat、token、事件和限制；`blocked` 是有意等待。按文档 message、resume 或 start，不删除有未推送工作的 Agent。
- **suspend 后会话未延续**：核对 harness resume 支持和 home 持久性；Kubernetes／Cloud Run 临时 home 不满足。跨 Runtime 不复用 Docker 恢复结论。
- **Hosted Agent 无法连接 Hub**：核对 `public_url`、容器侧 `agent_endpoint`、Broker 网络、证书和访问策略；不用关闭 TLS 验证作为修复。

## 10. 升级、备份与成本控制

升级前固定 Scion Release、tag commit、制品哈希、Go／Node／Git、Runtime、镜像、模板和 harness-config 指纹。阅读 Release 与迁移说明，重点检查 builtin provisioner 迁移、配置层级、环境键、模型别名和 Runtime 特定限制。

备份 Hub SQLite／Postgres、对象存储、模板、Agent home、workspace、分支、共享产物和外层 artifacts；不备份明文密钥。定期在隔离副本验证恢复，不能只确认文件存在。

在副本依次重验 CLI、认证、Broker、无模型只读检查、小任务、worktree／clone、消息和 stop／suspend／resume。保留旧制品和证据直到新路线独立通过；生产发布、回滚和 Agent 清理由外层人工流程定义。

限制并发、委派深度、任务时长、模型调用、修复轮次、provider 预算和日志增长。连续失败保留状态并停止自动重试。删除前确认提交已推送、共享文件已保存、未回答问题已处理；`completed` 不是删除或交付依据。

## 11. 安全红线与官方来源

- 不把模型 key、GitHub Token、OAuth secret、broker token、私钥或其他秘密写进模板、YAML、Git、state、日志、快照、网站或容器镜像。
- 不向容器分发宿主 SSH 私钥或长期凭据；使用专用、短期、最小 scope 的秘密注入。
- 不让公开输入直接创建高权限 Agent；不允许多 Agent 无协调共用工作树，不允许无界委派、模型调用、重启或成本。
- 不把 Phase／Activity／Detail、heartbeat、Web 状态或 `completed` 当作可信 CI、质量、安全或人工交付证明。
- 不自动 merge、不关闭 Issue、不删除分支、不直接部署生产；不为通过检查修改上游源码、关闭 TLS 或伪造模型／容器／benchmark 证据。

官方来源：

- https://github.com/GoogleCloudPlatform/scion
- https://github.com/GoogleCloudPlatform/scion/releases/tag/v0.3.0
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/README.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/go.mod
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/concepts.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/getting-started/install.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/docs-site/src/content/docs/local/templates.md
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/settings.yaml.example
- https://github.com/GoogleCloudPlatform/scion/blob/7035829be4f38efe1ef43faed34404fbd78141e4/LICENSE
