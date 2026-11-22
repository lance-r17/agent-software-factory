import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert, TerminalSquare } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 逻辑架构', topRight: 'Agent 不持有模型密钥以外的“平台权限”', inputLabel: '输入 / 你的系统', taskTitle: '任务与代码', taskLines: ['task 文本', 'Git 工作区', '测试与依赖镜像'],
      coreLabel: 'mini-SWE-agent 进程', modelLines: ['LiteLLM / OpenRouter', '生成动作 · 解析工具调用', '格式化观察'], agentLines: ['线性 messages', '成本 / 步数 / 墙钟限制', '异常驱动控制流'],
      outputLabel: '输出 / 仍需验收', changeTitle: '工作区变更', changeLines: ['源代码与测试', '候选 git diff', '不是自动合格补丁'], trajectoryTitle: '轨迹 JSON', trajectoryLines: ['消息与工具结果', '配置与模型统计', 'exit_status'],
      boundaryLead: '边界外：', boundaryBody: ' Issue 调度、PR 审批、权限系统、制品仓库、自动合并均不是 mini 的内建平台能力。', caption: '核心只有三类可替换协议：Model、Agent、Environment。v2 把动作解析与观察格式化移到 Model，Agent 成为更薄的协调器。',
    },
    workflow: {
      topLeft: '图 2 · 单任务闭环', topRight: '每一步后都会保存 trajectory（配置 output_path 时）',
      steps: [['渲染任务', 'system_template + instance_template，把 task 与环境信息放入初始消息。'], ['查询模型', 'Model.query(messages) 返回原生消息与一个或多个 bash 动作。'], ['检查闸门', '在查询前检查 step_limit、cost_limit、wall_time_limit_seconds。'], ['执行命令', '每个动作进入独立 subprocess 或 docker exec；目录与 export 默认不跨动作保留。'], ['写回观察', 'returncode、stdout/stderr 与异常被模型适配器格式化后追加到 messages。'], ['提交或终止', '魔法字符串触发 Submitted；超限、重复格式错误与用户中断也能结束循环。']],
      loopLabel: '若最后一条消息不是 role = exit', loopText: '返回 02，继续下一轮', captionBefore: '提交信号：', captionAfter: '。必须独占命令，且成功返回后才算 Submitted。',
    },
    data: {
      topLeft: '图 3 · 数据与事件流', topRight: '轨迹就是消息历史 + 配置 + 结果元数据',
      events: [['system', '行为契约', '告诉模型只能用 bash、如何编辑、怎样提交。'], ['user', '任务实例', 'Issue 文本、仓库信息和验收要求。'], ['assistant', '动作消息', '原生 tool call 或文本解析后的 actions。'], ['tool', '执行观察', '输出、返回码、超时或异常；过长输出默认截头尾。'], ['assistant', '下一轮决策', '读取观察，继续定位、修改或测试。'], ['exit', '退出记录', 'Submitted / LimitsExceeded / TimeExceeded / RepeatedFormatError。']],
      note: '可能包含源码、命令输出与敏感路径，应按内部日志保护，不宜直接公开上传。', caption: 'FormatError 不会简单丢弃：v2.4.6 专门修复了“响应解析失败但模型调用已计费”未计入 cost_limit 的问题。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: '从可读 demo 到无人值守批处理，信任边界逐步收紧',
      lanes: [
        { tag: 'A · 第一次体验', title: '本地 + confirm', flow: ['你的终端', '项目副本', '人工确认每条命令'], body: '最快，但 local 无隔离。只用可丢弃副本，不挂载真实凭据。' },
        { tag: 'B · 推荐复现', title: 'Docker + 限权', flow: ['宿主 Agent', '受限容器', '挂载工作区'], body: '模型 key 留在宿主；容器只拿代码。禁网、禁 capabilities、限 CPU / 内存 / PID。' },
        { tag: 'C · 自动化工厂', title: '调度器 + 验收', flow: ['Issue / cron', 'mini', '测试 + diff + 人审'], body: '调度、重试和 PR 由外层完成；Submitted 也不能替代测试与人工合并。' },
      ], caption: '三条路线都无需常驻端口。只有 SWE-bench / ProgramBench 等批量 runner 需要额外数据集、镜像与运行时依赖。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · LOGICAL ARCHITECTURE', topRight: 'The Agent holds no platform privilege beyond its model credential', inputLabel: 'INPUT / YOUR SYSTEM', taskTitle: 'Task and code', taskLines: ['task text', 'Git workspace', 'Tests and dependency image'],
      coreLabel: 'MINI-SWE-AGENT PROCESS', modelLines: ['LiteLLM / OpenRouter', 'Generate and parse actions', 'Format observations'], agentLines: ['Linear messages', 'Cost / step / wall-clock limits', 'Exception-driven control flow'],
      outputLabel: 'OUTPUT / VERIFY SEPARATELY', changeTitle: 'Workspace changes', changeLines: ['Source and tests', 'Candidate git diff', 'Not an approved patch'], trajectoryTitle: 'Trajectory JSON', trajectoryLines: ['Messages and tool results', 'Configuration and model stats', 'exit_status'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Issue scheduling, PR approval, authorization, artifact registries, and automatic merge are not built-in mini platform capabilities.', caption: 'The core has only three replaceable protocols: Model, Agent, and Environment. In v2, action parsing and observation formatting move to Model, making Agent a thinner coordinator.',
    },
    workflow: {
      topLeft: 'FIG 2 · SINGLE-TASK LOOP', topRight: 'Trajectory is saved after every step when output_path is configured',
      steps: [['Render the task', 'system_template + instance_template place the task and environment data in the initial messages.'], ['Query the model', 'Model.query(messages) returns a native message and one or more bash actions.'], ['Check guardrails', 'Before querying, check step_limit, cost_limit, and wall_time_limit_seconds.'], ['Execute the command', 'Each action enters an independent subprocess or docker exec; cwd and exports do not persist by default.'], ['Append the observation', 'returncode, stdout/stderr, and exceptions are formatted by the model adapter and appended to messages.'], ['Submit or terminate', 'The magic string triggers Submitted; limits, repeated format errors, and user interruption can also end the loop.']],
      loopLabel: 'If the final message is not role = exit', loopText: 'Return to 02 for another iteration', captionBefore: 'Submission signal: ', captionAfter: '. It must be the entire command and return successfully before the status becomes Submitted.',
    },
    data: {
      topLeft: 'FIG 3 · DATA & EVENT FLOW', topRight: 'Trajectory = message history + configuration + result metadata',
      events: [['system', 'Behavior contract', 'Tells the model to use only bash, how to edit, and how to submit.'], ['user', 'Task instance', 'Issue text, repository information, and acceptance requirements.'], ['assistant', 'Action message', 'A native tool call or actions produced by text parsing.'], ['tool', 'Execution observation', 'Output, return code, timeout, or exception; long output is trimmed at both ends by default.'], ['assistant', 'Next decision', 'Reads the observation and continues locating, editing, or testing.'], ['exit', 'Exit record', 'Submitted / LimitsExceeded / TimeExceeded / RepeatedFormatError.']],
      note: 'It can contain source code, command output, and sensitive paths. Protect it like internal logs rather than uploading it publicly.', caption: 'FormatError is not simply discarded: v2.4.6 specifically fixed the case where a billed model call with an unparseable response was not counted toward cost_limit.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Tighten the trust boundary from readable demo to unattended batch',
      lanes: [
        { tag: 'A · FIRST RUN', title: 'Local + confirm', flow: ['Your terminal', 'Project copy', 'Confirm each command'], body: 'Fastest, but local has no isolation. Use a disposable copy and do not expose real credentials.' },
        { tag: 'B · RECOMMENDED REPRODUCTION', title: 'Docker + constraints', flow: ['Host Agent', 'Restricted container', 'Mounted workspace'], body: 'Model key stays on the host; the container gets only code. Disable network and capabilities; limit CPU / memory / PIDs.' },
        { tag: 'C · AUTOMATED FACTORY', title: 'Scheduler + acceptance', flow: ['Issue / cron', 'mini', 'Tests + diff + review'], body: 'Scheduling, retry, and PR belong to the outer system; Submitted cannot replace tests and human merge.' },
      ], caption: 'None of the three routes needs a persistent port. Only batch runners such as SWE-bench / ProgramBench require additional datasets, images, and runtime dependencies.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function ArchitectureDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].architecture
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column"><span className="diagram-label">{c.inputLabel}</span><div className="diagram-box yellow"><GitBranch /><strong>{c.taskTitle}</strong><Lines lines={c.taskLines} /></div><div className="diagram-box pink"><KeyRound /><strong>{locale === 'en' ? 'Model credentials' : '模型凭据'}</strong><small>MSWEA_MODEL_NAME<br />PROVIDER_API_KEY</small></div></div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core"><span className="diagram-label">{c.coreLabel}</span><div className="core-loop">
        <div className="diagram-box blue"><span className="box-index">M</span><strong>Model adapter</strong><Lines lines={c.modelLines} /></div><div className="loop-arrows" aria-hidden="true"><span>messages <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
        <div className="diagram-box green"><span className="box-index">A</span><strong>DefaultAgent</strong><Lines lines={c.agentLines} /></div><div className="loop-arrows" aria-hidden="true"><span>action <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> output</span></div>
        <div className="diagram-box yellow"><TerminalSquare /><strong>Environment</strong><small>local subprocess<br />docker exec<br />singularity / bwrap…</small></div>
      </div></div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column"><span className="diagram-label">{c.outputLabel}</span><div className="diagram-box green"><Check /><strong>{c.changeTitle}</strong><Lines lines={c.changeLines} /></div><div className="diagram-box blue"><FileJson /><strong>{c.trajectoryTitle}</strong><Lines lines={c.trajectoryLines} /></div></div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div><figcaption>{c.caption}</figcaption>
  </figure>
}

export function WorkflowDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].workflow
  return <figure className="paper-diagram workflow-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><ol className="workflow-steps">{c.steps.map(([title, text], index) => <li key={title} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}><span className="flow-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><p>{text}</p>{index < c.steps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}</li>)}</ol><div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>{c.loopLabel}</span><strong>{c.loopText}</strong></div><figcaption>{c.captionBefore}<code>echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT</code>{c.captionAfter}</figcaption></figure>
}

export function DataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><div className="event-layout"><ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol><div className="trajectory-note"><Database /><strong>*.traj.json</strong><code>info.mini_version<br />info.model_stats<br />info.config<br />info.exit_status<br />info.submission<br />messages[]</code><p>{c.note}</p></div></div><figcaption>{c.caption}</figcaption></figure>
}

export function DeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div><figcaption>{c.caption}</figcaption></figure>
}
