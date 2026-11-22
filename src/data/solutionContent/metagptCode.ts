const zh = {
  INSTALL_CODE: `git clone --depth 1 --branch v0.8.1 https://github.com/FoundationAgents/MetaGPT.git
cd MetaGPT
git rev-parse HEAD
# 应为 c036574507e7616c02512e7c8ad88dd847783afa

python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip

# 本次实测：原始 lancedb==0.4.0 已无法从 PyPI 解析
cp requirements.txt /tmp/metagpt-v081-requirements.txt
sed -i 's/^lancedb==0.4.0$/lancedb==0.14.0/' /tmp/metagpt-v081-requirements.txt
python -m pip install -r /tmp/metagpt-v081-requirements.txt
python -m pip install --no-deps -e .
python -m pip install click==8.1.7 huggingface-hub==0.30.2

python -m compileall -q metagpt
metagpt --help
# pip check 仍会报告 MetaGPT 声明的 lancedb==0.4.0 与实际 0.14.0 不一致
# 这是兼容实验的已知偏差，不是干净的官方锁文件`,
  CONFIG_CODE: `# 初始化会备份已有配置为 config2.bak
metagpt --init-config
chmod 600 ~/.metagpt/config2.yaml

# 编辑 ~/.metagpt/config2.yaml；不要把真实密钥提交到 Git
# llm:
#   api_type: "openai"
#   model: "选择账户实际可用的模型"
#   base_url: "https://api.openai.com/v1"
#   api_key: "由本地密钥管理流程写入"

# 只生成文档，不雇佣 Engineer，也不运行生成代码
metagpt "Create a CLI snake game" --project-name snake_docs --no-implement --no-code-review --no-run-tests --investment 1 --n-round 5`,
  MESSAGE_CODE: `Message {
  content: string,
  instruct_content: BaseModel | null,
  role: string,
  cause_by: string,
  sent_from: string,
  send_to: set<string>
}

Document {
  root_path: string,
  filename: string,
  content: string
}

# 文件正文进入 ProjectRepo；消息携带结构化对象或文件引用
# cause_by 决定订阅过滤，send_to 决定环境路由`,
  DOCS_ROUTE_CODE: `# 仅用于已批准、可丢弃的需求；真实模型调用本页未执行
metagpt "Write a CLI snake game" \\
  --project-name snake_docs \\
  --no-implement --no-code-review --no-run-tests \\
  --investment 1 --n-round 5

find workspace/snake_docs -maxdepth 4 -type f | sort`,
  FULL_ROUTE_CODE: `# 高风险路线：只在一次性 VM 或等效隔离环境执行
# 会生成代码、进行评审，并在启用 QA 时执行生成的 Python 测试
metagpt "Write a CLI snake game" \\
  --project-name snake_full \\
  --implement --code-review --run-tests \\
  --investment 1 --n-round 8

# 不把 workspace 直接同步到生产仓库；先复制到干净 CI 副本验收`,
  RECOVER_ROUTE_CODE: `# 从已有序列化 Team 恢复；路径必须存在且以 team 结尾
metagpt --recover-path workspace/storage/team \\
  --investment 1 --n-round 3

# 恢复前备份 team.json、角色状态与 ProjectRepo
# 恢复不等于幂等重放；先核对模型、配置和剩余预算`,
  AUTOMATION_CODE: `from pathlib import Path
import os
import subprocess

root = Path("/srv/agent-factory")
run_home = root / "run-home"
command = [
    str(root / "vendor/MetaGPT/.venv/bin/metagpt"),
    "Create a CLI snake game",
    "--project-name", "approved_snake_docs",
    "--no-implement", "--no-code-review", "--no-run-tests",
    "--investment", "1", "--n-round", "5",
]

# 参数数组而非 shell=True；只处理外层审批过的需求
# run-home/.metagpt/config2.yaml 由密钥流程单独准备并限权
subprocess.run(
    command,
    cwd=root / "vendor/MetaGPT",
    env={**os.environ, "HOME": str(run_home)},
    timeout=1800,
    check=True,
)`,
}

type CodeShape<T> = { [K in keyof T]: unknown }

const en = {
  INSTALL_CODE: `git clone --depth 1 --branch v0.8.1 https://github.com/FoundationAgents/MetaGPT.git
cd MetaGPT
git rev-parse HEAD
# Expected: c036574507e7616c02512e7c8ad88dd847783afa

python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip

# Verified here: the original lancedb==0.4.0 no longer resolves from PyPI
cp requirements.txt /tmp/metagpt-v081-requirements.txt
sed -i 's/^lancedb==0.4.0$/lancedb==0.14.0/' /tmp/metagpt-v081-requirements.txt
python -m pip install -r /tmp/metagpt-v081-requirements.txt
python -m pip install --no-deps -e .
python -m pip install click==8.1.7 huggingface-hub==0.30.2

python -m compileall -q metagpt
metagpt --help
# pip check still reports the declared lancedb==0.4.0 versus installed 0.14.0
# This is a known compatibility deviation, not a clean official lockfile`,
  CONFIG_CODE: `# Initialization backs up an existing configuration as config2.bak
metagpt --init-config
chmod 600 ~/.metagpt/config2.yaml

# Edit ~/.metagpt/config2.yaml; never commit a real secret to Git
# llm:
#   api_type: "openai"
#   model: "choose-a-model-available-to-your-account"
#   base_url: "https://api.openai.com/v1"
#   api_key: "written-by-your-local-secret-process"

# Generate documents only: no Engineer and no generated-code execution
metagpt "Create a CLI snake game" --project-name snake_docs --no-implement --no-code-review --no-run-tests --investment 1 --n-round 5`,
  MESSAGE_CODE: `Message {
  content: string,
  instruct_content: BaseModel | null,
  role: string,
  cause_by: string,
  sent_from: string,
  send_to: set<string>
}

Document {
  root_path: string,
  filename: string,
  content: string
}

# ProjectRepo stores file bodies; messages carry objects or file references
# cause_by controls subscription filters; send_to controls environment routing`,
  DOCS_ROUTE_CODE: `# For an approved, disposable requirement only; no model call was executed here
metagpt "Write a CLI snake game" \\
  --project-name snake_docs \\
  --no-implement --no-code-review --no-run-tests \\
  --investment 1 --n-round 5

find workspace/snake_docs -maxdepth 4 -type f | sort`,
  FULL_ROUTE_CODE: `# Higher-risk route: use a disposable VM or equivalent isolation only
# It writes and reviews code; enabling QA executes generated Python tests
metagpt "Write a CLI snake game" \\
  --project-name snake_full \\
  --implement --code-review --run-tests \\
  --investment 1 --n-round 8

# Never sync workspace directly to production; validate a clean CI copy first`,
  RECOVER_ROUTE_CODE: `# Resume a serialized Team; the path must exist and end with team
metagpt --recover-path workspace/storage/team \\
  --investment 1 --n-round 3

# Back up team.json, role state, and ProjectRepo before recovery
# Recovery is not idempotent replay; verify model, configuration, and budget`,
  AUTOMATION_CODE: `from pathlib import Path
import os
import subprocess

root = Path("/srv/agent-factory")
run_home = root / "run-home"
command = [
    str(root / "vendor/MetaGPT/.venv/bin/metagpt"),
    "Create a CLI snake game",
    "--project-name", "approved_snake_docs",
    "--no-implement", "--no-code-review", "--no-run-tests",
    "--investment", "1", "--n-round", "5",
]

# Use an argument array, not shell=True; accept approved requirements only
# Prepare and restrict run-home/.metagpt/config2.yaml through a secret process
subprocess.run(
    command,
    cwd=root / "vendor/MetaGPT",
    env={**os.environ, "HOME": str(run_home)},
    timeout=1800,
    check=True,
)`,
} satisfies CodeShape<typeof zh>

export const metagptCode = { zh, en }
