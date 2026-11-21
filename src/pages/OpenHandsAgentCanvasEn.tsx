import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { ArchitectureDiagram, AutomationDiagram, DataEventDiagram, DeploymentDiagram, WorkflowDiagram } from '../components/OpenHandsDiagramsEn'
import { openHandsDeploySkillEn } from '../data/deploySkillsEn'

const VERIFY_DATE = '2026-11-20'

const ENV_CODE = `# /srv/openhands/.env  (chmod 600)
# These are examples, not real keys. Replace them through your own secret manager.
ANTHROPIC_API_KEY=replace-with-your-anthropic-key
GITHUB_TOKEN=replace-with-a-fine-grained-token
SANDBOX_TIMEOUT=120

# No dedicated model verification was executed. Start with the officially supported
# Anthropic model and record the actual model, price, and limits in the change ticket.`

const SETUP_CODE = `# Create the host directory before any volume mount to avoid root-owned directories
mkdir -p /srv/openhands/.openhands
cd /srv/openhands
chmod 700 . .openhands
# Write the .env template above, then run chmod 600 .env

curl -fsSL https://raw.githubusercontent.com/OpenHands/OpenHands/main/openhands-cli/install.sh -o /tmp/openhands-install.sh
# For production, review the script or pin an immutable revision instead of piping it to bash
bash /tmp/openhands-install.sh`

const NPM_CODE = `# Node.js >= 22.13; nvm users should run nvm install 22 && nvm use 22
npm install -g @openhands/canvas@1.43.0
openhands`

const SOURCE_CODE = `mkdir -p /srv/openhands && cd /srv/openhands
git clone --depth 1 --branch v1.43.0 https://github.com/OpenHands/OpenHands.git
cd OpenHands
uv sync
uv run pre-commit install
# Default development port: 12000
uv run python -m openhands.agent_server`

const DOCKER_CODE = `# Prerequisite: install and start Docker, then verify with docker run hello-world
cd /srv/openhands
export OPENHANDS_DIR=/srv/openhands/.openhands
nohup env UV_CACHE_DIR=/srv/openhands/.uv-cache \
  uvx --python 3.13 --from openhands-agent-server \
  openhands-agent-server --host 127.0.0.1 > /srv/openhands/agent-server.log 2>&1 &

# Wait for the local API to listen, then run the desktop client in another terminal
cd /srv/openhands/OpenHands
npm install
npm run dev:react`

const INSPECT_CODE = `curl -fsS http://127.0.0.1:12000/health || true
ps aux | grep -E 'openhands|uvicorn'
ss -lntp | grep 12000
tail -n 120 /srv/openhands/agent-server.log
# The public /health path was not proven in this check; if it 404s, use logs and process status instead.`

const GITHUB_ACTION = `# .github/workflows/openhands-resolver.yml — template; review before enabling
name: OpenHands issue resolver
on:
  issue_comment:
    types: [created]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  resolve:
    if: contains(github.event.comment.body, '/fix-me')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install openhands-resolver
      - run: openhands-resolver --repo \${{ github.repository }} --issue-number \${{ github.event.issue.number }}
        env:
          LLM_API_KEY: \${{ secrets.LLM_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
# Before production, constrain the trigger, fork trust boundary, model, and budget;
# do not give untrusted Issue text direct write or merge privileges.`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? 'Link copied' : 'Copy page link'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'cli', label: 'A · Official CLI', title: 'The official quick-start route', code: SETUP_CODE, note: 'install.sh sets up the local Agent and dependencies. uvx runs the Agent Server separately and is not the same entry point. Review the script and confirm where configuration is written before installation.' },
    { id: 'npm', label: 'B · Global npm', title: 'The route checked for this analysis', code: NPM_CODE, note: 'This analysis installed @openhands/canvas@1.43.0 globally in a temporary environment and verified its version and help output. No model key was configured, so no Agent conversation was created.' },
    { id: 'source', label: 'C · Source development', title: 'For modifying the Electron client', code: SOURCE_CODE, note: 'The source route requires the uv toolchain. The Agent Server runs separately from the front end; npm run dev:react starts only the React / Electron side, so do not assume that a visible page means the model service is ready.' },
    { id: 'docker', label: 'D · Headless + Docker', title: 'The manually assembled self-hosted route', code: DOCKER_CODE, note: 'The official 1.43 Docker page focuses on a headless API container. The commands above are an integration template assembled from official sources, not a claimed one-command desktop deployment. Adjust the image and mounts for your version.' },
  ]
  return <RouteTabs tabs={tabs} initialId="cli" ariaLabel="OpenHands Agent Canvas deployment routes">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id}.sh`} code={current.code} />
    </>}
  </RouteTabs>
}

export default function OpenHandsAgentCanvasEn() {
  return <PageShell>
    <article className="detail-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/en"><ArrowLeft size={16} /> Library</Link><ChevronRight size={14} /><span>OpenHands Agent Canvas</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 01</div>
            <h1><span>OpenHands</span><br />A coding Agent with<br />a <span className="highlight-pink">visible workbench</span></h1>
            <p className="hero-lead">Agent Canvas is not another chat box. It places the conversation stream and the evolving execution plan side by side, making a coding Agent’s steps, status, and checkpoints visible while keeping human takeover available.</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/en/solutions/openhands-agent-canvas', hash: '#deploy' }}>Open the reproduction guide <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/OpenHands/OpenHands" target="_blank" rel="noreferrer">Official repository <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">BOTTOM LINE</p><h2>A strong collaboration front end,<br />not an unattended delivery system.</h2><ul><li><Check size={17} />Conversation + Plan: two views of one task</li><li><Check size={17} />Local desktop, no dedicated cloud account required</li><li><Check size={17} />Pluggable models and containerized execution</li><li><XCircle size={17} />Sandbox, credentials, and PR review remain your responsibility</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>Version checked</dt><dd>v1.43.0 <small>Released 2026-11-17</small></dd></div>
          <div><dt>Maintenance signal</dt><dd>Multiple commits in November <small>Releases continuing in v1</small></dd></div>
          <div><dt>Runtime baseline</dt><dd>Node ≥ 22.13 <small>Python 3.13 / uv / Docker as applicable</small></dd></div>
          <div><dt>License / positioning</dt><dd>MIT <small>Electron + React + FastAPI</small></dd></div>
          <div><dt>Facts verified</dt><dd>{VERIFY_DATE} <small>Time-sensitive facts use this date</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>First, understand the naming</strong><p>The current Canvas client lives in the OpenHands repository’s <code>openhands/app/</code> directory and is published as <code>@openhands/canvas</code>. The separate <code>OpenHands/OpenHands-Cloud</code> repository hosts a different web client; do not confuse the two deployment paths.</p></div><SourceLink href="https://github.com/OpenHands/OpenHands/tree/main/openhands/app">Client source</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="A desktop shell around a local Agent service" intro="Canvas is the presentation layer. The model loop, tool execution, and workspace management belong to the OpenHands Agent Server and SDK. Understanding this boundary explains the installation and troubleshooting split." />
        <ArchitectureDiagram />
        <SourceStrip><SourceLink href="https://github.com/OpenHands/OpenHands/tree/main/openhands/app">Electron client source</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/runtimes/local">Local runtime</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/runtimes/docker">Docker runtime</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="A task is not a straight line; it is a conversation that can be corrected" intro="The user can observe the plan, add constraints, or pause execution while the Agent works. This interaction model is better suited to real software work than a single prompt-to-answer call." />
          <WorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>What Conversation records</h3><p>Messages, tool calls, file diffs, command output, and model status form one time-ordered stream. It answers “what happened”; it does not prove that every step was correct.</p></div>
            <div className="text-block"><h3>What Plan adds</h3><p>Plan turns the current understanding into a checklist with progress and subtasks. It can change as the Agent learns. The plan is an execution aid, not an immutable specification.</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="Separate the client, service, runtime, and delivery boundary" intro="The most common deployment mistake is treating the desktop window as the whole system. The actual responsibilities are distributed across four layers." />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">OpenHands Agent Canvas component responsibilities</caption><thead><tr><th>Component</th><th>Input</th><th>Responsibility</th><th>What it does not do</th></tr></thead><tbody>
            <tr><th><span className="component-chip pink">Electron shell</span></th><td>User actions and local windows</td><td>Desktop lifecycle, local process startup, settings, and native integration.</td><td>It is not the model runtime and does not make shell commands safe.</td></tr>
            <tr><th><span className="component-chip blue">React Canvas</span></th><td>Conversation and plan events</td><td>Renders messages, plans, diffs, and controls; calls the local API.</td><td>It does not independently execute repository changes or evaluate tests.</td></tr>
            <tr><th><span className="component-chip green">Agent Server</span></th><td>Task, model, and workspace configuration</td><td>Coordinates the Agent loop, tool calls, state persistence, and HTTP / WebSocket APIs.</td><td>It is not an identity, approval, or multi-tenant governance platform.</td></tr>
            <tr><th><span className="component-chip yellow">Runtime / workspace</span></th><td>Repository, tools, and credentials</td><td>Runs shell and editor operations locally or in Docker; returns observations.</td><td>Containerization alone does not guarantee least privilege or patch quality.</td></tr>
            <tr><th><span className="component-chip pink">Outer delivery system</span></th><td>Candidate diff and execution evidence</td><td>CI, secret scanning, human review, branch protection, and merge decisions.</td><td>It is not built into Canvas as a fully governed software factory.</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://docs.openhands.dev/openhands/usage/architecture">Official architecture</SourceLink><SourceLink href="https://github.com/OpenHands/OpenHands/tree/main/openhands/app">App package</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/security">Security guidance</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="Events are evidence, not automatic acceptance" intro="A useful Canvas session leaves a trace of prompts, actions, observations, and file changes. An outer system still needs to decide whether the result is complete, safe, and releasable." />
          <DataEventDiagram />
          <div className="code-with-note"><CodeBlock title="Inspect the local service" code={INSPECT_CODE} /><div className="sticky-explanation"><strong>Evidence worth retaining</strong><ul><li>Exact application, SDK, model, and image versions.</li><li>The original task, plan revisions, and material human interventions.</li><li>Command outcomes, test logs, and the final diff.</li><li>Cost, duration, failures, retries, and the final review decision.</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="Where it fits in an Agent software factory" intro="Canvas supplies the human-facing workbench. A complete factory still needs intake, isolation, verification, and controlled delivery around it." />
        <div className="factory-conveyor" aria-label="Complete software factory pipeline">
          <div className="conveyor-step external"><span>Outer system</span><GitPullRequest /><strong>Intake</strong><p>Issue / ticket / manual task</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>OpenHands</span><Layers3 /><strong>Execution</strong><p>Plan <ArrowRight className="inline-arrow" aria-hidden="true" /> Edit <ArrowRight className="inline-arrow" aria-hidden="true" /> Test</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>Canvas</span><FileCheck2 /><strong>Evidence</strong><p>Conversation + plan + diff</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>Outer system</span><Shield /><strong>Quality & delivery</strong><p>CI <ArrowRight className="inline-arrow" aria-hidden="true" /> Review <ArrowRight className="inline-arrow" aria-hidden="true" /> PR / merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />Especially suitable for</h3><ul><li>Developers who want to watch and steer an Agent instead of waiting for a black-box result.</li><li>Local experimentation with repository-level coding, debugging, and refactor tasks.</li><li>Teams evaluating model behavior, tool use, and human intervention points.</li><li>A human-agent console inside a larger factory with external CI and review.</li><li>Users who can operate Node, Python, Docker, and model credentials safely.</li></ul></div>
          <div className="fit-column no"><h3><XCircle />Not a direct fit for</h3><ul><li>Unattended production changes with automatic merge privileges.</li><li>Multi-tenant identity, granular authorization, and compliance approval out of the box.</li><li>Cross-repository program management or a durable task DAG.</li><li>Teams unwilling to manage model costs, secrets, images, and test infrastructure.</li><li>Environments where executing untrusted repository instructions cannot be isolated.</li></ul></div>
        </div>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="Choose a route, then verify each process separately" intro="The examples use Linux and /srv/openhands. Except for the explicitly recorded local checks, these are deployment templates assembled from official material, not a claim of production validation." />
          <div className="verification-stamp"><PackageCheck /><div><strong>Checks actually executed for this analysis</strong><p><code>@openhands/canvas@1.43.0</code> was installed in an isolated temporary environment; package version and CLI help were inspected. The v1.43.0 source and client entry points were checked. <b>No model was called, no Docker route was run, and no real repository repair was attempted.</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>Dependencies and versions</h3><dl>
              <div><dt>Node.js</dt><dd><strong>≥ 22.13</strong><span>Required by the Canvas package</span></dd></div>
              <div><dt>Python</dt><dd><strong>3.13 for uvx route</strong><span>Follow the pinned source / server requirements</span></dd></div>
              <div><dt>Core package</dt><dd><strong>@openhands/canvas 1.43.0</strong><span>Version pinned in this analysis</span></dd></div>
              <div><dt>Tooling</dt><dd><strong>npm / uv / Git</strong><span>The exact set depends on the route</span></dd></div>
              <div><dt>Optional runtime</dt><dd><strong>Docker</strong><span>Recommended for isolating repository execution</span></dd></div>
              <div><dt>Model access</dt><dd><strong>Provider API key</strong><span>Inject through a local secret boundary</span></dd></div>
              <div><dt>Ports</dt><dd><strong>12000 by default</strong><span>Development server; bind locally unless explicitly exposed</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>Suggested directories and ownership</h3><pre>{`/srv/openhands/
├── .env                    # chmod 600; never commit
├── .openhands/             # local state and workspace
├── .uv-cache/              # uv cache
├── OpenHands/              # optional pinned source tree
└── agent-server.log        # local service log

Model API key: host secret store or protected .env
GitHub Token: minimum scope, short lifetime where possible`}</pre><p><strong>Workspace rule:</strong> create directories before mounting them. Use a disposable repository copy, never a production checkout with unrelated credentials.</p></div>
          </div>
          <CodeBlock title="01 · Secret boundary template" code={ENV_CODE} language="bash" />
          <DeploymentTabs />
          <SourceStrip label="Command sources"><SourceLink href="https://docs.openhands.dev/openhands/usage/quick-start">Quick start</SourceLink><SourceLink href="https://www.npmjs.com/package/@openhands/canvas">npm package</SourceLink><SourceLink href="https://github.com/OpenHands/OpenHands/blob/v1.43.0/DEVELOPMENT.md">Development guide</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/runtimes/docker">Docker runtime</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="Hand this deployment manual directly to an AI Agent" intro="A complete SKILL.md deployment instruction set: frontmatter defines the use case, and the body includes route selection, exact commands, secret boundaries, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it for a coding Agent." />
          <DeploySkillCard skill={openHandsDeploySkillEn} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="Automation belongs outside the desktop client" intro="Canvas is a control surface, not the queueing and approval system. Let an outer orchestrator own triggers, credentials, retries, CI, and merge policy." />
        <AutomationDiagram />
        <div className="automation-layout"><CodeBlock title="03 · Illustrative GitHub resolver workflow" code={GITHUB_ACTION} language="yaml" /><div className="automation-notes"><h3>Answer these before integration</h3><ol><li><span>1</span><p><strong>Who can trigger?</strong> Issue and comment text is untrusted. Require maintainer approval for public repositories and forks.</p></li><li><span>2</span><p><strong>What can it write?</strong> Limit the token to the target repository and required operations; never grant automatic merge by default.</p></li><li><span>3</span><p><strong>What counts as success?</strong> A diff plus clean-checkout CI, secret scanning, and human review—not merely a finished Agent process.</p></li><li><span>4</span><p><strong>How does retry work?</strong> Use a fresh run ID, workspace, and sandbox; preserve the failed evidence rather than replaying blindly.</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>Workflow template, not a verified turnkey integration:</strong> resolver command flags and event filters must be checked against the exact release before enabling. Keep branch protection and required reviews outside the Agent’s control.</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="Acceptance: prove the boundary before the capability" intro="A first reproduction does not need an automatic PR. Prove that the version, credentials, workspace, evidence, and patch are inspectable before increasing autonomy." />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>Repeatable version</strong><p>Record the package, source commit, SDK, runtime image, and dependency lock; do not follow latest silently.</p></div></li>
            <li><span>02</span><div><strong>Explainable processes</strong><p>Identify which terminal owns Electron, React, Agent Server, and Docker; inspect each log separately.</p></div></li>
            <li><span>03</span><div><strong>Disposable workspace</strong><p>Only the intended repository copy is writable; unrelated host directories and the Docker socket are not exposed casually.</p></div></li>
            <li><span>04</span><div><strong>Secrets stay outside artifacts</strong><p>Scan logs, trajectories, diffs, and commits for keys; no secret is written into YAML, Git, or an image.</p></div></li>
            <li><span>05</span><div><strong>Limits actually work</strong><p>Exercise command timeout, task budget, cancellation, and container resource limits with harmless tasks.</p></div></li>
            <li><span>06</span><div><strong>Evidence is readable</strong><p>The conversation, plan, actions, observations, and final status can be exported or reconstructed.</p></div></li>
            <li><span>07</span><div><strong>The diff is reviewable</strong><p><code>git diff --check</code> passes, only intended files changed, and no temporary scripts or binaries slipped in.</p></div></li>
            <li><span>08</span><div><strong>Testing and merge are separate</strong><p>CI reruns in a clean environment; the Agent has no merge privilege and a human gives final approval.</p></div></li>
          </ol>
          <DeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="Common failures: identify the layer first" intro="A blank window, an unavailable API, a model authentication error, and a container failure have different owners. Do not respond to every symptom by increasing timeout or reinstalling everything." />
        <div className="trouble-list">
          <details open><summary><span>01</span>The CLI installs but the desktop window does not start<ChevronRight /></summary><div><strong>Likely cause</strong><p>Node is below 22.13, the global npm binary directory is not on PATH, or a desktop dependency is missing.</p><strong>Action</strong><p>Check <code>node --version</code>, <code>npm prefix -g</code>, and <code>openhands --help</code>. On headless Linux, use the API / source route rather than assuming Electron can open a display.</p></div></details>
          <details><summary><span>02</span>The UI opens but conversations cannot start<ChevronRight /></summary><div><strong>Likely cause</strong><p>The Agent Server is not running, is bound to another address, or failed while reading configuration.</p><strong>Action</strong><p>Inspect the server process and log, confirm port 12000, and check model configuration without printing the key. A rendered React page alone is not service readiness.</p></div></details>
          <details><summary><span>03</span>Model authentication or model-not-found errors<ChevronRight /></summary><div><strong>Likely cause</strong><p>The provider variable, model name, base URL, or account entitlement is wrong. A configured variable does not prove provider access.</p><strong>Action</strong><p>Check presence rather than value, use the provider’s exact model identifier, and test with a minimal official client call outside the container. Do not paste the key into logs or Issues.</p></div></details>
          <details><summary><span>04</span>Docker permission errors or missing commands<ChevronRight /></summary><div><strong>Likely cause</strong><p>The daemon is stopped, the current user lacks socket access, or the selected image lacks required shell tooling.</p><strong>Action</strong><p>Run <code>docker info</code> and <code>docker run hello-world</code> first. Resolve host permissions outside the Agent; never mount the Docker socket into an untrusted workload merely to silence an error.</p><SourceLink href="https://docs.openhands.dev/openhands/usage/runtimes/docker">Official Docker runtime</SourceLink></div></details>
          <details><summary><span>05</span>A mounted directory becomes root-owned<ChevronRight /></summary><div><strong>Likely cause</strong><p>Docker created a missing host path automatically, or the container user differs from the host user.</p><strong>Action</strong><p>Create and permission the directory before launch, use a dedicated writable copy, and record the container UID / GID. Avoid recursive chmod on a real repository.</p></div></details>
          <details><summary><span>06</span>The plan stalls or the Agent repeats a failing action<ChevronRight /></summary><div><strong>Likely cause</strong><p>The task is too broad, the test command is wrong, tool output is truncated, or the model is stuck in a loop.</p><strong>Action</strong><p>Pause and narrow the task, inspect the last observation, and rerun in a fresh workspace. Do not hide loops by simply raising cost and step budgets.</p></div></details>
          <details><summary><span>07</span>The GitHub workflow never triggers or pushes<ChevronRight /></summary><div><strong>Likely cause</strong><p>The comment filter, event context, token permission, fork policy, or branch protection does not match the template.</p><strong>Action</strong><p>Inspect the exact action logs and event payload. Keep write permissions minimal and require human review; do not disable branch protection to make the demo pass.</p></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="Design security, upgrades, and backups together" intro="A polished desktop interface does not remove untrusted model output, repository prompt injection, dependency supply-chain risk, or credential exposure." />
          <div className="risk-grid">
            <div className="risk-card high"><span>High</span><h3>Untrusted shell execution</h3><p>Issues, repository documentation, and model output can all induce dangerous commands. Use a disposable copy, constrained runtime, no unnecessary network, and human merge review.</p></div>
            <div className="risk-card high"><span>High</span><h3>Credential crossover</h3><p>Model keys and GitHub tokens have different trust boundaries. Keep them out of images, YAML, Git, logs, and untrusted containers; prefer short-lived, scoped credentials.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Local service exposure</h3><p>A local API bound to a public interface can become a remote execution gateway. Bind to loopback by default and add authentication before any shared deployment.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Dependency and image drift</h3><p>Canvas, Agent Server, SDK, runtime image, and model behavior can change independently. Pin versions, review releases, retain a lockfile / SBOM, and run regression tasks.</p></div>
            <div className="risk-card medium"><span>Medium</span><h3>Trace leakage</h3><p>Conversations and observations may contain private source, paths, and accidentally printed secrets. Restrict state directory access, set retention, and redact before sharing.</p></div>
            <div className="risk-card low"><span>Governance</span><h3>Demo evidence is not production evidence</h3><p>Package installation and CLI help prove neither model quality nor repository repair. Record unexecuted routes explicitly and require clean-environment CI before adoption.</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />Upgrade procedure</h3><ol><li>Back up configuration, state, dependency locks, image digests, and benchmark tasks; never commit .env.</li><li>Read the target release and migration notes for the client, server, SDK, and runtime together.</li><li>Install into a new environment while keeping the known-good version available for rollback.</li><li>Run the same non-sensitive repository task and compare plan, events, cost, tests, and diff.</li><li>Roll out gradually after CI; restore the pinned old environment if protocols or behavior regress.</li></ol></div>
            <div><h3><Shield />Backup and cost control</h3><ul><li>Back up configuration, task definitions, locks, test scripts, and required state; exclude plaintext secrets.</li><li>Set provider budgets and alerts in addition to application-level limits.</li><li>Record model, prompt, image digest, duration, retries, and token cost for every experiment.</li><li>Treat traces as sensitive operational logs, not anonymous material for public upload.</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="Primary sources and verification scope" intro={`Official facts were checked on ${VERIFY_DATE}. Community issues are used to discover failure modes, not to replace current official documentation.`} />
        <div className="source-list">
          <a href="https://github.com/OpenHands/OpenHands" target="_blank" rel="noreferrer"><span>01</span><div><strong>Official GitHub repository</strong><p>Releases, source entry points, license, and maintenance signals</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenHands/OpenHands/tree/main/openhands/app" target="_blank" rel="noreferrer"><span>02</span><div><strong>Canvas client source</strong><p>Electron / React structure and package boundaries</p></div><ArrowUpRight /></a>
          <a href="https://www.npmjs.com/package/@openhands/canvas" target="_blank" rel="noreferrer"><span>03</span><div><strong>@openhands/canvas on npm</strong><p>Package version, Node requirement, and CLI distribution</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/quick-start" target="_blank" rel="noreferrer"><span>04</span><div><strong>Official quick start</strong><p>CLI installation and initial model configuration</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/runtimes/local" target="_blank" rel="noreferrer"><span>05</span><div><strong>Local runtime</strong><p>Host execution boundary and local service behavior</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/runtimes/docker" target="_blank" rel="noreferrer"><span>06</span><div><strong>Docker runtime</strong><p>Container execution, mounts, and isolation considerations</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/security" target="_blank" rel="noreferrer"><span>07</span><div><strong>Security documentation</strong><p>Credentials, sandboxing, and deployment precautions</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenHands/OpenHands/blob/v1.43.0/DEVELOPMENT.md" target="_blank" rel="noreferrer"><span>08</span><div><strong>Development guide</strong><p>Source setup, uv, front-end commands, and development ports</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>Not claimed as verified:</strong> no real model repair quality was measured, no Docker route was executed, no cloud or enterprise deployment was tested, and no benchmark result was independently reproduced. The deployment snippets are structured guidance from official material plus this page’s integration design, not a substitute for your own security and CI acceptance.</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="Continue browsing"><Link to="/en"><ArrowLeft />Back to the searchable library</Link><Link to="/en/solutions/mini-swe-agent"><span>Next field note<small>mini-SWE-agent v2.4.6 · Minimal execution kernel</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
