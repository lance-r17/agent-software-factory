---
name: swe-agent-deploy
description: 部署、验证与迁移 SWE-agent v1.1.0（维护期完整 ACI 框架）。当任务是复现历史 SWE-bench pipeline、研究 ACI 工具束、审查旧轨迹或维护既有 v1.x 配置时使用；新建生产 Agent 平台不要选它，优先 mini-SWE-agent。
metadata:
  verified_at: "2026-11-21"
  upstream_version: "1.1.0"
  upstream_commit: "0f3acafacabc0def8cc76b4e48acb4b6cf302cb9"
  upstream_license: "MIT"
---

# SWE-agent v1.1.0 部署手册（遗产版）

> **归档提示**：本站已于 2026-11-23 将 SWE-agent 归档（官方 README 声明 mini-SWE-agent 已 supersede 本项目）。本手册保留 2026-11-21 的核验内容，仅供历史参考；新项目请改用 mini-SWE-agent 的部署手册。

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过自检、不越过安全红线。事实核验日期 2026-11-21。官方 README 与文档已声明 mini-SWE-agent 取代 SWE-agent，SWE-agent 处于 maintenance-only 模式；本手册只用于历史兼容、研究对照和既有 pipeline 复现。

## 0. 硬性前置检查（不通过就停下并报告）

1. Python >= 3.11：`python3.11 --version`。
2. Git 可用，并能固定到 v1.1.0：`git --version`。
3. 路线 A / C 需要 `docker info` 与 `docker pull python:3.11` 正常；路线 B 需要已认证 Modal。
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

```bash
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
```

同时保存 `pip freeze` 到 runs/。如果坚持非 editable 安装，必须额外设置 `SWE_AGENT_CONFIG_DIR`、`SWE_AGENT_TOOLS_DIR`、`SWE_AGENT_TRAJECTORY_DIR` 指向源码树；否则导入时可能断言 config / tools / trajectories 缺失。

## 3. 密钥与仓库边界

```bash
export ANTHROPIC_API_KEY='由密钥管理器注入'
export OPENAI_API_KEY='由密钥管理器注入'
# 公共仓库通常不需要 GITHUB_TOKEN
```

红线：模型 key 不进容器、GitHub Token 不进容器、密钥不写进 YAML 或 Git。访问私有仓库时，先在宿主侧用受控凭证预取到 workspace/project，再以 `env.repo.type=local` 上传；不要让长期 Token 通过 clone URL 进入容器。

## 4. 路线 A · 源码安装 + 加固 Docker

/srv/agent-factory/factory.docker.yaml：

```yaml
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
```

运行：

```bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11
sweagent run \
  --config config/default.yaml \
  --config /srv/agent-factory/factory.docker.yaml \
  --output_dir /srv/agent-factory/runs/docker-single
```

要点：local repo 由 SWE-ReX 从宿主上传，因此容器可断网；真实项目要预构建依赖镜像并固定 digest；断网路线不能在线安装依赖或推送代码。

## 5. 路线 B · 本地仓库 + Modal

```bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
modal token new
cat > /srv/agent-factory/runs/task.md <<'EOF'
先复现问题，再做最小修改；运行相关测试；不要提交或推送。
EOF

sweagent run \
  --config config/default.yaml \
  --agent.model.name=claude-3-7-sonnet-latest \
  --agent.model.per_instance_cost_limit=2.00 \
  --env.deployment.type=modal \
  --env.repo.path=/srv/agent-factory/workspace/project \
  --problem_statement.path=/srv/agent-factory/runs/task.md \
  --output_dir=/srv/agent-factory/runs/modal-single
```

要点：这条路线的目的是绕开本机 Docker，不是降低安全要求。代码、命令输出与轨迹会进入云端；先确认组织允许的数据区域、日志可见性与保留策略。

## 6. 路线 C · run-batch 批量基准

```bash
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
sweagent run-batch \
  --config config/default.yaml \
  --agent.model.name=claude-3-7-sonnet-latest \
  --agent.model.per_instance_cost_limit=2.00 \
  --instances.type=swe_bench \
  --instances.subset=lite \
  --instances.split=dev \
  --instances.slice=:3 \
  --num_workers=3 \
  --output_dir=/srv/agent-factory/runs/swebench-smoke

# preds.json 缺失或过期时在实验目录重建
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke
```

要点：先用 3 个实例烟测。检查成本、轨迹、Docker 负载和 exit statuses 后，再扩大 slice 与 num_workers。run-batch 产出预测，不运行 SWE-bench 评测；评测是外层独立步骤。

## 7. 路线 D · 轨迹审查与统计

```bash
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
```

注意：v1.1.0 的轨迹字段是 `query`，不再是旧版 `messages`。跨版本分析脚本必须先确认版本。

## 8. 验收清单（八道闸门）

1. 版本可重复：git tag 为 v1.1.0，commit 匹配；`sweagent --help` 显示 1.1.0；保存 pip freeze。
2. 配置可解释：启动日志包含默认 config/default.yaml 与自定义 YAML；模型名、解析器、工具束与成本限制符合预期。
3. 执行面隔离：Docker 参数含断网、cap-drop、no-new-privileges 与 CPU / 内存 / PID 上限；不使用 local 处理不可信仓库。
4. 密钥不越界：YAML、Git、容器环境与轨迹扫描无模型 key；GitHub Token 不进容器。
5. 限制确实生效：分别演练单命令 30 秒、安装 300 秒、总执行 1800 秒和成本上限。
6. 轨迹可读取：.traj 含 query、thought、action、observation、model_stats、exit_status 与 submission。
7. 补丁可审查：submission 非空；应用到干净副本后 `git apply --check` 与相关测试通过。
8. 评测与合并分离：run-batch 只产出 preds.json；SWE-bench / CI 与人工最终批准在 Agent 之外。

## 9. 常见故障速查

1. `sweagent` 找不到或版本不对：确认 `which python` 与 `which sweagent` 同属一个 venv；从 v1.1.0 源码重新 `pip install --editable .`。
2. 导入时报 config / tools / trajectories 不存在：非 editable 安装缺顶层目录；改走源码 editable，或设置三个 `SWE_AGENT_*_DIR`。
3. Docker socket 权限或 docker: not found：先 `docker run hello-world`；修 daemon 权限，或改 Modal 路线，不要退到无沙箱 local。
4. 模型 401 / 404 / 成本统计报错：检查 provider、模型名、base URL 与 key 是否存在（不打印密钥）；本地模型用 provider 前缀、成本限制设 0、设置 max_input_tokens。
5. 模型不返回合法动作：默认解析器是 function_calling；换支持工具调用的模型，或把 `agent.tools.parse_function.type` 改为 `thought_action` 并更新模板。
6. 旧配置提示 review_on_submit 或工具束不存在：v1.1.0 重命名工具束并移除 review_on_submit；改用 review_on_submit_m 与新 bundle 名。
7. 批处理 preds.json 缺失或过期：看 run_batch_exit_statuses.yaml；用 `sweagent remove-unfinished` 清理，再运行 `sweagent merge-preds`。

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
