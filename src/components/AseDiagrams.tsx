import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 任务驱动的 Agent 工程架构', topRight: '交互式工程技能是主线，自治 Fleet 是可选扩展', inputLabel: '输入 / 边界',
      issueTitle: '工程目标', issueLines: ['需求、仓库上下文与验收意图', '命名任务计划与明确状态', '开发者保留方向与关键决定'], secretTitle: 'Agent 与外部服务凭据', secretLines: ['留在 Agent 的登录与授权流程', '可选模型 / 搜索 MCP 可能收费', '不写进 .ase、YAML、Git 或附件'], coreLabel: 'ASE 本地工程栈',
      localizeTitle: 'Plugin + Skills + Hooks', localizeLines: ['Claude Code 为主支持目标', 'Copilot / Codex 为 reduced support', '数十个规划、代码与文档技能'], repairTitle: 'CLI + MCP + Sub-agents', repairLines: ['任务、看板、研究与实现入口', 'MCP service 提供工具面', 'hooks 与 sub-agents 扩展会话'], validateTitle: 'Task Store + Artifacts', validateLines: ['默认 ./.ase/task 本地存储', 'header + body + attachment', 'solo / team / enterprise 生命周期'], outputLabel: '输出 / 外部验收',
      outputLines: ['任务计划、draft 与变更集', '评审、资格判定与集成证据', '外层 CI 与人工决定是否接受'], evidenceTitle: '可选 Agent Fleet', evidenceLines: ['每成员独立进程与进程组', 'relay、监督、日志与重启', 'qualifier 默认仍需人类决定'],
      boundaryLead: '边界外：', boundaryBody: 'ASE 不是模型或免费算力，也不替代仓库授权、可信 CI、秘密扫描、人工 merge 或生产发布；不同 Agent harness 的支持程度并不相同。',
      caption: '技能把工程方法带入 Agent 会话，CLI / MCP 管理任务与工具，Task Store 让计划、状态和附件跨会话持续存在。',
    },
    workflow: {
      topLeft: '图 2 · Enterprise 任务工作流', topRight: '从草案到集成，每一步都有显式任务状态',
      steps: [
        ['建立命名任务', '从目标形成可持久化计划；用 alternative approach funnel 比较路径，而不是直接跳到补丁。'],
        ['质疑与研究', 'grill、research 等步骤暴露开放决定、证据缺口与实现风险；人仍负责范围确认。'],
        ['估算与排程', '记录 Effort、After、Source、Changeset 和 Target，让依赖、工作量与变更归属可检查。'],
        ['生成实现草案', 'implement --draft 先把变更作为附件保存，便于审阅，而不是立即改写目标分支。'],
        ['实现真实变更', '批准的计划在限定工作副本中进入 IMPLEMENTING，产生可测试的代码与任务证据。'],
        ['资格验证', '测试、评审和 qualifier 形成判定；默认 judge 模式不会替人移动资格状态。'],
        ['集成变更集', 'integrator 可按 merge、rebase 或 squash 配置工作；冲突、失败和未验证项必须显式处理。'],
        ['外层验收与交接', '保存任务、附件、成本与日志；干净副本复验、秘密扫描和人工 PR 决定仍在 ASE 之外。'],
      ],
      loopLabel: '有界反馈回路', loopText: '计划 / 实现 / 验证 → 修复 → 重新验证', caption: 'INTEGRATED 是 ASE 的任务状态，不是可信 CI、人工 merge 或生产发布证明。',
    },
    data: {
      topLeft: '图 3 · 任务、附件与事件流', topRight: '本地默认可用，网络服务需要额外安全边界',
      events: [
        ['edit', '创建或更新计划', 'CLI / MCP 客户端把文本任务序列化为 header、Markdown body 和附件 JSON。'],
        ['persist', '保存与状态迁移', '默认本地 .ase/task；远程模式使用独立 Task REST server，而不是 MCP service 的同一端点。'],
        ['guard', '条件保存与合并', 'ETag / If-Match 阻止覆盖并发变更；412 后按 header key、body section 和 attachment 合并。'],
        ['observe', '看板与 WebSocket 事件', '列表、统计、依赖图和项目事件帮助人观察任务，但不证明代码质量或运行成功。'],
        ['deliver', 'draft、changeset 与 usage', '任务可携带实现草案、外部文件引用和用量记录；敏感附件需要独立保留策略。'],
      ],
      note: '.ase 与任务附件可能包含需求、源码路径、diff、日志、模型输出、成本和凭据引用；远程 token 拥有所有项目的完整权限，必须限权、使用 TLS 并设置保留期。', caption: '任务存储连接计划、状态、附件与事件，不是代码调用图，也不是自动验收系统。',
    },
    deployment: {
      topLeft: '图 4 · 部署与验证路线', topRight: '当前只有发布包、CLI 和 Fleet 配置生成实测',
      lanes: [
        { tag: 'A · 发布包核验', title: '隔离 npm + Node 22.22 CLI', flow: ['固定 2.1.6', 'CLI / MCP list', 'enterprise init'], body: '本页已执行。安装 790 个包；版本、帮助、MCP 列表和 Fleet 配置生成成功，宿主 Node 20 不满足要求。' },
        { tag: 'B · 交互式工程', title: '官方插件 + 命名任务', flow: ['setup install', '计划 / 草案', '人工验证'], body: '官方路线，未实测真实模型。Claude Code 是主目标；Copilot / Codex 支持较弱，可选外部服务可能收费。' },
        { tag: 'C · 自治 Fleet', title: 'relay + 多角色监督进程', flow: ['审查 YAML', '独立工作副本', '人类资格门禁'], body: '只生成并审查配置，未启动。真实运行前需模型、预算、进程、仓库权限与日志治理。' },
      ],
      caption: '先证明固定包和 CLI 可用，再验证插件与小任务，最后才考虑 Fleet；任何一级都不能继承上一级的验收结论。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · TASK-DRIVEN AGENT ENGINEERING', topRight: 'Interactive engineering skills are primary; autonomous Fleets are optional', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Engineering goal', issueLines: ['Requirements, repo context, and acceptance intent', 'Named task plans with explicit state', 'Developers retain direction and key decisions'], secretTitle: 'Agent and external-service credentials', secretLines: ['Remain in Agent login and authorization flows', 'Optional model / search MCP services may charge fees', 'Never enter .ase, YAML, Git, or attachments'], coreLabel: 'ASE LOCAL ENGINEERING STACK',
      localizeTitle: 'Plugin + Skills + Hooks', localizeLines: ['Claude Code is the primary target', 'Copilot / Codex have reduced support', 'Dozens of planning, code, and docs skills'], repairTitle: 'CLI + MCP + Sub-agents', repairLines: ['Tasks, boards, research, and implementation', 'MCP service exposes the tool surface', 'Hooks and sub-agents extend sessions'], validateTitle: 'Task Store + Artifacts', validateLines: ['Local ./.ase/task storage by default', 'header + body + attachment', 'solo / team / enterprise lifecycles'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Task plans, drafts, and changesets', 'Review, qualification, and integration evidence', 'Outer CI and humans decide acceptance'], evidenceTitle: 'Optional Agent Fleet', evidenceLines: ['A process and process group per member', 'Relay, supervision, logs, and restarts', 'The default qualifier keeps human decisions'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' ASE is neither a model nor free compute, and does not replace repository authorization, trusted CI, secret scanning, human merge, or production release; support differs across Agent harnesses.',
      caption: 'Skills bring engineering methods into Agent sessions, CLI / MCP manages tasks and tools, and the Task Store preserves plans, state, and attachments across sessions.',
    },
    workflow: {
      topLeft: 'FIG 2 · ENTERPRISE TASK WORKFLOW', topRight: 'Every transition from draft to integration has explicit task state',
      steps: [
        ['Create a named task', 'Turn the goal into a persisted plan and compare paths through an alternative-approach funnel instead of jumping straight to a patch.'],
        ['Challenge and research', 'Grilling and research expose open decisions, evidence gaps, and implementation risks; humans still confirm scope.'],
        ['Estimate and schedule', 'Record Effort, After, Source, Changeset, and Target so dependencies, workload, and change ownership remain inspectable.'],
        ['Generate an implementation draft', 'implement --draft stores the change as an attachment for review instead of immediately rewriting the target branch.'],
        ['Implement the real change', 'An approved plan enters IMPLEMENTING in a bounded working copy and produces testable code plus task evidence.'],
        ['Check qualification', 'Tests, review, and the qualifier produce findings; the default judge mode does not move qualification state for the human.'],
        ['Integrate the changeset', 'The integrator can merge, rebase, or squash by configuration; conflicts, failures, and open checks stay explicit.'],
        ['Accept and hand off externally', 'Retain tasks, attachments, cost, and logs; clean-copy checks, secret scanning, and human PR decisions remain outside ASE.'],
      ],
      loopLabel: 'Bounded feedback loop', loopText: 'Plan / implement / verify → repair → verify again', caption: 'INTEGRATED is an ASE task state, not proof of trusted CI, human merge, or production release.',
    },
    data: {
      topLeft: 'FIG 3 · TASK, ATTACHMENT, AND EVENT FLOW', topRight: 'Local storage works by default; network service adds a security boundary',
      events: [
        ['edit', 'Create or update a plan', 'CLI / MCP clients serialize a textual task into header, Markdown body, and attachment JSON.'],
        ['persist', 'Save and transition state', 'The default is local .ase/task; remote mode uses a separate Task REST server rather than the MCP service endpoint.'],
        ['guard', 'Conditional saves and merges', 'ETag / If-Match prevents concurrent overwrites; after a 412, merges work by header key, body section, and attachment.'],
        ['observe', 'Boards and WebSocket events', 'Lists, statistics, dependency graphs, and project events aid observation without proving code quality or runtime success.'],
        ['deliver', 'Drafts, changesets, and usage', 'Tasks can carry implementation drafts, external file references, and usage records; sensitive attachments need a retention policy.'],
      ],
      note: '.ase and task attachments may contain requirements, source paths, diffs, logs, model output, cost, and credential references. A remote token has full access to all projects; restrict it, use TLS, and define retention.', caption: 'The Task Store connects plans, state, attachments, and events. It is neither a code call graph nor an automatic acceptance system.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT AND VERIFICATION ROUTES', topRight: 'Only the Release package, CLI, and Fleet configuration generation were tested',
      lanes: [
        { tag: 'A · RELEASE CHECKS', title: 'Isolated npm + Node 22.22 CLI', flow: ['Pin 2.1.6', 'CLI / MCP list', 'enterprise init'], body: 'Executed here. Installation added 790 packages; version, help, MCP listing, and Fleet configuration succeeded, while host Node 20 was unsupported.' },
        { tag: 'B · INTERACTIVE WORK', title: 'Official plugin + named tasks', flow: ['setup install', 'Plans / drafts', 'Human verification'], body: 'Official route, with no real model tested. Claude Code is primary; Copilot / Codex have reduced support, and optional external services may charge fees.' },
        { tag: 'C · AUTONOMOUS FLEET', title: 'Relay + multi-role supervisor', flow: ['Review YAML', 'Separate work copies', 'Human qualification gate'], body: 'Only configuration generation and review occurred. Real runs need model, budget, process, repository, and log governance.' },
      ],
      caption: 'Prove the pinned package and CLI first, then plugin and small-task behavior, and only then consider a Fleet; no level inherits acceptance from another.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function AseArchitectureDiagram({ locale }: { locale: Locale }) {
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
          <div className="loop-arrows" aria-hidden="true"><span>command <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> artifact</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>task <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> state</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>Changes + evidence</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AseWorkflowDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].workflow
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <ol className="workflow-steps">{c.steps.map(([title, text], index) => <li key={title} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow', 'pink', 'green'][index]}>
      <span className="flow-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><p>{text}</p>{index < c.steps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
    </li>)}</ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>{c.loopLabel}</span><strong>{c.loopText}</strong></div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AseDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.ase/</strong><code>fleet.yaml<br />task header + body<br />draft + attachments<br />ETag + lifecycle<br />events + usage</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AseDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
