import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert, TerminalSquare, type LucideIcon } from 'lucide-react'

export function ArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>FIG 1 · LOGICAL ARCHITECTURE</span><span>The desktop client and Agent service are separate processes</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">INPUT / YOUR SYSTEM</span>
        <div className="diagram-box yellow"><GitBranch /><strong>Task and repository</strong><small>Issue / text<br />Local Git workspace<br />Tests and tools</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>Host credentials</strong><small>Provider API key<br />Optional GitHub Token<br />Never in YAML or Git</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">OPENHANDS LOCAL PROCESSES</span>
        <div className="core-loop">
          <div className="diagram-box pink"><span className="box-index">C</span><strong>Electron + React</strong><small>Conversation + Plan<br />Settings and controls<br />Local API client</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>task <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> events</span></div>
          <div className="diagram-box green"><span className="box-index">A</span><strong>Agent Server</strong><small>Model loop<br />Tool calls and state<br />HTTP / WebSocket</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>action <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
          <div className="diagram-box yellow"><TerminalSquare /><strong>Runtime</strong><small>Local or Docker<br />Shell and editor tools<br />Workspace changes</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">OUTPUT / VERIFY SEPARATELY</span>
        <div className="diagram-box green"><Check /><strong>Workspace diff</strong><small>Source and tests<br />Candidate patch<br />Not automatically accepted</small></div>
        <div className="diagram-box blue"><FileJson /><strong>Session evidence</strong><small>Events and plan<br />Logs and status<br />Cost and configuration</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>Outside the boundary:</strong> issue queues, identity, approval, secret rotation, CI, and deterministic merge are not supplied by the Canvas desktop client.</div>
    <figcaption>The client renders work; the Agent Server coordinates it; the runtime executes it. A visible UI does not prove that the model or container is ready.</figcaption>
  </figure>
}

const flowSteps = [
  ['01', 'Frame the task', 'The user supplies a goal, repository context, and constraints; Canvas creates a session.'],
  ['02', 'Draft the plan', 'The Agent turns its current understanding into steps and subtasks that can evolve.'],
  ['03', 'Choose an action', 'The model reads history and selects a shell, editor, or other registered tool action.'],
  ['04', 'Execute in runtime', 'The local or container runtime performs the action and returns output and status.'],
  ['05', 'Publish events', 'Conversation and Plan update; the user can pause, clarify, or take over.'],
  ['06', 'Submit evidence', 'The final diff, logs, and status go to outer CI and human review, not straight to merge.'],
]

export function WorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 2 · TASK LOOP</span><span>Human intervention is part of the workflow, not an exception</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>If the task is incomplete and no hard stop applies</span><strong>Return to 03 for another iteration</strong></div>
    <figcaption>Conversation records what happened; Plan records the current intended route. Neither proves that tests pass or that a patch is safe.</figcaption>
  </figure>
}

export function DataEventDiagram() {
  const events = [
    ['user', 'Task and constraints', 'The requirement, repository context, and explicit security or delivery limits.'],
    ['plan', 'Working plan', 'Steps, progress, and subtasks; revised as new evidence arrives.'],
    ['action', 'Tool request', 'A structured shell, editor, or other tool operation proposed by the model.'],
    ['event', 'Observation', 'Output, status, errors, and file events returned to the Agent and UI.'],
    ['human', 'Intervention', 'Pause, clarification, correction, or takeover becomes part of the session evidence.'],
    ['exit', 'Candidate result', 'Final status, diff, logs, and cost; outer acceptance remains mandatory.'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>FIG 3 · DATA & EVENT FLOW</span><span>The session is an audit interface, not a correctness proof</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.openhands/</strong><code>configuration<br />conversation state<br />workspace data<br />service logs<br />model / runtime metadata</code><p>State can contain private source, absolute paths, and accidentally printed secrets. Restrict access and redact before sharing.</p></div>
    </div>
    <figcaption>Preserve the exact versions, task, material interventions, test results, and final decision so that another engineer can reconstruct the run.</figcaption>
  </figure>
}

export function DeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>FIG 4 · DEPLOYMENT ROUTES</span><span>Choose the process topology before granting autonomy</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · QUICKEST START</span><h3>Official CLI</h3><div className="lane-flow"><span>install.sh</span><ArrowRight size={12} aria-hidden="true" /><span>Local Agent</span><ArrowRight size={12} aria-hidden="true" /><span>Desktop session</span></div><p>Official entry point. Review the installer, model settings, state paths, and host execution boundary before use.</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · PINNED PACKAGE</span><h3>npm Canvas</h3><div className="lane-flow"><span>Node ≥ 22.13</span><ArrowRight size={12} aria-hidden="true" /><span>Canvas 1.43.0</span><ArrowRight size={12} aria-hidden="true" /><span>Local service</span></div><p>The package installation and help entry were checked. Model conversations and Docker execution were not.</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · DEVELOPMENT</span><h3>Source + runtime</h3><div className="lane-flow"><span>uv / server</span><ArrowRight size={12} aria-hidden="true" /><span>React client</span><ArrowRight size={12} aria-hidden="true" /><span>Docker runtime</span></div><p>Best for inspecting or modifying the client. Verify front-end and server readiness independently.</p></div>
    </div>
    <figcaption>Keep model keys on the host side, expose only the intended workspace, and do not bind a local execution API to a public interface without authentication.</figcaption>
  </figure>
}

export function AutomationDiagram() {
  const steps: { title: string; text: string; Icon: LucideIcon }[] = [
    { title: 'Approved trigger', text: 'Maintainer-approved Issue or comment, not arbitrary public input', Icon: GitBranch },
    { title: 'Outer orchestrator', text: 'Fetch task, create run ID, prepare a clean repository copy', Icon: TerminalSquare },
    { title: 'Constrained Agent', text: 'Pinned model and runtime, scoped credentials, explicit budgets', Icon: KeyRound },
    { title: 'Independent CI', text: 'Apply the candidate diff in a clean environment and test it', Icon: Check },
    { title: 'Human delivery', text: 'Review evidence and patch; only then approve PR / merge', Icon: ShieldAlert },
  ]
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 5 · AUTOMATION BOUNDARY</span><span>Canvas supplies visibility; the outer system owns permissions and acceptance</span></div>
    <div className="factory-conveyor" aria-label="OpenHands outer automation pipeline">
      {steps.map(({ title, text, Icon }, index) => <div key={title} className={`conveyor-step ${index === 2 ? 'internal' : 'external'}`}><span>{index === 2 ? 'OpenHands' : 'Outer system'}</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}
    </div>
    <figcaption>Never infer success from process exit or a generated patch. Require a clean checkout, independent CI, secret scanning, and a human merge decision.</figcaption>
  </figure>
}
