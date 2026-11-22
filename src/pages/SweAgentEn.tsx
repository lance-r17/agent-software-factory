import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { SweArchitectureDiagram, SweDataEventDiagram, SweDeploymentDiagram, SweWorkflowDiagram } from '../components/SweAgentDiagramsEn'
import { sweAgentDeploySkillEn } from '../data/deploySkillsEn'

const VERIFY_DATE = '2026-11-21'

const INSTALL_CODE = `# Officially recommended route: editable installation from source
mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
cd /srv/agent-factory
python3.11 -m venv .venv
source .venv/bin/activate

git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
cd vendor/SWE-agent
git rev-parse HEAD   # Checked here: 0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
python -m pip install --upgrade pip
python -m pip install --editable .

# Verify package and CLI entry points only; this starts no Docker and calls no model
sweagent --help
python -m sweagent run --help`

const ENV_CODE = `# Prefer host process environment or a secret manager; never write keys to YAML or Git
export ANTHROPIC_API_KEY='injected-by-a-secret-manager'
export OPENAI_API_KEY='injected-by-a-secret-manager'

# Public repositories normally do not need GITHUB_TOKEN.
# If a private repository is unavoidable, prefetch it on the host and pass it as
# a local repo; do not put a long-lived token into a clone URL inside an untrusted container.

# Optional: .env can also be read, but it must be chmod 600 and listed in .gitignore.
# This guide prefers process environment and does not create .env.`

const DOCKER_YAML = `# /srv/agent-factory/factory.docker.yaml
# Load together with the default config/default.yaml; override only security boundaries and task input
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
  text: 'Reproduce first, make the smallest fix, and run related tests. Do not commit, push, or use the network.'
agent:
  model:
    name: claude-3-7-sonnet-latest
    per_instance_cost_limit: 2.00
    total_cost_limit: 5.00
  tools:
    execution_timeout: 30
    install_timeout: 300
    total_execution_timeout: 1800
    max_consecutive_execution_timeouts: 3`

const DOCKER_RUN = `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11

# SWE-ReX uploads the repository from host to container, so docker_args can disable networking
sweagent run \\
  --config config/default.yaml \\
  --config /srv/agent-factory/factory.docker.yaml \\
  --output_dir /srv/agent-factory/runs/docker-single`

const MODAL_RUN = `# For hosts without Docker where code may enter a cloud sandbox
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# Complete Modal authentication and environment checks first; Modal is not built into SWE-agent
modal token new
cat > /srv/agent-factory/runs/task.md <<'EOF'
Reproduce first, make the smallest fix, and run related tests. Do not commit or push.
EOF

sweagent run \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --env.deployment.type=modal \\
  --env.repo.path=/srv/agent-factory/workspace/project \\
  --problem_statement.path=/srv/agent-factory/runs/task.md \\
  --output_dir=/srv/agent-factory/runs/modal-single`

const BATCH_RUN = `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# Smoke-test 3 instances first; expand slice / workers only after checking cost, traces, and container load
sweagent run-batch \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --instances.type=swe_bench \\
  --instances.subset=lite \\
  --instances.split=dev \\
  --instances.slice=:3 \\
  --num_workers=3 \\
  --output_dir=/srv/agent-factory/runs/swebench-smoke

# Rebuild preds.json in the experiment directory if it is stale or missing
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke`

const INSPECT_CODE = `# Inspect one trajectory in the terminal
sweagent inspect /srv/agent-factory/runs/docker-single/**/*.traj

# Browse an experiment directory; when bound locally by default, open it through 127.0.0.1
sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001

# Summarize exit status, cost, and API calls
sweagent quick-stats /srv/agent-factory/runs/docker-single`

const AUTOMATION_CODE = `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT/vendor/SWE-agent"
source "$ROOT/.venv/bin/activate"

# The outer system fetches the Issue and stores it as text; all Issue content is untrusted input
gh issue view 123 --repo "$GITHUB_REPOSITORY" > "$ROOT/runs/$RUN_ID.md"
git -C "$ROOT/workspace/project" status --porcelain | grep -q . && exit 2

# Reuse hardened Docker configuration; model key stays on host and GitHub Token stays out of the container
sweagent run \\
  --config config/default.yaml \\
  --config "$ROOT/factory.docker.yaml" \\
  --problem_statement.path="$ROOT/runs/$RUN_ID.md" \\
  --output_dir="$ROOT/runs/$RUN_ID"

# Process exit is not repair success: inspect trajectory, then patch, then let CI and humans decide
python - <<'PY' "$ROOT/runs/$RUN_ID"
import json, pathlib, sys
run = pathlib.Path(sys.argv[1])
trajs = list(run.rglob('*.traj'))
assert trajs, 'No trajectory file'
info = json.loads(trajs[0].read_text())['info']
assert info.get('exit_status') == 'submitted', info.get('exit_status')
assert info.get('submission'), 'No submission patch'
PY
# Next: apply submission to a clean copy, run full CI, and request human review.`

const TRAJECTORY_CODE = `jq '{
  version: .info.swe_agent_version,
  rex: .info.swe_rex_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission_present: (.info.submission != null),
  steps: (.trajectory | length)
}' runs/docker-single/**/*.traj`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? 'Link copied' : 'Copy page link'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'docker', label: 'A · Hardened Docker', title: 'Recommended legacy route for one-repository reproduction', yaml: DOCKER_YAML, run: DOCKER_RUN, note: 'The repository uses local-repo upload rather than git clone inside the container, so networking can be disabled. This isolates command execution, but SWE-agent 1.x is in maintenance mode: use it to reproduce historical pipelines and study ACI, not as the foundation of a new platform.' },
    { id: 'modal', label: 'B · Modal cloud', title: 'An alternative execution surface without local Docker', yaml: '# This route needs no additional YAML; override deployment and repo through the CLI.\n# Code is uploaded to a Modal sandbox, so confirm your organization’s data boundary first.', run: MODAL_RUN, note: 'Modal removes the local Docker dependency, not secret and data governance. The model key remains on the host for API calls; repository content, command output, and trajectories enter a cloud runtime.' },
    { id: 'batch', label: 'C · Batch benchmarks', title: 'SWE-bench / historical Issue batch processing', yaml: '# Batch instances are specified through CLI parameters.\n# Sources include swe_bench, file, huggingface, and expert_file.', run: BATCH_RUN, note: 'run-batch standardizes batch experiments and preds.json aggregation; it is not an acceptance gate. Smoke-test with slice=:3 and num_workers=3 before scaling.' },
    { id: 'inspect', label: 'D · Trajectory review', title: 'Turn research output into debuggable evidence', yaml: '# No Agent launch is required; read only existing .traj / preds.json / logs.', run: INSPECT_CODE, note: 'The trajectory viewers remain an important reason to use SWE-agent. Before migrating to mini or another framework, compare historical decisions, costs, and failure paths on the same task.' },
  ]
  return <RouteTabs tabs={tabs} initialId="docker" ariaLabel="SWE-agent deployment configuration routes">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id} route configuration`} code={current.yaml} language="yaml" />
      <CodeBlock title={`Run the ${current.id} route`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function SweAgentEn() {
  return <PageShell>
    <article className="detail-page swe-agent-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/en"><ArrowLeft size={16} /> Library</Link><ChevronRight size={14} /><span>SWE-agent</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 03 · LEGACY LINE</div>
            <h1><span>SWE-agent</span><br />A complete ACI research framework<br /><span className="highlight-blue">that has passed the baton</span></h1>
            <p className="hero-lead">This is one of the most historically influential open-source Agent frameworks in the SWE-bench ecosystem: YAML-driven, with replaceable tool bundles and research-oriented trajectories. Its official status belongs up front: mini-SWE-agent has superseded it, and the mainline is in maintenance mode.</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/en/solutions/swe-agent', hash: '#deploy' }}>Open the reproduction guide <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/SWE-agent/SWE-agent" target="_blank" rel="noreferrer">Official repository <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">BOTTOM LINE</p><h2>Useful for historical research and batches,<br />not the default base for a new factory.</h2><ul><li><Check size={17} />Complete ACI and tool-bundle design</li><li><Check size={17} />Mature trajectories, batches, and inspection tools</li><li><Check size={17} />Replaceable Docker / Modal / Fargate backends</li><li><XCircle size={17} />Officially superseded by mini; maintenance mode</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>Version checked</dt><dd>v1.1.0 <small>Released 2025-05-22</small></dd></div>
          <div><dt>Maintenance signal</dt><dd>Official README <small>Recommends mini-SWE-agent instead</small></dd></div>
          <div><dt>Runtime baseline</dt><dd>Python ≥ 3.11 <small>Default Docker python:3.11</small></dd></div>
          <div><dt>License / positioning</dt><dd>MIT <small>Research-oriented ACI framework</small></dd></div>
          <div><dt>Facts verified</dt><dd>{VERIFY_DATE} <small>Time-sensitive facts use this date</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>Why index a solution that has been superseded?</strong><p>Many historical tutorials, SWE-bench pipelines, and ACI studies still point to SWE-agent 1.x. The correct treatment is not to market it as the preferred new deployment, but to mark its maintenance status, preserve a reproducible path, and explain when to move to mini-SWE-agent.</p></div><SourceLink href="https://github.com/SWE-agent/SWE-agent/blob/main/README.md">Official succession notice</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="CLI, Agent, and environment: three layers" intro="SWE-agent 1.x is more complete and heavier than mini: the sweagent CLI assembles runs, Agent makes model and tool decisions, and SWEEnv manages deployment and shell sessions through SWE-ReX." />
        <SweArchitectureDiagram />
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/background/architecture/">Official architecture</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-agent/blob/v1.1.0/sweagent/environment/swe_env.py">SWEEnv source</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-ReX">SWE-ReX execution backend</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="From YAML to submit: a research workflow" intro="Every step is configurable, recordable, and replayable. It trades some simplicity for fine-grained control over prompts, tools, history, and batch experiments." />
          <SweWorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>ACI is SWE-agent’s core legacy</h3><p>It does more than expose bash to a model: tool bundles provide windowed file viewing, search, editing, and submission, with syntax checks before edits. Many later coding Agents inherited this idea that models need a well-designed computer interface.</p></div>
            <div className="text-block"><h3>A complete framework also means more migration surface</h3><p>Templates, tool bundles, parsers, HistoryProcessor, deployment backends, and batch instance sources are all configurable. That is a research advantage but a long-term maintenance burden for new teams, especially now that the official project recommends mini.</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="Who thinks, who executes, who preserves evidence" intro="Follow this line through the source: Agent.forward() creates actions, ToolHandler parses and executes them, SWEEnv owns environment and deployment, and run hooks plus runners aggregate output files." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">SWE-agent core component responsibilities</caption><thead><tr><th>Component</th><th>Input</th><th>Responsibility</th><th>What it does not do</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">sweagent CLI</span></th><td>run / run-batch / inspect</td><td>Parses hierarchical parameters, merges YAML, creates runners; provides trajectory viewing, prediction merging, and statistics.</td><td>Does not include a complete Issue scheduling platform.</td></tr>
            <tr><th><span className="component-chip green">Agent</span></th><td>history + model + tools</td><td>forward() queries the model and handles retries, cost limits, submission, and exceptional exits.</td><td>Does not manage Docker or cloud resources directly.</td></tr>
            <tr><th><span className="component-chip yellow">HistoryProcessor</span></th><td>Complete message history</td><td>Compresses, caches, or rewrites history to control the context entering the model.</td><td>Does not guarantee that compression preserves every fact.</td></tr>
            <tr><th><span className="component-chip pink">ToolHandler / ACI</span></th><td>Tool bundles and action text</td><td>Installs registry / editor / review tools, parses function calling, and executes submit checks.</td><td>Does not inherently block dangerous shell; the deployment layer sets the boundary.</td></tr>
            <tr><th><span className="component-chip blue">SWEEnv + SWE-ReX</span></th><td>deployment + repo</td><td>Starts Docker / Modal / Fargate / local runtimes, copies the repository, and executes shell commands.</td><td>Does not evaluate patch semantics or replace CI acceptance.</td></tr>
            <tr><th><span className="component-chip green">Inspector / preds</span></th><td>.traj / experiment directory</td><td>Views trajectories in terminal or web; quick-stats summarizes; preds.json goes to external evaluation.</td><td>Does not turn “prediction generated” into “repair succeeded.”</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/background/aci/">ACI design</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-agent/tree/v1.1.0/tools">Tool bundle source</SourceLink><SourceLink href="https://swe-agent.com/latest/reference/agent/">Agent reference</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="v1.1.0 makes a key trajectory-format change" intro="The old messages field is replaced by query: each step now stores the exact input seen by the current model. This is the easiest detail to misread in cross-version analysis." />
          <SweDataEventDiagram />
          <div className="code-with-note"><CodeBlock title="Read trajectory acceptance fields" code={TRAJECTORY_CODE} language="bash" /><div className="sticky-explanation"><strong>v1.1.0 migration essentials</strong><ul><li><code>messages</code> becomes <code>query</code>; do not reuse old parsing scripts unchanged.</li><li>Several windowed tool bundles are renamed; old <code>review_on_submit</code> is removed in favor of <code>review_on_submit_m</code>.</li><li>Adds SWE-bench multilingual / multimodal and SWE-smith support.</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="Its correct factory role: research line and historical compatibility layer" intro="SWE-agent is not a bad solution merely because it is older; it is a complete framework succeeded by a smaller successor. Use it where it fits, while pointing new platform defaults toward mini." />
        <div className="factory-conveyor" aria-label="Complete software factory pipeline">
          <div className="conveyor-step external"><span>Outer system</span><GitPullRequest /><strong>Intake</strong><p>Issue / dataset / manual task</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>SWE-agent</span><Layers3 /><strong>Execution</strong><p>ACI tools <ArrowRight className="inline-arrow" aria-hidden="true" /> Edit <ArrowRight className="inline-arrow" aria-hidden="true" /> Self-test</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>SWE-agent</span><FileCheck2 /><strong>Evidence</strong><p>traj + preds + logs</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>Outer system</span><Shield /><strong>Quality & delivery</strong><p>SWE-bench / CI <ArrowRight className="inline-arrow" aria-hidden="true" /> Review <ArrowRight className="inline-arrow" aria-hidden="true" /> merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />Especially suitable for</h3><ul><li>Reproducing 2024–2025 SWE-agent / SWE-bench research and historical pipelines.</li><li>Studying Agent-Computer Interface, tool bundles, prompts, and history-compression strategies.</li><li>Teams needing the run-batch, inspector, merge-preds, and quick-stats experiment toolset.</li><li>Maintaining v1.x YAML configurations or SWE-smith / multilingual evaluation.</li><li>A comparison baseline against mini-SWE-agent: complete framework versus minimal kernel.</li></ul></div>
          <div className="fit-column no"><h3><XCircle />Not a direct fit for</h3><ul><li>The default production Agent base for a new team; the official project recommends mini-SWE-agent.</li><li>Scenarios needing active feature evolution, modern platform governance, and long-term upgrade commitments.</li><li>Unattended pipelines that connect GitHub Issues directly to automatic fixes and automatic merge.</li><li>Strong-compliance identity, approval, audit, tenant isolation, and credential rotation.</li><li>Teams unwilling to maintain Docker / cloud sandboxes, model secrets, and dependency locks.</li></ul></div>
        </div>
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/installation/changelog/">v1.1.0 changes and maintenance status</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/">Successor: mini-SWE-agent</SourceLink><SourceLink href="https://arxiv.org/abs/2405.15793">ACI paper</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="Pin v1.1.0, then choose an execution backend" intro="The official installation preference is editable source installation; PyPI is not a reliable distribution path for this solution at present. Except for the installation and CLI smoke checks, these commands combine official-source guidance with this page’s deployment design." />
          <div className="verification-stamp"><PackageCheck /><div><strong>Checks actually executed for this analysis</strong><p><code>v1.1.0</code> was cloned and checked at commit <code>0f3acaf</code>, installed from source in an isolated temporary directory, and <code>sweagent --help</code>, <code>run --help</code>, <code>run-batch --help</code>, and trajectory-viewer help all ran successfully. <b>The current sandbox has no Docker or model keys, so no real Issue repair, model call, or SWE-bench run was executed.</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>Dependencies and versions</h3><dl>
              <div><dt>Python</dt><dd><strong>≥ 3.11</strong><span>Required by pyproject; example uses 3.11</span></dd></div>
              <div><dt>Core package</dt><dd><strong>sweagent 1.1.0</strong><span>Editable source installation</span></dd></div>
              <div><dt>Execution backend</dt><dd><strong>SWE-ReX ≥ 1.2.0</strong><span>Version 1.4.0 resolved in this check</span></dd></div>
              <div><dt>Default image</dt><dd><strong>python:3.11</strong><span>Docker route; pin tag / digest</span></dd></div>
              <div><dt>Optional backends</dt><dd><strong>Modal / Fargate / local</strong><span>Cloud or unisolated local</span></dd></div>
              <div><dt>Model integration</dt><dd><strong>litellm</strong><span>OpenAI / Anthropic / Together and others</span></dd></div>
              <div><dt>Ports</dt><dd><strong>Inspector web port</strong><span>CLI repair tasks need no persistent port</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>Suggested directories and ownership</h3><pre>{`/srv/agent-factory/\n├── .venv/                 # Host Python environment\n├── vendor/SWE-agent/      # v1.1.0 editable source\n├── factory.docker.yaml    # Network and resource limits\n├── workspace/project/     # Only writable repository copy\n└── runs/                  # task / traj / preds / logs\n\nModel API key: host process environment or secret manager\nGitHub Token: outside container; host prefetches private repos`}</pre><p><strong>Non-editable installation caveat:</strong> without editable source installation, you must additionally set <code>SWE_AGENT_CONFIG_DIR</code>, <code>SWE_AGENT_TOOLS_DIR</code>, and <code>SWE_AGENT_TRAJECTORY_DIR</code>. That is why this page follows the official source route.</p></div>
          </div>
          <CodeBlock title="01 · Install and entry-point smoke check" code={INSTALL_CODE} />
          <CodeBlock title="02 · Secret boundary" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="Command sources"><SourceLink href="https://swe-agent.com/latest/installation/source/">Source installation</SourceLink><SourceLink href="https://swe-agent.com/latest/usage/hello_world/">Single-Issue example</SourceLink><SourceLink href="https://swe-agent.com/latest/usage/batch_mode/">Batch mode</SourceLink><SourceLink href="https://swe-agent.com/latest/config/env/">Environment variables</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="Hand this legacy deployment manual directly to an AI Agent" intro="A complete SKILL.md instruction set: frontmatter defines the use case, and the body includes a four-route selection table, exact commands, secret boundaries, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it." />
          <DeploySkillCard skill={sweAgentDeploySkillEn} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="SWE-agent executes; the outer system owns the gates" intro="Even the complete framework lacks the approval and permission system a modern factory needs. Let an outer scheduler fetch Issues, prefetch repositories, invoke the CLI, and hand trajectories plus patches to CI and human review." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">Stage boundaries for SWE-agent batch processing and outer delivery</caption><thead><tr><th>Stage</th><th>Inputs and controls</th><th>Output or responsibility</th><th>Explicit boundary</th></tr></thead><tbody>
            <tr><th><span className="component-chip yellow">instances</span></th><td>swe_bench / file / huggingface / expert_file</td><td>Provides traceable instances for batch experiments.</td><td>The instance source proves neither patch correctness nor repository write permission.</td></tr>
            <tr><th><span className="component-chip green">run-batch</span></th><td>num_workers, isolated workspaces, and exit statuses</td><td>Runs instances concurrently and records failures.</td><td>Worker completion does not mean every instance succeeded.</td></tr>
            <tr><th><span className="component-chip blue">merge-preds</span></th><td>Per-instance predictions and exit statuses</td><td>Aggregates or repairs preds.json.</td><td>Only merges prediction files; it does not perform final evaluation or delivery.</td></tr>
            <tr><th><span className="component-chip pink">human-review</span></th><td>inspect / inspector / quick-stats</td><td>Reviews trajectories, cost, patches, and failed instances.</td><td>Agent self-evaluation cannot replace human review.</td></tr>
            <tr><th><span className="component-chip blue">external-eval</span></th><td>SWE-bench harness or project CI</td><td>Validates the patch independently outside the Agent.</td><td>The Agent does not own final evaluation, push, or merge permission.</td></tr>
          </tbody></table>
        </div>
        <div className="automation-layout"><CodeBlock title="03 · Example outer pipeline from Issue to patch" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>Answer these before integration</h3><ol><li><span>1</span><p><strong>Who can trigger?</strong> Issue text is untrusted input; public repositories require maintainer approval before a run.</p></li><li><span>2</span><p><strong>How does the repository enter?</strong> Upload a local repo from the host rather than placing a long-lived GITHUB_TOKEN in a clone URL inside the container.</p></li><li><span>3</span><p><strong>What counts as success?</strong> <code>exit_status == "submitted"</code> + a submission + clean-environment CI + human review.</p></li><li><span>4</span><p><strong>Why not use it as a new base?</strong> The official mainline is in maintenance mode; new automation should prefer mini or an actively evolving platform.</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>Private-repository red line:</strong> <code>GithubRepoConfig</code> can interpolate <code>GITHUB_TOKEN</code> into the git remote URL executed inside the container. For private or untrusted repositories, prefetch on the host and configure <code>env.repo.type=local</code>.</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="Acceptance: prove the boundary before the capability" intro="A first reproduction does not need a SWE-bench score. Prove that version, secrets, sandbox, trajectories, and patches are inspectable before discussing scale." />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>Repeatable version</strong><p>Git tag is v1.1.0; <code>sweagent --help</code> reports 1.1.0; save the dependency lock.</p></div></li>
            <li><span>02</span><div><strong>Explainable configuration</strong><p>Startup logs include default and custom YAML; model name, parser, and tool bundle match expectations.</p></div></li>
            <li><span>03</span><div><strong>Isolated execution surface</strong><p>Docker arguments include no network, cap-drop, no-new-privileges, and resource limits; do not use local for untrusted repositories.</p></div></li>
            <li><span>04</span><div><strong>Secrets stay in bounds</strong><p>YAML, Git, container environment, and trajectory scans contain no model key; GitHub Token stays out of the container.</p></div></li>
            <li><span>05</span><div><strong>Limits actually work</strong><p>Exercise execution_timeout, install_timeout, total_execution_timeout, and cost limits.</p></div></li>
            <li><span>06</span><div><strong>Readable trajectory</strong><p><code>.traj</code> contains query, thought, action, observation, model_stats, and exit_status.</p></div></li>
            <li><span>07</span><div><strong>Reviewable patch</strong><p>Submission is non-empty; after applying it to a clean copy, <code>git apply --check</code> and tests pass.</p></div></li>
            <li><span>08</span><div><strong>Evaluation and merge are separate</strong><p>run-batch produces only preds.json; SWE-bench / CI and final human approval remain outside the Agent.</p></div></li>
          </ol>
          <SweDeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="Common failures: separate installation, runtime, model, and parser" intro="SWE-agent errors can come from the Python environment, Docker, Modal, model provider, function calling, or legacy configuration migration. Debug in this order." />
        <div className="trouble-list">
          <details open><summary><span>01</span>sweagent is missing or reports the wrong version<ChevronRight /></summary><div><strong>Cause</strong><p>It was installed into another Python environment, or an old / unexpected PyPI package is interfering.</p><strong>Action</strong><p>Confirm <code>which python</code> and <code>which sweagent</code> belong to the same venv; follow the official v1.1.0 source route with <code>pip install --editable .</code>, then run <code>python -m sweagent --help</code>.</p></div></details>
          <details><summary><span>02</span>Import reports missing config / tools / trajectories directories<ChevronRight /></summary><div><strong>Cause</strong><p>A non-editable installation does not place the repository’s top-level config, tools, and trajectories beside the package.</p><strong>Action</strong><p>Prefer editable source installation. If non-editable installation is mandatory, point <code>SWE_AGENT_CONFIG_DIR</code>, <code>SWE_AGENT_TOOLS_DIR</code>, and <code>SWE_AGENT_TRAJECTORY_DIR</code> to the source tree.</p></div></details>
          <details><summary><span>03</span>Startup reports Docker socket permission or docker: not found<ChevronRight /></summary><div><strong>Cause</strong><p>Docker is the default execution backend; the host has no Docker or the current user cannot access its daemon.</p><strong>Action</strong><p>Verify with <code>docker run hello-world</code> first and follow the official socket / user-group troubleshooting. Without Docker, use the Modal route rather than falling back to unisolated local execution.</p><SourceLink href="https://swe-agent.com/latest/installation/tips/">Official Docker troubleshooting</SourceLink></div></details>
          <details><summary><span>04</span>Model 401 / 404 / cost-accounting errors<ChevronRight /></summary><div><strong>Cause</strong><p>The provider key, model name, base URL, or litellm cost table may be wrong. Local models can also lack a provider prefix.</p><strong>Action</strong><p>Check variable presence without printing secrets; use <code>provider/model</code> or an official example model name. For local models, set the cost limit to 0 and configure <code>max_input_tokens</code>.</p><SourceLink href="https://swe-agent.com/latest/installation/keys/">Model and key configuration</SourceLink></div></details>
          <details><summary><span>05</span>The model returns no valid action<ChevronRight /></summary><div><strong>Cause</strong><p>The default parser is function_calling; the model may not support tool calling, or the template may not describe the tool format clearly.</p><strong>Action</strong><p>Use a model with function calling, or change <code>agent.tools.parse_function.type</code> to <code>thought_action</code> while ensuring the template shows the tool documentation.</p></div></details>
          <details><summary><span>06</span>Legacy configuration mentions missing review_on_submit or tool bundles<ChevronRight /></summary><div><strong>Cause</strong><p>v1.1.0 renamed several windowed tool bundles and removed <code>review_on_submit</code>.</p><strong>Action</strong><p>Migrate to <code>review_on_submit_m</code> and the new bundle names using the v1.1.0 changelog; do not apply v0.7 / v1.0 YAML unchanged to this page.</p><SourceLink href="https://swe-agent.com/latest/installation/changelog/">v1.1.0 breaking changes</SourceLink></div></details>
          <details><summary><span>07</span>A batch has partial instances and missing or stale preds.json<ChevronRight /></summary><div><strong>Cause</strong><p>A worker failed, an instance did not finish, or historical results remain in the directory. run-batch does not automatically prove every prediction is current.</p><strong>Action</strong><p>Read <code>run_batch_exit_statuses.yaml</code> and instance logs; clean with <code>sweagent remove-unfinished</code>, then run <code>sweagent merge-preds</code> in the experiment directory.</p></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="The biggest risk is treating a maintenance-mode project as a new foundation" intro="SWE-agent’s ACI ideas remain important, but lifecycle, secret boundaries, and execution isolation all belong in the adoption decision." />
          <div className="risk-grid">
            <div className="risk-card high"><span>High</span><h3>Official maintenance mode</h3><p>The README and documentation explicitly recommend mini-SWE-agent. Default new platforms to mini; reserve SWE-agent for historical compatibility, research baselines, or pipelines that must be reproduced.</p></div>
            <div className="risk-card high"><span>High</span><h3>Token can enter container commands</h3><p>GitHubRepoConfig can place GITHUB_TOKEN in a container-side git URL. Prefetch private repositories on the host and upload them as local, or use short-lived least-privilege credentials.</p></div>
            <div className="risk-card high"><span>High</span><h3>Issue and repository prompt injection</h3><p>The model can execute shell induced by task text. Network restrictions, resource limits, clean copies, CI, and human merge are all necessary.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Local model / function-calling mismatch</h3><p>The default parser assumes tool calling; local models may also need cost tracking disabled and prompt-cache configuration handled, or the first step fails.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Trajectory leakage</h3><p>Trajectories store queries, source, command output, and paths, and may contain accidentally printed secrets. runs/ needs restricted access, retention, and redaction.</p></div>
            <div className="risk-card low"><span>Governance</span><h3>Benchmark context does not transfer automatically</h3><p>Official SWE-bench results depend on specific models, budgets, and datasets; they cannot promise the same repair rate on your private repository.</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />Upgrade / migration procedure</h3><ol><li>Pin v1.1.0 and the dependency lock; back up YAML, runs/, image digests, and experiment documentation.</li><li>Evaluate mini-SWE-agent first for new requirements; if staying on SWE-agent, track only security and necessary fixes.</li><li>Before crossing versions, check trajectory fields, tool-bundle names, parsers, and SWE-ReX interfaces.</li><li>Compare old and new frameworks on the same small task for cost, trajectory structure, and patch quality.</li><li>Retain the old source environment and experiment output until the new route passes full acceptance.</li></ol></div>
            <div><h3><CircleDollarSign />Backup and cost control</h3><ul><li>Back up custom YAML, runs/, task lists, dependency locks, and image digests; do not back up plaintext secrets.</li><li>Set per-instance and total cost limits together; add provider-side budgets and alerts.</li><li>Smoke-test batches with slice=:3 and num_workers=3 before scaling based on logs.</li><li>Trajectories and preds are research assets that may contain sensitive code; protect them like internal logs.</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="Primary sources and verification scope" intro={`Official facts were checked on ${VERIFY_DATE}. Community content is used only to discover failure leads, not as the basis for version or maintenance status.`} />
        <div className="source-list">
          <a href="https://github.com/SWE-agent/SWE-agent" target="_blank" rel="noreferrer"><span>01</span><div><strong>Official GitHub repository</strong><p>README, MIT, maintenance status, and source entry points</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/SWE-agent/releases/tag/v1.1.0" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v1.1.0</strong><p>2025-05-22; SWE-smith and multilingual / multimodal support</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/installation/changelog/" target="_blank" rel="noreferrer"><span>03</span><div><strong>Official changelog</strong><p>Maintenance mode, v1.1.0 breaking changes, and fixes</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/background/architecture/" target="_blank" rel="noreferrer"><span>04</span><div><strong>Official architecture documentation</strong><p>Relationships among CLI, Agent, SWEEnv, SWE-ReX, and ACI</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/background/aci/" target="_blank" rel="noreferrer"><span>05</span><div><strong>ACI design</strong><p>Motivation for file viewing, search, editing, and linter design</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/installation/source/" target="_blank" rel="noreferrer"><span>06</span><div><strong>Source installation documentation</strong><p>Editable install, Docker prerequisites, and GUI dependencies</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/hello_world/" target="_blank" rel="noreferrer"><span>07</span><div><strong>Hello world / single Issue</strong><p>run command, model keys, and execution phases</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/batch_mode/" target="_blank" rel="noreferrer"><span>08</span><div><strong>Batch mode</strong><p>run-batch, instance sources, workers, and preds.json</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/trajectories/" target="_blank" rel="noreferrer"><span>09</span><div><strong>Trajectory output</strong><p>query field, log structure, and experiment-directory layout</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>Not claimed as verified:</strong> no model was called, no Docker was run, no real Issue repair or SWE-bench score reproduction was performed, and not every SWE-ReX cloud backend was validated. Official “state of the art” wording remains in its historical benchmark context; this page’s recommendation is legacy compatibility and research, not new production default.</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="Continue browsing"><Link to="/en"><ArrowLeft />Back to the searchable library</Link><Link to="/en/solutions/mini-swe-agent"><span>Compare with<small>mini-SWE-agent v2.4.6 · Official successor</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
