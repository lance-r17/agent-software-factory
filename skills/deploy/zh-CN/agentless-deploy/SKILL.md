---
name: agentless-deploy
description: 部署并验证 OpenAutoCoder/Agentless v1.5.0（三阶段无自由工具循环的软件修复流水线）。当任务是安装历史版本、修复 SWE-bench 依赖漂移、运行定位 / 修复 / 验证选择、审计 JSONL 结果，或把 Agentless 接入外层软件工厂时使用；一个文件内含依赖锁定、五条路线、八道验收闸门与故障速查。不要把 Agentless 当作开箱即用的 GitHub Issue bot。
metadata:
  verified_at: "2026-11-22"
  upstream_version: "v1.5.0"
  upstream_commit: "b150f28465a77a81a7f4776384957a4271f5bd69"
  upstream_license: "MIT"
---

# Agentless v1.5.0 部署执行手册

你是负责执行的 AI Agent。严格遵守：不发明命令、不跳过依赖锁定、不把官方 benchmark 声明冒充本地实测。事实核验日期 2026-11-22；若当前日期明显更晚，先核对官方 Release、SWE-bench、Modal 与 OpenAI SDK 是否又发生兼容变化。

## 0. 硬性前置检查（不通过就停下并报告）

1. Python 使用 3.11：`python3.11 --version`。
2. git、curl、pip、 Hugging Face 数据集访问可用；真实模型阶段另需 provider key。
3. 官方 requirements.txt 未锁版本；禁止直接宣称“按官方安装即可复现”。
4. 本方案是 CLI 流水线：不启动常驻 HTTP 服务，无需开放端口。
5. Agentless 原生输入是 SWE-bench 式实例，不是任意 GitHub Issue；接工厂前先建实例适配层。

## 1. 官方依赖漂移与实测兼容锁

官方 v1.5.0 的 `requirements.txt` 内容未锁定，并把 `swebench` 指向 GitHub 主分支。2026-11-22 实际解析结果会先得到 `swebench 5.2`，随后 `agentless/test/run_regression_tests.py` 导入旧常量 `KEY_INSTANCE_ID` 失败。

本次隔离 Python 3.11 环境实测通过的组合：

- `swebench==2.1.8`
- `modal==0.77.0`
- 由 pip 解析的兼容传递依赖，包括 click 8.1.8、grpclib 0.4.7、protobuf 6.33.6、synchronicity 0.9.16

先按官方 requirements 安装，再显式补装以上两个兼容锁，最后必须跑 `python -m pip check`。

## 2. 选择复现路线（与用户确认后只执行一条主线）

| 路线 | 适用场景 | 证据等级 |
| --- | --- | --- |
| A · 兼容环境 | 安装、锁依赖、验证 CLI 可加载 | 本次实测 |
| B · 层级定位 | 官方 SWE-bench 文件 / 元素 / 行级定位 | 官方资料；未调用模型 |
| C · 多样本修复 | 从定位上下文生成候选补丁 | 官方资料；未调用模型 |
| D · 验证选择 | 回归、复现测试与多数投票 | 官方资料；未运行基准 |
| E · 成本审计 | 统计 output.jsonl token 与估算成本 | 入口实测；无真实 output |

默认先做 A；没有模型 key、数据集访问和评测预算时，不要跳级执行 B–D。

## 3. 源码安装与入口自检（路线 A）

```bash
mkdir -p /srv/agent-factory/{workspace,runs,vendor}
cd /srv/agent-factory

git clone --depth 1 --branch v1.5.0 https://github.com/OpenAutoCoder/Agentless.git vendor/Agentless
cd vendor/Agentless
git rev-parse HEAD   # 期望 b150f28465a77a81a7f4776384957a4271f5bd69

python3.11 -m venv /srv/agent-factory/.venv
source /srv/agent-factory/.venv/bin/activate
python -m pip install --upgrade pip
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
python dev/util/cost.py --help
```

同时保存 `pip freeze`、源码包哈希、命令输出和当前日期到 runs/。任何一项失败，先停下记录环境，不要改源码绕过。

## 4. 模型、数据集与目录边界

```bash
export OPENAI_API_KEY='由密钥管理器注入'
```

- 官方 README 示例使用 OpenAI；源码 `util/model.py` 支持 `openai` 与 `deepseek` backend。
- DeepSeek 路径复用 OpenAI-compatible client；未改源码前仍默认读取 `OPENAI_API_KEY`，不要误以为 `DEEPSEEK_API_KEY` 会被自动读取。
- 数据集默认为 `princeton-nlp/SWE-bench_Lite`；可用 `--dataset princeton-nlp/SWE-bench_Verified`。
- 官方支持模型选项包括 `gpt-4o-2024-05-13`、`gpt-4o-mini-2024-07-18`、`deepseek-coder`；入口脚本会校验 deepseek 模型必须配合 `--backend deepseek`。
- `results/`、`embedding/`、`playground/` 可能包含私有源码、路径、日志和模型输出；生产接入时移到受控工作区并设置保留期。

## 5. 官方 SWE-bench 阶段命令（路线 B–D）

### 5.1 文件级定位、检索与合并

```bash
cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
export PYTHONPATH=/srv/agent-factory/vendor/Agentless
mkdir -p results/swe-bench-lite

python agentless/fl/localize.py --file_level \
  --output_folder results/swe-bench-lite/file_level \
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --file_level --irrelevant \
  --output_folder results/swe-bench-lite/file_level_irrelevant \
  --num_threads 10 --skip_existing

python agentless/fl/retrieve.py --index_type simple \
  --filter_type given_files \
  --filter_file results/swe-bench-lite/file_level_irrelevant/loc_outputs.jsonl \
  --output_folder results/swe-bench-lite/retrieval_embedding \
  --persist_dir embedding/swe-bench_simple \
  --num_threads 10

python agentless/fl/combine.py \
  --retrieval_loc_file results/swe-bench-lite/retrieval_embedding/retrieve_locs.jsonl \
  --model_loc_file results/swe-bench-lite/file_level/loc_outputs.jsonl \
  --top_n 3 \
  --output_folder results/swe-bench-lite/file_level_combined
```

### 5.2 元素级与编辑位置定位

```bash
python agentless/fl/localize.py --related_level \
  --output_folder results/swe-bench-lite/related_elements \
  --top_n 3 --compress_assign --compress \
  --start_file results/swe-bench-lite/file_level_combined/combined_locs.jsonl \
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --fine_grain_line_level \
  --output_folder results/swe-bench-lite/edit_location_samples \
  --top_n 3 --compress --temperature 0.8 --num_samples 4 \
  --start_file results/swe-bench-lite/related_elements/loc_outputs.jsonl \
  --num_threads 10 --skip_existing

python agentless/fl/localize.py --merge \
  --output_folder results/swe-bench-lite/edit_location_individual \
  --top_n 3 --num_samples 4 \
  --start_file results/swe-bench-lite/edit_location_samples/loc_outputs.jsonl
```

### 5.3 多样本修复

```bash
python agentless/repair/repair.py \
  --loc_file results/swe-bench-lite/edit_location_individual/loc_merged_0-0_outputs.jsonl \
  --output_folder results/swe-bench-lite/repair_sample_1 \
  --loc_interval --top_n=3 --context_window=10 \
  --max_samples 10 --cot --diff_format --gen_and_process \
  --num_threads 2
```

官方示例对 4 组编辑位置各生成 10 个样本，合计每题 40 个候选。第一次真实运行应先用 `--target_id` 与更少样本收窄范围。

### 5.4 回归、复现与选择

```bash
python agentless/test/run_regression_tests.py \
  --run_id generate_regression_tests \
  --output_file results/swe-bench-lite/passing_tests.jsonl

python agentless/test/select_regression_tests.py \
  --passing_tests results/swe-bench-lite/passing_tests.jsonl \
  --output_folder results/swe-bench-lite/select_regression

python agentless/test/generate_reproduction_tests.py \
  --max_samples 40 \
  --output_folder results/swe-bench-lite/reproduction_test_samples \
  --num_threads 10

python agentless/repair/rerank.py \
  --patch_folder results/swe-bench-lite/repair_sample_1/ \
  --num_samples 10 --deduplicate --regression --reproduction
```

`rerank.py` 输出 `all_preds.jsonl`。这只是交给 SWE-bench 或 CI 的候选预测，不是修复成功证明。

## 6. 成本与证据审计（路线 E）

```bash
cd /srv/agent-factory/vendor/Agentless
source /srv/agent-factory/.venv/bin/activate
python dev/util/cost.py --output_file results/swe-bench-lite/repair_sample_1/output.jsonl

python - <<'PY'
import json
from collections import Counter
path = 'results/swe-bench-lite/repair_sample_1/all_preds.jsonl'
rows = [json.loads(line) for line in open(path, encoding='utf-8')]
counts = Counter(row['instance_id'] for row in rows)
assert rows and all(count == 1 for count in counts.values())
assert all('model_patch' in row for row in rows)
print({'instances': len(counts), 'non_empty_patches': sum(bool(r['model_patch']) for r in rows)})
PY
```

记录：数据集、target_id / slice、模型、backend、温度、样本数、num_threads、依赖锁、结果哈希与成本。没有这些字段，后续无法解释分数差异。

## 7. 外层自动化接入门禁

Agentless 原生读取 SWE-bench 数据集字段。接入软件工厂时，外层系统必须先把人工批准的 Issue 映射为 `instance_id`、`repo`、`base_commit`、`problem_statement`，并准备可丢弃仓库副本。

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="20261122-agentless-smoke"
TARGET_ID="django__django-10914"

cd "$ROOT/vendor/Agentless"
source "$ROOT/.venv/bin/activate"
export PYTHONPATH="$ROOT/vendor/Agentless"

python agentless/fl/localize.py --file_level \
  --target_id "$TARGET_ID" \
  --output_folder "$ROOT/runs/$RUN_ID/file_level" \
  --num_threads 1
```

红线：Issue 文本不可信；外层系统负责触发审批、并发限制、预算、CI 与人工合并。Agentless 不持有 push 或 merge 权限。

## 8. 八道验收闸门

1. 版本可重复：v1.5.0、commit b150f284、Python 3.11、pip freeze 与源码包哈希已保存。
2. 依赖不失配：`swebench==2.1.8`、`modal==0.77.0`，`pip check` 无破损依赖。
3. 入口可加载：11 个 CLI 帮助命令全部通过。
4. 密钥不越界：Git、YAML、结果文件、日志与容器命令中无明文模型 key。
5. 范围可收窄：首次真实运行使用 target_id、低样本数和受控数据集切片。
6. 证据可追踪：loc、repair、regression、reproduction、rerank 各阶段 JSONL 与日志完整。
7. 补丁可审查：all_preds.jsonl 每实例一个补丁；应用到干净副本后测试通过。
8. 评测与合并分离：SWE-bench / CI 与人工审批在 Agentless 外完成；不自动合并。

## 9. 常见故障速查

1. `ImportError: cannot import name 'KEY_INSTANCE_ID'`：直接安装官方 requirements 解析到了新 SWE-bench；补装 `swebench==2.1.8` 与 `modal==0.77.0`。
2. `AttributeError: module 'modal' has no attribute 'Mount'`：只固定 swebench 不够；Modal 也需固定到 0.77.0 并让 pip 重解传递依赖。
3. `pip check` 报 click / grpclib / protobuf / synchronicity：不要手工逐个乱降级；重新以两个顶层约束让 resolver 解出一致组合。
4. OpenAI 401 / 模型不可用：检查 key 是否存在、账户权限、模型名与 provider；不要打印密钥。
5. DeepSeek 断言失败：同时使用 `--model deepseek-coder --backend deepseek`；未改源码前仍注意 OPENAI_API_KEY 读取逻辑。
6. 定位为空：核对 instance_id、base_commit、PROJECT_FILE_LOC、top_n 与 localization_logs；先跑 file_level。
7. 补丁无法解析：看 repair_logs，保留 diff_format / gen_and_process，增大 context_window 或换稳定模型；不要手工改 output.jsonl。
8. all_preds 缺失或字段不对：检查 rerank 输入的 normalized patch、regression 与 reproduction 结果文件是否同 instance_id 对齐。

## 10. 升级、备份与成本控制

- 升级前备份：源码包哈希、pip freeze、运行命令、结果 JSONL、模型 / 数据集版本；不备份明文密钥。
- 升级时先核对 SWE-bench、Modal、OpenAI SDK 与 datasets 字段，再用同一 target_id 做新旧对比。
- 成本先用小样本烟测，再扩大 num_threads、num_samples、num_workers。
- 用 `dev/util/cost.py` 分阶段统计 token 与估算成本；provider 侧另设预算和告警。
- results/、embedding/、playground/ 需限权、脱敏、设置保留期和磁盘配额。

## 11. 安全红线（任何路线都不得违反）

- 模型 key 不进 Git、YAML、结果文件、日志或不可信容器。
- 不把 Agentless 包装成开箱即用的 GitHub Issue bot。
- 不让 Agentless 或外层 Agent 自动 merge；最终补丁必须经干净环境 CI 与人工批准。
- 不把官方 SWE-bench 历史分数写成当前实测；官方资料与实际执行验证必须分开。
- 不手工编辑中间 JSONL 来掩盖解析、定位或测试失败。

## 来源与核验范围（核验日期 2026-11-22）

- github.com/OpenAutoCoder/Agentless：README、Release v1.5.0、README_swebench.md、requirements.txt、agentless 源码
- arxiv.org/abs/2407.01489：Agentless 论文
- huggingface.co/datasets/princeton-nlp/SWE-bench_Lite 与 SWE-bench_Verified
- 实测范围：官方 v1.5.0 源码包、Python 3.11 隔离环境、pip 依赖解析、compileall、pip check、11 个 CLI 帮助入口。未调用模型，未执行真实 Issue 修复，未运行 SWE-bench 端到端。
  