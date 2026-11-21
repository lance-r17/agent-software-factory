import { ArrowDown, ArrowLeft, ArrowRight, Boxes, Check, Database, FileJson, GitBranch, History, KeyRound, RotateCcw, ShieldAlert, TerminalSquare, Wrench, type LucideIcon } from 'lucide-react'

export function SweArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>FIG 1 · LOGICAL ARCHITECTURE</span><span>SWEEnv is a thin wrapper above SWE-ReX</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">INPUT / YOUR SYSTEM</span>
        <div className="diagram-box yellow"><GitBranch /><strong>Task and code</strong><small>GitHub Issue / text<br />GitHub or local repository<br />SWE-bench instance</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>Host credentials</strong><small>OPENAI / ANTHROPIC key<br />Optional GITHUB_TOKEN<br />Never in YAML or Git</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">SWEAGENT CLI & AGENT PROCESS</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">C</span><strong>YAML configuration</strong><small>agent / env / tools<br />Templates and parsers<br />Cost and timeout limits</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>history <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> action</span></div>
          <div className="diagram-box green"><span className="box-index">A</span><strong>Agent.forward()</strong><small>HistoryProcessor compression<br />function_calling parser<br />Cost and timeout accounting</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>command <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
          <div className="diagram-box yellow"><TerminalSquare /><strong>SWEEnv + SWE-ReX</strong><small>Deployment starts containers<br />Shell-session execution<br />Installs ACI tool bundles</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">OUTPUT / VERIFY SEPARATELY</span>
        <div className="diagram-box green"><Check /><strong>Patch and predictions</strong><small>submit extracts diff<br />run-batch aggregates preds.json<br />Not proof of passing tests</small></div>
        <div className="diagram-box blue"><FileJson /><strong>Trajectories and logs</strong><small>*.traj / config.yaml<br />info / warning / debug log<br />exit_statuses.yaml</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>Outside the boundary:</strong> Issue queues, permission approval, deterministic merge, credential rotation, and team audit are not built-in v1.1.0 platform capabilities.</div>
    <figcaption>Core path: the CLI assembles configuration, Agent produces actions, and SWEEnv uses SWE-ReX to execute in local Docker, Modal, Fargate, or another deployment.</figcaption>
  </figure>
}

const flowSteps = [
  ['01', 'Merge configuration', 'Default YAML and --config overrides become the run configuration: model, tools, repository, and budget.'],
  ['02', 'Start deployment', 'SWE-ReX starts python:3.11 Docker by default; Modal, Fargate, and local are alternatives.'],
  ['03', 'Inject ACI', 'Tool bundles such as registry, edit_anthropic, and review_on_submit_m are copied into the environment and installed.'],
  ['04', 'Model decision', 'HistoryProcessor compresses history; the model returns a structured action through function calling.'],
  ['05', 'Execute and observe', 'ToolHandler runs the command in a shell session and appends output, status, and exceptions to history.'],
  ['06', 'Submit evidence', 'submit extracts the workspace diff; trajectory, configuration, and logs are persisted, and batches aggregate preds.json.'],
]

export function SweWorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 2 · SINGLE-TASK LOOP</span><span>Every step is constrained by execution / install / total timeout</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>If no submit occurred and budget remains</span><strong>Return to 04 for another iteration</strong></div>
    <figcaption>Default limits: 30 seconds per command, 300 seconds per tool installation, 1800 seconds across all commands; three consecutive command timeouts end the run.</figcaption>
  </figure>
}

export function SweDataEventDiagram() {
  const events = [
    ['config', 'Run fingerprint', 'Merged config.yaml records model, templates, tool bundles, repository, and limits.'],
    ['query', 'Model input', 'Since v1.1.0, each step stores the exact current query, replacing the old messages field.'],
    ['thought', 'Pre-parse reasoning', 'Thought separated from raw model output; used for audit, not direct execution.'],
    ['action', 'Structured action', 'function_calling or thought_action parser produces shell / edit / submit.'],
    ['observation', 'Environment feedback', 'stdout, stderr, return code, timeout, and tool-state JSON.'],
    ['exit', 'Result metadata', 'Submitted, CostLimitExceeded, TotalExecutionTimeExceeded, and other exit reasons.'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>FIG 3 · DATA & EVENT FLOW</span><span>The trajectory is a research object and an outer-pipeline acceptance interface</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>trajectories/&lt;user&gt;/&lt;experiment&gt;/</strong><code>run_batch.config.yaml<br />preds.json<br />run_batch.*.log<br />run_batch_exit_statuses.yaml<br />instance/*.traj<br />instance/*.config.yaml</code><p>Trajectories can contain private source, absolute paths, and accidentally printed secrets; redact before public sharing and restrict retention.</p></div>
    </div>
    <figcaption>Batch preds.json can be passed to SWE-bench evaluation; evaluation is a separate step, not an automatic conclusion from run-batch.</figcaption>
  </figure>
}

export function SweDeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>FIG 4 · DEPLOYMENT ROUTES</span><span>Isolate the execution surface before expanding batch or cloud scope</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · ONE-REPOSITORY REPRODUCTION</span><h3>Source + hardened Docker</h3><div className="lane-flow"><span>Host CLI</span><ArrowRight size={12} aria-hidden="true" /><span>Upload local copy</span><ArrowRight size={12} aria-hidden="true" /><span>Offline container</span></div><p>Model key stays on the host; SWE-ReX uploads the repository; the container has no network or capabilities and limited CPU / memory / PIDs.</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · NO LOCAL DOCKER</span><h3>Local repository + Modal</h3><div className="lane-flow"><span>Local code</span><ArrowRight size={12} aria-hidden="true" /><span>Modal sandbox</span><ArrowRight size={12} aria-hidden="true" /><span>Cloud execution</span></div><p>Removes the local Docker dependency, but code and commands leave the host; confirm cloud region, logs, and data boundaries first.</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · BATCH EVALUATION</span><h3>run-batch + SWE-bench</h3><div className="lane-flow"><span>Instance set</span><ArrowRight size={12} aria-hidden="true" /><span>num_workers</span><ArrowRight size={12} aria-hidden="true" /><span>preds + traj</span></div><p>Suitable for benchmarks and historical Issue batches; concurrency amplifies cost and host / Docker load, so smoke-test slice :3 first.</p></div>
    </div>
    <figcaption>Every route keeps model keys in the host process environment or secret manager; never write keys into YAML, a Git repository, or a container image.</figcaption>
  </figure>
}

export function SweBatchPipelineDiagram() {
  const steps: { title: string; text: string; Icon: LucideIcon }[] = [
    { title: 'Instance source', text: 'swe_bench / file / huggingface / expert_file', Icon: Boxes },
    { title: 'Concurrent execution', text: 'num_workers controls workers; failed instances write exit statuses', Icon: Wrench },
    { title: 'Aggregate predictions', text: 'merge-preds generates or repairs preds.json', Icon: FileJson },
    { title: 'Human inspection', text: 'inspect / inspector / quick-stats review trajectories and cost', Icon: History },
    { title: 'External evaluation', text: 'SWE-bench harness or project CI runs independently', Icon: Check },
  ]
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 5 · BATCH PIPELINE</span><span>run-batch produces predictions; it does not prove patch correctness</span></div>
    <div className="factory-conveyor" aria-label="SWE-agent batch experiment pipeline">
      {steps.map(({ title, text, Icon }, index) => <div key={title} className={`conveyor-step ${index === 4 ? 'external' : 'internal'}`}><span>{index === 4 ? 'Outer system' : 'SWE-agent'}</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}
    </div>
    <figcaption>Make a three-instance smoke run work before expanding slice and workers; do not use a higher budget to conceal loops or parser failures.</figcaption>
  </figure>
}
