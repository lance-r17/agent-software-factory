// Locale-specific comments in otherwise shared operational commands.

const zhCode = {
  INSTALL_CODE: `mkdir -p /srv/agent-factory/{workspace,runs,vendor}
cd /srv/agent-factory

git clone --depth 1 --branch v1.5.0 https://github.com/OpenAutoCoder/Agentless.git vendor/Agentless
cd vendor/Agentless
git rev-parse HEAD   # 期望 b150f28465a77a81a7f4776384957a4271f5bd69

python3.11 -m venv /srv/agent-factory/.venv
source /srv/agent-factory/.venv/bin/activate
python -m pip install --upgrade pip

# 官方 requirements.txt 未锁版本；先按官方安装，再补上本次实测通过的历史兼容锁
python -m pip install -r requirements.txt
python -m pip install 'swebench==2.1.8' 'modal==0.77.0'
python -m pip check

export PYTHONPATH=/srv/agent-factory/vendor/Agentless
python -m compileall -q agentless
python agentless/fl/localize.py --help
python agentless/fl/retrieve.py --help
python agentless/fl/combine.py --help
python agentless/repair/repair.py --help
python agentless/repair/rerank.py --help
python agentless/test/select_regression_tests.py --help
python agentless/test/run_regression_tests.py --help
python agentless/test/generate_reproduction_tests.py --help
python agentless/test/run_reproduction_tests.py --help
python agentless/test/run_tests.py --help
python dev/util/cost.py --help`,
  ENV_CODE: `# 官方示例使用 OpenAI；密钥由宿主进程环境或密钥管理器注入
export OPENAI_API_KEY='由密钥管理器注入'

# 源码中的 deepseek 后端也复用 OpenAI-compatible client；
# 未改造 util/api_requests.py 前，它仍默认读取 OPENAI_API_KEY。
# 因此不要把第三方 key 误写成 DEEPSEEK_API_KEY 后以为程序会读取。

# 基准运行另需 Hugging Face 数据集访问；不要把数据集缓存、results/ 或 playground/
# 当作可公开目录。`,
  LOCALIZE_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless
mkdir -p results/swe-bench-lite

python agentless/fl/localize.py --file_level \\
  --output_folder results/swe-bench-lite/file_level \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --file_level --irrelevant \\
  --output_folder results/swe-bench-lite/file_level_irrelevant \\
  --num_threads 10 --skip_existing

python agentless/fl/retrieve.py --index_type simple \\
  --filter_type given_files \\
  --filter_file results/swe-bench-lite/file_level_irrelevant/loc_outputs.jsonl \\
  --output_folder results/swe-bench-lite/retrieval_embedding \\
  --persist_dir embedding/swe-bench_simple \\
  --num_threads 10

python agentless/fl/combine.py \\
  --retrieval_loc_file results/swe-bench-lite/retrieval_embedding/retrieve_locs.jsonl \\
  --model_loc_file results/swe-bench-lite/file_level/loc_outputs.jsonl \\
  --top_n 3 \\
  --output_folder results/swe-bench-lite/file_level_combined`,
  REPAIR_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless

# 官方示例：4 组编辑位置 × 每组 10 个样本 = 每个问题 40 个候选补丁
python agentless/fl/localize.py --fine_grain_line_level \\
  --output_folder results/swe-bench-lite/edit_location_samples \\
  --top_n 3 --compress --temperature 0.8 --num_samples 4 \\
  --start_file results/swe-bench-lite/related_elements/loc_outputs.jsonl \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --merge \\
  --output_folder results/swe-bench-lite/edit_location_individual \\
  --top_n 3 --num_samples 4 \\
  --start_file results/swe-bench-lite/edit_location_samples/loc_outputs.jsonl

python agentless/repair/repair.py \\
  --loc_file results/swe-bench-lite/edit_location_individual/loc_merged_0-0_outputs.jsonl \\
  --output_folder results/swe-bench-lite/repair_sample_1 \\
  --loc_interval --top_n=3 --context_window=10 \\
  --max_samples 10 --cot --diff_format --gen_and_process \\
  --num_threads 2`,
  VALIDATION_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless

python agentless/test/run_regression_tests.py \\
  --run_id generate_regression_tests \\
  --output_file results/swe-bench-lite/passing_tests.jsonl

python agentless/test/select_regression_tests.py \\
  --passing_tests results/swe-bench-lite/passing_tests.jsonl \\
  --output_folder results/swe-bench-lite/select_regression

python agentless/test/generate_reproduction_tests.py \\
  --max_samples 40 \\
  --output_folder results/swe-bench-lite/reproduction_test_samples \\
  --num_threads 10

python agentless/repair/rerank.py \\
  --patch_folder results/swe-bench-lite/repair_sample_1/ \\
  --num_samples 10 --deduplicate --regression --reproduction`,
  AUDIT_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate

# 统计每个阶段 output.jsonl 的 token 与估算美元成本
python dev/util/cost.py --output_file results/swe-bench-lite/repair_sample_1/output.jsonl

# 检查最终预测文件是否每个 instance 只有一个补丁
python - <<'PY'
import json
from collections import Counter
path = 'results/swe-bench-lite/repair_sample_1/all_preds.jsonl'
rows = [json.loads(line) for line in open(path, encoding='utf-8')]
counts = Counter(row['instance_id'] for row in rows)
assert rows and all(count == 1 for count in counts.values())
assert all('model_patch' in row for row in rows)
print({'instances': len(counts), 'non_empty_patches': sum(bool(r['model_patch']) for r in rows)})
PY`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="20261122-agentless-smoke"
TARGET_ID="django__django-10914"

# 外层系统负责人工批准、任务映射、干净副本与最终 CI；
# Agentless 原生面向 SWE-bench 数据集，不是开箱即用的 GitHub Issue bot。
test -n "$TARGET_ID"
test -d "$ROOT/vendor/Agentless"
cd "$ROOT/vendor/Agentless"
source "$ROOT/.venv/bin/activate"
export PYTHONPATH="$ROOT/vendor/Agentless"

python agentless/fl/localize.py --file_level \\
  --target_id "$TARGET_ID" \\
  --output_folder "$ROOT/runs/$RUN_ID/file_level" \\
  --num_threads 1

# 后续 repair / validation 命令必须由外层调度器显式启用；
# 进程退出和 all_preds.jsonl 存在都不等于修复成功。`,
  RESULT_CODE: `python - <<'PY'
import json
from pathlib import Path
for name in ['loc_outputs.jsonl', 'output.jsonl', 'all_preds.jsonl']:
    matches = list(Path('results').rglob(name))
    print(name, len(matches))
    for path in matches[:3]:
        first = json.loads(path.read_text(encoding='utf-8').splitlines()[0])
        print(' ', path, sorted(first)[:8])
PY`,
}

const enCode = {
  INSTALL_CODE: `mkdir -p /srv/agent-factory/{workspace,runs,vendor}
cd /srv/agent-factory

git clone --depth 1 --branch v1.5.0 https://github.com/OpenAutoCoder/Agentless.git vendor/Agentless
cd vendor/Agentless
git rev-parse HEAD   # Expected b150f28465a77a81a7f4776384957a4271f5bd69

python3.11 -m venv /srv/agent-factory/.venv
source /srv/agent-factory/.venv/bin/activate
python -m pip install --upgrade pip

# The official requirements.txt is unpinned; install it, then apply the
# historical compatibility combination verified here.
python -m pip install -r requirements.txt
python -m pip install 'swebench==2.1.8' 'modal==0.77.0'
python -m pip check

export PYTHONPATH=/srv/agent-factory/vendor/Agentless
python -m compileall -q agentless
python agentless/fl/localize.py --help
python agentless/fl/retrieve.py --help
python agentless/fl/combine.py --help
python agentless/repair/repair.py --help
python agentless/repair/rerank.py --help
python agentless/test/select_regression_tests.py --help
python agentless/test/run_regression_tests.py --help
python agentless/test/generate_reproduction_tests.py --help
python agentless/test/run_reproduction_tests.py --help
python agentless/test/run_tests.py --help
python dev/util/cost.py --help`,
  ENV_CODE: `# The official example uses OpenAI; inject secrets through the host process
# environment or a secret manager.
export OPENAI_API_KEY='injected-by-a-secret-manager'

# The DeepSeek backend in the source also reuses the OpenAI-compatible client.
# Unless util/api_requests.py is changed, it still reads OPENAI_API_KEY.
# Do not assume that writing a third-party key as DEEPSEEK_API_KEY is enough.

# Benchmark runs also need Hugging Face dataset access. Do not treat dataset
# caches, results/, or playground/ as public directories.`,
  LOCALIZE_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless
mkdir -p results/swe-bench-lite

python agentless/fl/localize.py --file_level \\
  --output_folder results/swe-bench-lite/file_level \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --file_level --irrelevant \\
  --output_folder results/swe-bench-lite/file_level_irrelevant \\
  --num_threads 10 --skip_existing

python agentless/fl/retrieve.py --index_type simple \\
  --filter_type given_files \\
  --filter_file results/swe-bench-lite/file_level_irrelevant/loc_outputs.jsonl \\
  --output_folder results/swe-bench-lite/retrieval_embedding \\
  --persist_dir embedding/swe-bench_simple \\
  --num_threads 10

python agentless/fl/combine.py \\
  --retrieval_loc_file results/swe-bench-lite/retrieval_embedding/retrieve_locs.jsonl \\
  --model_loc_file results/swe-bench-lite/file_level/loc_outputs.jsonl \\
  --top_n 3 \\
  --output_folder results/swe-bench-lite/file_level_combined`,
  REPAIR_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless

# Official example: 4 edit-location sets x 10 samples = 40 candidates per issue
python agentless/fl/localize.py --fine_grain_line_level \\
  --output_folder results/swe-bench-lite/edit_location_samples \\
  --top_n 3 --compress --temperature 0.8 --num_samples 4 \\
  --start_file results/swe-bench-lite/related_elements/loc_outputs.jsonl \\
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --merge \\
  --output_folder results/swe-bench-lite/edit_location_individual \\
  --top_n 3 --num_samples 4 \\
  --start_file results/swe-bench-lite/edit_location_samples/loc_outputs.jsonl

python agentless/repair/repair.py \\
  --loc_file results/swe-bench-lite/edit_location_individual/loc_merged_0-0_outputs.jsonl \\
  --output_folder results/swe-bench-lite/repair_sample_1 \\
  --loc_interval --top_n=3 --context_window=10 \\
  --max_samples 10 --cot --diff_format --gen_and_process \\
  --num_threads 2`,
  VALIDATION_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless

python agentless/test/run_regression_tests.py \\
  --run_id generate_regression_tests \\
  --output_file results/swe-bench-lite/passing_tests.jsonl

python agentless/test/select_regression_tests.py \\
  --passing_tests results/swe-bench-lite/passing_tests.jsonl \\
  --output_folder results/swe-bench-lite/select_regression

python agentless/test/generate_reproduction_tests.py \\
  --max_samples 40 \\
  --output_folder results/swe-bench-lite/reproduction_test_samples \\
  --num_threads 10

python agentless/repair/rerank.py \\
  --patch_folder results/swe-bench-lite/repair_sample_1/ \\
  --num_samples 10 --deduplicate --regression --reproduction`,
  AUDIT_CODE: `cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate

# Count tokens and estimate dollar cost for each phase output.jsonl
python dev/util/cost.py --output_file results/swe-bench-lite/repair_sample_1/output.jsonl

# Check that the final prediction file has one patch per instance
python - <<'PY'
import json
from collections import Counter
path = 'results/swe-bench-lite/repair_sample_1/all_preds.jsonl'
rows = [json.loads(line) for line in open(path, encoding='utf-8')]
counts = Counter(row['instance_id'] for row in rows)
assert rows and all(count == 1 for count in counts.values())
assert all('model_patch' in row for row in rows)
print({'instances': len(counts), 'non_empty_patches': sum(bool(r['model_patch']) for r in rows)})
PY`,
  AUTOMATION_CODE: `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="20261122-agentless-smoke"
TARGET_ID="django__django-10914"

# The outer system owns human approval, task mapping, a clean copy, and final CI.
# Agentless is designed around SWE-bench datasets, not an out-of-the-box GitHub bot.
test -n "$TARGET_ID"
test -d "$ROOT/vendor/Agentless"
cd "$ROOT/vendor/Agentless"
source "$ROOT/.venv/bin/activate"
export PYTHONPATH="$ROOT/vendor/Agentless"

python agentless/fl/localize.py --file_level \\
  --target_id "$TARGET_ID" \\
  --output_folder "$ROOT/runs/$RUN_ID/file_level" \\
  --num_threads 1

# Later repair / validation commands must be enabled explicitly by the outer
# scheduler. Process exit and all_preds.jsonl alone do not prove repair success.`,
  RESULT_CODE: `python - <<'PY'
import json
from pathlib import Path
for name in ['loc_outputs.jsonl', 'output.jsonl', 'all_preds.jsonl']:
    matches = list(Path('results').rglob(name))
    print(name, len(matches))
    for path in matches[:3]:
        first = json.loads(path.read_text(encoding='utf-8').splitlines()[0])
        print(' ', path, sorted(first)[:8])
PY`,
}

export const agentlessCode = { zh: zhCode, en: enCode }
