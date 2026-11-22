import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 角色化 SOP 架构', topRight: '消息协作与文件产物分离', inputLabel: '输入 / 边界',
      issueTitle: '已批准需求', issueLines: ['一句 idea', 'investment + n_round', '实现 / 评审 / QA 开关'],
      secretTitle: '宿主侧配置', secretLines: ['~/.metagpt/config2.yaml', '模型、base URL 与 key', '不进 Git 与命令行'], coreLabel: 'METAGPT 协作内核',
      localizeTitle: 'Team', localizeLines: ['雇佣角色', '发布 UserRequirement', '预算、轮次与归档'],
      repairTitle: 'Environment + Roles', repairLines: ['按 send_to 路由消息', '按 cause_by 订阅过滤', 'Role 观察并执行 Action'],
      validateTitle: 'ProjectRepo', validateLines: ['docs / resources / src', 'tests / test_outputs', '文件依赖与 Git 工作区'], outputLabel: '输出 / 外部验收',
      outputLines: ['需求、PRD、设计与任务', '可选代码、测试与轨迹', '交给外层 CI 与人审'],
      evidenceTitle: '可恢复状态', evidenceLines: ['workspace/storage/team', '角色记忆与当前状态', '恢复前必须备份'],
      boundaryLead: '边界外：', boundaryBody: 'Environment 不是系统沙箱；MetaGPT 不内建 Issue 准入、密钥托管、权限审批、干净 CI、PR 或合并闸门。',
      caption: '控制流由 Team 与源码拥有，模型在 Action 内生成内容；文件交付由 ProjectRepo 组织，而不是只留在聊天记录里。',
    },
    workflow: {
      topLeft: '图 2 · 默认软件公司工作流', topRight: '上游 Action 产物触发下游角色',
      steps: [
        ['发布需求', 'Team 把 Human 的 idea 包装为 UserRequirement，发布到共享 Environment。'],
        ['准备与撰写 PRD', 'ProductManager 执行 PrepareDocuments / WritePRD，形成需求与产品文档。'],
        ['系统设计', 'Architect 订阅 WritePRD，执行 WriteDesign，输出系统与接口设计。'],
        ['任务拆解', 'ProjectManager 订阅 WriteDesign，执行 WriteTasks，形成任务与依赖。'],
        ['编码与评审', 'Engineer 订阅任务，执行 WriteCode，可在官方默认路线中加入 WriteCodeReview。'],
        ['摘要与可选 QA', 'Engineer 可生成代码摘要；只有 --run-tests 才加入 QA 写测试、运行与调试。'],
        ['归档与外部验收', 'Team 在预算和轮次内运行并归档；外层系统再做干净 CI、安全扫描和人工合并。'],
      ],
      loopLabel: '可选调试回路', loopText: 'RunCode → DebugError → WriteTest；不是默认开启', caption: '官方默认 implement=true、code_review=true、run_tests=false；文档先行必须同时关闭实现与评审。',
    },
    data: {
      topLeft: '图 3 · 数据与证据流', topRight: 'Message 传语义，Document 与文件仓库存产物',
      events: [
        ['requirement', '用户需求', 'Message.content 携带 idea，cause_by=UserRequirement，send_to 默认面向所有角色。'],
        ['design', '结构化产物', 'instruct_content 可承载 PRD、设计、任务或编码上下文，供后续 Action 使用。'],
        ['route', '订阅与路由', 'cause_by 决定关注哪类上游动作，send_to 与角色地址决定进入谁的私有缓冲。'],
        ['repository', '文件与依赖', 'Document 记录 root_path、filename、content；ProjectRepo 写入分组文件仓库。'],
        ['acceptance', '独立验收', 'workspace 产物复制到干净环境后，才运行外层 CI、扫描和人工评审。'],
      ],
      note: '消息、序列化状态和 workspace 可能包含私有需求、源码、路径、配置与成本信息；接入工厂时需要限权、脱敏和保留期。', caption: 'Team 返回的是 ProjectRepo，不是“已验收可合并”的承诺；外层系统必须独立检查文件和测试证据。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: '离线入口已实测，真实模型路线保持未执行声明',
      lanes: [
        { tag: 'A · 离线核验', title: '固定源码 + 兼容依赖', flow: ['v0.8.1', '导入与编译', 'CLI --help'], body: '本页已执行。原始 LanceDB 版本不可解析；兼容替换后入口可用，但 pip check 仍保留声明偏差。' },
        { tag: 'B · 文档先行', title: '无 Engineer 的模型烟测', flow: ['批准需求', 'PRD 与设计', '任务文件'], body: '使用 --no-implement --no-code-review --no-run-tests，降低代码执行面；真实模型与产物质量未在本站执行。' },
        { tag: 'C · 完整生成', title: '隔离实现 + 可选 QA', flow: ['一次性 VM', '编码与测试', '外层 CI'], body: '启用 QA 会执行生成测试；不挂 Docker socket，不带生产凭据，产物必须经独立验收和人工评审。' },
      ],
      caption: '恢复路线是状态管理功能，不是绕过验收的捷径；恢复前备份 Team 与 workspace，恢复后仍需完整外部验收。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · ROLE-BASED SOP ARCHITECTURE', topRight: 'Message collaboration is separate from file artifacts', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Approved requirement', issueLines: ['One-line idea', 'investment + n_round', 'Implementation / review / QA switches'],
      secretTitle: 'Host-side configuration', secretLines: ['~/.metagpt/config2.yaml', 'Model, base URL, and key', 'Never in Git or command lines'], coreLabel: 'METAGPT COLLABORATION CORE',
      localizeTitle: 'Team', localizeLines: ['Hires roles', 'Publishes UserRequirement', 'Budget, rounds, and archiving'],
      repairTitle: 'Environment + Roles', repairLines: ['Routes by send_to', 'Filters subscriptions by cause_by', 'Roles observe and execute Actions'],
      validateTitle: 'ProjectRepo', validateLines: ['docs / resources / src', 'tests / test_outputs', 'File dependencies and Git workspace'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Requirement, PRD, design, and tasks', 'Optional code, tests, and traces', 'Handed to outer CI and human review'],
      evidenceTitle: 'Recoverable state', evidenceLines: ['workspace/storage/team', 'Role memory and current state', 'Back up before recovery'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Environment is not a system sandbox; MetaGPT has no built-in Issue admission, secret custody, permission approvals, clean CI, PR, or merge gate.',
      caption: 'Team and source own control flow, models generate content inside Actions, and ProjectRepo organizes deliverable files instead of leaving them only in chat.',
    },
    workflow: {
      topLeft: 'FIG 2 · DEFAULT SOFTWARE-COMPANY WORKFLOW', topRight: 'Upstream Action artifacts trigger downstream roles',
      steps: [
        ['Publish the requirement', 'Team wraps the human idea as UserRequirement and publishes it to the shared Environment.'],
        ['Prepare documents and write the PRD', 'ProductManager runs PrepareDocuments / WritePRD to produce requirement and product documents.'],
        ['Design the system', 'Architect subscribes to WritePRD and runs WriteDesign for system and interface design.'],
        ['Break down tasks', 'ProjectManager subscribes to WriteDesign and runs WriteTasks for tasks and dependencies.'],
        ['Write and review code', 'Engineer subscribes to tasks and runs WriteCode, with WriteCodeReview in the official default route.'],
        ['Summarize and optionally run QA', 'Engineer can summarize code; only --run-tests adds QA to write, execute, and debug tests.'],
        ['Archive and accept externally', 'Team runs within budget and rounds, then archives; the outer system performs clean CI, security scans, and human merge.'],
      ],
      loopLabel: 'Optional debug loop', loopText: 'RunCode → DebugError → WriteTest; disabled by default', caption: 'Official defaults are implement=true, code_review=true, and run_tests=false; documentation-first requires disabling both implementation and review.',
    },
    data: {
      topLeft: 'FIG 3 · DATA & EVIDENCE FLOW', topRight: 'Messages carry semantics; Documents and file repositories carry artifacts',
      events: [
        ['requirement', 'User requirement', 'Message.content carries the idea, cause_by=UserRequirement, and send_to defaults to all roles.'],
        ['design', 'Structured artifacts', 'instruct_content can hold PRD, design, task, or coding context for subsequent Actions.'],
        ['route', 'Subscriptions and routing', 'cause_by selects upstream action types, while send_to and role addresses select the private buffer.'],
        ['repository', 'Files and dependencies', 'Document records root_path, filename, and content; ProjectRepo writes grouped file repositories.'],
        ['acceptance', 'Independent acceptance', 'Only after copying workspace artifacts to a clean environment does the outer system run CI, scans, and human review.'],
      ],
      note: 'Messages, serialized state, and workspace can contain private requirements, source, paths, configuration, and cost data; restrict, redact, and retain them deliberately.', caption: 'Team returns a ProjectRepo, not a promise that output is accepted or mergeable; the outer system must independently inspect files and test evidence.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Offline entry points were tested; real model routes remain explicitly unexecuted',
      lanes: [
        { tag: 'A · OFFLINE VERIFICATION', title: 'Fixed source + compatibility dependencies', flow: ['v0.8.1', 'Imports and compilation', 'CLI --help'], body: 'Executed here. The original LanceDB pin no longer resolves; entry points load after replacement, but pip check retains the declaration mismatch.' },
        { tag: 'B · DOCUMENTATION FIRST', title: 'Model smoke run without an Engineer', flow: ['Approved requirement', 'PRD and design', 'Task files'], body: 'Use --no-implement --no-code-review --no-run-tests to reduce code-execution exposure; real model output and quality were not tested here.' },
        { tag: 'C · FULL GENERATION', title: 'Isolated implementation + optional QA', flow: ['Disposable VM', 'Code and tests', 'Outer CI'], body: 'QA executes generated tests; use no Docker socket or production credentials, and require independent acceptance plus human review.' },
      ],
      caption: 'Recovery is state management, not an acceptance shortcut. Back up Team and workspace before recovery, then repeat full external acceptance.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function MetaGPTArchitectureDiagram({ locale }: { locale: Locale }) {
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
          <div className="loop-arrows" aria-hidden="true"><span>roles <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> state</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>documents <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> context</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>ProjectRepo</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function MetaGPTWorkflowDiagram({ locale }: { locale: Locale }) {
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

export function MetaGPTDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>workspace/</strong><code>storage/team/team.json<br />&lt;project&gt;/docs/prd/<br />&lt;project&gt;/docs/system_design/<br />&lt;project&gt;/docs/task/<br />&lt;project&gt;/tests/<br />&lt;project&gt;/test_outputs/</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function MetaGPTDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
