import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 自治工程队架构', topRight: '控制平面、工程策略与运行时分离', inputLabel: '输入 / 边界',
      issueTitle: '已批准目标', issueLines: ['goal + repo_url / repo_path', 'runtime + 角色模型映射', '预算、迭代与 CI 上限'],
      secretTitle: '部署侧凭据', secretLines: ['模型 provider key', '可选最小权限 GH_TOKEN', '不进请求体、Git 与日志'], coreLabel: 'AGENTFIELD + SWE-AF 控制栈',
      localizeTitle: '规划与 Issue DAG', localizeLines: ['PRD → 架构 → 评审', 'Sprint Planner 拆 Issue', '依赖层级与风险指导'],
      repairTitle: 'DAG 执行与治理', repairLines: ['同层 worktree 并行', '内环 / 中环 / 外环', '合并、集成与显式技术债'],
      validateTitle: '运行时与状态', validateLines: ['AForge / Claude / OpenCode', 'Codex / Command Code', '.artifacts + checkpoint'], outputLabel: '输出 / 外部验收',
      outputLines: ['分支、提交与验证结果', '可选 push、PR 与 CI 修复', '人工复核后决定是否 merge'],
      evidenceTitle: '可恢复证据', evidenceLines: ['plan / execution / verification', 'DAGState + replan_history', '恢复时重新指定 runtime'],
      boundaryLead: '边界外：', boundaryBody: 'worktree 只隔离 Git 写入；部署方仍需提供系统隔离、网络限制、可信 CI、预算、人工评审与最终 merge。',
      caption: '模型在运行时内执行工具，SWE-AF 负责工程控制与状态，AgentField 负责节点和异步调用；三者不能互相替代安全验收。',
    },
    workflow: {
      topLeft: '图 2 · 构建与自适应工作流', topRight: '同层并行，层级屏障后汇合证据',
      steps: [
        ['目标与仓库准入', '外层批准目标、仓库范围、运行时、预算和权限；SWE-AF 接收 goal 与 repo 配置。'],
        ['规划与架构评审', 'PM、Architect、Tech Lead 生成并检查 PRD 与架构，再形成 Issue DAG。'],
        ['Issue 写作与分层', 'Issue Writer 并行补全契约；拓扑排序计算依赖层级并标记文件冲突。'],
        ['隔离执行与内环', '每个 Issue 在独立 worktree 编码；按风险进入 Reviewer 或 QA + Reviewer + Synthesizer。'],
        ['中环 / 外环适应', 'Advisor 改策略、拆分或带债接受；Replanner 可修改剩余 DAG、缩减范围或中止。'],
        ['合并与验证', '层级屏障合并分支并做集成检查；Verifier 对照 PRD，失败可生成定向修复 Issue。'],
        ['交付与人工决定', '保存 checkpoint、债务和验证证据；可选 push / PR / CI 修复，最终 merge 由人决定。'],
      ],
      loopLabel: '有界反馈回路', loopText: '修复 → 复验 → 升级；不是无限重试', caption: '完成状态必须连同 accumulated_debt、失败 / 跳过列表和原始验收条件一起阅读。',
    },
    data: {
      topLeft: '图 3 · 数据与证据流', topRight: 'Issue 契约驱动执行，DAGState 驱动恢复',
      events: [
        ['input', '目标与仓库', 'goal、repo_url / repo_path、多仓库角色与 config 进入异步 build 或 implement_issue。'],
        ['plan', 'PRD 与 Issue DAG', '验收条件、依赖、文件清单、测试指导和风险理由成为可校验工作契约。'],
        ['execute', 'IssueResult 与分支', '每个 Issue 记录结果、尝试、文件、分支、适配和债务；同层结果在屏障汇合。'],
        ['state', 'checkpoint 与技术债', 'DAGState 保存层级、合并、重规划和 accumulated_debt，恢复后仍需重新核对 runtime。'],
        ['delivery', '独立验收', '分支、测试、CI 与债务进入干净环境复核；内部完成不等于人工接受。'],
      ],
      note: '计划、checkpoint、原始模型输出和 workspace 可能包含私有需求、源码、路径、成本与秘密；需要限权、脱敏和保留期。', caption: 'BuildResult 是证据汇总，不是生产就绪承诺；completed_with_debt 和失败分支都必须进入人工 diff 审查。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: 'Python 测试已实测，其余路线保留未执行声明',
      lanes: [
        { tag: 'A · 离线核验', title: '固定提交 + Python 测试', flow: ['0de5364', '隔离安装', '2641 通过'], body: '本页已执行。pip check 通过；固定 claude-agent-sdk 0.1.20 有 yanked 警告，未调用模型。' },
        { tag: 'B · PYTHON COMPOSE', title: '控制平面 + 双 Python 节点', flow: [':8080', ':8003 / :8004', '共享 workspaces'], body: '官方路线，本站未启动。显式固定 runtime，审查 ~/.codex 挂载、回调、密钥与预算。' },
        { tag: 'C · GO / 子 HARNESS', title: 'Go 节点或单 Issue 委托', flow: [':8005 / :8006', '独立 NODE_ID', '分支 + 证据'], body: 'Go 未实测。implement_issue 默认不开 PR，适合外层工厂小步委托并保留 merge 控制。' },
      ],
      caption: '恢复不是绕过验收的捷径；旧 checkpoint 不冻结 runtime，升级后恢复必须显式固定运行时并重新检查模型与成本。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · AUTONOMOUS ENGINEERING-TEAM ARCHITECTURE', topRight: 'Control plane, engineering policy, and runtime stay separate', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Approved goal', issueLines: ['goal + repo_url / repo_path', 'runtime + role-model map', 'Budget, iteration, and CI limits'],
      secretTitle: 'Deployment credentials', secretLines: ['Model-provider key', 'Optional least-privilege GH_TOKEN', 'Never in requests, Git, or logs'], coreLabel: 'AGENTFIELD + SWE-AF CONTROL STACK',
      localizeTitle: 'Planning and Issue DAG', localizeLines: ['PRD → architecture → review', 'Sprint Planner writes Issues', 'Dependency levels and risk guidance'],
      repairTitle: 'DAG execution and governance', repairLines: ['Same-level worktree parallelism', 'Inner / middle / outer loops', 'Merge, integration, and explicit debt'],
      validateTitle: 'Runtimes and state', validateLines: ['AForge / Claude / OpenCode', 'Codex / Command Code', '.artifacts + checkpoint'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Branches, commits, and verification', 'Optional push, PR, and CI repair', 'Humans decide whether to merge'],
      evidenceTitle: 'Recoverable evidence', evidenceLines: ['plan / execution / verification', 'DAGState + replan_history', 'Specify runtime again on recovery'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Worktrees isolate Git writes only; deployers still provide system isolation, network limits, trusted CI, budgets, human review, and final merge.',
      caption: 'Models execute tools inside runtimes, SWE-AF owns engineering control and state, and AgentField owns nodes and async calls; none replaces safety acceptance.',
    },
    workflow: {
      topLeft: 'FIG 2 · BUILD AND ADAPTATION WORKFLOW', topRight: 'Parallel within a level; evidence converges at the barrier',
      steps: [
        ['Admit the goal and repository', 'The outer system approves goal, repository scope, runtime, budget, and privileges; SWE-AF receives goal and repo configuration.'],
        ['Plan and review architecture', 'PM, Architect, and Tech Lead produce and check the PRD and architecture before the Issue DAG.'],
        ['Write Issues and compute levels', 'Issue Writers complete contracts in parallel; topological sorting computes dependency levels and marks file conflicts.'],
        ['Execute in isolation with the inner loop', 'Each Issue uses its own worktree; risk selects Reviewer or QA + Reviewer + Synthesizer.'],
        ['Adapt through middle and outer loops', 'Advisor changes approach, splits, or accepts with debt; Replanner can modify the remaining DAG, reduce scope, or abort.'],
        ['Merge and verify', 'The level barrier merges branches and runs integration checks; Verifier compares against the PRD and can generate targeted fixes.'],
        ['Deliver for a human decision', 'Persist checkpoints, debt, and verification; optional push / PR / CI repair never replaces human merge.'],
      ],
      loopLabel: 'Bounded feedback loop', loopText: 'Repair → recheck → escalate; never infinite retry', caption: 'Read completion together with accumulated_debt, failed and skipped lists, and the original acceptance criteria.',
    },
    data: {
      topLeft: 'FIG 3 · DATA AND EVIDENCE FLOW', topRight: 'Issue contracts drive execution; DAGState drives recovery',
      events: [
        ['input', 'Goal and repositories', 'goal, repo_url / repo_path, multi-repository roles, and config enter async build or implement_issue.'],
        ['plan', 'PRD and Issue DAG', 'Acceptance criteria, dependencies, file manifests, testing guidance, and risk rationale become validated work contracts.'],
        ['execute', 'IssueResult and branches', 'Each Issue records outcome, attempts, files, branch, adaptations, and debt; same-level results converge at the barrier.'],
        ['state', 'Checkpoint and debt', 'DAGState stores levels, merges, replans, and accumulated_debt; recovery still requires a fresh runtime review.'],
        ['delivery', 'Independent acceptance', 'Branches, tests, CI, and debt enter a clean-environment review; internal completion is not human acceptance.'],
      ],
      note: 'Plans, checkpoints, raw model output, and workspaces can contain private requirements, source, paths, costs, and secrets; apply access control, redaction, and retention.', caption: 'BuildResult aggregates evidence, not a production-readiness promise; completed_with_debt and failed branches both require human diff review.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Python tests were executed; other routes remain explicitly unexecuted',
      lanes: [
        { tag: 'A · OFFLINE VERIFICATION', title: 'Pinned commit + Python tests', flow: ['0de5364', 'Isolated install', '2641 passed'], body: 'Executed here. pip check passed; pinned claude-agent-sdk 0.1.20 emitted a yanked warning, and no model was called.' },
        { tag: 'B · PYTHON COMPOSE', title: 'Control plane + two Python nodes', flow: [':8080', ':8003 / :8004', 'Shared workspaces'], body: 'Official route, not started here. Pin runtime and review the ~/.codex mount, callbacks, secrets, and budgets.' },
        { tag: 'C · GO / SUB-HARNESS', title: 'Go node or single-Issue delegation', flow: [':8005 / :8006', 'Distinct NODE_ID', 'Branch + evidence'], body: 'Go was not tested. implement_issue opens no PR by default, supporting small outer-factory delegations with caller-owned merge.' },
      ],
      caption: 'Recovery is not an acceptance shortcut. Old checkpoints do not freeze runtime; pin it explicitly after upgrades and recheck models and cost.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function SweAfArchitectureDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].architecture
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">{c.inputLabel}</span>
        <div className="diagram-box yellow"><GitBranch /><strong>{c.issueTitle}</strong><Lines lines={c.issueLines} /></div>
        <div className="diagram-box pink"><KeyRound /><strong>{c.secretTitle}</strong><Lines lines={c.secretLines} /></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">{c.coreLabel}</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">1</span><strong>{c.localizeTitle}</strong><Lines lines={c.localizeLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>plan <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> review</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>state <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> evidence</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>BuildResult</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function SweAfWorkflowDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].workflow
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <ol className="workflow-steps">{c.steps.map(([title, text], index) => <li key={title} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow', 'green'][index]}>
      <span className="flow-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><p>{text}</p>{index < c.steps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
    </li>)}</ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>{c.loopLabel}</span><strong>{c.loopText}</strong></div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function SweAfDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.artifacts/</strong><code>plan/prd.md<br />plan/architecture.md<br />execution/checkpoint.json<br />execution/issue-*.md<br />verification/</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function SweAfDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
