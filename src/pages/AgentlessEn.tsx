import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { AgentlessArchitectureDiagramEn, AgentlessDataEventDiagramEn, AgentlessDeploymentDiagramEn, AgentlessWorkflowDiagramEn } from '../components/AgentlessDiagramsEn'
import { agentlessDeploySkillEn } from '../data/deploySkillsEn'

const VERIFY_DATE = '2026-11-22'
const VERSION = 'v1.5.0'
const TAG_COMMIT = 'b150f28465a77a81a7f4776384957a4271f5bd69'

const INSTALL_CODE = `mkdir -p /srv/agent-factory/{workspace,runs,vendor}
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
python dev/util/cost.py --help`

const ENV_CODE = `# The official example uses OpenAI; inject secrets through the host process
# environment or a secret manager.
export OPENAI_API_KEY='injected-by-a-secret-manager'

# The DeepSeek backend in the source also reuses the OpenAI-compatible client.
# Unless util/api_requests.py is changed, it still reads OPENAI_API_KEY.
# Do not assume that writing a third-party key as DEEPSEEK_API_KEY is enough.

# Benchmark runs also need Hugging Face dataset access. Do not treat dataset
# caches, results/, or playground/ as public directories.`

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
PY`

const AUTOMATION_CODE = `#!/usr/bin/env bash
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
# scheduler. Process exit and all_preds.jsonl alone do not prove repair success.`

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
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? 'Link copied' : 'Copy page link'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'pinned', label: 'A · Compatible environment', title: 'Reproduce the historical dependency combination verified here', yaml: '# Key fact: the official requirements.txt is unpinned\n# swebench tracks the Git main branch; a direct install on 2026-11-22 resolved SWE-bench 5.2\n# Verified combination: swebench==2.1.8 + modal==0.77.0', run: INSTALL_CODE, note: 'This is the only route with installation-level verification here: source compilation, pip check, and 11 CLI help entry points passed. No model call, SWE-bench run, or real Issue repair was executed.' },
    { id: 'localize', label: 'B · Hierarchical localization', title: 'Official file-level, element-level, and line-level localization', yaml: '# Input: SWE-bench Lite / Verified\n# Output: file_level_combined/combined_locs.jsonl\n# --target_id can restrict the run to one instance', run: LOCALIZE_CODE, note: 'File-level localization combines LLM output with embedding retrieval; related_level finds classes, functions, and globals; fine_grain_line_level samples several edit intervals. Real runs call a model and download datasets.' },
    { id: 'repair', label: 'C · Multi-sample repair', title: 'Generate parseable patches from localized context', yaml: '# Official example: 4 location sets x 10 samples\n# Edit format: --cot --diff_format --gen_and_process\n# Output: repair_sample_i/output.jsonl and output_i_processed.jsonl', run: REPAIR_CODE, note: 'repair.py assembles the issue, localized file fragments, and context windows into prompts, then parses edit_file or SEARCH/REPLACE output. More candidates do not imply higher quality; validation and selection are essential.' },
    { id: 'validate', label: 'D · Validation and selection', title: 'Regression tests, reproduction tests, and majority voting', yaml: '# Regression: find tests that pass in the original repository\n# Reproduction: generate tests and first verify they reproduce the issue\n# Selection: --deduplicate --regression --reproduction', run: VALIDATION_CODE, note: 'rerank.py normalizes and deduplicates patches, preferring fewer regression failures and a passing reproduction test. If no candidate passes both, it falls back to regression-only candidates. External CI remains mandatory.' },
    { id: 'audit', label: 'E · Cost and evidence', title: 'Turn JSONL into auditable results', yaml: '# cost.py reads output.jsonl without calling a model\n# all_preds.jsonl is the prediction file for external evaluation', run: AUDIT_CODE, note: 'The official dev/util/cost.py estimates token usage and cost per phase. A factory integration should also preserve dependency locks, commands, dataset versions, model names, sample counts, and result hashes.' },
  ]
  return <RouteTabs tabs={tabs} initialId="pinned" ariaLabel="Agentless deployment and reproduction routes">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id} route notes`} code={current.yaml} language="yaml" />
      <CodeBlock title={`Run the ${current.id} route`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function AgentlessEn() {
  return <PageShell>
    <article className="detail-page agentless-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/en"><ArrowLeft size={16} /> Library</Link><ChevronRight size={14} /><span>Agentless</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 04 · FIXED PIPELINE</div>
            <h1><span>Agentless</span><br />Turn an Issue into a<br /><span className="highlight-blue">candidate patch</span> without a free tool loop</h1>
            <p className="hero-lead">Agentless takes the opposite path: instead of letting a model decide which tool to use next, it splits software repair into hierarchical localization, multi-sample repair, and patch validation plus selection. It is an auditable research pipeline, not a complete factory platform.</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/en/solutions/agentless', hash: '#deploy' }}>Open the reproduction guide <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/OpenAutoCoder/Agentless" target="_blank" rel="noreferrer">Official repository <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">BOTTOM LINE</p><h2>Strong for studying a less agentic repair pipeline,<br />not an out-of-the-box factory base.</h2><ul><li><Check size={17} />Clear three-phase structure and stable JSONL interfaces</li><li><Check size={17} />Official end-to-end SWE-bench reproduction guide</li><li><Check size={17} />Readable, independently reviewable patch selection</li><li><XCircle size={17} />Unpinned dependencies already drifted by 2026</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>Version checked</dt><dd>{VERSION} <small>Released 2024-10-29</small></dd></div>
          <div><dt>Tag commit</dt><dd><code>{TAG_COMMIT.slice(0, 8)}</code> <small>GitHub tag metadata</small></dd></div>
          <div><dt>Runtime baseline</dt><dd>Python 3.11 <small>Official conda example</small></dd></div>
          <div><dt>Repository signal</dt><dd>2.1k stars <small>GitHub API, 2026-11-22</small></dd></div>
          <div><dt>Facts verified</dt><dd>{VERIFY_DATE} <small>Time-sensitive facts use this date</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>Read the official score in benchmark context.</strong><p>The official README records v1.0 fixing 82 SWE-bench Lite issues (27.3%) at an average cost of about $0.34 per issue; v1.5.0 is the current official release and provides Lite plus Verified artifacts. This analysis did not rerun models or benchmarks, so those are historical official claims, not measurements from this site.</p></div><SourceLink href="https://github.com/OpenAutoCoder/Agentless/releases/tag/v1.5.0">Official v1.5.0 release</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="Three fixed phases replace free exploration" intro="Agentless derives its architectural value from constraint: an open-ended tool loop becomes a predictable program. Models still generate key content, but the code owns flow control." />
        <AgentlessArchitectureDiagramEn />
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README.md">Official README</SourceLink><SourceLink href="https://arxiv.org/abs/2407.01489">Agentless paper</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/tree/v1.5.0/agentless">Official source tree</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="From Issue to all_preds: a research pipeline" intro="Localization, repair, and validation each persist JSONL. Every phase can be rerun, audited, or replaced independently, which makes failure attribution easier than in a black-box Agent loop." />
          <AgentlessWorkflowDiagramEn />
          <div className="explanation-grid">
            <div className="text-block"><h3>Hierarchical localization reduces context noise</h3><p>It finds files first, then related classes, functions, and globals, and only then edit lines. Compared with sending the whole repository to a model, the context is smaller and the reason the model saw particular code is easier to inspect.</p></div>
            <div className="text-block"><h3>Validation and selection are not final acceptance</h3><p>Regression and reproduction tests choose one candidate from many. They do not prove semantic correctness and do not replace project CI, code review, or human merge.</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="Localization, generation, execution, and selection stay separate" intro="The source has no complex Agent abstraction layer; each entry script is part of the pipeline. Understand which JSONL each script reads and writes, and an outer system can integrate it." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">Agentless core component responsibilities</caption><thead><tr><th>Component</th><th>Input</th><th>Responsibility</th><th>What it does not do</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">fl/localize.py</span></th><td>SWE-bench instance, repository structure</td><td>File-level, related-element, and fine-grained line localization; supports merge and target_id.</td><td>Does not generate the final patch.</td></tr>
            <tr><th><span className="component-chip green">fl/retrieve.py + combine.py</span></th><td>Irrelevant-folder output, model locations</td><td>Adds embedding-retrieved files and merges model plus retrieval candidates at top_n.</td><td>Does not guarantee that top_n contains the true fault.</td></tr>
            <tr><th><span className="component-chip yellow">repair/repair.py</span></th><td>loc_file, issue text, context window</td><td>Samples patches, parses edit_file or SEARCH/REPLACE, and creates normalized patches.</td><td>Does not run tests or judge business correctness.</td></tr>
            <tr><th><span className="component-chip pink">test/*.py</span></th><td>Candidate patches, dataset, selected tests</td><td>Selects regression tests, runs patch tests, and generates plus filters reproduction tests.</td><td>Does not replace full CI or official SWE-bench evaluation.</td></tr>
            <tr><th><span className="component-chip blue">repair/rerank.py</span></th><td>Normalized patches + both test results</td><td>Deduplicates, filters by regression / reproduction outcomes, and majority-votes all_preds.jsonl.</td><td>Does not merge automatically or explain patch semantics.</td></tr>
            <tr><th><span className="component-chip green">util/model.py</span></th><td>model + backend</td><td>Wraps OpenAI and DeepSeek chat completions and records token usage.</td><td>Does not manage key rotation, budget alerts, or provider failover.</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/fl/localize.py">Localization entry</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/repair/repair.py">Repair entry</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/repair/rerank.py">Selection entry</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="JSONL is both evidence chain and integration interface" intro="Agentless has no unified trace viewer; each phase has its own JSONL and log directory. The format is simple, but an outer system must index, redact, and retain it." />
          <AgentlessDataEventDiagramEn />
          <div className="code-with-note"><CodeBlock title="Inspect result files and fields" code={RESULT_CODE} language="bash" /><div className="sticky-explanation"><strong>Run fingerprints to preserve</strong><ul><li>Source tag, commit, dependency lock, and Python version.</li><li>Dataset name, target_id, model, backend, sample count, and temperature.</li><li>Every output_file, log directory, and the final all_preds.jsonl hash.</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="Correct factory role: candidate patch generator" intro="Agentless can become the localization and candidate-patch module, but it should not own repository write access, production execution, or merge permission." />
        <div className="factory-conveyor" aria-label="Complete software factory pipeline">
          <div className="conveyor-step external"><span>Outer system</span><GitPullRequest /><strong>Intake</strong><p>Issue approval <ArrowRight className="inline-arrow" aria-hidden="true" /> benchmark instance mapping</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Agentless</span><Layers3 /><strong>Localize and repair</strong><p>Hierarchical localization <ArrowRight className="inline-arrow" aria-hidden="true" /> candidates</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Agentless</span><FileCheck2 /><strong>Validate and select</strong><p>Regression + reproduction <ArrowRight className="inline-arrow" aria-hidden="true" /> all_preds</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>Outer system</span><Shield /><strong>Quality and delivery</strong><p>Clean CI <ArrowRight className="inline-arrow" aria-hidden="true" /> review <ArrowRight className="inline-arrow" aria-hidden="true" /> merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />Especially suitable for</h3><ul><li>Studying automatic repair without a free tool loop.</li><li>Teams needing clear phase boundaries, JSONL intermediates, and independently rerunnable scripts.</li><li>Reproducing SWE-bench Lite / Verified historical experiments.</li><li>Comparing models on the same fixed pipeline for patch quality and cost.</li><li>A candidate patch generator inside an outer factory, not the final decision maker.</li></ul></div>
          <div className="fit-column no"><h3><XCircle />Not a direct fit for</h3><ul><li>An out-of-the-box GitHub Issue repair bot.</li><li>Platforms needing mature sandbox scheduling, approval, audit, and multi-tenant governance.</li><li>Teams unwilling to manage historical dependency pins and benchmark drift.</li><li>Unattended pipelines without model budgets, evaluation capacity, and human review.</li><li>“Install and modify any repository” expectations; native input is a SWE-bench-style instance.</li></ul></div>
        </div>
        <SourceStrip><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md">Official SWE-bench guide</SourceLink><SourceLink href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite">SWE-bench Lite</SourceLink><SourceLink href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified">SWE-bench Verified</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="Fix dependency drift before attempting benchmark reproduction" intro="Agentless v1.5.0 has an official requirements.txt that tracks SWE-bench Git main directly; in 2026 that is no longer reproducible. Official installation material and the compatibility pins verified here are labeled separately below." />
          <div className="verification-stamp"><PackageCheck /><div><strong>Checks actually executed for this analysis</strong><p>The official <code>v1.5.0</code> source archive was downloaded and checked against tag commit <code>b150f284</code>; installation, <code>compileall</code>, <code>pip check</code>, and 11 CLI help entry points passed in an isolated Python 3.11 environment. A direct install of the unpinned requirements resolved <code>swebench 5.2</code>, which failed when <code>run_regression_tests.py</code> imported <code>KEY_INSTANCE_ID</code>. The final verified compatibility combination was <code>swebench==2.1.8</code> with <code>modal==0.77.0</code>. <b>No model call, real Issue repair, or SWE-bench evaluation was executed.</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>Dependencies and versions</h3><dl>
              <div><dt>Python</dt><dd><strong>3.11</strong><span>Official conda example; verified in isolation</span></dd></div>
              <div><dt>Source version</dt><dd><strong>v1.5.0</strong><span>Tag commit b150f284</span></dd></div>
              <div><dt>Official dependencies</dt><dd><strong>Unpinned</strong><span>swebench tracks Git main</span></dd></div>
              <div><dt>Verified compatibility pins</dt><dd><strong>swebench 2.1.8</strong><span>With modal 0.77.0</span></dd></div>
              <div><dt>Model backends</dt><dd><strong>openai / deepseek</strong><span>Source choices; openai is default</span></dd></div>
              <div><dt>Datasets</dt><dd><strong>Lite / Verified</strong><span>Hugging Face datasets</span></dd></div>
              <div><dt>Ports</dt><dd><strong>No persistent port</strong><span>CLI batch pipeline; evaluation runtime is separate</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>Suggested directories and ownership</h3><pre>{`/srv/agent-factory/\n├── .venv/                  # Isolated Python 3.11 environment\n├── vendor/Agentless/       # Pinned v1.5.0 source\n├── workspace/              # Disposable repository copies prepared outside\n├── results/                # Official benchmark output and JSONL evidence\n└── runs/                   # Outer scheduler and audit inputs for this guide\n\nModel key: host process environment or secret manager\nplayground/ and embedding/: default inside the source tree; move them to a controlled workspace for production integration`}</pre><p><strong>Key boundary:</strong> the Agentless scripts provide a pipeline, not modern sandbox governance. Real repository checkout, dependency installation, command execution, and test runs belong to a controlled outer environment.</p></div>
          </div>
          <CodeBlock title="01 · Install, pin, and entry-point smoke checks" code={INSTALL_CODE} />
          <CodeBlock title="02 · Model secret boundary" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="Command sources"><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/requirements.txt">Official requirements</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md">Official benchmark commands</SourceLink><SourceLink href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/agentless/util/model.py">Model backend source</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="Hand this deployment manual directly to an AI Agent" intro="A complete SKILL.md instruction set: frontmatter defines the use case, while the body includes version pinning, route selection, exact commands, secret boundaries, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it." />
          <DeploySkillCard skill={agentlessDeploySkillEn} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="Automation: build an instance adapter before running the pipeline" intro="Agentless natively reads SWE-bench dataset fields; it does not subscribe to GitHub Issues. An outer factory must map an approved Issue to instance_id, repo, base_commit, and problem_statement, then prepare a disposable workspace." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">Stage boundaries for Agentless patch validation and selection</caption><thead><tr><th>Stage</th><th>Inputs and controls</th><th>Output or responsibility</th><th>Explicit boundary</th></tr></thead><tbody>
            <tr><th><span className="component-chip yellow">candidates</span></th><td>Multiple location sets × samples per location</td><td>Generates a parseable set of candidate patches.</td><td>Candidate volume implies neither quality nor final delivery.</td></tr>
            <tr><th><span className="component-chip blue">normalize</span></th><td>normalize_patch and equivalent-patch rules</td><td>Normalizes and deduplicates equivalent candidates.</td><td>Deduplication reduces repetition but does not prove business correctness.</td></tr>
            <tr><th><span className="component-chip green">regression</span></th><td>Regression results and failed-test counts</td><td>Prefers candidates with fewer regression failures.</td><td>Regression filtering does not replace full project CI.</td></tr>
            <tr><th><span className="component-chip pink">reproduction</span></th><td>The selected reproduction test and its result</td><td>Prefers candidates passing the reproduction test.</td><td>Without a dual-pass candidate, selection falls back to regression-only results.</td></tr>
            <tr><th><span className="component-chip blue">majority-vote</span></th><td>Vote counts, generation order, and patch length</td><td>Selects by votes; ties prefer earlier and shorter patches.</td><td>rerank.py only selects; external CI and human review decide delivery.</td></tr>
          </tbody></table>
        </div>
        <div className="automation-layout"><CodeBlock title="03 · Minimal outer-scheduler gate example" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>Answer these before integration</h3><ol><li><span>1</span><p><strong>How is input mapped?</strong> An arbitrary GitHub Issue must become a SWE-bench-style instance; an Issue URL alone is not enough.</p></li><li><span>2</span><p><strong>Where does the repository live?</strong> Official scripts process structure from repo and base_commit in playground/; isolate that directory explicitly in production.</p></li><li><span>3</span><p><strong>What counts as success?</strong> all_preds.jsonl is only a candidate prediction; clean-environment tests, code scanning, and human review remain delivery gates.</p></li><li><span>4</span><p><strong>Who can trigger?</strong> Issue text is untrusted; public-repository automation should require maintainer approval before a budget-limited run.</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>Model secret boundary:</strong> the DeepSeek backend in the source reuses the OpenAI-compatible client and, unless changed, still reads <code>OPENAI_API_KEY</code>. Do not place several providers’ long-lived keys in one runtime merely to make configuration appear correct.</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="Acceptance: prove repeatability before repair capability" intro="For Agentless, the first gate is not model quality; it is whether the 2026 environment can still be installed reproducibly, whether entry points load, and whether evidence files are complete." />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>Repeatable version</strong><p>Tag is v1.5.0, commit is b150f284, and the pip freeze plus source archive hash are saved.</p></div></li>
            <li><span>02</span><div><strong>No dependency drift</strong><p>Pin swebench==2.1.8 and modal==0.77.0 explicitly; pip check passes.</p></div></li>
            <li><span>03</span><div><strong>Entry points load</strong><p>Help commands pass for localize, retrieve, combine, repair, rerank, test, and cost scripts.</p></div></li>
            <li><span>04</span><div><strong>Secrets stay in bounds</strong><p>Model keys are host-injected; Git, YAML, result files, and logs contain no plaintext key.</p></div></li>
            <li><span>05</span><div><strong>Scope can be narrowed</strong><p>First real runs use --target_id, a lower max_samples value, and a controlled dataset slice.</p></div></li>
            <li><span>06</span><div><strong>Evidence is traceable</strong><p>JSONL, logs, model name, temperature, sample counts, and dataset versions can be replayed per phase.</p></div></li>
            <li><span>07</span><div><strong>Patch is reviewable</strong><p>all_preds.jsonl has at most one patch per instance; applying it to a clean copy passes project tests.</p></div></li>
            <li><span>08</span><div><strong>Evaluation and merge are separate</strong><p>SWE-bench / CI run outside Agentless; the Agent receives no push or merge permission.</p></div></li>
          </ol>
          <AgentlessDeploymentDiagramEn />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="Common failures: check dependency age before pipeline input" intro="The largest issue found in this verification was not the model; it was the unpinned official dependency set. Dataset, backend, localization, and test execution come after that." />
        <div className="trouble-list">
          <details open><summary><span>01</span>Importing swebench fails because KEY_INSTANCE_ID is missing<ChevronRight /></summary><div><strong>Cause</strong><p>The official requirements track SWE-bench Git main; a direct install here resolved 5.2, while Agentless v1.5.0 still imports an older API.</p><strong>Action</strong><p>Install <code>swebench==2.1.8</code> and <code>modal==0.77.0</code> in the same virtual environment, then rerun pip check and every CLI help entry point.</p></div></details>
          <details><summary><span>02</span>The modal.Mount attribute is missing<ChevronRight /></summary><div><strong>Cause</strong><p>Newer Modal releases migrated the old Mount API; SWE-bench 2.1.8 still references it.</p><strong>Action</strong><p>Do not pin swebench alone; pin <code>modal==0.77.0</code> as well and let pip resolve compatible click, grpclib, protobuf, and synchronicity versions.</p></div></details>
          <details><summary><span>03</span>OPENAI_API_KEY is missing, returns 401, or the model is rejected<ChevronRight /></summary><div><strong>Cause</strong><p>The official example reads the OpenAI-style environment variable; provider account, model name, or base URL can each fail independently.</p><strong>Action</strong><p>Check variable presence without printing the secret; start with an officially listed model such as <code>gpt-4o-2024-05-13</code> or <code>gpt-4o-mini-2024-07-18</code>, then modify the source only if another provider is required.</p></div></details>
          <details><summary><span>04</span>deepseek-coder fails the backend assertion<ChevronRight /></summary><div><strong>Cause</strong><p>Entry scripts require DeepSeek models to pass <code>--backend deepseek</code> explicitly.</p><strong>Action</strong><p>Use <code>--model deepseek-coder --backend deepseek</code> together. Note that the current source still uses the OpenAI-compatible client and reads OPENAI_API_KEY by default.</p></div></details>
          <details><summary><span>05</span>Localization output is empty or found_files looks wrong<ChevronRight /></summary><div><strong>Cause</strong><p>Repository structure was not generated, target_id is absent from the dataset, top_n is too small, or retrieval filtering removed too much.</p><strong>Action</strong><p>Check instance_id, base_commit, PROJECT_FILE_LOC, loc_outputs.jsonl, and localization_logs. Run file_level before related and fine_grain stages.</p></div></details>
          <details><summary><span>06</span>Repair output cannot be parsed into a patch<ChevronRight /></summary><div><strong>Cause</strong><p>The model did not follow edit_file or SEARCH/REPLACE formatting, indentation was lost, or the context window truncated relevant code.</p><strong>Action</strong><p>Read repair_logs; keep <code>--diff_format</code> and <code>--gen_and_process</code>, increase context_window, or use a more stable model. Do not hand-edit output.jsonl to hide a parser failure.</p></div></details>
          <details><summary><span>07</span>Regression / reproduction execution fails even though the patch is plausible<ChevronRight /></summary><div><strong>Cause</strong><p>The SWE-bench environment, Modal / Docker resources, dataset fields, or test selection may not match the current platform.</p><strong>Action</strong><p>Debug candidate generation separately from test execution; prove that original-repository tests run before judging the patch. Reduce num_workers if needed.</p></div></details>
          <details><summary><span>08</span>Cost or token statistics are missing<ChevronRight /></summary><div><strong>Cause</strong><p>Only model-generation phase output.jsonl files can be passed directly to cost.py; test result files use another format.</p><strong>Action</strong><p>Run cost.py separately for localization, repair, and test generation outputs; store model pricing and wall-clock duration in the outer system.</p></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="The biggest risk is treating a research pipeline as a production platform" intro="Agentless is simple and academically valuable, but its engineering boundary is equally clear: dependencies, sandboxes, permissions, secrets, and delivery all need external systems." />
          <div className="risk-grid">
            <div className="risk-card high"><span>High</span><h3>Dependency time drift</h3><p>requirements.txt is unpinned and tracks SWE-bench Git main. Without a lock, the same tag can install a broken environment on a different date.</p></div>
            <div className="risk-card high"><span>High</span><h3>Not an out-of-the-box Issue bot</h3><p>Native input is a SWE-bench instance. Arbitrary GitHub Issues require an outer adapter, repository preparation, permission approval, and result acceptance.</p></div>
            <div className="risk-card high"><span>High</span><h3>Model output and tests are not merge permission</h3><p>A patch selected by the pipeline can still be semantically wrong, incompatible, or unsafe; CI and human review are mandatory.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Result-file leakage</h3><p>loc_outputs, repair output, logs, and all_preds can contain private source, paths, and model output; restrict access, retention, and redaction.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Legacy API maintenance surface</h3><p>Recent project commits are concentrated in 2024; OpenAI, Modal, SWE-bench, and dataset-field changes require fresh verification.</p></div>
            <div className="risk-card low"><span>Governance</span><h3>Benchmark scores do not transfer automatically</h3><p>Official SWE-bench results depend on historical models, budgets, datasets, and paper settings; they do not promise the same private-repository repair rate.</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />Upgrade / migration procedure</h3><ol><li>Pin v1.5.0, its commit, Python, dependency lock, and result hashes.</li><li>Before upgrades, check SWE-bench, Modal, OpenAI SDK, and dataset-field changes.</li><li>Compare old and new environments on the same target_id for localization, candidate count, cost, and final patch.</li><li>Retain the old virtual environment and results/ until the new route passes full acceptance.</li><li>If active platform capabilities are required, evaluate Agentless as a module rather than waiting for it to grow factory governance.</li></ol></div>
            <div><h3><CircleDollarSign />Backup and cost control</h3><ul><li>Back up source archive hashes, dependency locks, commands, result JSONL, and model / dataset versions; do not back up plaintext secrets.</li><li>Smoke-test with target_id and fewer samples before expanding num_threads, num_samples, and num_workers.</li><li>Use dev/util/cost.py per phase for token and estimated cost; add provider-side budget alerts.</li><li>results/, embedding/, and playground/ can grow quickly; include disk quotas and cleanup policy.</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="Primary sources and verification scope" intro={`Official facts were checked on ${VERIFY_DATE}. Official benchmark scores remain in their historical context; the hands-on check here covers only the source archive, dependency compatibility, and CLI entry points.`} />
        <div className="source-list">
          <a href="https://github.com/OpenAutoCoder/Agentless" target="_blank" rel="noreferrer"><span>01</span><div><strong>Official GitHub repository</strong><p>README, MIT license, source structure, and maintenance signal</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/releases/tag/v1.5.0" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v1.5.0</strong><p>2024-10-29; Lite / Verified artifacts</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/README_swebench.md" target="_blank" rel="noreferrer"><span>03</span><div><strong>Official SWE-bench reproduction guide</strong><p>Localization, repair, testing, rerank, and cost commands</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/blob/v1.5.0/requirements.txt" target="_blank" rel="noreferrer"><span>04</span><div><strong>Official requirements.txt</strong><p>Unpinned dependencies; swebench tracks Git main</p></div><ArrowUpRight /></a>
          <a href="https://arxiv.org/abs/2407.01489" target="_blank" rel="noreferrer"><span>05</span><div><strong>Agentless paper</strong><p>Three-phase design and benchmark context</p></div><ArrowUpRight /></a>
          <a href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite" target="_blank" rel="noreferrer"><span>06</span><div><strong>SWE-bench Lite</strong><p>Official default dataset</p></div><ArrowUpRight /></a>
          <a href="https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified" target="_blank" rel="noreferrer"><span>07</span><div><strong>SWE-bench Verified</strong><p>The other officially supported dataset</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenAutoCoder/Agentless/tree/v1.5.0/agentless" target="_blank" rel="noreferrer"><span>08</span><div><strong>agentless source tree</strong><p>Entry points and data contracts in fl, repair, test, and util</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>Not claimed as verified:</strong> no OpenAI / DeepSeek model call, real Issue repair, SWE-bench Lite / Verified end-to-end run, official score reproduction, or cloud evaluation resource check was performed. Benchmark commands are official-source material; dependency pins and CLI loading were verified here.</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="Continue browsing"><Link to="/en"><ArrowLeft />Back to the searchable library</Link><Link to="/en/solutions/swe-agent"><span>Compare with<small>SWE-agent v1.1.0 · Free tool-loop route</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
