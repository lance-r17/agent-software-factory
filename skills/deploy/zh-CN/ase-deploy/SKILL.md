---
name: ase-deploy
description: 部署并验收 Agentic Software Engineering（ASE）2.1.6。用于固定 Release 与提交、隔离安装 npm 包、核验 Node 22.22 CLI、安装受支持 Agent 插件、运行命名任务与可选 Agent Fleet，以及落实 Task Store、密钥、工作副本、预算、备份和人工交付门禁。不用于无授权模型调用、自动 merge、关闭 Issue 或生产部署。
---

# ASE 2.1.6 部署与验收

## 0. 版本合同与证据边界

- 官方仓库：https://github.com/rse/ase
- 固定 Release：`2.1.6`。
- 固定 tag 提交：`8c1c95952edc75cb8d4fe5a87efecbdb1267680a`。
- 另观察到更新 master：`5420d8966eab96bc9bfd4f205029dc14de5b99e8`；不得与上述 Release 混写为同一提交。
- 包名：`@rse/ase`；主包要求 Node `>=22.22.0`、npm `>=10.0.0`。
- 许可证：Apache-2.0，依据固定提交 `LICENSE.txt`。
- 核验日期：2026-11-27。
- 已实测：隔离安装发布包，共加入 790 个包；临时 Node 22.22.0 下 `ASE 2.1.6`、顶层帮助、Fleet 帮助、`setup mcp list` 成功；临时 Git 仓库中的 enterprise `fleet init` 成功生成 `.ase/fleet.yaml`。
- 首次 `fleet init` 因没有项目上下文失败；在临时目录 `git init` 后重跑成功，未修改上游源码。
- 宿主 Node 为 20.20.2，不满足主包要求；`@gitbeaker/rest@44.1.10` 另声明 Node `>=24.16.0`，GitLab 路径未实测。
- 未实测：宿主插件安装、真实模型任务、可选付费服务、MCP / Task Store / relay 启动、Fleet start、真实 Issue 修复、benchmark 或生产部署。

不得把官方功能、配置生成、本手册命令或任务状态写成“端到端已运行成功”。只报告实际执行的步骤、输出和未验证项。

## 1. 硬性前置检查

正常交互使用至少需要一个受支持 Agent：Claude Code 是主目标，GitHub Copilot CLI 和 OpenAI Codex CLI 是 reduced support，不能假定三种 harness 功能等价。

```bash
node --version       # >=22.22.0；若有 GitLab 集成，另行核对依赖 engines
npm --version        # >=10.0.0
git --version
claude --version || true
```

准备专用目录并限制权限：

```bash
sudo install -d -m 750 /srv/ase/{workspaces,worktrees,artifacts,secrets}
# secrets 只表示独立密钥流程边界，不放真实 key 进 Git、容器或网站
```

默认任务存储为项目内 `./.ase/task`，不需要服务器。Fleet 配置为 `.ase/fleet.yaml`，运行状态和日志位于 `.ase/agent/`。用户级配置和状态可用 `ASE_CONFIG_DIR`、`ASE_STATE_DIR` 隔离。

## 2. 路线选择

| 路线 | 适用场景 | 主要风险 | 网络 / 端口 |
| --- | --- | --- | --- |
| A · 发布包核验 | 固定版本、安装、CLI、MCP list、Fleet init | 主 CLI 通过不代表所有集成兼容 | 获取 npm 包与临时 Node |
| B · 官方插件 | 注册插件、hooks、skills 与 MCP | Agent 配置写入、模型和可选服务凭据 | 由 Agent 与可选 MCP 决定 |
| C · 命名任务 | 备选计划、grill、draft、实现与集成 | 模型成本、Git 写权限、敏感附件 | 由项目与外部服务决定 |
| D · Agent Fleet | 多角色 relay、监督、重启和阶段推进 | 并发污染、重启成本、日志与全项目 token | relay / Task Store 需独立治理 |

先 A，再 B；只读注册检查通过后才开放 C 的小范围写权限。D 只在独立工作副本、预算、人工资格门禁和停止路径明确后启用。

## 3. 路线 A：固定 Release 隔离核验

不需要模型或 GitHub 凭据。以下路径均为临时核验目录：

```bash
node --version
npm view @rse/ase@2.1.6 version dist.tarball engines
npm install --prefix /tmp/ase-verify \
  --ignore-scripts --no-audit --no-fund @rse/ase@2.1.6
ASE=/tmp/ase-verify/node_modules/@rse/ase/bin/ase

npx --yes --package node@22.22.0 node "$ASE" --version
npx --yes --package node@22.22.0 node "$ASE" --help
npx --yes --package node@22.22.0 node "$ASE" agent fleet --help
npx --yes --package node@22.22.0 node "$ASE" setup mcp list
```

在临时测试仓库生成 enterprise 配置，不启动 Agent：

```bash
mkdir -p /tmp/ase-verify/project
cd /tmp/ase-verify/project
git init -q
npx --yes --package node@22.22.0 node "$ASE" agent fleet init --lifecycle enterprise
test -s .ase/fleet.yaml
```

检查结果至少包括：

```bash
grep -nE '^(rebooter|condenser|griller|researcher|implementer|qualifier|integrator|editor|estimator):' .ase/fleet.yaml
grep -A3 '^qualifier:' .ase/fleet.yaml
```

本次确认包含 enterprise 角色，`qualifier.mode=judge` 保留人类资格决定。以上命令不证明真实 Fleet、模型质量、生产安全或所有依赖集成都通过。

若需要源码级复核，应单独 clone 并固定完整提交；不要把 master 的新文件或技能数量套用到 2.1.6。

## 4. 路线 B：官方插件与只读状态检查

先确认 Node / npm、安装包来源和 scope，再明确批准修改 Agent 配置：

```bash
npm install -g @rse/ase@2.1.6
ase setup install --tool claude --scope project
ase setup status --tool claude
ase setup mcp list
```

也可按官方范围选择 `user`、`project` 或 `local`。Copilot / Codex 分别使用 `--tool copilot`、`--tool codex`，但需逐项验证 reduced support，而不是复用 Claude Code 的验收结论。

安装或升级后打开新的 Agent 会话，使插件、hooks、skills 和 MCP 注册生效。`ase setup status` 是只读检查，覆盖各 scope 的插件、MCP、输出风格、hooks、statusline 和 telemetry 注册。

模型登录留在 Agent 自己的凭据流程。可选外部模型 / 搜索 MCP 可能收费，应逐项审查用途、数据出站、费用和密钥，不因为 `setup mcp list` 成功就激活。

## 5. 路线 C：命名任务、draft 与真实实现

只有完成授权、插件冒烟和小范围无写任务后，才在目标项目运行真实模型任务。以下是 Claude Code 会话内命令，不是 shell 命令：

```text
/ase-task-edit -A team-settings: "Add an approved team settings page"
/ase-task-grill team-settings
/ase-task-implement --draft team-settings
/ase-task-integrate --draft team-settings
```

先审查计划与 draft。确认范围、依赖、测试、Source / Changeset / Target 和预算后，才进行真实实现：

```text
/ase-task-implement team-settings
/ase-task-view team-settings
```

官方 CLI 可用 `ase task board` 或 `ase task board --web` 观察任务。看板用于观察，不是质量证明。

推荐顺序：

1. 用命名任务和备选方案漏斗明确目标，不直接跳到无界补丁。
2. grill / research 暴露开放决定、证据缺口和风险，人确认范围。
3. 记录 After、Effort、Source、Changeset、Target 和验收合同。
4. 先生成 draft 附件并审查，再允许真实工作副本变更。
5. 测试和评审后进入资格门禁；默认 judge 不替人决定。
6. 集成后重跑必要检查，保存任务、附件、成本和日志。
7. 外层干净副本复验、可信 CI、秘密扫描与人工 PR 审核后才交付。

本次未配置模型，也未执行以上真实任务命令。真实调用可能产生费用和仓库变更，必须设置并发、任务时间、修复轮次和 provider 预算上限。

## 6. 路线 D：Agent Fleet

前置：插件和命名任务已在独立环境验证，真实模型与仓库权限获得明确批准，所有 Agent 有独立工作副本。

```bash
cd /path/to/approved-project
ase agent fleet init -t claude --lifecycle enterprise
```

先审查 `.ase/fleet.yaml`：

- `relay` 的地址、端口、TLS 与 token 来源。
- `default.tool`、`model`、`parallel`、`timeout`、`budget`、`repo`、`tempdir`。
- enterprise 角色 `rebooter`、`condenser`、`griller`、`researcher`、`implementer`、`qualifier`、`integrator`、`editor`、`estimator`。
- `implementer` 默认并行 2；`qualifier.mode=judge` 默认只给判定，资格状态由人决定。
- `integrator.mode` 可为 merge、rebase 或 squash，需符合外层交付策略。

获得真实运行授权后才执行：

```bash
ase agent fleet start
ase agent fleet status
ase agent fleet log -f
ase agent fleet stop
```

Fleet 为每个成员启动独立进程和进程组，并在退出后重启，连续重启退避最高到 5 分钟。终止时先停 Agent，把处理中任务放回，再停 relay。被强制杀死的 Fleet 可能留下孤儿成员，下次 start 或 stop 会依据运行状态处理。

**一个 Git working copy 只应被一个 Agent 直接使用。** 其他 Agent 配置 `repo` 或独立 `cwd` / worktree，不要依靠任务状态协调并行文件写入。

本次只执行 `fleet init`，没有执行 `start`、真实 `status`、日志跟踪或运行中的 `stop`。

## 7. Task Store 与自动化门禁

任务 JSON 由 `header`、`body`、`attachment` 组成。默认 `ase:./.ase/task` 在客户端进程内运行内置存储；独立 Task REST server 与 `ase service` 的 `/mcp`、`/command` 服务分开。

```bash
# 默认保持 loopback；端口随机分配并持久化，token 未提供时自动生成
ase task store start
ase task store status
ase task store stop
```

远程模式必须理解：

- 每个请求都要求 bearer token；有效 token 持久化在用户级 `store.yaml`。
- token 授予所有项目的完整访问权，没有按项目或操作的细粒度授权。
- 非 loopback 部署应使用 TLS，可用官方证书参数或 loopback + TLS 反向代理。
- 浏览器跨域需显式 CORS origin；WebSocket 以 token 查询参数认证，因此更要防止 URL 和日志泄漏。
- 客户端使用 `ase://` / `ases://` 配置；不要把 `?insecure` 当作常规证书方案。

条件保存使用 ETag / If-Match。412 后按 header key、Markdown body section 和 attachment 合并；同一部分冲突必须人工处理，不得直接 force 覆盖。

外层自动化只提交已批准任务，并负责：

- 选择 Agent、生命周期、任务 ID、项目范围、模型和预算。
- 限制实际仓库、工具、网络、进程与容器权限；任务字段不是沙箱。
- 保存 diff、验证命令及顺序、退出状态、usage、未验证项、评审和人工决定。
- 连续失败或无法验证时停止自动重试，保留状态并升级人工。
- 只有受控授权流程才能创建或更新 PR；维护者拥有 merge、Issue close 和生产发布。

## 8. 八道验收闸门

1. **版本**：2.1.6、8c1c959、npm tarball、Node / npm、Agent / 插件 scope 和依赖指纹一致且已保存。
2. **安装**：CLI、setup status 和 MCP list 来自实际执行；主包与所有实际集成的 engines 均满足。
3. **任务**：项目 ID、任务 ID、生命周期、After、Source / Changeset / Target、附件和 ETag 正确。
4. **证据**：diff、测试、命令顺序、退出状态、usage、日志和未验证项符合实际执行。
5. **隔离**：并行 Agent 使用独立工作副本；条件保存失败和冲突不会被静默覆盖。
6. **资格**：默认 judge 判定由人审阅，资格后再集成；集成后仍重跑必要检查。
7. **Fleet**：并发、超时、预算、重启和日志有上限，status / log / stop 与孤儿进程路径经过验证。
8. **交付**：外层干净副本复验和秘密扫描通过后再审 PR；merge、Issue close、生产部署由人决定。

## 9. 常见故障

- **Node 版本过低**：核对主包和实际依赖 engines；不要隐藏 GitBeaker 警告，也不要把临时 Node 22 主 CLI 成功扩展为 GitLab 兼容结论。
- **fleet init 报 no project context**：在已批准 Git 项目根执行；本次临时目录 `git init` 后成功。不要为绕过检查随意初始化真实仓库。
- **安装后技能或 hooks 不可见**：检查 setup status 和 scope，打开新 Agent 会话；不同 harness 逐项验证。
- **任务保存 412**：保留 base 和最新版本，按部分合并并使用新 ETag 条件保存；同部分冲突人工解决。
- **远程看板 401 / CORS 失败**：核对 bearer token 和显式 origin；token 有全项目权限，泄露后立即轮换并审查所有项目。
- **非 loopback 明文服务**：保持 loopback + TLS 代理，或配置官方 TLS；不要关闭证书校验来掩盖配置问题。
- **Fleet 反复重启**：先用 foreground 小范围验证，检查模型、配置、repo / cwd、预算与日志；必要时 stop，并处理孤儿成员。
- **多 Agent 相互污染**：一个工作副本只给一个 Agent 直接使用，其他成员使用 repo 或独立 cwd / worktree。
- **误把 INTEGRATED 当发布**：它只是内部任务状态；仍需外层 CI、秘密扫描、PR 审核和人工 merge。

## 10. 升级、备份与安全红线

升级前固定 ASE Release、tag commit、npm 包、Node / npm、Agent / 模型 ID、插件 scope、可选 MCP 和依赖指纹。阅读 Release 与迁移说明，备份 `.ase` 任务、附件、Fleet 配置、用户级配置和外层 artifacts，在副本依次重验 CLI、setup status、小型任务、条件保存、看板与 Fleet 生命周期。

备份任务、附件、依赖指纹和人工决定，不备份明文密钥。需求、diff、模型输出、usage、截图、`store.yaml` 和 Fleet 日志可能含秘密，需要限权、脱敏、加密和保留期。

安全红线：

- 不把模型 key、GitHub Token、relay token 或 Task Store token 写进 YAML、Git、任务附件、日志、state、快照、网站或容器。
- 不把任务状态、qualifier=judge、看板或 INTEGRATED 当作独立安全或质量证明。
- 不允许多 Agent 无协调共用工作副本，不允许无界重启、修复、模型调用或成本。
- 不自动 merge、不关闭 Issue、不删除分支、不直接部署生产。
- 不为了通过检查修改上游源码、隐藏 engines 警告、关闭 TLS 或伪造模型 / Fleet / benchmark 证据。

## 11. 官方来源

- https://github.com/rse/ase
- https://github.com/rse/ase/releases/tag/2.1.6
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/README.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/tool/package.json
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/docs/building-blocks.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/docs/task-api.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/tool/man/ase-agent-fleet.md
- https://github.com/rse/ase/blob/8c1c95952edc75cb8d4fe5a87efecbdb1267680a/LICENSE.txt
