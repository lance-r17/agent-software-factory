import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · MCP 交付控制架构', topRight: 'Agent 负责生成，Loom 负责状态、合同与路由', inputLabel: '输入 / 边界',
      issueTitle: '交付目标', issueLines: ['范围、仓库上下文与验收意图', '测试、日志与预览证据', '由受支持的 coding agent 发起'],
      secretTitle: '宿主与模型凭据', secretLines: ['留在所选 Agent 的登录流程', '不写进 .loom / YAML / Git', 'Docker 预览不接收模型 key'], coreLabel: 'LOOM 本地交付栈',
      localizeTitle: 'Agent 插件 + Rust MCP', localizeLines: ['@loom 或 /loom 命令面', '本地 MCP delivery state machine', '返回结构化 next action'],
      repairTitle: '动态工作流路由器', repairLines: ['request manifest', 'requestReadPlan + field groups', 'writeTargets + resultFile'],
      validateTitle: '项目本地 .loom/', validateLines: ['需求、计划与 TaskResult', '评审、修复与运行事实', 'continue 从持久状态恢复'], outputLabel: '输出 / 外部验收',
      outputLines: ['代码、测试与交付 artifacts', '评审、修复和本地预览证据', '外层 CI 与人工决定是否接受'],
      evidenceTitle: '按需算法与证据图', evidenceLines: ['隔离 Python >= 3.11', '检索 / 分词等算法 worker', 'deliveryGraph 只读 .loom'],
      boundaryLead: '边界外：', boundaryBody: 'Loom 不是模型，也不拥有外层仓库写权限、可信 CI、自动 merge 或生产发布；当前 deploy 只支持本地 Docker Compose 预览。',
      caption: '插件把请求交给 Rust MCP；路由器声明读什么、写哪里，Agent 提交合同化结果后继续下一动作。',
    },
    workflow: {
      topLeft: '图 2 · 可恢复交付工作流', topRight: '每一步都从状态路由，而不是依赖聊天记忆',
      steps: [
        ['启动或恢复', 'build 开启交付；中断或新会话先运行 continue，从项目 .loom/ 状态找到下一动作。'],
        ['澄清并确认范围', '确认需求、边界和验收意图；可选知识源只提供澄清线索，不自动成为需求。'],
        ['建立交付基线', '形成 repository context、technical baseline、planning contract 与 architecture artifact。'],
        ['生成任务合同', '任务计划声明所有权、字段组读取、写入边界、验证意图和 TaskResult 模板。'],
        ['执行有界任务', 'Agent 只按当前 request 工作，把代码、命令和证据写入预期 artifact，而非自由改全仓。'],
        ['提交 TaskResult', 'Loom 校验、规范化并持久化结果，再根据真实状态路由下一任务或修复路径。'],
        ['评审与有界修复', '结构化 review 信号可路由代码、任务计划或架构修复；更新结果必须重新验证。'],
        ['预览与交接', '需要时准备本地 Compose 预览；保存日志、运行事实和未完成项，供 continue 或人工接手。'],
      ],
      loopLabel: '有界反馈回路', loopText: '验证 / 评审 → 修复请求 → 重新验证', caption: ' completed 不是外层验收；真实模型、Docker、成本与交付质量必须在目标环境单独验证。',
    },
    data: {
      topLeft: '图 3 · 请求、写入与证据流', topRight: '读取按需展开，写入由合同限定',
      events: [
        ['request', '请求清单', '当前动作给出 requestReadPlan、outputContract、执行规则和 recommended next tool。'],
        ['read', '字段组定向读取', 'readFieldGroup 只展开声明的 selectors；完整日志通过 fullLogRef 按需读取。'],
        ['write', '授权 artifact I/O', 'writeTargets 指定可写文件；TaskResult 只写 outputContract.resultFile。'],
        ['persist', '校验与状态迁移', 'Loom 校验提交、保存结果并给出下一动作；缺失阶段不会伪造完整证据图。'],
        ['inspect', '只读交付证据图', 'deliveryGraph 返回 nodes、edges 和 Mermaid；它读取记录，不重跑测试或修改状态。'],
      ],
      note: '.loom/ 可能包含需求、源码路径、日志、模型输出、预览环境与修复历史；需要限权、脱敏、备份和保留期。', caption: '交付图连接的是计划、任务、结果、验证与评审证据，不是代码调用图，也不是运行成功证明。',
    },
    deployment: {
      topLeft: '图 4 · 部署与验证路线', topRight: '只有源码语法和 Python 算法在当前环境实测',
      lanes: [
        { tag: 'A · 离线源码', title: '静态语法 + Python algorithms', flow: ['固定 fc4c0ba', '7 passed', '无模型 key'], body: '本页已执行。脚本与插件语法通过，隔离依赖下 7 项 Python 测试通过；Rust 与 Release 包未实测。' },
        { tag: 'B · AGENT 插件', title: '官方安装器 + MCP 注册', flow: ['Release + SHA', 'loom-setup doctor', '新会话 status'], body: '官方路线，本站未执行。安装器按 OS / CPU 下载并校验 Release，注册 MCP；用户不手工启动 server。' },
        { tag: 'C · 交付 / 预览', title: 'build → review → local deploy', flow: ['TaskResult', '修复环', 'Compose preview'], body: '未实测。真实交付需要受支持 Agent 与模型；deploy 还需要 Docker，且明确不是生产部署。' },
      ],
      caption: '先证明固定源码可检查，再验证安装与只读 status，最后才开放真实交付；任何一级都不能继承上一级的验收结论。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · MCP DELIVERY CONTROL ARCHITECTURE', topRight: 'The Agent generates; Loom owns state, contracts, and routing', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Delivery goal', issueLines: ['Scope, repo context, and acceptance intent', 'Tests, logs, and preview evidence', 'Started by a supported coding Agent'],
      secretTitle: 'Host and model credentials', secretLines: ['Remain in the selected Agent login flow', 'Never enter .loom / YAML / Git', 'No model key in the Docker preview'], coreLabel: 'LOOM LOCAL DELIVERY STACK',
      localizeTitle: 'Agent plugin + Rust MCP', localizeLines: ['@loom or /loom command surface', 'Local MCP delivery state machine', 'Structured next-action responses'],
      repairTitle: 'Dynamic workflow router', repairLines: ['Request manifest', 'requestReadPlan + field groups', 'writeTargets + resultFile'],
      validateTitle: 'Project-local .loom/', validateLines: ['Requirements, plans, and TaskResults', 'Reviews, repairs, and runtime facts', 'continue resumes persisted state'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Code, tests, and delivery artifacts', 'Review, repair, and local-preview evidence', 'Outer CI and humans decide acceptance'],
      evidenceTitle: 'On-demand algorithms and graph', evidenceLines: ['Isolated Python >= 3.11', 'Retrieval / tokenization workers', 'deliveryGraph only reads .loom'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Loom is not a model and does not own outer repository writes, trusted CI, automatic merge, or production release; deploy currently means local Docker Compose preview only.',
      caption: 'The plugin sends requests to Rust MCP; the router declares reads and writes, and the Agent submits contracted results before receiving the next action.',
    },
    workflow: {
      topLeft: 'FIG 2 · RECOVERABLE DELIVERY WORKFLOW', topRight: 'State routes every step instead of chat memory',
      steps: [
        ['Start or resume', 'build starts a delivery; after interruption or a new session, continue finds the next action from project .loom/ state.'],
        ['Clarify and confirm scope', 'Confirm requirements, boundaries, and acceptance intent; optional knowledge sources inform clarification rather than becoming requirements themselves.'],
        ['Build the delivery baseline', 'Create repository context, a technical baseline, a planning contract, and an architecture artifact.'],
        ['Generate task contracts', 'Task plans declare ownership, field-group reads, write boundaries, verification intent, and TaskResult templates.'],
        ['Execute bounded tasks', 'The Agent handles only the current request and writes code, commands, and evidence to expected artifacts instead of roaming the repository.'],
        ['Submit the TaskResult', 'Loom validates, normalizes, and persists the result, then routes the next task or repair from actual state.'],
        ['Review and repair within bounds', 'Structured review signals can route code, task-plan, or architecture repair; every updated result needs verification again.'],
        ['Preview and hand off', 'When requested, prepare a local Compose preview; preserve logs, runtime facts, and open items for continue or a human handoff.'],
      ],
      loopLabel: 'Bounded feedback loop', loopText: 'Verify / review → repair request → verify again', caption: 'Completed is not outer acceptance; real models, Docker, cost, and delivery quality need separate validation in the target environment.',
    },
    data: {
      topLeft: 'FIG 3 · REQUEST, WRITE, AND EVIDENCE FLOW', topRight: 'Reads expand on demand; writes stay contract-bound',
      events: [
        ['request', 'Request manifest', 'The current action provides requestReadPlan, outputContract, execution rules, and the recommended next tool.'],
        ['read', 'Targeted field-group reads', 'readFieldGroup expands declared selectors only; full logs remain available through fullLogRef when needed.'],
        ['write', 'Authorized artifact I/O', 'writeTargets names writable files; a TaskResult goes only to outputContract.resultFile.'],
        ['persist', 'Validation and state transition', 'Loom validates submissions, stores results, and returns the next action; missing stages never become a complete evidence graph.'],
        ['inspect', 'Read-only delivery evidence graph', 'deliveryGraph returns nodes, edges, and Mermaid; it reads records without rerunning tests or changing state.'],
      ],
      note: '.loom/ can contain requirements, source paths, logs, model output, preview environments, and repair history; apply access control, redaction, backup, and retention.', caption: 'The delivery graph links plans, tasks, results, verification, and review evidence. It is neither a code call graph nor proof of runtime success.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT AND VERIFICATION ROUTES', topRight: 'Only source syntax and Python algorithms were tested here',
      lanes: [
        { tag: 'A · OFFLINE SOURCE', title: 'Static syntax + Python algorithms', flow: ['Pin fc4c0ba', '7 passed', 'No model key'], body: 'Executed here. Script and plugin syntax passed, as did seven Python tests with isolated dependencies; Rust and the Release package were not tested.' },
        { tag: 'B · AGENT PLUGIN', title: 'Official installer + MCP registration', flow: ['Release + SHA', 'loom-setup doctor', 'status in new session'], body: 'Official route, not executed here. The installer downloads and checks an OS / CPU Release, registers MCP, and needs no manual server launch.' },
        { tag: 'C · DELIVERY / PREVIEW', title: 'build → review → local deploy', flow: ['TaskResult', 'Repair loop', 'Compose preview'], body: 'Not tested. Real delivery needs a supported Agent and model; deploy also needs Docker and is explicitly not production deployment.' },
      ],
      caption: 'Check pinned source first, then installation and read-only status, and only then open real delivery; no level inherits acceptance from the previous one.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function LoomArchitectureDiagram({ locale }: { locale: Locale }) {
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
          <div className="loop-arrows" aria-hidden="true"><span>request <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> action</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>artifact <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> state</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>Artifacts + evidence</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function LoomWorkflowDiagram({ locale }: { locale: Locale }) {
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

export function LoomDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.loom/</strong><code>request manifest<br />read groups + selectors<br />writeTargets + resultFile<br />TaskResult + fullLogRef<br />review + repair + deploy</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function LoomDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
