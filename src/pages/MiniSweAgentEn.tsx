import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { ArchitectureDiagram, DataEventDiagram, DeploymentDiagram, WorkflowDiagram } from '../components/MiniDiagramsEn'
import { miniSweAgentDeploySkillEn } from '../data/deploySkillsEn'

const VERIFY_DATE = '2026-11-21'

const INSTALL_CODE = `# Linux / macOS; this example uses Python 3.12
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# Verify the package and entry point only; this does not call a model
python -c 'import minisweagent; print(minisweagent.__version__)'
python -m minisweagent --help`

const ENV_CODE = `# The model name needs a provider prefix; this follows the official example
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'
export ANTHROPIC_API_KEY='injected-by-a-secret-manager-never-written-to-yaml-or-git'
export MSWEA_CONFIGURED=true

# Process-wide guardrails; tighten the per-task limits in YAML as well
export MSWEA_GLOBAL_CALL_LIMIT=100
export MSWEA_GLOBAL_COST_LIMIT=10.00`

const LOCAL_YAML = `# /srv/agent-factory/factory.local.yaml
# Load together with the built-in mini.yaml: -c mini.yaml -c factory.local.yaml
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
    TQDM_DISABLE: '1'`

const LOCAL_RUN = `cd /srv/agent-factory
source .venv/bin/activate
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.local.yaml \
  -t 'Reproduce the issue first, make the smallest fix, and run related tests. Do not commit or push.' \
  -o /srv/agent-factory/runs/local-demo.traj.json`

const DOCKER_YAML = `# /srv/agent-factory/factory.docker.yaml
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
    - /srv/agent-factory/workspace/project:/workspace:rw`

const DOCKER_RUN = `cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm

# Demonstrate on a small repository without dependencies; real projects should use
# an image with dependencies preinstalled and an immutable digest
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.docker.yaml \
  -t 'Inspect this repository, fix the described issue, and run tests. Do not use the network, commit, or push.' \
  -o /srv/agent-factory/runs/docker-demo.traj.json \
  --yolo --exit-immediately`

const AUTOMATION_CODE = `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

# gh / jq belong to the outer pipeline; they are not built into mini
gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \
  -t "$(cat "runs/$RUN_ID.issue.txt")" \
  -o "runs/$RUN_ID.traj.json" \
  --yolo --exit-immediately

# Process exit is not task success; check the explicit exit status first
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# Next: run full CI in an isolated environment and request human review; never auto-merge.`

const TRAJECTORY_CODE = `jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? 'Link copied' : 'Copy page link'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'local', label: 'A · Local confirmation', title: 'The shortest route to understanding the Agent', yaml: LOCAL_YAML, run: LOCAL_RUN, note: 'The local environment inherits the host and executes subprocesses without filesystem isolation. Use only a disposable project copy, keep confirm enabled, and never point this route at a production directory.' },
    { id: 'docker', label: 'B · Docker sandbox', title: 'A least-privilege template before unattended runs', yaml: DOCKER_YAML, run: DOCKER_RUN, note: 'This template deliberately disables networking, so it cannot install dependencies online or push code. Prebuild a dependency image and pin its digest for real projects. If network access is essential, use a domain-level egress proxy instead of opening all network access.' },
  ]
  return <RouteTabs tabs={tabs} initialId="local" ariaLabel="Deployment configuration routes">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id}.yaml`} code={current.yaml} language="yaml" />
      <CodeBlock title={`Run the ${current.id} route`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function MiniSweAgentEn() {
  return <PageShell>
    <article className="detail-page mini-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/en"><ArrowLeft size={16} /> Library</Link><ChevronRight size={14} /><span>mini-SWE-agent</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 02</div>
            <h1><span>mini-SWE-agent</span><br />A software factory reduced to<br />one <span className="highlight-green">auditable loop</span></h1>
            <p className="hero-lead">It is not a full development platform, but a small, transparent work unit: the model proposes a bash action, the environment returns an observation, and a linear trajectory records every decision until submission or a hard limit.</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/en/solutions/mini-swe-agent', hash: '#deploy' }}>Open the reproduction guide <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer">Official repository <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">BOTTOM LINE</p><h2>A strong factory kernel,<br />not a governance platform.</h2><ul><li><Check size={17} />Readable source and control flow</li><li><Check size={17} />Replaceable local, Docker, and HPC backends</li><li><Check size={17} />Cost and trajectories are first-class</li><li><XCircle size={17} />Issue dispatch and PR approval need an outer system</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>Version checked</dt><dd>v2.4.6 <small>Released 2026-07-23</small></dd></div>
          <div><dt>Maintenance signal</dt><dd>Latest main commit <small>2026-09-03; no deprecation notice found</small></dd></div>
          <div><dt>Runtime baseline</dt><dd>Python ≥ 3.10 <small>bash; container runtime optional</small></dd></div>
          <div><dt>License / maturity</dt><dd>MIT <small>Package metadata still says Alpha</small></dd></div>
          <div><dt>Facts verified</dt><dd>{VERIFY_DATE} <small>Time-sensitive facts use this date</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>Why not the legacy SWE-agent?</strong><p>The legacy repository README says current development is focused mainly on mini-SWE-agent and generally recommends mini going forward. This analysis therefore covers mini rather than presenting the officially superseded mainline as the preferred new deployment.</p></div><SourceLink href="https://github.com/SWE-agent/SWE-agent">Legacy official notice</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="Three protocols, one message pipeline" intro="Mini’s value is not merely having fewer features. Every step maps to readable source: who creates an action, who executes it, and who persists state, with no hidden workflow engine." />
        <ArchitectureDiagram />
        <SourceStrip><SourceLink href="https://mini-swe-agent.com/latest/advanced/control_flow/">Official control flow</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/agents/default.py">DefaultAgent source</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/environments/">Execution environments</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="The full loop: query, execute, observe, repeat" intro="Each action runs independently. This sacrifices persistent shell state but creates clearer timeout boundaries, replaceable sandboxes, and a replayable message sequence." />
          <WorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>Why no persistent shell can be a feature</h3><p>A persistent session must guess when a command has finished and can be corrupted by one abnormal command. Mini ends each execution independently. If the next command needs a directory or environment variable, write <code>cd … &amp;&amp; …</code> in the same action or pass the environment explicitly.</p></div>
            <div className="text-block"><h3>Submission is not passing tests</h3><p>The environment only recognizes the designated completion signal on the first output line. It does not judge whether tests are sufficient or the patch meets the requirement. The outer pipeline must still inspect the diff, run CI, and retain human merge approval.</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="Few components, distinct responsibilities" intro="The key v2 change is that Model owns parsing and observation formatting, Agent coordinates and enforces limits, and Environment only executes and recognizes the submission signal." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">mini-SWE-agent core component responsibilities</caption><thead><tr><th>Component</th><th>Input</th><th>Responsibility</th><th>What it does not do</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">Model</span></th><td>Linear messages</td><td>Calls LiteLLM / OpenRouter; uses native tool calling by default in v2; can parse text; formats observations.</td><td>Does not operate the repository directly or decide sandbox permissions.</td></tr>
            <tr><th><span className="component-chip green">DefaultAgent</span></th><td>task + Model + Environment</td><td>Renders templates; loops query / execute_actions; tracks cost and calls; handles control-flow exceptions.</td><td>Provides no Issue queue, task DAG, or multi-Agent negotiation.</td></tr>
            <tr><th><span className="component-chip yellow">InteractiveAgent</span></th><td>Model actions + user input</td><td>confirm / yolo / human modes; action allowlists and exit confirmation.</td><td>Confirm is not a security sandbox; pressing Enter can still approve a dangerous command.</td></tr>
            <tr><th><span className="component-chip pink">Environment</span></th><td>{'{ command }'}</td><td>Uses subprocess locally or docker exec; returns output / returncode / exception.</td><td>Does not prove patch correctness or inherently prevent prompt injection.</td></tr>
            <tr><th><span className="component-chip blue">Run scripts</span></th><td>CLI or benchmark instance</td><td>Assemble configuration; mini saves the latest run; the SWE-bench runner supports concurrent batches.</td><td>v2 removed the dedicated github_issue.py; there is no complete built-in Issue-to-PR bot.</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://mini-swe-agent.com/latest/advanced/v2_migration/">v2 migration guide</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/usage/mini/">mini CLI</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/run/mini.py">CLI source</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="The trajectory is both debugger and automation acceptance interface" intro="Linear history keeps the context sent to the model closely aligned with the saved execution trace. Automation can read exit_status instead of treating process exit as success." />
          <DataEventDiagram />
          <div className="code-with-note"><CodeBlock title="Read acceptance fields" code={TRAJECTORY_CODE} language="bash" /><div className="sticky-explanation"><strong>Four outcomes worth preserving</strong><ul><li><code>Submitted</code>: the Agent claims completion; continue acceptance.</li><li><code>LimitsExceeded</code>: budget or steps exhausted; not success.</li><li><code>TimeExceeded</code>: wall-clock budget exhausted; narrow the task.</li><li><code>RepeatedFormatError</code>: model output repeatedly violates the tool contract.</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="Why it works as a software-factory work unit" intro="It turns requirement text into reviewable repository changes and serializes the process, execution result, and exit reason. A complete factory still needs you to supply intake, quality control, and delivery." />
        <div className="factory-conveyor" aria-label="Complete software factory pipeline">
          <div className="conveyor-step external"><span>Outer system</span><GitPullRequest /><strong>Intake</strong><p>Issue / cron / manual task</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Built into mini</span><Layers3 /><strong>Execution</strong><p>Understand <ArrowRight className="inline-arrow" aria-hidden="true" /> Edit <ArrowRight className="inline-arrow" aria-hidden="true" /> Self-test</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Built into mini</span><FileCheck2 /><strong>Evidence</strong><p>trajectory + submission</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>Outer system</span><Shield /><strong>Quality & delivery</strong><p>CI <ArrowRight className="inline-arrow" aria-hidden="true" /> Review <ArrowRight className="inline-arrow" aria-hidden="true" /> PR / merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />Especially suitable for</h3><ul><li>Research into Agent scaffolds, model capability, and bash-only baselines.</li><li>Well-bounded fixes on disposable repository copies.</li><li>Batch SWE-bench / ProgramBench experiments with comparable trajectories.</li><li>Teams that want custom Model / Environment protocols without maintaining a heavy platform.</li><li>A single-task executor inside an outer scheduler, backed by CI and human review.</li></ul></div>
          <div className="fit-column no"><h3><XCircle />Not a direct fit for</h3><ul><li>Cross-repository, multi-role, long-running project planning and task DAGs.</li><li>Unisolated automatic fixes on production hosts or direct automatic merge.</li><li>Identity, granular authorization, approval, and tenant governance required by strong compliance.</li><li>Unattended scenarios that require deterministic execution and guaranteed patch correctness.</li><li>Teams unwilling to operate model APIs, container images, tests, and secret systems.</li></ul></div>
        </div>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="Start with a pinned version and expand permissions gradually" intro="The commands use Linux and /srv/agent-factory. Except where explicitly noted, they combine official-source guidance with this page’s deployment design; they are not executed production validation." />
          <div className="verification-stamp"><PackageCheck /><div><strong>Checks actually executed for this analysis</strong><p><code>mini-swe-agent==2.4.6</code> was installed in an isolated temporary directory, imported successfully with its version read, and <code>python -m minisweagent --help</code> ran successfully. <b>No model was called, no Docker route was run, and no real repository repair was attempted.</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>Dependencies and versions</h3><dl>
              <div><dt>Python</dt><dd><strong>≥ 3.10</strong><span>Required by the project; example uses 3.12</span></dd></div>
              <div><dt>Shell</dt><dd><strong>bash</strong><span>Required locally or inside the container</span></dd></div>
              <div><dt>Core package</dt><dd><strong>mini-swe-agent 2.4.6</strong><span>Pinned in this analysis</span></dd></div>
              <div><dt>Key dependencies</dt><dd><strong>pydantic ≥ 2.0</strong><span>litellm ≥ 1.75.5, excluding 1.82.7 / 1.82.8</span></dd></div>
              <div><dt>Optional runtime</dt><dd><strong>Docker / Podman</strong><span>Singularity / Apptainer also available for SWE-bench</span></dd></div>
              <div><dt>Outer automation</dt><dd><strong>Git / gh / jq</strong><span>Only the example pipeline; not built into mini</span></dd></div>
              <div><dt>Ports</dt><dd><strong>None</strong><span>The CLI starts no HTTP service and needs no open port</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>Suggested directories and ownership</h3><pre>{`/srv/agent-factory/
├── .venv/                 # Host Python environment
├── factory.local.yaml     # Unisolated demo only
├── factory.docker.yaml    # Sandbox and resource limits
├── workspace/project/     # Only writable repository copy
└── runs/                  # issue / patch / traj / logs

Model API key: host process environment or secret manager
Inside container: no model key by default; no Docker socket`}</pre><p><strong>Workspace rule:</strong> create directories before mounting so Docker does not create root-owned paths. Real projects should use an image with dependencies installed and an immutable digest.</p></div>
          </div>
          <CodeBlock title="01 · Install and entry-point smoke check" code={INSTALL_CODE} />
          <CodeBlock title="02 · Model, secrets, and global budget" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="Command sources"><SourceLink href="https://mini-swe-agent.com/latest/quickstart/">Quick start</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/global_configuration/">Global configuration</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/yaml_configuration/">YAML configuration</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/pyproject.toml">Dependency declaration</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="Hand this deployment manual directly to an AI Agent" intro="A complete SKILL.md instruction set: frontmatter defines the use case, and the body includes a two-route selection table, YAML templates, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it for any coding Agent." />
          <DeploySkillCard skill={miniSweAgentDeploySkillEn} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="Let the outer system intake work and CI decide delivery" intro="v2 removed the old dedicated github_issue script. Do not copy a v1 entry point into a new project; let an outer scheduler fetch the Issue and invoke the mini CLI." />
        <div className="automation-layout"><CodeBlock title="03 · Example outer pipeline from Issue to patch" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>Answer these before integration</h3><ol><li><span>1</span><p><strong>Who can trigger?</strong> Issue text is untrusted input; public-repository triggers need maintainer approval first.</p></li><li><span>2</span><p><strong>What can it write?</strong> Mount only the workspace copy; keep the GitHub Token out of the container and push in a separate outer step.</p></li><li><span>3</span><p><strong>What counts as success?</strong> Submitted + diff checks + full CI + human review. Missing any one means no merge.</p></li><li><span>4</span><p><strong>How does retry work?</strong> Use a new run_id, container, and workspace; never blindly replay dangerous commands in a failed environment.</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>The most common v2 configuration trap:</strong> once <code>-c</code> is used, the built-in default is not automatically loaded as a base. When overriding a field, also write <code>-c mini.yaml -c your.yaml</code>, or even required templates may be missing.</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="Acceptance: split “the run ended” into eight gates" intro="A first reproduction does not need automatic PRs. Prove that permission boundaries, trajectories, and patches are inspectable before increasing automation." />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>Repeatable version</strong><p>The imported version is 2.4.6; save <code>pip freeze</code> and do not follow latest directly.</p></div></li>
            <li><span>02</span><div><strong>Explainable configuration</strong><p>Startup logs include both mini.yaml and the custom YAML; the model name has a provider prefix.</p></div></li>
            <li><span>03</span><div><strong>Disposable workspace</strong><p>Only a copy is mounted; other host directories and the Docker socket are not writable.</p></div></li>
            <li><span>04</span><div><strong>No secrets in the patch</strong><p>Trajectory, patch, and log scans find no API key; the container has no model secret by default.</p></div></li>
            <li><span>05</span><div><strong>Limits actually work</strong><p>Exercise command timeout, per-task cost / step limits, and the wall-clock limit separately.</p></div></li>
            <li><span>06</span><div><strong>Readable trajectory</strong><p>The JSON contains version, configuration, messages, model statistics, and an explicit exit_status.</p></div></li>
            <li><span>07</span><div><strong>Reviewable changes</strong><p><code>git diff --check</code> passes; the patch contains only expected files, with no binaries or temporary scripts.</p></div></li>
            <li><span>08</span><div><strong>Testing and merge are separate</strong><p>Rerun CI in a clean environment; the Agent has no merge privilege and a human gives final approval.</p></div></li>
          </ol>
          <DeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="Common failures: identify the layer first" intro="Model, configuration, host, container, and outer-pipeline failures can look similar. Debug in this order instead of simply increasing every timeout and budget." />
        <div className="trouble-list">
          <details open><summary><span>01</span>Templates or configuration are missing after using -c<ChevronRight /></summary><div><strong>Cause</strong><p>Multiple v2 configurations merge recursively, but specifying -c stops the default mini.yaml from being included automatically.</p><strong>Action</strong><p>Use <code>mini -c mini.yaml -c factory.local.yaml …</code>. With a text-parsing model, also ensure action_regex matches every template format.</p></div></details>
          <details><summary><span>02</span>AuthenticationError despite a configured API key<ChevronRight /></summary><div><strong>Cause</strong><p>The provider prefix, secret variable name, environment loading order, or provider-side authentication may be wrong. Official Issues contain related reports; #558 was still open at verification time.</p><strong>Action</strong><p>Check variable presence on the host without printing the secret; use a model name such as <code>anthropic/…</code>; inspect configuration paths with the official <code>mini-extra config edit</code>. Do not treat “put the key in the container too” as a fix.</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/issues/558">Issue #558</SourceLink></div></details>
          <details><summary><span>03</span>A cd or export disappears in the next turn<ChevronRight /></summary><div><strong>Cause</strong><p>Every action uses a new subshell by default. This is deliberate design, not a state-loss bug.</p><strong>Action</strong><p>Write <code>cd /workspace &amp;&amp; pytest</code> in the same action or configure environment.cwd. For persistent environment state, write a workspace file and load it explicitly.</p></div></details>
          <details><summary><span>04</span>Docker image pulls time out or the container cannot execute<ChevronRight /></summary><div><strong>Cause</strong><p>Network, architecture, daemon permissions, or missing bash inside the image. Official SWE-bench Linux images also assume x86 architecture.</p><strong>Action</strong><p>Run <code>docker info</code>, <code>docker pull</code>, and <code>docker exec … ls</code> manually first; raise pull_timeout from its 120-second default. Ordinary command timeout is controlled by environment.timeout, which defaults to 30 seconds.</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/issues/499">Pull timeout Issue #499</SourceLink></div></details>
          <details><summary><span>05</span>CI waits for input or does not exit after completion<ChevronRight /></summary><div><strong>Cause</strong><p>Mini defaults to confirm and also asks for confirmation on submission. Unattended runs must explicitly disable both kinds of confirmation.</p><strong>Action</strong><p>Use <code>--yolo --exit-immediately</code> only inside a constrained sandbox; retain cost, step, and wall-clock limits. Never enable yolo on the host merely to make CI unattended.</p></div></details>
          <details><summary><span>06</span>exit_status is LimitsExceeded / TimeExceeded<ChevronRight /></summary><div><strong>Cause</strong><p>The task is too large, the model is looping, tests are slow, or the budget is too small. Normal process exit does not mean the fix is complete.</p><strong>Action</strong><p>Narrow the task and test scope first, then inspect the trajectory for loops before adjusting limits with evidence. Do not routinely set cost_limit=0, because zero means unlimited.</p></div></details>
          <details><summary><span>07</span>An old tutorial’s mini -v / github_issue.py does not exist<ChevronRight /></summary><div><strong>Cause</strong><p>v2 removed the Visual UI, the dedicated github_issue run script, key rotation, and legacy model classes; parsing fields also moved from agent to model.</p><strong>Action</strong><p>Follow the official v2 migration guide. If you must stay on v1, pin <code>mini-swe-agent~=1.0</code>, but never apply v1 configuration directly to this page’s v2 commands.</p><SourceLink href="https://mini-swe-agent.com/latest/advanced/v2_migration/">Official migration list</SourceLink></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="Design security boundaries, upgrades, and backups together" intro="A small kernel reduces code complexity but does not automatically solve untrusted model output, dependency supply-chain risk, or repository prompt injection." />
          <div className="risk-grid">
            <div className="risk-card high"><span>High</span><h3>Local has no isolation</h3><p>Subprocesses inherit the host environment and can execute arbitrary shell. Use disposable copies only; use a stronger sandbox for production. Confirm cannot replace isolation.</p></div>
            <div className="risk-card high"><span>High</span><h3>Issue / code prompt injection</h3><p>Repository documentation and Issues are untrusted content. Separate trigger and write privileges, constrain network access, and prohibit automatic Agent merge.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Default containers are not least privilege</h3><p>The official default run_args contains only --rm; this page’s network, capability, and resource controls are additional hardening. Highly adversarial tasks still need stronger boundaries such as microVMs.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Dependency supply chain</h3><p>The project explicitly excludes compromised litellm 1.82.7 / 1.82.8. Lock dependencies, review releases, and retain an SBOM during upgrades instead of updating only the Agent package.</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.2.8">Official security release</SourceLink></div>
            <div className="risk-card medium"><span>Medium</span><h3>Trajectory leakage</h3><p>Messages and output may contain private source, paths, and accidentally printed secrets. Restrict runs/ permissions, set retention, and redact before public sharing.</p></div>
            <div className="risk-card low"><span>Governance</span><h3>Alpha status and maintenance cadence</h3><p>Package metadata still says Development Status :: 3 - Alpha, and recent commits and the latest release are separated in time. Pin a version and run your own regression before adoption.</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />Upgrade procedure</h3><ol><li>Back up custom YAML, runs/, and the dependency lock; read the target release and migration guide.</li><li>Install the target version in a new virtual environment while keeping 2.4.6 available for rollback.</li><li>Run the same task on a small non-sensitive repository; compare trajectory structure, cost, and tests.</li><li>Check Model / Environment protocols, configuration keys, completion signals, and exit statuses.</li><li>Roll out gradually after full CI; reinstall the pinned old version and restore configuration on failure.</li></ol></div>
            <div><h3><CircleDollarSign />Backup and cost control</h3><ul><li>Back up runs/, custom YAML, dependency locks, test scripts, and image digests; never commit .env.</li><li>If secret files truly need backup, encrypt them separately with restricted access rather than archiving them with ordinary traces.</li><li>Set per-task and global cost / call limits together; add provider-side budgets and alerts.</li><li>Record image digests and benchmark-task results before upgrades so an unchanged codebase does not hide environment drift.</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="Primary sources and verification scope" intro={`Official facts were checked on ${VERIFY_DATE}. Community content and Issues are used to discover failures, not to replace current official documentation.`} />
        <div className="source-list">
          <a href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer"><span>01</span><div><strong>Official GitHub repository</strong><p>Positioning, README, defaults, and source entry points</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.4.6" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v2.4.6</strong><p>2026-07-23; counts billed parse-failure calls toward the cost limit</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/commits/main/" target="_blank" rel="noreferrer"><span>03</span><div><strong>main commit history</strong><p>The latest commit read for this analysis was dated 2026-09-03</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/control_flow/" target="_blank" rel="noreferrer"><span>04</span><div><strong>Official control flow and DefaultAgent</strong><p>Loop, exceptions, submission signal, and serialization</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/environments/" target="_blank" rel="noreferrer"><span>05</span><div><strong>Environments</strong><p>Boundaries for local / Docker / Singularity / Bubblewrap and others</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/yaml_configuration/" target="_blank" rel="noreferrer"><span>06</span><div><strong>YAML and v2 migration guides</strong><p>Configuration merging, templates, tool calling, and breaking changes</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/global_configuration/" target="_blank" rel="noreferrer"><span>07</span><div><strong>Global configuration and mini CLI</strong><p>Model, secrets, global budget, output paths, and interaction modes</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/blob/main/pyproject.toml" target="_blank" rel="noreferrer"><span>08</span><div><strong>pyproject.toml</strong><p>Python, dependency constraints, MIT, and Alpha metadata</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>Not claimed as verified:</strong> real model repair quality was not measured, not all model providers were tested, SWE-bench transferability to your repository was not established, and the Docker example is not claimed to resist malicious kernel-level attacks. The official “&gt;74%” is the project’s statement in its benchmark context, not an independent result from this page.</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="Continue browsing"><Link to="/en"><ArrowLeft />Back to the searchable library</Link><Link to="/en/solutions/openhands-agent-canvas"><span>Previous field note<small>OpenHands Agent Canvas</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
