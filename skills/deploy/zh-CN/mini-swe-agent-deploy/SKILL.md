---
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

1. Python >= 3.10（示例用 3.12）：`python3.12 --version`。
2. bash 可用（local 与容器内都需要）。
3. 路线 B 需要 `docker info` 正常返回。
4. 外层自动化另需 git、gh、jq（它们不是 mini 的内建组件）。
5. 本方案是纯 CLI：不启动 HTTP 服务，无需开放任何端口。

## 1. 选择部署路线（与用户确认后执行；建议先 A 跑通再迁 B）

| 路线 | 适用场景 | 隔离与交互 |
| --- | --- | --- |
| A · 本地确认模式 | 学习控制流、调试、一次性仓库副本 | 无文件系统隔离；confirm 模式人工逐步确认 |
| B · Docker 沙箱 | 无人值守前的最小限权形态 | 断网 + cap-drop ALL + no-new-privileges + 资源上限 |

红线：不要在生产目录使用路线 A；confirm 只是确认器，不是沙箱。

## 2. 安装与入口自检（两条路线共用）

```bash
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# 只验证包和入口，不会调用模型
python -c 'import minisweagent; print(minisweagent.__version__)'   # 期望 2.4.6
python -m minisweagent --help
```

同时把 `pip freeze` 输出保存到 runs/，保证环境可重复。

## 3. 模型、密钥与总预算

```bash
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'   # 模型名必须带 provider 前缀
export ANTHROPIC_API_KEY='由密钥管理器注入，不要写进 YAML 或 Git'
export MSWEA_CONFIGURED=true
export MSWEA_GLOBAL_CALL_LIMIT=100     # 进程级总闸门
export MSWEA_GLOBAL_COST_LIMIT=10.00
```

## 4. 路线 A · 本地确认模式

/srv/agent-factory/factory.local.yaml：

```yaml
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
```

运行：

```bash
cd /srv/agent-factory
source .venv/bin/activate
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.local.yaml \
  -t '先复现问题，再做最小修改；运行相关测试，不要提交或推送。' \
  -o /srv/agent-factory/runs/local-demo.traj.json
```

注意：一旦使用 -c，内置默认配置不会自动作为基底加载，必须同时写 -c mini.yaml。

## 5. 路线 B · Docker 沙箱

/srv/agent-factory/factory.docker.yaml：

```yaml
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
```

运行：

```bash
cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.docker.yaml \
  -t '检查当前仓库，修复任务描述的问题，运行测试；不要联网、提交或推送。' \
  -o /srv/agent-factory/runs/docker-demo.traj.json \
  --yolo --exit-immediately
```

要点：模板主动断网，不能在线安装依赖或推送代码；真实项目预构建依赖镜像并固定 digest；先建目录再挂载，避免 Docker 自动创建 root 拥有的目录；容器内默认不放模型 key、不挂 Docker socket。

## 6. 可选：外层自动化接入（Issue 到补丁）

v2 已移除专用 github_issue.py，由外层调度器取 Issue 再调用 mini CLI：

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \
  -t "$(cat "runs/$RUN_ID.issue.txt")" \
  -o "runs/$RUN_ID.traj.json" \
  --yolo --exit-immediately

# 进程退出不等于任务成功：先检查显式退出状态
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# 下一步：在隔离环境运行完整 CI，再交人工审阅；不要自动 merge
```

读取轨迹验收字段：

```bash
jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json
```

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
