import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { AgentlessArchitectureDiagram, AgentlessDataEventDiagram, AgentlessDeploymentDiagram, AgentlessSelectionDiagram, AgentlessWorkflowDiagram } from '../components/AgentlessDiagrams'
import { agentlessDeploySkill } from '../data/deploySkills'

const VERIFY_DATE = '2026-11-22'
const VERSION = 'v1.5.0'
const TAG_COMMIT = 'b150f28465a77a81a7f4776384957a4271f5bd69'

const INSTALL_CODE = `mkdir -p /srv/agent-factory/{workspace,runs,vendor}
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
python dev/util/cost.py --help`

const ENV_CODE = `# 官方示例使用 OpenAI；密钥由宿主进程环境或密钥管理器注入
export OPENAI_API_KEY='由密钥管理器注入'

# 源码中的 deepseek 后端也复用 OpenAI-compatible client；
# 未改造 util/api_requests.py 前，它仍默认读取 OPENAI_API_KEY。
# 因此不要把第三方 key 误写成 DEEPSEEK_API_KEY 后以为程序会读取。

# 基准运行另需 Hugging Face 数据集访问；不要把数据集缓存、results/ 或 playground/
# 当作可公开目录。`

const LOCALIZE_CODE = `cd /srv/agent-factory/vendor/Agentless
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
  --output_folder results/swe-bench-lite/file_level_combined`

const REPAIR_CODE = `cd /srv/agent-factory/vendor/Agentless
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
  --num_threads 2`

const VALIDATION_CODE = `cd /srv/agent-factory/vendor/Agentless
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
  --num_samples 10 --deduplicate --regression --reproduction`

const AUDIT_CODE = `cd /srv/agent-factory/vendor/Agentless
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
PY`

const AUTOMATION_CODE = `#!/usr/bin/env bash
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
# 进程退出和 all_preds.jsonl 存在都不等于修复成功。`

const RESULT_CODE = `python - <<'PY'
import json
from pathlib import Path
for name in ['loc_outputs.jsonl', 'output.jsonl', 'all_preds.jsonl']:
    matches = list(Path('results').rglob(name))
    print(name, len(matches))
    for path in matches[:3]:
        first = json.loads(path.read_text(encoding='utf-8').splitlines()[0])
        print(' ', path, sorted(first)[:8])
PY`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? '链接已复制' : '复制本页链接'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'pinned', label: 'A · 兼容环境', title: '先复现本次实测通过的历史依赖组合', yaml: '# 关键事实：官方 requirements.txt 未锁定版本\n# swebench 指向 Git 主分支；2026-11-22 直接安装会解析到 SWE-bench 5.2\n# 本次通过的组合：swebench==2.1.8 + modal==0.77.0', run: INSTALL_CODE, note: '这是本页唯一完成过安装级验证的路线：源码编译、pip check 与 11 个 CLI 帮助入口均通过。它没有调用模型、没有运行 SWE-bench，也没有执行真实 Issue 修复。' },
    { id: 'localize', label: 'B · 层级定位', title: '官方文件级、元素级、行级定位链路', yaml: '# 输入：SWE-bench Lite / Verified\n# 输出：file_level_combined/combined_locs.jsonl\n# 可用 --target_id 只处理一个实例', run: LOCALIZE_CODE, note: '文件级定位结合 LLM 与 embedding 检索；related_level 再找类、函数和全局变量；fine_grain_line_level 采样多组编辑区间。真实运行会访问模型与数据集。' },
    { id: 'repair', label: 'C · 多样本修复', title: '从定位上下文生成可解析补丁', yaml: '# 官方示例：4 组位置 × 10 个样本\n# edit 格式：--cot --diff_format --gen_and_process\n# 输出：repair_sample_i/output.jsonl 与 output_i_processed.jsonl', run: REPAIR_CODE, note: 'repair.py 会把 issue、定位文件片段和上下文窗口组装成提示词，再解析 edit_file 或 SEARCH/REPLACE 输出。候选多不等于质量好，后续验证选择才是关键环节。' },
    { id: 'validate', label: 'D · 验证选择', title: '回归测试、复现测试与多数投票', yaml: '# 回归：先找原始仓库中通过的测试\n# 复现：生成测试并先在原始仓库验证能复现\n# 选择：--deduplicate --regression --reproduction', run: VALIDATION_CODE, note: 'rerank.py 会归一化去重，优先选择回归失败更少且通过复现测试的补丁；若没有双通过候选，会退回回归通过集合。最终结果仍需外部 CI。' },
    { id: 'audit', label: 'E · 成本与证据', title: '把 JSONL 变成可审计结果', yaml: '# cost.py 只读取 output.jsonl，不调用模型\n# all_preds.jsonl 是交给外部评测的预测文件', run: AUDIT_CODE, note: '官方提供 dev/util/cost.py 统计每个阶段 token 与估算成本。接入工厂时，应同时保留依赖锁、命令、数据集版本、模型名、样本数和结果哈希。' },
  ]
  return <RouteTabs tabs={tabs} initialId="pinned" ariaLabel="Agentless 部署与复现路线">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id} 路线说明`} code={current.yaml} language="yaml" />
      <CodeBlock title={`运行 ${current.id} 路线`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function Agentless() {
  return <PageShell>
    <article className="detail-page agentless-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/"><ArrowLeft size={16} /> 方案库</Link><ChevronRight size={14} /><span>Agentless</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 04 · FIXED PIPELINE</div>
            <h1><span>Agentless</span><br />不用自由工具循环，<br />也能把 Issue 修成<span className="highlight-blue">候选补丁</span></h1>
            <p className="hero-lead">Agentless 反其道而行：不让模型自主决定“下一步用什么工具”，而是把软件修复拆成层级定位、多样本修复、补丁验证与选择三段固定流程。它更像一条可审计的研究流水线，而不是一个完整工厂平台。</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/solutions/agentless', hash: '#deploy' }}>进入复现手册 <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/OpenAutoCoder/Agentless" target="_blank" rel="noreferrer">官方仓库 <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">一句话判断</p><h2>适合研究“少 Agent 化”的修复流水线，<br />不适合作为开箱即用的工厂底座。</h2><ul><li><Check size={17} />三阶段结构清晰、JSONL 接口稳定</li><li><Check size={17} />官方提供 SWE-bench 完整复现实验说明</li><li><Check size={17} />补丁选择逻辑可读、可单独审查</li><li><XCircle size={17} />依赖未锁定，2026 年直接安装已失配</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>核验版本</dt><dd>{VERSION} <small>2024-10-29 Release</small></dd></div>
          <div><dt>标签提交</dt><dd><code>{TAG_COMMIT.slice(0, 8)}</code> <small>GitHub tag 元数据</small></dd></div>
          <div><dt>运行基线</dt><dd>Python 3.11 <small>官方 conda 示例</small></dd></div>
          <div><dt>仓库信号</dt><dd>2.1k stars <small>2026-11-22 GitHub API</small></dd></div>
          <div><dt>事实核验日</dt><dd>{VERIFY_DATE} <small>时效信息以此为准</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>官方成绩要放回基准语境里读。</strong><p>官方 README 记录 v1.0 在 SWE-bench Lite 上修复 82 个问题（27.3%）、平均每题约 0.34 美元；v1.5.0 是当前官方 Release 并提供 Lite 与 Verified artifacts。本页没有复跑模型或基准，因此这些是官方历史声明，不是本站实测分数。</p></div><SourceLink href="https://github.com/OpenAutoCoder/Agentless/releases/tag/v1.5.0">官方 v1.5.0 Release</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="三段固定流程，替代 Agent 自由探索" intro="Agentless 的架构价值在于“限制”：把开放式工具循环收缩成可预测的程序阶段。模型仍在关键环节生成内容，但流程控制权留在代码里。" />
        <AgentlessArchitectureDiagram />
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README.md">官方 README</SourceLink><SourceLink href="https://arxiv.org/abs/2407.01489">Agentless 论文</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/tree/v1.5.0/agentless">官方源码目录</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="从 Issue 到 all_preds：一条研究流水线" intro="定位、修复、验证分别落盘 JSONL；每个阶段都可以单独重跑、审查和替换。这是它比“黑盒 Agent 循环”更容易做实验归因的地方。" />
          <AgentlessWorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>层级定位降低上下文噪音</h3><p>先找文件，再找相关类、函数和全局变量，最后才找编辑行。相比把整个仓库塞给模型，这条路线的上下文更小，也更容易检查“模型为什么看到了这些代码”。</p></div>
            <div className="text-block"><h3>验证选择不是最终验收</h3><p>回归测试和复现测试只用于从候选中挑一个补丁。它不证明业务语义正确，也不替代项目 CI、代码评审和人工合并。</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="组件分工：定位、生成、执行、选择彼此独立" intro="源码没有复杂的 Agent 抽象层；入口脚本本身就是流程。理解每个脚本读什么 JSONL、写什么 JSONL，就能接上外层系统。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">Agentless 核心组件分工</caption><thead><tr><th>组件</th><th>输入</th><th>职责</th><th>不做什么</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">fl/localize.py</span></th><td>SWE-bench 实例、仓库结构</td><td>文件级、相关元素级、细粒度行级定位；支持 merge 与 target_id。</td><td>不生成最终补丁。</td></tr>
            <tr><th><span className="component-chip green">fl/retrieve.py + combine.py</span></th><td>无关目录过滤结果、模型定位结果</td><td>用 embedding 检索补文件，并按 top_n 合并模型与检索候选。</td><td>不保证 top_n 内一定有真实故障点。</td></tr>
            <tr><th><span className="component-chip yellow">repair/repair.py</span></th><td>loc_file、问题文本、上下文窗口</td><td>采样多个补丁，解析 edit_file 或 SEARCH/REPLACE，生成 normalized patch。</td><td>不运行测试，也不判断业务正确性。</td></tr>
            <tr><th><span className="component-chip pink">test/*.py</span></th><td>候选补丁、数据集、测试选择</td><td>选择回归测试、运行补丁测试、生成并筛选复现测试。</td><td>不替代完整 CI 与 SWE-bench 官方评测。</td></tr>
            <tr><th><span className="component-chip blue">repair/rerank.py</span></th><td>normalized patch + 两类测试结果</td><td>归一化去重，按回归 / 复现结果过滤，多数投票输出 all_preds.jsonl。</td><td>不自动合并，也不解释补丁语义。</td></tr>
            <tr><th><span className="component-chip green">util/model.py</span></th><td>model + backend</td><td>封装 OpenAI 与 DeepSeek chat completions；记录 token 用量。</td><td>不管理密钥轮换、预算告警或 provider 故障转移。</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/fl/localize.py">定位入口</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/repair/repair.py">修复入口</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/repair/rerank.py">选择入口</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="JSONL 是证据链，也是外层系统接口" intro="Agentless 没有统一轨迹查看器；每个阶段自己的 JSONL 与日志目录就是证据。好处是格式简单，代价是需要外层系统做索引、脱敏与留存。" />
          <AgentlessDataEventDiagram />
          <div className="code-with-note"><CodeBlock title="检查结果文件与字段" code={RESULT_CODE} language="bash" /><div className="sticky-explanation"><strong>必须保留的运行指纹</strong><ul><li>源码 tag、commit、依赖锁与 Python 版本。</li><li>数据集名称、target_id、模型、backend、样本数与温度。</li><li>每个阶段的 output_file、日志目录和最终 all_preds.jsonl 哈希。</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="它在工厂里的正确位置：补丁候选生成器" intro="Agentless 可以成为“定位与候选补丁”模块，但不应直接拥有仓库写权限、生产执行权限或合并权限。" />
        <div className="factory-conveyor" aria-label="完整软件工厂流水线">
          <div className="conveyor-step external"><span>外层补齐</span><GitPullRequest /><strong>接单</strong><p>Issue 审批 <ArrowRight className="inline-arrow" aria-hidden="true" /> 基准实例映射</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Agentless</span><Layers3 /><strong>定位与修复</strong><p>层级定位 <ArrowRight className="inline-arrow" aria-hidden="true" /> 候选补丁</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Agentless</span><FileCheck2 /><strong>验证选择</strong><p>回归 + 复现 <ArrowRight className="inline-arrow" aria-hidden="true" /> all_preds</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>外层补齐</span><Shield /><strong>质检与交付</strong><p>干净环境 CI <ArrowRight className="inline-arrow" aria-hidden="true" /> 人审 <ArrowRight className="inline-arrow" aria-hidden="true" /> merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />特别适合</h3><ul><li>研究“无自由工具循环”的自动修复流程。</li><li>需要清晰阶段边界、JSONL 中间产物与可单独重跑脚本。</li><li>复现 SWE-bench Lite / Verified 的历史实验。</li><li>比较多模型在同一固定 pipeline 下的补丁质量与成本。</li><li>作为外层工厂的候选补丁生成器，而不是最终决策者。</li></ul></div>
          <div className="fit-column no"><h3><XCircle />不适合直接承担</h3><ul><li>开箱即用的 GitHub Issue 自动修复机器人。</li><li>需要成熟沙箱调度、权限审批、审计和多租户治理的平台。</li><li>不愿处理历史依赖锁定与基准环境漂移的团队。</li><li>没有模型预算、评测资源和人工审阅的无人值守流水线。</li><li>希望“装完就能改任意仓库”的场景；原生输入是 SWE-bench 式实例。</li></ul></div>
        </div>
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md">官方 SWE-bench 复现说明</SourceLink><SourceLink href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite">SWE-bench Lite</SourceLink><SourceLink href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified">SWE-bench Verified</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="先修依赖漂移，再谈基准复现" intro="Agentless v1.5.0 的官方 requirements.txt 直接跟踪 SWE-bench Git 主分支；这在 2026 年已经不是可重复安装。下面把“官方安装资料”和“本次实测兼容锁”明确分开。" />
          <div className="verification-stamp"><PackageCheck /><div><strong>本次实际执行验证</strong><p>已下载并核对 <code>v1.5.0</code> 官方源码包，对应 tag commit <code>b150f284</code>；在 Python 3.11 隔离环境完成安装、<code>compileall</code>、<code>pip check</code> 与 11 个 CLI 帮助入口检查。官方未锁依赖直接解析到 <code>swebench 5.2</code> 后会在 <code>run_regression_tests.py</code> 导入 <code>KEY_INSTANCE_ID</code> 时失败；最终实测通过组合为 <code>swebench==2.1.8</code> 与 <code>modal==0.77.0</code>。<b>未调用模型、未运行真实 Issue 修复、未运行 SWE-bench 评测。</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>依赖与版本清单</h3><dl>
              <div><dt>Python</dt><dd><strong>3.11</strong><span>官方 conda 示例；本次隔离环境实测</span></dd></div>
              <div><dt>源码版本</dt><dd><strong>v1.5.0</strong><span>tag commit b150f284</span></dd></div>
              <div><dt>官方依赖</dt><dd><strong>未锁定</strong><span>swebench 跟踪 Git 主分支</span></dd></div>
              <div><dt>实测兼容锁</dt><dd><strong>swebench 2.1.8</strong><span>配合 modal 0.77.0</span></dd></div>
              <div><dt>模型后端</dt><dd><strong>openai / deepseek</strong><span>源码 choices；默认 openai</span></dd></div>
              <div><dt>数据集</dt><dd><strong>Lite / Verified</strong><span>Hugging Face datasets</span></dd></div>
              <div><dt>端口</dt><dd><strong>无常驻端口</strong><span>CLI 批处理；评测环境另算</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>建议目录与归属</h3><pre>{`/srv/agent-factory/\n├── .venv/                  # Python 3.11 隔离环境\n├── vendor/Agentless/       # v1.5.0 固定源码\n├── workspace/              # 外层系统准备的可丢弃仓库副本\n├── results/                # 官方基准输出与 JSONL 证据\n└── runs/                   # 本页外层调度与审计输入\n\n模型 key：宿主进程环境或密钥管理器\nplayground/、embedding/：默认写在源码目录，生产接入应显式改到受控工作区`}</pre><p><strong>关键边界：</strong>Agentless 脚本只提供流水线，不提供现代沙箱治理。真实仓库 checkout、依赖安装、命令执行和测试运行都要由外层受控环境承担。</p></div>
          </div>
          <CodeBlock title="01 · 安装、锁定与入口自检" code={INSTALL_CODE} />
          <CodeBlock title="02 · 模型密钥边界" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="命令依据"><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/requirements.txt">官方 requirements</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md">官方基准命令</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/util/model.py">模型后端源码</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="把这份部署手册直接交给 AI Agent" intro="SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置版本锁定、路线选择、精确命令、密钥边界、八道验收闸门与故障速查。先预览核对结构，再复制或下载。" />
          <DeploySkillCard skill={agentlessDeploySkill} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="自动化接入：先做实例适配层，再让流水线运行" intro="Agentless 原生读取 SWE-bench 数据集字段，而不是订阅 GitHub Issue。外层工厂必须把已批准的 Issue 映射成 instance_id、repo、base_commit 与 problem_statement，并准备可丢弃 workspace。" />
        <AgentlessSelectionDiagram />
        <div className="automation-layout"><CodeBlock title="03 · 外层调度器的最小门禁示例" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>接入前必须回答</h3><ol><li><span>1</span><p><strong>输入怎么映射？</strong>任意 GitHub Issue 需要转换为 SWE-bench 式实例；不能只把 Issue URL 塞给脚本。</p></li><li><span>2</span><p><strong>仓库放哪里？</strong>官方脚本会基于 repo 与 base_commit 在 playground/ 中处理结构；生产环境要显式隔离该目录。</p></li><li><span>3</span><p><strong>什么叫成功？</strong>all_preds.jsonl 只是候选预测；干净环境测试、代码扫描和人工审阅才算交付闸门。</p></li><li><span>4</span><p><strong>谁能触发？</strong>Issue 文本不可信；公开仓库自动化应先由维护者批准，再进入有预算上限的运行。</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>模型密钥边界：</strong>源码中的 deepseek 后端复用 OpenAI-compatible client，未改造时仍默认读取 <code>OPENAI_API_KEY</code>。不要为“看起来正确”而把多个 provider 的长期 key 同时放进运行环境。</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="验收清单：先证明可重复，再证明能修" intro="对 Agentless，第一道闸门不是模型效果，而是 2026 年还能否重复安装、入口能否加载、证据文件是否完整。" />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>版本可重复</strong><p>tag 为 v1.5.0，commit 为 b150f284；保存 pip freeze 与源码包哈希。</p></div></li>
            <li><span>02</span><div><strong>依赖不漂移</strong><p>显式锁定 swebench==2.1.8 与 modal==0.77.0；pip check 通过。</p></div></li>
            <li><span>03</span><div><strong>入口可加载</strong><p>localize、retrieve、combine、repair、rerank、测试与成本脚本帮助命令均通过。</p></div></li>
            <li><span>04</span><div><strong>密钥不越界</strong><p>模型 key 由宿主注入；Git、YAML、结果文件与日志扫描无明文 key。</p></div></li>
            <li><span>05</span><div><strong>范围可收窄</strong><p>首次真实运行使用 --target_id、较低 max_samples 与受控数据集切片。</p></div></li>
            <li><span>06</span><div><strong>证据可追踪</strong><p>每个阶段的 JSONL、日志、模型名、温度、样本数和数据集版本都可回放。</p></div></li>
            <li><span>07</span><div><strong>补丁可审查</strong><p>all_preds.jsonl 每实例至多一个补丁；应用到干净副本后通过项目测试。</p></div></li>
            <li><span>08</span><div><strong>评测与合并分离</strong><p>SWE-bench / CI 在 Agentless 外运行；Agent 不获得 push 或 merge 权限。</p></div></li>
          </ol>
          <AgentlessDeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="常见故障：先查依赖年代，再查流程输入" intro="本页实测发现的最大问题不是模型，而是官方依赖没有锁定。之后才是数据集、模型后端、定位输出和测试执行。" />
        <div className="trouble-list">
          <details open><summary><span>01</span>导入 swebench 时报 KEY_INSTANCE_ID 不存在<ChevronRight /></summary><div><strong>原因</strong><p>官方 requirements 直接跟踪 SWE-bench Git 主分支；本次直接安装解析到 5.2，Agentless v1.5.0 仍引用旧 API。</p><strong>处理</strong><p>在同一虚拟环境中补装 <code>swebench==2.1.8</code> 与 <code>modal==0.77.0</code>，再运行 <code>pip check</code> 与全部 CLI 帮助入口。</p></div></details>
          <details><summary><span>02</span>modal.Mount 属性不存在<ChevronRight /></summary><div><strong>原因</strong><p>较新的 Modal 已迁移旧 Mount API；SWE-bench 2.1.8 仍引用旧接口。</p><strong>处理</strong><p>不要只固定 swebench；同时固定 <code>modal==0.77.0</code>，让 pip 解析兼容的 click、grpclib、protobuf 与 synchronicity。</p></div></details>
          <details><summary><span>03</span>OPENAI_API_KEY 缺失、401 或模型名被拒绝<ChevronRight /></summary><div><strong>原因</strong><p>官方示例只读取 OpenAI 风格环境变量；provider 账户、模型名或 base URL 任一不符都会失败。</p><strong>处理</strong><p>只检查变量是否存在，不打印密钥；先用官方支持列表中的 <code>gpt-4o-2024-05-13</code> 或 <code>gpt-4o-mini-2024-07-18</code> 验证，再考虑改源码接其他 provider。</p></div></details>
          <details><summary><span>04</span>使用 deepseek-coder 时断言 backend 错误<ChevronRight /></summary><div><strong>原因</strong><p>入口脚本要求 DeepSeek 模型必须同时传 <code>--backend deepseek</code>。</p><strong>处理</strong><p>成对设置 <code>--model deepseek-coder --backend deepseek</code>；同时注意当前源码仍通过 OpenAI-compatible client 默认读取 OPENAI_API_KEY。</p></div></details>
          <details><summary><span>05</span>定位结果为空或 found_files 不符合预期<ChevronRight /></summary><div><strong>原因</strong><p>仓库结构未生成、target_id 不在数据集、top_n 太小，或检索过滤过度。</p><strong>处理</strong><p>检查 instance_id、base_commit、PROJECT_FILE_LOC、loc_outputs.jsonl 与 localization_logs；先跑 file_level，再跑 related 与 fine_grain。</p></div></details>
          <details><summary><span>06</span>repair 输出无法解析成补丁<ChevronRight /></summary><div><strong>原因</strong><p>模型未按 edit_file 或 SEARCH/REPLACE 格式返回，缩进丢失，或上下文窗口截断了关键代码。</p><strong>处理</strong><p>查看 repair_logs；保留 <code>--diff_format</code> 与 <code>--gen_and_process</code>，增大 context_window 或更换稳定模型，不要手写修补 output.jsonl。</p></div></details>
          <details><summary><span>07</span>回归 / 复现测试运行失败但补丁本身没问题<ChevronRight /></summary><div><strong>原因</strong><p>SWE-bench 环境、Modal / Docker 资源、数据集字段或测试选择脚本可能与当前平台不匹配。</p><strong>处理</strong><p>把 Agentless 候选生成与测试执行分开排障；先确认原始仓库测试可运行，再评价补丁。必要时减少 num_workers。</p></div></details>
          <details><summary><span>08</span>成本或 token 统计缺失<ChevronRight /></summary><div><strong>原因</strong><p>只有模型生成阶段的 output.jsonl 能直接交给 cost.py；测试执行结果文件不是同一格式。</p><strong>处理</strong><p>对 localization、repair、test generation 各自的 output.jsonl 分别统计；外层系统另存模型价格表和运行时长。</p></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="最大风险：把研究流水线误当生产平台" intro="Agentless 的设计简洁、论文价值高，但它的工程边界也非常清楚：依赖、沙箱、权限、密钥和交付都要外部补齐。" />
          <div className="risk-grid">
            <div className="risk-card high"><span>高</span><h3>依赖时间漂移</h3><p>requirements.txt 未锁版本，且直接跟踪 SWE-bench Git 主分支。没有锁文件时，同一 tag 在不同日期可能装出不能运行的环境。</p></div>
            <div className="risk-card high"><span>高</span><h3>不是开箱 Issue bot</h3><p>原生输入是 SWE-bench 实例；把任意 GitHub Issue 接入需要外层适配、仓库准备、权限审批和结果验收。</p></div>
            <div className="risk-card high"><span>高</span><h3>模型输出与测试都不等于合并许可</h3><p>补丁通过项目内选择流程后，仍可能语义错误、破坏兼容性或引入安全问题；CI 与人工审阅不可省略。</p></div>
            <div className="risk-card medium"><span>中</span><h3>结果文件泄漏</h3><p>loc_outputs、repair output、日志与 all_preds 可能包含私有源码、路径和模型输出；需要限权、保留期和脱敏。</p></div>
            <div className="risk-card medium"><span>中</span><h3>旧 API 维护面</h3><p>项目最近提交集中在 2024 年；v1.5.0 的 OpenAI、Modal、SWE-bench API 都需要随生态升级重新核验。</p></div>
            <div className="risk-card low"><span>治理</span><h3>基准成绩不可直接迁移</h3><p>官方 SWE-bench 成绩依赖历史模型、预算、数据集与论文设置；不能直接承诺私有仓库修复率。</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />升级 / 迁移流程</h3><ol><li>固定 v1.5.0、commit、Python、依赖锁和结果哈希。</li><li>升级前先确认 SWE-bench、Modal、OpenAI SDK 与数据集字段变化。</li><li>用同一 target_id 比较新旧环境的定位、候选数、成本与最终补丁。</li><li>保留旧虚拟环境和 results/，直到新路线通过完整验收。</li><li>若需要活跃平台能力，把它作为模块评估，不要等待它长出完整工厂治理。</li></ol></div>
            <div><h3><CircleDollarSign />备份与成本控制</h3><ul><li>备份源码包哈希、依赖锁、运行命令、结果 JSONL 和模型 / 数据集版本；不备份明文密钥。</li><li>先用 target_id 与较少样本烟测，再扩大 num_threads、num_samples 和 num_workers。</li><li>使用 dev/util/cost.py 分阶段统计 token 与估算成本；provider 侧另设预算告警。</li><li>results/、embedding/、playground/ 可能迅速增大；纳入磁盘配额与清理策略。</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="主要来源与核验范围" intro={`官方事实核验日期：${VERIFY_DATE}。官方 benchmark 成绩保留在其历史语境中；本次实测只覆盖源码包、依赖兼容与 CLI 入口。`} />
        <div className="source-list">
          <a href="https://github.com/OpenAutoCoder/Agentless" target="_blank" rel="noreferrer"><span>01</span><div><strong>官方 GitHub 仓库</strong><p>README、MIT、源码结构与维护信号</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/releases/tag/v1.5.0" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v1.5.0</strong><p>2024-10-29；Lite / Verified artifacts</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md" target="_blank" rel="noreferrer"><span>03</span><div><strong>官方 SWE-bench 复现说明</strong><p>定位、修复、测试、rerank 与成本命令</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/requirements.txt" target="_blank" rel="noreferrer"><span>04</span><div><strong>官方 requirements.txt</strong><p>未锁定依赖；swebench 跟踪 Git 主分支</p></div><ArrowUpRight /></a>
          <a href="https://arxiv.org/abs/2407.01489" target="_blank" rel="noreferrer"><span>05</span><div><strong>Agentless 论文</strong><p>三阶段设计与 benchmark 语境</p></div><ArrowUpRight /></a>
          <a href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite" target="_blank" rel="noreferrer"><span>06</span><div><strong>SWE-bench Lite</strong><p>官方默认数据集</p></div><ArrowUpRight /></a>
          <a href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified" target="_blank" rel="noreferrer"><span>07</span><div><strong>SWE-bench Verified</strong><p>官方支持的另一数据集</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/tree/v1.5.0/agentless" target="_blank" rel="noreferrer"><span>08</span><div><strong>agentless 源码目录</strong><p>fl、repair、test、util 的入口与数据契约</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>没有写成结论的内容：</strong>未调用 OpenAI / DeepSeek 模型，未执行真实 Issue 修复，未运行 SWE-bench Lite / Verified 端到端，未复现官方分数，也未验证云端评测资源。页面中的基准命令来自官方资料；依赖锁与 CLI 可用性是本次实测。</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="继续浏览"><Link to="/"><ArrowLeft />返回可搜索方案库</Link><Link to="/solutions/swe-agent"><span>对比阅读<small>SWE-agent v1.1.0 · 自由工具循环路线</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
