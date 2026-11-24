---
name: swe-af-deploy
description: 在固定提交、最小权限和明确预算下部署或验收 SWE-AF；覆盖 Python 离线测试、Python Compose、Go 节点、单 Issue 委托、恢复、故障与安全边界。用于需要把 AgentField 上的多 Agent 工程队接入软件工厂的场景，不用于自动 merge 或无人值守生产发布。
---

# SWE-AF 部署与验收手册

## 0. 版本合同与证据边界

- 官方仓库：`https://github.com/Agent-Field/SWE-AF`
- 固定提交：`0de536488f279c982fc03f5f5660011a7501e0cb`
- 页面版本：`main@0de5364`；核验日：`2026-11-24`
- 许可证：Apache-2.0。
- 官方没有可用最新 GitHub Release；`pyproject.toml` 的 `0.1.0` 不是本手册声称的 Release。
- 已实测：Python 3.12 隔离安装、`compileall`、核心导入、`pip check`，以及 `2641 passed, 1 skipped`。
- 已知警告：固定的 `claude-agent-sdk==0.1.20` 当前被上游 yanked；安装成功不等于可以忽略此维护风险。
- 未实测：真实模型、AgentField 服务、Docker、Go、Railway、真实 Issue 修复、checkpoint 恢复、PR、CI 修复和 benchmark。
- 官方 PR #179 的 10/10 Issue、217 测试与 $19.23 只属于项目方案例，不得写成本次运行结果。

## 1. 硬性前置检查

按路线准备，不要预装无用运行时：

| 项目 | 要求 | 检查 |
| --- | --- | --- |
| 固定源码 | 必须等于上述提交 | `git rev-parse HEAD` |
| Python 路线 | Python 3.12+ | `python3.12 --version` |
| Go 路线 | 可用 Go 工具链；本手册未实测 | `go version` |
| 容器路线 | Docker 20.10+、Compose 2.0+、BuildKit | `docker version && docker compose version` |
| 控制平面 | AgentField；Python 包要求 `agentfield>=0.1.145` | 固定实际解析版本 |
| 运行时 | AForge / Claude Code / OpenCode / Codex；Command Code 仅 Python | 只安装所选 CLI |
| 端口 | CP 8080；Python 8003/8004；Go 8005/8006 | 确认无冲突且不全网暴露 |
| 工作区 | 专用 `/workspaces` 或显式 `SWE_WORKSPACE_ROOT` | 专用账户可写、有配额 |
| 凭据 | 一个所选模型 provider；GH_TOKEN 仅按需 | 由密钥流程提供，不进 Git |

先创建专用运行账户和目录。不要在含个人 CLI 登录、长期 Token、生产仓库或 Docker socket 的宿主上直接运行完整构建。

```bash
sudo install -d -m 700 -o swe-af -g swe-af /srv/agent-factory
sudo -iu swe-af
cd /srv/agent-factory
git clone https://github.com/Agent-Field/SWE-AF.git vendor/SWE-AF
cd vendor/SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb
test "$(git rev-parse HEAD)" = "0de536488f279c982fc03f5f5660011a7501e0cb"
```

## 2. 路线选择

| 路线 | 适用 | 会产生什么 | 主要边界 |
| --- | --- | --- | --- |
| A · Python 离线核验 | 升级前、依赖审查、CI 预检 | 编译、导入与单元测试证据 | 不证明模型构建或 Go |
| B · Python Compose | 需要官方控制平面与 planner/fast 双节点 | 8080/8003/8004 服务、workspace、artifacts、可选 PR | 高权限、高成本；本手册未启动 |
| C · Go 节点 | 采用 `af install` 当前默认实现 | Go planner/fast，默认 8005/8006 | 本手册未构建；注意 beta engine 默认差异 |
| D · 单 Issue 委托 | 外层已有 planner，只需编码闭环 | 隔离 branch、commits、files_changed、verification | 默认不 push、不开 PR；调用方负责 merge |

先用 A，再选 B/C/D 中唯一所需路线。不要为了“功能齐全”同时启动 Python 和 Go 的同名节点。

## 3. 路线 A：固定源码与 Python 离线核验

本手册实际执行过的命令形态如下。在隔离目录创建虚拟环境，不复用系统 site-packages：

```bash
cd /srv/agent-factory/vendor/SWE-AF
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m compileall -q swe_af
python -m pip check
python -c "import swe_af; import swe_af.app; import agentfield; print(agentfield.__version__)"
```

本次解析到 `agentfield 0.1.146`。保存完整依赖指纹：

```bash
python -m pip freeze > /srv/agent-factory/artifacts/python-requirements.freeze.txt
python --version > /srv/agent-factory/artifacts/python-version.txt
```

运行测试前，确保进程不继承真实模型或 GitHub 凭据。按实际环境清除所有相关变量，不只下面列出的例子：

```bash
env \
  -u ANTHROPIC_API_KEY -u CLAUDE_CODE_OAUTH_TOKEN \
  -u OPENROUTER_API_KEY -u OPENAI_API_KEY -u GOOGLE_API_KEY \
  -u MINIMAX_API_KEY -u INFRON_API_KEY -u RUNCRATE_API_KEY \
  -u CHEAPERINFERENCE_API_KEY -u GH_TOKEN -u EXA_API_KEY \
  .venv/bin/python -m pytest -q | tee /srv/agent-factory/artifacts/pytest.txt
```

通过标准：固定提交正确、安装和导入成功、`pip check` 无 broken requirements、测试无失败。yanked 警告和测试 warnings 必须写入报告，不得删去。

## 4. 路线 B：Python Compose 全栈

> 官方路线；本次未启动。会构建包含多种 Agent CLI 的镜像，可能执行生成代码和 shell。

### 4.1 配置

```bash
cd /srv/agent-factory/vendor/SWE-AF
cp .env.example .env
chmod 600 .env
```

只配置实际使用的一个模型 provider。显式固定运行时，避免 OpenRouter 存在时自动切换到 AForge：

```dotenv
# 示例键名，不是真实值；由本地秘密管理流程写入
SWE_DEFAULT_RUNTIME=open_code
SWE_DEFAULT_MODEL=<该运行时支持的已批准模型>
OPENROUTER_API_KEY=<由秘密管理流程填写>
```

边界：

- `GH_TOKEN` 只用于私库克隆、push 或 PR；本地公开仓库路线保持未设置。
- 若只需 API 模式，不使用 Codex 订阅挂载。官方 Compose 默认挂载 `${HOME}/.codex`，应在不需要时删除该卷，而不是依赖只读或目录权限。
- 容器或远端部署设置 `AGENT_CALLBACK_URL` 为控制平面可达地址；Python planner 默认 `http://swe-agent:8003`。
- `build-db` 是共享临时测试数据库。需要数据库的构建应串行，或改成每构建独立数据库。
- 不挂载 Docker socket，不映射生产目录，不向公网开放无认证控制平面。

### 4.2 启动与健康检查

```bash
docker compose config --quiet
docker compose up -d --build
curl -f http://localhost:8080/api/v1/health
curl -f http://localhost:8003/health
curl -f http://localhost:8004/health
docker compose ps
```

保存非敏感状态与日志；日志可能含秘密，先审查再分享：

```bash
docker compose ps > /srv/agent-factory/artifacts/compose-ps.txt
docker compose logs --no-color swe-agent swe-fast > /srv/agent-factory/artifacts/node.log
```

### 4.3 已批准目标的完整构建

> 下面只是官方 API 形状，本次未执行。完整 build 可能产生数百至数千次模型调用。

```bash
curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.build \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "input": {
    "goal": "Add the already approved authentication change",
    "repo_path": "/workspaces/approved-project",
    "config": {
      "runtime": "open_code",
      "models": {"default": "<approved-model-id>"},
      "max_coding_iterations": 2,
      "max_advisor_invocations": 1,
      "max_replans": 1,
      "max_ci_fix_cycles": 1,
      "enable_learning": false
    }
  }
}
JSON
```

返回 `execution_id` 后查询：

```bash
curl http://localhost:8080/api/v1/executions/<execution_id>
curl http://localhost:8080/api/v1/executions/<execution_id>/notes
```

`completed_with_debt` 不是全部通过。必须审查原始验收条件、失败 / 跳过列表、技术债、分支 diff 和独立 CI。

## 5. 路线 C：Go 节点

> 本环境无 Go 工具链，本手册未执行 Go 构建或测试。

固定源码后显式选择 `//go`，避免未来根 manifest 重定向改变实现：

```bash
cd /srv/agent-factory/vendor/SWE-AF
af install "$PWD//go"
af run swe-planner
curl -f http://localhost:8005/health
```

Go fast 节点默认 8006。与 Python 共用控制平面时必须设置不同 `NODE_ID`；否则双方都注册 `swe-planner` / `swe-fast`。

在独立 Go 环境补充源码核验：

```bash
cd /srv/agent-factory/vendor/SWE-AF/go
GOWORK=off go build ./...
GOWORK=off go vet ./...
GOWORK=off go test ./...
go version > /srv/agent-factory/artifacts/go-version.txt
```

`af install` / Desktop 默认开启 `SWE_PRO_ENGINE=1` 的 beta coding engine；clone、Compose 或裸二进制默认关闭。升级时核对 engine、模型池、回调和 `SWE_PRO_MAX_COST`。Go 不支持 `command_code`。

## 6. 路线 D：单 Issue 委托

适用于上层系统已经完成规划的任务。目标仓库至少有一个提交；未提交修改不会进入 Issue 分支。

```bash
cat > /srv/agent-factory/approved-issue.json <<'JSON'
{
  "input": {
    "issue": {
      "title": "Add bounded retry to fetch_user",
      "description": "Wrap the existing HTTP call with at most three retries.",
      "acceptance_criteria": ["A retry-then-success test passes"],
      "files_to_modify": ["src/api/client.py"],
      "testing_strategy": "pytest tests/api/test_client.py"
    },
    "repo_path": "/workspaces/approved-project",
    "base_branch": "main",
    "config": {
      "runtime": "open_code",
      "models": {"default": "<approved-model-id>"},
      "enable_github_pr": false,
      "max_coding_iterations": 2,
      "agent_timeout_seconds": 900,
      "agent_max_turns": 30
    }
  }
}
JSON

curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \
  -H "Content-Type: application/json" \
  -d @/srv/agent-factory/approved-issue.json
```

验收返回字段：`success`、`outcome`、`branch`、`commits`、`files_changed`、`verification`、`debt_items`。即使 `success=false` 也可能返回有提交的分支；没有提交时分支可能被删除。默认不 push、不创建 PR，调用方检查 diff 后自行合并并运行 CI。

## 7. 恢复、状态与自动化门禁

完整构建状态位于目标仓库 `.artifacts/`：

```text
.artifacts/
├── plan/           # PRD、架构、Issue 规范与规划日志
├── execution/      # checkpoint.json、逐 Issue 状态与 Agent 输出
└── verification/   # 验收条件结果
```

恢复前备份 artifacts、分支与依赖指纹。checkpoint 不冻结旧 runtime；升级后恢复必须传回旧 `config.runtime` 或设置部署覆盖：

```bash
# 官方 reasoner 形状；由控制平面异步调用
# swe-planner.resume_build(repo_path, artifacts_dir=".artifacts", config={
#   "runtime": "<原构建运行时>",
#   "models": {"default": "<兼容模型>"}
# })
```

外层调度器必须：

1. 只接收人工批准的目标或 Issue。
2. 根据是否需要拆解选择 `build` 或 `implement_issue`。
3. 设置 provider 预算、应用层迭代 / 重规划 / CI 上限、并发与进程超时。
4. 保存 execution_id、checkpoint、分支、提交、测试、技术债与成本。
5. 在干净副本独立 CI、扫描密钥与漏洞，再交人工 PR 评审。
6. 永不自动 merge、关闭 Issue 或部署生产。

## 8. 八道验收闸门

- [ ] 提交、节点实现、Python / Go、AgentField SDK、运行时 CLI 和依赖指纹一致。
- [ ] `SWE_DEFAULT_RUNTIME`、请求 `config.runtime`、模型 ID 与 provider 凭据匹配。
- [ ] 控制平面、节点健康和 `AGENT_CALLBACK_URL` 可达；端口未无认证暴露。
- [ ] 模型 key 与 GH_TOKEN 不在 Git、请求体、镜像、日志、checkpoint 或网站中。
- [ ] workspace 按 build_id 隔离，网络、文件、进程、并发、超时和预算有界。
- [ ] PRD、Issue DAG、checkpoint、恢复记录、原始 AC、失败 / 跳过与技术债完整。
- [ ] 分支 diff、生成文件、测试和 CI 修复历史经干净环境复验；未运行 reviewer 不算批准。
- [ ] PR 只由受控流程创建或更新；merge、Issue close 与生产部署由维护者人工决定。

## 9. 故障速查

### 9.1 `go: not found`

本环境真实结果。它不是上游测试失败。安装并固定 Go 工具链后再运行第 5 节命令；在此之前不得声称 Go 路线通过。

### 9.2 `claude-agent-sdk==0.1.20` yanked 警告

本次真实安装警告。保留证据并评估升级；不要静默改依赖。升级后重跑全部 Python 测试和所选运行时烟测。

### 9.3 升级后切换到 AForge / 账单变化

OpenRouter 存在且未显式 runtime 时自动选 AForge；恢复旧 checkpoint 也不冻结 runtime。显式设置 `SWE_DEFAULT_RUNTIME` / `config.runtime`，检查模型和 provider 账单。

### 9.4 `504 agent_unreachable`

检查 `AGENT_CALLBACK_URL` 是否从控制平面容器可达。不要用另一个容器的 localhost，不要关闭 TLS 或主机校验。

### 9.5 双实现注册冲突

Python 与 Go 默认 NODE_ID 相同。只保留一种实现，或设置不同 NODE_ID 并验证调用路由。

### 9.6 Codex `bwrap: No permissions to create a new namespace`

官方说明 Codex workspace-write 需要 Linux user namespaces。使用受控专用环境启用，或改用明确配置的其他运行时；不要改成无限制宿主执行。

### 9.7 构建“完成”但功能缺失

检查 `DAGState.accumulated_debt`、`adaptation_history`、失败 / 跳过列表和最终 `VerificationResult`。带债完成或缩减范围需要维护者重新批准。

### 9.8 恢复后行为变化

检查运行时、模型、SDK、CLI、目标仓库 base commit 与配置是否变化。恢复不是幂等重放；保留旧证据并重新验收。

## 10. 升级、备份与安全红线

升级：

1. 固定旧 / 新提交、节点实现、SDK、CLI、镜像摘要和完整依赖。
2. 检查 manifest 重定向、runtime 自动选择、模型默认、NODE_ID、端口与 beta engine 开关。
3. 用同一小型批准任务对比计划、调用量、技术债、测试、CI、成本与人工结果。
4. 旧 checkpoint 显式使用旧 runtime；新路线通过验收前保留旧环境和分支。

备份：保存 `.artifacts`、平台状态、分支 / 提交、依赖指纹和人工决定；不备份明文密钥。对 workspace、日志和模型原始输出实施限权、脱敏、磁盘配额和保留期。

安全红线：

- worktree 不是系统沙箱；`SWE_FENCE` 可选且只覆盖声明范围。
- 不挂载 Docker socket、生产目录或不必要的 CLI 登录。
- 不把模型 key、GitHub Token 写入 Git、YAML、网站、请求 JSON、日志或 state。
- 不用 skip、xfail、注释测试或放宽断言换取绿色 CI。
- 不自动 merge、不自动关闭 Issue、不自动部署生产。

## 11. 官方来源

- 仓库与许可证：`https://github.com/Agent-Field/SWE-AF`
- 固定提交：`https://github.com/Agent-Field/SWE-AF/commit/0de536488f279c982fc03f5f5660011a7501e0cb`
- README：`https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/README.md`
- 架构：`https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/docs/ARCHITECTURE.md`
- Python 包：`https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/pyproject.toml`
- Go 节点：`https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/go/README.md`
- 部署：`https://github.com/Agent-Field/SWE-AF/blob/0de536488f279c982fc03f5f5660011a7501e0cb/docs/deployment.md`
- 项目方案例：`https://github.com/Agent-Field/agentfield/pull/179`
