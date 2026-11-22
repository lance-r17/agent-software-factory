import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, ListChecks, RotateCcw, ShieldAlert, TestTube2, Wrench, type LucideIcon } from 'lucide-react'

export function AgentlessArchitectureDiagramEn() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>FIG 1 · THREE-PHASE ARCHITECTURE</span><span>A fixed pipeline replaces an autonomous tool loop</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">INPUT / BOUNDARY</span>
        <div className="diagram-box yellow"><GitBranch /><strong>Issue and repository structure</strong><small>SWE-bench instance<br />repo + base_commit<br />Optional target_id</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>Host-side secrets</strong><small>OPENAI_API_KEY<br />Optional DeepSeek API<br />Never in Git or logs</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">AGENTLESS FIXED PIPELINE</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">1</span><strong>Hierarchical localization</strong><small>File-level LLM + retrieval merge<br />Related classes / functions / globals<br />Fine-grained edit intervals</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>locations <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> context</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>Multi-sample repair</strong><small>Patches from localized context<br />edit_file or SEARCH/REPLACE<br />Parsing, syntax checks, normalization</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>candidates <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> results</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>Validation and selection</strong><small>Regression test selection / execution<br />Reproduction test generation / filtering<br />Majority vote after deduplication</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">OUTPUT / EXTERNAL ACCEPTANCE</span>
        <div className="diagram-box green"><Check /><strong>all_preds.jsonl</strong><small>One selected patch per instance<br />model_name_or_path=agentless<br />Handed to SWE-bench / CI</small></div>
        <div className="diagram-box blue"><FileJson /><strong>JSONL evidence chain</strong><small>loc_outputs / output.jsonl<br />test_results / logs<br />Cost-statistics inputs</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>Outside the boundary:</strong> Agentless does not provide an Issue queue, sandbox scheduler, approval flow, secret management, or merge gate; an outer software factory must supply them.</div>
    <figcaption>The key idea is not free model-driven tool choice. It is an auditable fixed sequence: localize, repair, then validate and select.</figcaption>
  </figure>
}

const flowSteps = [
  ['01', 'Read the instance', 'Load problem_statement, repo, and base_commit from SWE-bench Lite / Verified; target_id can narrow the run.'],
  ['02', 'Localize files', 'LLM-predicted suspicious files are complemented by irrelevant-folder filtering and embedding retrieval.'],
  ['03', 'Localize elements and lines', 'Find related classes, functions, and globals in top_n files, then sample several fine-grained edit-location sets.'],
  ['04', 'Generate patches', 'Each edit-location set produces one greedy sample plus temperature samples; the v1.5.0 guide example yields 40 candidates.'],
  ['05', 'Run validation', 'Select regression tests that pass on the original repository, then generate and filter tests that reproduce the issue.'],
  ['06', 'Vote and submit', 'Filter by regression failures and reproduction results, deduplicate normalized patches, and write all_preds.jsonl.'],
]

export function AgentlessWorkflowDiagramEn() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 2 · SINGLE-INSTANCE LOOP</span><span>Fixed phases plus sampling, not free exploration</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>When localization is invalid</span><strong>Retry the same phase at a higher temperature instead of wandering</strong></div>
    <figcaption>The official flow defaults to SWE-bench Lite; README_swebench.md also documents the SWE-bench Verified --dataset option.</figcaption>
  </figure>
}

export function AgentlessDataEventDiagramEn() {
  const events = [
    ['loc', 'Localization results', 'loc_outputs.jsonl stores found_files, found_related_locs, found_edit_locs, and trajectories.'],
    ['repair', 'Candidate patches', 'output.jsonl stores raw sample output, token statistics, and post-processed diffs.'],
    ['regression', 'Regression results', 'output_i_regression_test_results.jsonl records failed tests; fewer is better.'],
    ['reproduction', 'Reproduction results', 'output_i_reproduction_test_results.jsonl marks whether a patch passes the selected reproduction test.'],
    ['rerank', 'Final predictions', 'all_preds.jsonl keeps one model_patch per instance.'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>FIG 3 · DATA & EVIDENCE FLOW</span><span>JSONL is the stable interface between phases</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>results/&lt;benchmark&gt;/</strong><code>file_level/loc_outputs.jsonl<br />file_level_combined/combined_locs.jsonl<br />repair_sample_i/output.jsonl<br />repair_sample_i/*_test_results.jsonl<br />reproduction_tests.jsonl<br />all_preds.jsonl</code><p>Result files can contain private source, absolute paths, model output, and cost data; restrict, redact, and retain them deliberately.</p></div>
    </div>
    <figcaption>Patch validation is not final evaluation; all_preds.jsonl still needs the SWE-bench harness or project CI.</figcaption>
  </figure>
}

export function AgentlessDeploymentDiagramEn() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>FIG 4 · DEPLOYMENT ROUTES</span><span>Pin dependencies before attempting a real benchmark</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · COMPATIBLE ENVIRONMENT</span><h3>Python 3.11 + version pins</h3><div className="lane-flow"><span>v1.5.0 source</span><ArrowRight size={12} aria-hidden="true" /><span>pip check</span><ArrowRight size={12} aria-hidden="true" /><span>CLI smoke checks</span></div><p>The official requirements are unpinned. In this verification, swebench==2.1.8 and modal==0.77.0 were required for every entry point to pass its help command.</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · SINGLE-ISSUE SMOKE TEST</span><h3>target_id + a small sample count</h3><div className="lane-flow"><span>One Issue</span><ArrowRight size={12} aria-hidden="true" /><span>Localization and repair</span><ArrowRight size={12} aria-hidden="true" /><span>Candidate JSONL</span></div><p>Validate inputs and outputs first with --target_id, a lower max_samples value, and a disposable repository. No model call or real repair is claimed here.</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · BENCHMARK BATCH</span><h3>Lite / Verified + external evaluation</h3><div className="lane-flow"><span>Dataset</span><ArrowRight size={12} aria-hidden="true" /><span>Concurrent phases</span><ArrowRight size={12} aria-hidden="true" /><span>SWE-bench</span></div><p>The official example generates 40 repair candidates and 40 reproduction-test samples; cap cost, disk, workers, and evaluation concurrency first.</p></div>
    </div>
    <figcaption>Agentless is not an execution sandbox by itself. Real repository commands, dependency installation, and CI belong in a controlled outer environment.</figcaption>
  </figure>
}

export function AgentlessSelectionDiagramEn() {
  const steps: { title: string; text: string; Icon: LucideIcon }[] = [
    { title: 'Candidate patches', text: 'Multiple location sets × samples per location', Icon: Wrench },
    { title: 'Normalize and deduplicate', text: 'normalize_patch merges equivalent patches', Icon: FileJson },
    { title: 'Regression filter', text: 'Prefer candidates with the fewest failed tests', Icon: ListChecks },
    { title: 'Reproduction filter', text: 'Prefer candidates passing the selected reproduction test', Icon: TestTube2 },
    { title: 'Majority vote', text: 'Vote count wins; ties prefer earlier and shorter patches', Icon: Check },
  ]
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>FIG 5 · PATCH SELECTION</span><span>rerank.py selects; it does not prove business correctness</span></div>
    <div className="factory-conveyor" aria-label="Agentless patch validation and selection pipeline">
      {steps.map(({ title, text, Icon }) => <div key={title} className="conveyor-step internal"><span>Agentless</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}
    </div>
    <figcaption>If no candidate passes both regression and reproduction checks, the code falls back to regression-only candidates; external CI and human review still decide delivery.</figcaption>
  </figure>
}
