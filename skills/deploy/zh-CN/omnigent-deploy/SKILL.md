---
name: omnigent-deploy
description: 部署并验收 Omnigent v0.23.0 多 Agent 元 harness。用于固定官方包与源码、选择本地或 Docker 服务、配置异构编码 harness、运行 Polly 并行 worktree 与跨供应商评审示例，以及落实密钥、策略、沙箱、备份和人工 merge 门禁。不用于无授权模型调用、自动合并或生产发布。
---

# Omnigent v0.23.0 部署与验收

## 0. 版本合同与证据边界

- 官方仓库：https://github.com/omnigent-ai/omnigent
- 固定 Release：`v0.23.0`，发布于 2026-11-19。
- 固定提交：`033963227a3b54803ae00c5ef0f0f6fe97f5549d`。
- 许可证：Apache-2.0，依据 GitHub 仓库元数据。
- 核验日期：2026-11-25。
- 已实测：Python 3.12 隔离安装官方 wheel，`omnigent`、`omnigent-client`、`omnigent-ui-sdk` 均为 0.23.0；`pip check`、固定源码 `compileall`、核心导入、`omnigent` / `omni` CLI 和 Polly 严格规格解析通过。
- 未实测：模型调用、服务启动、Docker、云沙箱、真实 Issue、fanout、跨供应商评审、PR、benchmark 或生产部署。

不得把官方功能描述、Polly 示例或本手册命令写成千变一律的“已运行成功”。只报告你实际执行的步骤和输出。

## 1. 硬性前置检查

核心包要求 Python 3.12+。官方推荐 `uv tool install`，也可使用 `pip`。

```bash
python3.12 --version
git --version
uv --version || true
node --version || true   # 需要本地编码 harness CLI 时，官方要求 Node 22 LTS+
pnpm --version || true   # 构建 Web UI 时
tmux -V || true          # 原生终端 harness
bwrap --version || true  # Linux 原生终端 / Pi 沙箱
docker --version || true
docker compose version || true
```

根据路线安装缺失依赖，不要为了启动而关闭沙箱或改用不受控宿主执行。Windows 原生模式不提供与 bwrap / seatbelt 相同的文件和网络隔离。

准备目录：

```bash
sudo install -d -m 750 /srv/omnigent/{vendor,agents,workspaces,artifacts,secrets}
# 将目录交给专用服务账户；不要把 secrets 放进 Git、镜像或网站
```

## 2. 路线选择

| 路线 | 适用场景 | 主要风险 | 默认端口 |
| --- | --- | --- | --- |
| A · 离线核验 | 验证包、CLI、固定源码和 Agent 规格 | 不证明模型或交付质量 | 无 |
| B · 本地控制层 | 单机评估 CLI、Web UI 与执行 harness | 执行发生在本机，凭据与 workspace 暴露 | 6767 |
| C · Docker 服务 | 团队服务、Postgres 与持久 artifacts | 认证、HTTPS、数据库迁移与卷备份 | 8000 |
| D · Polly 示例 | 并行实现、独立评审、PR 交付 | 多模型成本、写冲突、供应商能力差异 | 继承所选服务 |

先 A，再 B 或 C；只有在无写权限的小任务通过后，才开放 D 的实现权限。

## 3. 路线 A：固定版本离线核验

不需要模型或 GitHub 凭据。

```bash
python3.12 -m venv /tmp/omnigent-v023-venv
/tmp/omnigent-v023-venv/bin/python -m pip install \
  --only-binary=:all: omnigent==0.23.0
/tmp/omnigent-v023-venv/bin/python -m pip check
/tmp/omnigent-v023-venv/bin/omnigent --version
/tmp/omnigent-v023-venv/bin/omni --version
/tmp/omnigent-v023-venv/bin/omnigent run --help
/tmp/omnigent-v023-venv/bin/omnigent server --help

git clone --depth 1 --branch v0.23.0 \
  https://github.com/omnigent-ai/omnigent.git /tmp/omnigent-v0.23.0
cd /tmp/omnigent-v0.23.0
test "$(git rev-parse HEAD)" = "033963227a3b54803ae00c5ef0f0f6fe97f5549d"
/tmp/omnigent-v023-venv/bin/python -m compileall -q omnigent
```

严格解析 Polly，不展开服务端环境变量，并启用策略 handler allowlist：

```bash
/tmp/omnigent-v023-venv/bin/python - <<'PY'
from pathlib import Path
from omnigent.spec import load
spec = load(
    Path('/tmp/omnigent-v0.23.0/examples/polly'),
    expand_env=False,
    enforce_handler_allowlist=True,
)
assert spec.name == 'polly'
assert len(spec.sub_agents) == 7
print('Polly spec: passed; sub-agents:', ', '.join(a.name for a in spec.sub_agents))
PY
```

本次结果：以上安装、依赖、编译、CLI 和规格检查通过。首次从本地源码安装完整依赖超时，随后改用同版本官方 PyPI wheel 成功；不要删除依赖来掩盖安装问题。

## 4. 路线 B：本地控制层

### 4.1 安装与模型配置

```bash
uv tool install --python 3.12 'omnigent==0.23.0'
omnigent --version
omnigent setup
```

`setup` 只配置实际使用的 provider。真实 key 由交互式密钥流程或本地密钥管理提供，不写进 Agent YAML、命令行、Git、日志或本手册。

官方默认启用匿名遥测。阅读官方 Usage Telemetry 说明，按组织政策选择退出；不要声称遥测不包含任何数据，只按官方范围判断。

### 4.2 启动已审核 Agent

```bash
git clone --depth 1 --branch v0.23.0 \
  https://github.com/omnigent-ai/omnigent.git
cd omnigent
omnigent run examples/polly/
```

本地服务和 Web UI 默认使用 `127.0.0.1:6767`。另开终端检查：

```bash
omnigent server status
curl -f http://127.0.0.1:6767/v1/info
```

只转发当前会话需要的变量名：

```bash
OMNIGENT_SESSION_ENV_PASSTHROUGH=TERMINAL_PANE_SOCKET \
  omnigent run examples/polly/
```

不要把所有宿主环境变量传入 runner。普通停止：

```bash
omnigent stop
```

## 5. 路线 C：Docker 服务

官方栈包含 Omnigent Server 和 Postgres，并使用持久 artifact 卷。Compose 默认启用账号认证。

```bash
cd deploy/docker
./bootstrap.sh
chmod 600 .env
docker compose config --quiet
docker compose up -d
docker compose logs -f omnigent
curl -f http://localhost:8000/v1/info
```

首次启动在 Web UI 创建管理员，不要把管理员密码写进 Git。公网部署至少完成：

1. 配置 HTTPS 与 `OMNIGENT_ACCOUNTS_BASE_URL=https://omnigent.example.com`。
2. 选择账号或 OIDC；不要使用无认证单用户模式。
3. 如使用 header 模式，可信代理必须剥离客户端伪造的同名身份头，并用伪造请求实测。
4. 检查数据库迁移、`/v1/info`、artifact 写入、账号邀请和退出。
5. 不把 `.env`、模型 key、GitHub Token 或 workspace 打包进镜像。

危险命令：

```bash
# 会删除数据库和 artifact 卷；只有明确批准销毁数据时才使用
docker compose down -v
```

普通停止不要加 `-v`。

## 6. 路线 D：Polly 并行工程示例

### 6.1 准入条件

- 任务已由维护者批准，验收合同、仓库范围、预算与超时明确。
- 至少两个不同供应商的 worker 实际可用，否则不能声称独立跨供应商评审。
- 只有文件范围不重叠且无顺序依赖的任务才能 fanout。
- 每个实现者只拥有自己的 worktree、分支和 PR；reviewer 不编辑代码。
- Polly 和执行器均无自动 merge 权限。

### 6.2 工作流

1. 创建 `.worktrees/<task_id>` 和 `polly/<task_id>`，写入 `.polly/registry.json`。
2. 给实现者发送任务、worktree 路径、验收合同和绿色门禁；记录 `conversation_id`。
3. 实现者运行 tests / lint / typecheck，并打开自己的 PR。
4. 保存 base / head 对应的不可变 diff；不要通过模型输出重新生成 diff。
5. 让不同供应商 reviewer 只读取固定 diff 与合同，输出 blocking / non-blocking / suggestions。
6. blocking 问题回到同一实现者会话，更新原 PR，重新生成快照并复验。
7. 清洁后将 PR 和证据交给维护者；不得执行 `git merge` 或 `gh pr merge`。

官方入口：

```bash
omnigent run examples/polly/
# 真实模型与 PR 操作可能产生费用和外部写入；只有授权后执行
```

## 7. Agent 契约与自动化门禁

Agent YAML 可声明 `executor`、`tools`、`policies`、`os_env`、`terminals` 和子 Agent。不可信 bundle 必须使用 `expand_env=False` 和 handler allowlist，防止从服务进程展开秘密或加载未批准 handler。

最小策略示例：

```yaml
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
```

外层仍需设置进程超时、provider 预算、并发、网络、Git 仓库与分支范围。策略按 session → Agent → server 顺序评估，DENY 优先；普通 tool-call DENY / ASK 不会阻止 `sys_agent_start` 探针，不能用工具策略代替 Agent 启动准入。

附件扩展名和大小限制不是内容扫描。隐藏内置 Agent 也不是访问控制。对外层工厂保留：bundle 哈希、运行指纹、会话、registry、base / head、diff、测试、评审、成本与人工决定。

## 8. 八道验收闸门

1. **版本**：三个 Python 包均为 0.23.0，源码 HEAD 为 0339632，harness CLI 和依赖指纹已保存。
2. **规格**：Agent bundle 严格解析通过；不可信输入没有环境展开或未批准 handler。
3. **服务**：本地 :6767 或 Docker :8000 健康，数据库迁移、artifacts、账号 / OIDC 和 HTTPS 已验证。
4. **密钥**：只转发必要变量；YAML、Git、镜像、日志、快照和网站中无秘密。
5. **执行**：workspace、网络、沙箱、工具次数、进程超时和 provider 预算实测有效。
6. **并行**：fanout 文件范围无冲突，registry 中 worktree、分支、会话和 PR 完整。
7. **评审**：确定性门禁先通过，不同供应商 reviewer 使用固定 diff；blocking findings 清零后复验。
8. **交付**：PR 保持待审；merge、Issue close、生产部署由维护者执行。

## 9. 常见故障

- **源码安装超时**：改用同版本官方 wheel 和 `--only-binary=:all:`；保留失败记录，不删除依赖。
- **CLI / 沙箱缺失**：核对 Node、pnpm、tmux、bwrap 与具体 harness；不要改成无隔离宿主执行。
- **模型凭据不可见**：检查受限环境和 `env_passthrough`；只声明当前 provider 需要的变量名。
- **header 身份伪造**：修复代理入站头清洗并实测；公网改用正确配置的账号 / OIDC + HTTPS。
- **启动未被策略阻止**：官方启动探针不适用普通 DENY / ASK；在准入和沙箱转换层限制。
- **无法独立评审**：准备可共享的固定 diff 并安排第二供应商；做不到就升级人工，不伪造评审。
- **Docker 数据被删**：`down -v` 是销毁操作；从已验证备份恢复，日常停止不带 `-v`。

## 10. 升级、备份与安全红线

升级前固定 Omnigent、client、ui-sdk、harness CLI、Node / Python、镜像和依赖树；阅读 Release 与能力变化，重新解析 bundle，并用同一无写权限任务比较登录、模型、审批、取消和成本。Docker 先备份并验证数据库 / artifacts 恢复，再迁移。

备份数据库、artifacts、Agent bundle、registry、分支 / 提交和依赖指纹，不备份明文密钥。会话、日志、diff、workspace 和模型输出可能含源码与秘密，需要限权、脱敏和保留期。

安全红线：不挂宿主 Docker socket；不把 home 或全部 CLI 凭据交给会话；不自动 merge、关闭 Issue 或发布生产；不把官方示例、策略 ALLOW 或内部 reviewer 写成独立生产验收。

## 11. 官方来源

- https://github.com/omnigent-ai/omnigent
- https://github.com/omnigent-ai/omnigent/releases/tag/v0.23.0
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/README.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/pyproject.toml
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/docs/AGENT_YAML_SPEC.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/docs/POLICIES.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/config.yaml
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/skills/fanout/SKILL.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/examples/polly/skills/cross-review/SKILL.md
- https://github.com/omnigent-ai/omnigent/blob/033963227a3b54803ae00c5ef0f0f6fe97f5549d/deploy/docker/README.md
