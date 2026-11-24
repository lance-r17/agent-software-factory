const zh = {
  INSTALL_CODE: `git clone https://github.com/Agent-Field/SWE-AF.git
cd SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb
git rev-parse HEAD

python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m compileall -q swe_af
python -m pip check

# 清除真实凭据后执行；本页结果：2641 passed，1 skipped
python -m pytest -q

# 已知警告：claude-agent-sdk==0.1.20 当前被上游 yanked
# 本页没有执行 Go、Docker、控制平面、真实模型或 PR 流程`,
  CONFIG_CODE: `cp .env.example .env
chmod 600 .env

# 在 .env 中只配置实际选择的一个模型 provider
# 不在命令行、Git、请求体或日志中写入真实密钥
# SWE_DEFAULT_RUNTIME=open_code
# SWE_DEFAULT_MODEL=<该运行时实际支持的模型 ID>
# OPENROUTER_API_KEY=<由本地密钥流程填写>

# 只有私库克隆、push 或开 PR 才考虑最小权限 GH_TOKEN
# 容器 / 远端部署必须设置控制平面可达的回调：
# AGENT_CALLBACK_URL=http://swe-agent:8003

# 启动前检查自动运行时、模型、挂载和端口
docker compose config --quiet`,
  DATA_CODE: `PlannedIssue {
  name, title, description,
  acceptance_criteria: string[],
  depends_on: string[],
  files_to_create: string[],
  files_to_modify: string[],
  guidance: {
    needs_deeper_qa: boolean,
    testing_guidance: string,
    risk_rationale: string
  }
}

DAGState {
  levels: string[][],
  completed_issues: IssueResult[],
  failed_issues: IssueResult[],
  current_level: number,
  git_integration_branch: string,
  accumulated_debt: object[],
  replan_history: ReplanDecision[]
}

# checkpoint：.artifacts/execution/checkpoint.json
# 恢复不冻结旧 runtime；升级后必须显式指定`,
  PYTHON_ROUTE_CODE: `# 官方路线，本站未启动
cp .env.example .env
chmod 600 .env
# 编辑 .env：选择一个 provider，并显式设置 SWE_DEFAULT_RUNTIME

docker compose config --quiet
docker compose up -d --build

curl -f http://localhost:8080/api/v1/health
curl -f http://localhost:8003/health
curl -f http://localhost:8004/health

# 不需要 Codex 订阅认证时，移除 Compose 的 ~/.codex 挂载
# 不把 .env、模型 key、GH_TOKEN 或 workspace 打包进镜像`,
  GO_ROUTE_CODE: `# 官方 Go 路线，本站因无 Go 工具链未执行
git clone https://github.com/Agent-Field/SWE-AF.git
cd SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb

# 显式 //go，避免依赖根 manifest 的未来重定向
af install "$PWD//go"
af run swe-planner

# Go 默认端口：planner 8005 / fast 8006
curl -f http://localhost:8005/health

# 与 Python 节点共用控制平面时，必须设置不同 NODE_ID
# af install / Desktop 默认开启 beta engine；clone 默认关闭`,
  ISSUE_ROUTE_CODE: `# 官方 API 形状，本站未调用模型或执行此请求
curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \\
  -H "Content-Type: application/json" \\
  -d @- <<'JSON'
{
  "input": {
    "issue": {
      "title": "Add bounded retry to fetch_user",
      "description": "Wrap the HTTP call with three retries.",
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
      "max_coding_iterations": 2
    }
  }
}
JSON

# 用返回的 execution_id 查询状态；最终审查 branch 与 diff
curl http://localhost:8080/api/v1/executions/<execution_id>`,
  AUTOMATION_CODE: `# 外层只接收已批准、边界明确的 Issue
# 1. 默认 enable_github_pr=false，由调用方拥有 merge
# 2. 限制迭代、并发、进程超时和 provider 预算
# 3. 保存 execution_id、checkpoint、branch、commits 和 debt
# 4. 在干净 CI 副本验收，再进入人工 PR 评审

curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \\
  -H "Content-Type: application/json" \\
  -d @approved-issue.json

curl http://localhost:8080/api/v1/executions/<execution_id>
curl http://localhost:8080/api/v1/executions/<execution_id>/notes

# completed_with_debt 不等于全部验收通过
# success=false 也可能返回含提交的分支，必须审查`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `git clone https://github.com/Agent-Field/SWE-AF.git
cd SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb
git rev-parse HEAD

python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m compileall -q swe_af
python -m pip check

# Run with real credentials removed; result here: 2641 passed, 1 skipped
python -m pytest -q

# Known warning: claude-agent-sdk==0.1.20 is currently yanked upstream
# Go, Docker, control plane, real models, and PR flow were not executed here`,
  CONFIG_CODE: `cp .env.example .env
chmod 600 .env

# Configure only the selected model provider in .env
# Never place real secrets in command lines, Git, request bodies, or logs
# SWE_DEFAULT_RUNTIME=open_code
# SWE_DEFAULT_MODEL=<a-model-id-supported-by-the-selected-runtime>
# OPENROUTER_API_KEY=<written-by-your-local-secret-process>

# Consider least-privilege GH_TOKEN only for private clones, push, or PRs
# Container and remote deployments need a control-plane-reachable callback:
# AGENT_CALLBACK_URL=http://swe-agent:8003

# Check automatic runtime selection, models, mounts, and ports before startup
docker compose config --quiet`,
  DATA_CODE: `PlannedIssue {
  name, title, description,
  acceptance_criteria: string[],
  depends_on: string[],
  files_to_create: string[],
  files_to_modify: string[],
  guidance: {
    needs_deeper_qa: boolean,
    testing_guidance: string,
    risk_rationale: string
  }
}

DAGState {
  levels: string[][],
  completed_issues: IssueResult[],
  failed_issues: IssueResult[],
  current_level: number,
  git_integration_branch: string,
  accumulated_debt: object[],
  replan_history: ReplanDecision[]
}

# Checkpoint: .artifacts/execution/checkpoint.json
# Recovery does not freeze the old runtime; specify it after upgrades`,
  PYTHON_ROUTE_CODE: `# Official route; not started by this site
cp .env.example .env
chmod 600 .env
# Edit .env: select one provider and set SWE_DEFAULT_RUNTIME explicitly

docker compose config --quiet
docker compose up -d --build

curl -f http://localhost:8080/api/v1/health
curl -f http://localhost:8003/health
curl -f http://localhost:8004/health

# Remove the Compose ~/.codex mount when Codex subscription auth is unneeded
# Never bake .env, model keys, GH_TOKEN, or workspaces into an image`,
  GO_ROUTE_CODE: `# Official Go route; not executed here because Go is unavailable
git clone https://github.com/Agent-Field/SWE-AF.git
cd SWE-AF
git checkout --detach 0de536488f279c982fc03f5f5660011a7501e0cb

# Use explicit //go instead of relying on future root-manifest redirection
af install "$PWD//go"
af run swe-planner

# Go defaults: planner 8005 and fast 8006
curl -f http://localhost:8005/health

# Set distinct NODE_ID values when sharing a control plane with Python
# af install and Desktop enable the beta engine; clones disable it by default`,
  ISSUE_ROUTE_CODE: `# Official API shape; this site neither called a model nor sent this request
curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \\
  -H "Content-Type: application/json" \\
  -d @- <<'JSON'
{
  "input": {
    "issue": {
      "title": "Add bounded retry to fetch_user",
      "description": "Wrap the HTTP call with three retries.",
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
      "max_coding_iterations": 2
    }
  }
}
JSON

# Query the returned execution_id; review the final branch and diff
curl http://localhost:8080/api/v1/executions/<execution_id>`,
  AUTOMATION_CODE: `# The outer system accepts only approved, tightly scoped Issues
# 1. Keep enable_github_pr=false; the caller owns merge
# 2. Bound iterations, concurrency, process timeout, and provider budget
# 3. Retain execution_id, checkpoint, branch, commits, and debt
# 4. Accept in a clean CI copy before human PR review

curl -X POST http://localhost:8080/api/v1/execute/async/swe-planner.implement_issue \\
  -H "Content-Type: application/json" \\
  -d @approved-issue.json

curl http://localhost:8080/api/v1/executions/<execution_id>
curl http://localhost:8080/api/v1/executions/<execution_id>/notes

# completed_with_debt does not mean every acceptance criterion passed
# success=false can still return a branch with commits; inspect it`,
} satisfies CodeShape<typeof zh>

export const sweAfCode = { zh, en }
