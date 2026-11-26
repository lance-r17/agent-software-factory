---
name: loom-deploy
description: 部署并验收 Loom 0.3.0 开放交付 harness。用于固定 main 源码、检查脚本与 Python 算法、安装受支持 coding agent 插件、运行 build／continue／review 交付环和本地 Docker Compose 预览，以及落实 MCP 合同、状态、密钥、恢复、备份和人工交付门禁。不用于无授权模型调用、自动 merge、关闭 Issue 或生产部署。
---

# Loom 0.3.0 部署与验收

## 0. 版本合同与证据边界

- 官方仓库：https://github.com/valkor-ai/loom
- 版本：`package.json` 与 Rust workspace 均为 `0.3.0`。
- 固定研究提交：`fc4c0bab2176e502ddd29677bc2aae0880f5fd5d`，main 快照日期 2026-11-23。
- Release 页面：`v0.3.0`，发布于 2026-09-18；不要把 Release 标签和上述 main 提交混称为同一提交。
- 许可证：Apache-2.0，依据官方仓库与 LICENSE。
- 核验日期：2026-11-26。
- 已实测：固定源码的 shell、插件 JavaScript、测试脚本和 plugin JSON 静态语法通过；隔离 Python 3.12 环境下 7 项算法测试通过，worker 分词冒烟通过。
- 初次测试为 4 通过 / 3 失败，根因是 helper 覆盖子进程 `PYTHONPATH`；使用临时 user-site 共享隔离依赖后重跑为 7 通过，未修改上游源码或测试。
- 未实测：Release 包 SHA-256、官方安装器、CLI、Rust MCP / Cargo、真实模型 build / continue / review / deploy、Docker Compose、benchmark 或生产部署。
- Release 包第一次 HTTP/2 下载以 exit 18 失败，唯一一次 HTTP/1.1 重试以 exit 52 失败；已按重试上限停止，不得继续声称安装验证成功。

不得把官方功能、工具注册表、本手册命令或图形化交付状态写成“已运行成功”。只报告实际执行的步骤、输出和未验证项。

## 1. 硬性前置检查

正常交付至少需要一个受支持 coding agent：Codex、Claude Code 或 OpenCode。算法要求 Python ≥ 3.11；本地源码构建需要 Rust；`loom deploy` 还需要 Docker。

```bash
python3 --version             # 算法：>= 3.11；本次为 3.12
rustc --version || true       # 本地构建 / Cargo 测试需要；本次缺失
cargo --version || true
node --version || true        # 插件 JS 静态检查
git --version
docker --version || true      # 仅本地 deploy preview 需要
docker compose version || true
```

准备目录，并把它们交给专用账户：

```bash
sudo install -d -m 750 /srv/loom/{vendor,workspaces,artifacts,secrets}
# /srv/loom/secrets 只作为独立密钥流程边界，不放真实 key 进 Git、容器或网站
```

官方用户级运行时位于 `~/.loom`；每个目标项目的交付状态位于 `<project>/.loom/`。不要手工编造项目状态，`build` 会按需初始化。

## 2. 路线选择

| 路线 | 适用场景 | 主要风险 | 网络 / 端口 |
| --- | --- | --- | --- |
| A · 离线源码 | 固定提交、静态语法、Python 算法测试 | 不证明 Release、Rust 或交付质量 | 仅获取源码与依赖 |
| B · 官方插件 | Release 安装、MCP 注册、只读 status | 安装脚本与包来源、宿主 Agent 凭据 | 下载 Release；无手工 MCP 端口 |
| C · 交付与恢复 | build、continue、review、TaskResult 证据 | 模型成本、仓库写权限、敏感状态 | 由 Agent / 项目决定 |
| D · 本地预览 | Loom 生成并验证 Docker Compose preview | 容器环境、日志、秘密与生产边界误读 | 由生成的项目拓扑决定 |

先 A，再 B；只读 `status` 通过后才开放 C 的小范围写权限。D 仅用于本地预览，绝不继承为生产部署能力。

## 3. 路线 A：固定源码离线核验

不需要模型或 GitHub 凭据。

```bash
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
```

隔离算法依赖。测试 helper 会把子进程 `PYTHONPATH` 覆盖为 `src/python`，因此额外准备临时 `PYTHONUSERBASE`，让父子进程都能找到相同依赖：

```bash
python3 -m pip install --target /tmp/loom-pydeps \
  pytest jieba rank-bm25 scikit-learn
mkdir -p /tmp/loom-pyuser/lib/python3.12/site-packages
cp -a /tmp/loom-pydeps/. /tmp/loom-pyuser/lib/python3.12/site-packages/
PYTHONUSERBASE=/tmp/loom-pyuser \
  PYTHONPATH=/tmp/loom-pydeps:/tmp/loom-fc4c0ba/src/python \
  PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -q tests/python
```

本次最终结果：`7 passed`。worker tokenize 冒烟也返回 `ok: true` 和预期 tokens。若你的 Python 小版本不同，应使用对应的 user-site 路径，并保存实际版本和依赖指纹；不要通过修改测试或删除依赖制造通过。

如具备 Rust，可另行执行官方测试：

```bash
npm run rust:test:full
# 或：cargo test --manifest-path src/rust/Cargo.toml
```

本次没有 Rust 工具链，以上 Cargo 路线未执行。不能用 Python 测试替代 Rust 构建结论。

## 4. 路线 B：官方插件与只读冒烟

官方安装器会检测 OS / CPU，下载匹配 Release，校验 `.sha256`，安装 Rust MCP 和隔离 Python runtime，写 Agent MCP 注册、刷新插件并运行 `loom-setup doctor`。

先在隔离环境下载并审查脚本，再决定是否执行：

```bash
curl -fsSL https://github.com/valkor-ai/loom/releases/latest/download/install.sh \
  -o /tmp/loom-install.sh
bash -n /tmp/loom-install.sh
less /tmp/loom-install.sh
# 明确批准安装到当前机器后：
bash /tmp/loom-install.sh --agent codex
# 也可使用 --agent claude-code、--agent opencode 或 --agent all
```

本地修复后的源码验证路线是：

```bash
./install.sh --agent codex --local-build
```

这条路线会构建 Rust MCP 与 setup binary、生成 Release 布局并安装；本次未执行。安装或升级后打开目标项目的新 Agent 会话，再运行：

```text
@loom status     # Codex
/loom status     # Claude Code / OpenCode
```

新项目返回 `STATE_NOT_INITIALIZED` 是有效冒烟结果：插件可用且尚未开始交付。正常由 Agent MCP 注册启动 Rust server，用户不手工启动或常驻另一个 MCP server。

模型登录保留在所选 Agent 的凭据流程中。模型 key 与 GitHub Token 不进入 `.loom/`、YAML、Git、日志、state、快照或容器。

## 5. 路线 C：真实交付、评审与恢复

只有完成授权、插件冒烟和小范围无写任务后，才在目标项目运行真实交付。以下是 Agent 内命令，不是 shell 命令：

```text
@loom build Add a team settings page
@loom continue
@loom review
```

Claude Code / OpenCode 使用：

```text
/loom build Add a team settings page
/loom continue
/loom review
```

交付顺序：

1. 澄清并确认范围；可选知识源只是澄清辅助，不自动成为需求。
2. 建立 repository context、technical baseline、planning contract 与 architecture artifact。
3. 任务计划声明所有权、`requestReadPlan`、字段组、写入边界、验证意图与结果模板。
4. Agent 执行有界任务，只写合同允许的代码和 `outputContract.resultFile`。
5. 通过 `loom.recordTaskResultFile` 提交 TaskResult，由 Loom 校验、规范化、持久化并返回下一动作。
6. review 根据结构化信号路由代码、任务计划、架构修复或人工 review；更新后必须重新验证。
7. 中断、换会话、工具成功但未继续时优先 `continue`，不要凭聊天记忆重建状态。
8. `completed` 仍需外层干净副本复验、可信 CI、秘密扫描和人工接受。

本次未配置模型，也未执行这些交付命令。真实调用可能产生费用和仓库变更，必须设置任务数、修复轮次、超时和 provider 预算上限。

## 6. 路线 D：本地 Docker Compose 预览

前置：插件已验证，项目已有可检查的交付状态，Docker 已安装且当前用户获得明确授权。

```text
@loom deploy     # Codex
/loom deploy     # Claude Code / OpenCode
```

Loom 的 MCP 工具面包含 `deployPrepare`、`deployRun`、`deployUp`、`deployStatus`、`deployInspect`、`deployValidate`、`deployLogs`、`deployBootstrap`、`deployDown` 和 `deployRepair`。按返回的 next action 操作，不绕过状态机编造预览结果。

验收时检查：

1. Compose 拓扑、项目根和写目标来自当前交付状态。
2. 环境规则、运行事实、端口、日志与 `fullLogRef` 可追踪。
3. readiness、validate 与失败日志来自真实命令；修复后重新验证。
4. 容器内无模型 key、GitHub Token、宿主 home 或无关凭据。
5. 停止与清理前备份需要保留的 `.loom/` 和外层 artifacts；不把销毁命令当普通重启。

**当前 deploy 只支持本地 Docker Compose preview，不支持生产部署。** 公网发布另需生产架构、HTTPS、认证、秘密管理、可信 CI、制品审查、监控、备份、回滚和人工批准。本次未运行 Docker 或 deploy。

## 7. MCP 合同与自动化门禁

核心合同形状（按固定源码简化，不是独立 JSON 文件模板）：

```text
Request manifest {
  requestReadPlan: { groups: [{ selectors, purpose, whenToRead }] },
  outputContract: { writeTargets, resultFile },
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
```

`readFieldGroup` 只展开声明的 selectors；紧凑诊断不足时才按 `fullLogRef` 读取完整日志。`deliveryGraph(projectRoot)` 返回 `nodes`、`edges` 和 `mermaid`，只读 `.loom/`，不修改状态，也不重跑检查。它是交付证据图，不是代码调用图；缺失阶段应保留部分图。

外层自动化只提交已批准目标，并负责：

- 选择受支持 Agent、固定 Loom 提交、项目范围、模型与预算。
- 限制实际仓库、工具、网络、进程与容器权限；请求清单本身不是沙箱。
- 保存 changedFiles、验证命令及顺序、退出状态、fullLogRef、未验证项、评审与修复历史。
- 连续失败或无法验证时停止自动重试，保留状态并升级人工。
- 只有受控授权流程才能创建或更新 PR；维护者拥有 merge、Issue close 和生产发布。

本地 SVG exporter 可用以下官方源码命令，但需要 Rust，且不包含在 Release 安装器中：

```bash
cargo run --manifest-path src/rust/Cargo.toml -p mcp-server \
  --bin loom-delivery-graph -- /absolute/path/to/project /tmp/delivery.svg
```

本次未执行该 exporter。

## 8. 八道验收闸门

1. **版本**：0.3.0、fc4c0ba、Agent 插件、Release SHA、Rust / Python 和算法依赖指纹一致且已保存。
2. **安装**：Release 校验、doctor 和新会话只读 status 独立通过；`STATE_NOT_INITIALIZED` 解释正确。
3. **合同**：selectors、writeTargets 和 resultFile 不越界；TaskResult 由对应 MCP 工具提交。
4. **证据**：changedFiles、命令顺序、退出状态、runtime evidence、fullLogRef 与 unverifiedItems 符合实际执行。
5. **恢复**：中断后新会话 `continue` 从 `.loom/` 找到真实下一动作，不重复完成任务或伪造状态。
6. **修复**：review findings 路由明确，轮次与预算有界，更新后重跑失败检查和必要回归。
7. **隔离**：密钥不进入 `.loom`、YAML、Git、日志、快照或容器；本地 preview 与生产严格分离。
8. **交付**：外层干净副本复验和秘密扫描通过后再审 PR；merge、Issue close、生产部署由人决定。

## 9. 常见故障

- **Release 下载失败**：保留 exit 18 / 52 等真实错误和重试次数；不要声称 SHA 或 CLI 已通过。网络恢复后在新隔离目录重新核验官方包。
- **pytest worker 子进程失败**：检查 helper 是否覆盖 `PYTHONPATH`；用临时 `PYTHONUSERBASE` 共享隔离依赖，不修改测试来隐藏问题。
- **rustc 不存在**：只报告源码与 Python 证据；安装受支持 Rust 后再跑 Cargo，不把算法结果写成 MCP 成功。
- **安装后看不到命令**：打开新的 Agent 会话加载插件和 MCP 注册，再运行只读 status；不要手工常驻第二个 server。
- **STATE_NOT_INITIALIZED**：新项目可为正常结果；从 build 按需初始化，不手工编造状态。
- **流程中断或重复**：保留 `.loom/` 并运行 continue，检查 TaskResult 与未完成项，按 next action 推进。
- **预览失败**：查看 deployStatus / Inspect / Validate / Logs 和修复边界；不要把本地 preview 当生产，也不要注入更多秘密“试试”。
- **状态或索引误删**：区分 uninstall 和 purge；先验证备份，再执行清理。purge 不是普通卸载。

## 10. 升级、备份与安全红线

升级前固定 Loom commit、Release、插件、Agent / 模型 ID、Rust / Python、算法依赖和 OS / CPU 包指纹。阅读 Release 与迁移说明，备份项目 `.loom/` 和用户级运行时，在副本中验证兼容，再依次重验 Release SHA、doctor、status、小型 build、continue、review 和本地 preview。

备份项目 `.loom/`、外层 artifacts、依赖指纹和人工决定，不备份明文密钥。需求、源码路径、模型输出、运行事实、截图和日志可能含秘密，需要限权、脱敏、加密和保留期。

安全红线：

- 不把模型 key 或 GitHub Token 写进 `.loom/`、YAML、Git、日志、state、快照、网站或容器。
- 不把请求清单、内部 review、deliveryGraph 或 `completed` 当作独立安全证明。
- 不允许无界仓库写入、无界修复循环、连续自动重试或未授权模型调用。
- 不自动 merge、不关闭 Issue、不删除分支、不把本地 Compose preview 当生产部署。
- 不为了通过检查修改上游测试、删除依赖、关闭 TLS 或伪造 Release / Rust / Docker 证据。

## 11. 官方来源

- https://github.com/valkor-ai/loom
- https://github.com/valkor-ai/loom/releases/tag/v0.3.0
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/README.md
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/Cargo.toml
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/python/algorithms/pyproject.toml
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/mcp-server/tool_registry.rs
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/src/rust/execution/task_execution.rs
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/docs/delivery-graph.md
- https://github.com/valkor-ai/loom/blob/fc4c0bab2176e502ddd29677bc2aae0880f5fd5d/install.sh
