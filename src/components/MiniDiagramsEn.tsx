import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert, TerminalSquare } from 'lucide-react'

export function ArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>FIG 1 · LOGICAL ARCHITECTURE</span><span>The Agent holds no platform privilege beyond its model credential</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">INPUT / YOUR SYSTEM</span>
        <div className="diagram-box yellow"><GitBranch /><strong>Task and code</strong><small>task text<br />Git workspace<br />Tests and dependency image</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>Model credentials</strong><small>MSWEA_MODEL_NAME<br />PROVIDER_API_KEY</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">MINI-SWE-AGENT PROCESS</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">M</span><strong>Model adapter</strong><small>LiteLLM / OpenRouter<br />Generate and parse actions<br />Format observations</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>messages <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
          <div className="diagram-box green"><span className="box-index">A</span><strong>DefaultAgent</strong><small>Linear messages<br />Cost / step / wall-clock limits<br />Exception-driven control flow</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>action <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> output</span></div>
          <div className="diagram-box yellow"><TerminalSquare /><strong>Environment</strong><small>local subprocess<br />docker exec<br />singularity / bwrap…</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">OUTPUT / VERIFY SEPARATELY</span>
        <div className="diagram-box green"><Check /><strong>Workspace changes</strong><small>Source and tests<br />Candidate git diff<br />Not an approved patch</small></div>
        <div className="diagram-box blue"><FileJson /><strong>Trajectory JSON</strong><small>Messages and tool results<br />Configuration and model stats<br />exit_status</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>Outside the boundary:</strong> Issue scheduling, PR approval, authorization, artifact registries, and automatic merge are not built-in mini platform capabilities.</div>
    <figcaption>The core has only three replaceable protocols: Model, Agent, and Environment. In v2, action parsing and observation formatting move to Model, making Agent a thinner coordinator.</figcaption>
  </figure>
}

const flowSteps = [
  ['01', 'Render the task', 'system_template + instance_template place the task and environment data in the initial messages.'],
  ['02', 'Query the model', 'Model.query(messages) returns a native message and one or more bash actions.'],
  ['03', 'Check guardrails', 'Before querying, check step_limit, cost_limit, and wall_time_limit_seconds.'],
  ['04', 'Execute the command', 'Each action enters an independent subprocess or docker exec; cwd and exports do not persist by default.'],
  ['05', 'Append the observation', 'returncode, stdout/stderr, and exceptions are formatted by the model adapter and appended to messages.'],
  ['06', 'Submit or terminate', 'The magic string triggers Submitted; limits, repeated format errors, and user interruption can also end the loop.'],
]

export function WorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 2 · SINGLE-TASK LOOP</span><span>Trajectory is saved after every step when output_path is configured</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>If the final message is not role = exit</span><strong>Return to 02 for another iteration</strong></div>
    <figcaption>Submission signal: <code>echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT</code>. It must be the entire command and return successfully before the status becomes Submitted.</figcaption>
  </figure>
}

export function DataEventDiagram() {
  const events = [
    ['system', 'Behavior contract', 'Tells the model to use only bash, how to edit, and how to submit.'],
    ['user', 'Task instance', 'Issue text, repository information, and acceptance requirements.'],
    ['assistant', 'Action message', 'A native tool call or actions produced by text parsing.'],
    ['tool', 'Execution observation', 'Output, return code, timeout, or exception; long output is trimmed at both ends by default.'],
    ['assistant', 'Next decision', 'Reads the observation and continues locating, editing, or testing.'],
    ['exit', 'Exit record', 'Submitted / LimitsExceeded / TimeExceeded / RepeatedFormatError.'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>FIG 3 · DATA & EVENT FLOW</span><span>Trajectory = message history + configuration + result metadata</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>*.traj.json</strong><code>info.mini_version<br />info.model_stats<br />info.config<br />info.exit_status<br />info.submission<br />messages[]</code><p>It can contain source code, command output, and sensitive paths. Protect it like internal logs rather than uploading it publicly.</p></div>
    </div>
    <figcaption>FormatError is not simply discarded: v2.4.6 specifically fixed the case where a billed model call with an unparseable response was not counted toward cost_limit.</figcaption>
  </figure>
}

export function DeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>FIG 4 · DEPLOYMENT ROUTES</span><span>Tighten the trust boundary from readable demo to unattended batch</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · FIRST RUN</span><h3>Local + confirm</h3><div className="lane-flow"><span>Your terminal</span><ArrowRight size={12} aria-hidden="true" /><span>Project copy</span><ArrowRight size={12} aria-hidden="true" /><span>Confirm each command</span></div><p>Fastest, but local has no isolation. Use a disposable copy and do not expose real credentials.</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · RECOMMENDED REPRODUCTION</span><h3>Docker + constraints</h3><div className="lane-flow"><span>Host Agent</span><ArrowRight size={12} aria-hidden="true" /><span>Restricted container</span><ArrowRight size={12} aria-hidden="true" /><span>Mounted workspace</span></div><p>Model key stays on the host; the container gets only code. Disable network and capabilities; limit CPU / memory / PIDs.</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · AUTOMATED FACTORY</span><h3>Scheduler + acceptance</h3><div className="lane-flow"><span>Issue / cron</span><ArrowRight size={12} aria-hidden="true" /><span>mini</span><ArrowRight size={12} aria-hidden="true" /><span>Tests + diff + review</span></div><p>Scheduling, retry, and PR belong to the outer system; Submitted cannot replace tests and human merge.</p></div>
    </div>
    <figcaption>None of the three routes needs a persistent port. Only batch runners such as SWE-bench / ProgramBench require additional datasets, images, and runtime dependencies.</figcaption>
  </figure>
}
