---
name: agentless-deploy
description: Deploy and verify OpenAutoCoder/Agentless v1.5.0, a three-phase software-repair pipeline without a free-running tool loop. Use when a coding Agent must install the historical release, repair SWE-bench dependency drift, run localization / repair / validation and selection, audit JSONL results, or integrate Agentless into an outer software factory. Includes dependency pins, five routes, eight acceptance gates, and troubleshooting. Do not treat Agentless as an out-of-the-box GitHub Issue bot.
metadata:
  verified_at: "2026-11-22"
  upstream_version: "v1.5.0"
  upstream_commit: "b150f28465a77a81a7f4776384957a4271f5bd69"
  upstream_license: "MIT"
---

# Agentless v1.5.0 deployment execution manual

You are the executing AI Agent. Do not invent commands, skip dependency pinning, or present official benchmark claims as local measurements. Facts were verified on 2026-11-22; if the current date is materially later, recheck the official release plus SWE-bench, Modal, and OpenAI SDK compatibility before execution.

## 01 · Hard prerequisites

1. Use Python 3.11: `python3.11 --version`.
2. git, curl, pip, and Hugging Face dataset access must work; real model phases also need a provider key.
3. The official requirements.txt is unpinned; never claim that a direct official install is reproducible without a lock.
4. This is a CLI pipeline: it starts no persistent HTTP service and requires no open port.
5. Agentless natively consumes SWE-bench-style instances, not arbitrary GitHub Issues; build an instance adapter before factory integration.

## 02 · Dependency drift and verified pins

The official v1.5.0 requirements.txt is unpinned and points `swebench` at GitHub main. On 2026-11-22, a direct install resolved `swebench 5.2`, after which `agentless/test/run_regression_tests.py` failed to import the legacy `KEY_INSTANCE_ID` constant.

The compatibility combination verified in an isolated Python 3.11 environment was:

- `swebench==2.1.8`
- `modal==0.77.0`
- pip-resolved compatible transitive dependencies, including click 8.1.8, grpclib 0.4.7, protobuf 6.33.6, and synchronicity 0.9.16

Install the official requirements first, then apply the two explicit compatibility pins, and always finish with `python -m pip check`.

## 03 · Choose a route

| Route | When to use | Evidence level |
| --- | --- | --- |
| A · Compatible environment | Install, pin dependencies, and prove CLI entry points load | Verified here |
| B · Hierarchical localization | Official SWE-bench file / element / line localization | Official material; no model called here |
| C · Multi-sample repair | Generate candidate patches from localized context | Official material; no model called here |
| D · Validation and selection | Regression, reproduction tests, and majority voting | Official material; no benchmark run here |
| E · Cost audit | Count tokens and estimate cost from output.jsonl | Entry point verified; no real output supplied |

Start with A. Do not jump to B-D without model keys, dataset access, and an evaluation budget.

## 04 · Source installation and CLI checks

```bash
mkdir -p /srv/agent-factory/{workspace,runs,vendor}
cd /srv/agent-factory

git clone --depth 1 --branch v1.5.0 https://github.com/OpenAutoCoder/Agentless.git vendor/Agentless
cd vendor/Agentless
git rev-parse HEAD   # Expected b150f28465a77a81a7f4776384957a4271f5bd69

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

Save pip freeze, the source archive hash, command output, and the current date under runs/. If any check fails, stop and record the environment; do not patch source merely to hide the failure.

## 05 · Model, dataset, and directory boundaries

```bash
export OPENAI_API_KEY='injected-by-a-secret-manager'
```

- The official README example uses OpenAI; source `util/model.py` supports the `openai` and `deepseek` backends.
- The DeepSeek path reuses the OpenAI-compatible client. Without source changes, it still reads `OPENAI_API_KEY`; do not assume `DEEPSEEK_API_KEY` is read automatically.
- The default dataset is `princeton-nlp/SWE-bench_Lite`; `--dataset princeton-nlp/SWE-bench_Verified` selects Verified.
- Officially listed model choices include `gpt-4o-2024-05-13`, `gpt-4o-mini-2024-07-18`, and `deepseek-coder`; entry scripts assert that a DeepSeek model must use `--backend deepseek`.
- `results/`, `embedding/`, and `playground/` can contain private source, paths, logs, and model output. Move them to controlled workspaces with retention limits for production integration.

## 06 · Official SWE-bench phase commands

### 6.1 File localization, retrieval, and merge

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

### 6.2 Element and edit-location localization

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

### 6.3 Multi-sample repair

```bash
python agentless/repair/repair.py \
  --loc_file results/swe-bench-lite/edit_location_individual/loc_merged_0-0_outputs.jsonl \
  --output_folder results/swe-bench-lite/repair_sample_1 \
  --loc_interval --top_n=3 --context_window=10 \
  --max_samples 10 --cot --diff_format --gen_and_process \
  --num_threads 2
```

The official example uses four edit-location sets and ten samples per set, producing 40 candidates per issue. For a first real run, narrow scope with `--target_id` and fewer samples.

### 6.4 Regression, reproduction, and selection

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

`rerank.py` writes `all_preds.jsonl`. That file is a candidate prediction for SWE-bench or CI, not proof that a repair succeeded.

## 07 · Cost and evidence audit

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

Record dataset, target_id or slice, model, backend, temperature, sample counts, num_threads, dependency lock, result hashes, and cost. Without those fields, score differences cannot be explained later.

## 08 · Outer automation gates

Agentless natively reads SWE-bench dataset fields. Before factory integration, an outer system must map an approved Issue to `instance_id`, `repo`, `base_commit`, and `problem_statement`, then prepare a disposable repository copy.

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

Red lines: Issue text is untrusted. The outer system owns trigger approval, concurrency limits, budgets, CI, and human merge. Agentless receives no push or merge permission.

## 09 · Eight acceptance gates

1. Repeatable version: v1.5.0, commit b150f284, Python 3.11, pip freeze, and source archive hash are saved.
2. Compatible dependencies: `swebench==2.1.8` and `modal==0.77.0`; pip check reports no broken requirements.
3. Entry points load: all 11 CLI help commands pass.
4. Secret safety: no plaintext model key appears in Git, YAML, result files, logs, or container commands.
5. Narrow scope: the first real run uses target_id, a low sample count, and a controlled dataset slice.
6. Traceable evidence: JSONL and logs exist for loc, repair, regression, reproduction, and rerank.
7. Reviewable patch: all_preds.jsonl has one patch per instance and the patch passes tests after application to a clean copy.
8. Separate evaluation and merge: SWE-bench / CI and human approval happen outside Agentless; no automatic merge.

## 10 · Troubleshooting

1. `ImportError: cannot import name 'KEY_INSTANCE_ID'`: the direct official install resolved a newer SWE-bench; install `swebench==2.1.8` and `modal==0.77.0`.
2. `AttributeError: module 'modal' has no attribute 'Mount'`: pinning swebench alone is insufficient; pin Modal 0.77.0 and let pip re-resolve transitive dependencies.
3. pip check reports click / grpclib / protobuf / synchronicity conflicts: do not hand-pick random downgrades; rerun resolution with the two top-level constraints.
4. OpenAI 401 / unavailable model: check key presence, account entitlement, model name, and provider without printing the secret.
5. DeepSeek assertion failure: use `--model deepseek-coder --backend deepseek` together; without source changes, note the OPENAI_API_KEY reading behavior.
6. Empty localization: check instance_id, base_commit, PROJECT_FILE_LOC, top_n, and localization_logs; run file_level before related and fine_grain stages.
7. Unparseable patch: inspect repair_logs, keep diff_format / gen_and_process, increase context_window, or use a more stable model; do not hand-edit output.jsonl.
8. Missing or malformed all_preds: check that normalized patches, regression results, and reproduction results align by instance_id before rerank.

## 11 · Upgrades, backup, cost control, and security red lines

- Before upgrades, back up source archive hashes, pip freeze, commands, result JSONL, and model / dataset versions; never back up plaintext secrets.
- During upgrades, check SWE-bench, Modal, OpenAI SDK, and dataset-field changes, then compare old and new environments on the same target_id.
- Smoke-test cost with a small sample count before expanding num_threads, num_samples, and num_workers.
- Use `dev/util/cost.py` per phase for token and estimated cost; configure provider-side budgets and alerts separately.
- Restrict, redact, and set retention plus disk quotas for results/, embedding/, and playground/.
- Never write model keys into Git, YAML, result files, logs, or untrusted containers.
- Never present Agentless as an out-of-the-box GitHub Issue bot.
- Never let Agentless or an outer Agent merge automatically; final patches require clean-environment CI and human approval.
- Never present historical official SWE-bench scores as current local measurements.
- Never edit intermediate JSONL by hand to conceal parsing, localization, or test failures.

## Sources and verification scope

- github.com/OpenAutoCoder/Agentless: README, Release v1.5.0, README_swebench.md, requirements.txt, and agentless source
- arxiv.org/abs/2407.01489: Agentless paper
- huggingface.co/datasets/princeton-nlp/SWE-bench_Lite and SWE-bench_Verified
- Verified here on 2026-11-22: official v1.5.0 source archive, isolated Python 3.11 installation, pip dependency resolution, compileall, pip check, and 11 CLI help entry points. No model was called, no real Issue repair was executed, and no end-to-end SWE-bench run was performed.
  