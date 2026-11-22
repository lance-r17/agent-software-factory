import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert, TerminalSquare } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 逻辑架构', topRight: 'SWEEnv 是 SWE-ReX 之上的薄封装', inputLabel: '输入 / 你的系统', taskTitle: '任务与代码', taskLines: ['GitHub Issue / 文本', 'GitHub 或本地仓库', 'SWE-bench 实例'], secretTitle: '宿主侧凭据', secretLines: ['OPENAI / ANTHROPIC key', '可选 GITHUB_TOKEN', '不写进 YAML 或 Git'],
      coreLabel: 'sweagent CLI 与 Agent 进程', configTitle: 'YAML 配置', configLines: ['agent / env / tools', '模板与解析器', '成本与超时限制'], agentLines: ['HistoryProcessor 压缩', 'function_calling 解析', '统计成本与超时'], envLines: ['Deployment 启停容器', 'shell session 执行', '安装 ACI 工具束'],
      outputLabel: '输出 / 仍需验收', patchTitle: '补丁与预测', patchLines: ['submit 提取 diff', 'run-batch 汇总 preds.json', '不直接等于测试通过'], trajectoryTitle: '轨迹与日志', trajectoryLines: ['*.traj / config.yaml', 'info / warning / debug log', 'exit_statuses.yaml'],
      boundaryLead: '边界外：', boundaryBody: 'Issue 队列、权限审批、确定性合并、凭证轮换与团队审计都不是 v1.1.0 的内建平台能力。', caption: '核心链路：CLI 装配配置，Agent 产生动作，SWEEnv 借助 SWE-ReX 在本地 Docker、Modal、Fargate 等部署中执行。',
    },
    workflow: {
      topLeft: '图 2 · 单任务闭环', topRight: '每一步都受 execution / install / total timeout 约束',
      steps: [['合并配置', '默认 YAML 与 --config 覆盖项合成本次运行配置，包含模型、工具、仓库与预算。'], ['启动部署', 'SWE-ReX 默认拉起 python:3.11 Docker；也可切换到 Modal、Fargate 或 local。'], ['注入 ACI', 'registry、edit_anthropic、review_on_submit_m 等工具束复制进环境并安装。'], ['模型决策', 'HistoryProcessor 压缩历史，模型用 function calling 返回一个结构化动作。'], ['执行观察', 'ToolHandler 在 shell session 中执行命令，把输出、状态与异常写回历史。'], ['提交留证', 'submit 提取工作区 diff；轨迹、配置与日志落盘，批处理再汇总 preds.json。']],
      loopLabel: '若未 submit 且未超预算', loopText: '返回 04，继续下一轮', caption: '默认限制：单命令 30 秒、工具安装每条 300 秒、全部命令合计 1800 秒；连续 3 次命令超时即退出。',
    },
    data: {
      topLeft: '图 3 · 数据与事件流', topRight: '轨迹是研究对象，也是外层流水线的验收接口',
      events: [['config', '运行指纹', '合并后的 config.yaml 记录模型、模板、工具束、仓库与限制。'], ['query', '模型输入', 'v1.1.0 起每步保存当前精确 query，取代旧 messages 字段。'], ['thought', '解析前推理', '模型原始输出中分离出的 thought，用于审计而不是直接执行。'], ['action', '结构化动作', 'function_calling 或 thought_action 解析器得到 shell / edit / submit。'], ['observation', '环境反馈', 'stdout、stderr、返回码、超时，以及工具状态 JSON。'], ['exit', '结果元数据', 'Submitted、CostLimitExceeded、TotalExecutionTimeExceeded 等退出原因。']],
      note: '轨迹可能包含私有源码、绝对路径和误打印的密钥；公开分享前必须脱敏并限制保留期。', caption: '批处理的 preds.json 可交给 SWE-bench 评测；评测是单独步骤，不是 run-batch 的自动结论。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: '先把执行面隔离，再扩大批量与云端范围',
      lanes: [
        { tag: 'A · 单仓库复现', title: '源码安装 + 加固 Docker', flow: ['宿主 CLI', '上传本地副本', '断网容器执行'], body: '模型 key 留在宿主；仓库由 SWE-ReX 上传；容器断网、丢弃 capabilities、限制 CPU / 内存 / PID。' },
        { tag: 'B · 无本地 Docker', title: '本地仓库 + Modal', flow: ['本地代码', 'Modal sandbox', '云端执行'], body: '绕开本机 Docker 依赖，但代码与命令离开本机；先确认云端区域、日志与数据边界。' },
        { tag: 'C · 批量评测', title: 'run-batch + SWE-bench', flow: ['实例集', 'num_workers', 'preds + traj'], body: '适合基准和历史 Issue 批处理；并发会放大成本与宿主机 / Docker 负载，先用 slice :3 烟测。' },
      ], caption: '所有路线的模型 key 都在宿主进程环境或密钥管理器中；不要把 key 写进 YAML、Git 仓库或容器镜像。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · LOGICAL ARCHITECTURE', topRight: 'SWEEnv is a thin wrapper above SWE-ReX', inputLabel: 'INPUT / YOUR SYSTEM', taskTitle: 'Task and code', taskLines: ['GitHub Issue / text', 'GitHub or local repository', 'SWE-bench instance'], secretTitle: 'Host credentials', secretLines: ['OPENAI / ANTHROPIC key', 'Optional GITHUB_TOKEN', 'Never in YAML or Git'],
      coreLabel: 'SWEAGENT CLI & AGENT PROCESS', configTitle: 'YAML configuration', configLines: ['agent / env / tools', 'Templates and parsers', 'Cost and timeout limits'], agentLines: ['HistoryProcessor compression', 'function_calling parser', 'Cost and timeout accounting'], envLines: ['Deployment starts containers', 'Shell-session execution', 'Installs ACI tool bundles'],
      outputLabel: 'OUTPUT / VERIFY SEPARATELY', patchTitle: 'Patch and predictions', patchLines: ['submit extracts diff', 'run-batch aggregates preds.json', 'Not proof of passing tests'], trajectoryTitle: 'Trajectories and logs', trajectoryLines: ['*.traj / config.yaml', 'info / warning / debug log', 'exit_statuses.yaml'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Issue queues, permission approval, deterministic merge, credential rotation, and team audit are not built-in v1.1.0 platform capabilities.', caption: 'Core path: the CLI assembles configuration, Agent produces actions, and SWEEnv uses SWE-ReX to execute in local Docker, Modal, Fargate, or another deployment.',
    },
    workflow: {
      topLeft: 'FIG 2 · SINGLE-TASK LOOP', topRight: 'Every step is constrained by execution / install / total timeout',
      steps: [['Merge configuration', 'Default YAML and --config overrides become the run configuration: model, tools, repository, and budget.'], ['Start deployment', 'SWE-ReX starts python:3.11 Docker by default; Modal, Fargate, and local are alternatives.'], ['Inject ACI', 'Tool bundles such as registry, edit_anthropic, and review_on_submit_m are copied into the environment and installed.'], ['Model decision', 'HistoryProcessor compresses history; the model returns a structured action through function calling.'], ['Execute and observe', 'ToolHandler runs the command in a shell session and appends output, status, and exceptions to history.'], ['Submit evidence', 'submit extracts the workspace diff; trajectory, configuration, and logs are persisted, and batches aggregate preds.json.']],
      loopLabel: 'If no submit occurred and budget remains', loopText: 'Return to 04 for another iteration', caption: 'Default limits: 30 seconds per command, 300 seconds per tool installation, 1800 seconds across all commands; three consecutive command timeouts end the run.',
    },
    data: {
      topLeft: 'FIG 3 · DATA & EVENT FLOW', topRight: 'The trajectory is a research object and an outer-pipeline acceptance interface',
      events: [['config', 'Run fingerprint', 'Merged config.yaml records model, templates, tool bundles, repository, and limits.'], ['query', 'Model input', 'Since v1.1.0, each step stores the exact current query, replacing the old messages field.'], ['thought', 'Pre-parse reasoning', 'Thought separated from raw model output; used for audit, not direct execution.'], ['action', 'Structured action', 'function_calling or thought_action parser produces shell / edit / submit.'], ['observation', 'Environment feedback', 'stdout, stderr, return code, timeout, and tool-state JSON.'], ['exit', 'Result metadata', 'Submitted, CostLimitExceeded, TotalExecutionTimeExceeded, and other exit reasons.']],
      note: 'Trajectories can contain private source, absolute paths, and accidentally printed secrets; redact before public sharing and restrict retention.', caption: 'Batch preds.json can be passed to SWE-bench evaluation; evaluation is a separate step, not an automatic conclusion from run-batch.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Isolate the execution surface before expanding batch or cloud scope',
      lanes: [
        { tag: 'A · ONE-REPOSITORY REPRODUCTION', title: 'Source + hardened Docker', flow: ['Host CLI', 'Upload local copy', 'Offline container'], body: 'Model key stays on the host; SWE-ReX uploads the repository; the container has no network or capabilities and limited CPU / memory / PIDs.' },
        { tag: 'B · NO LOCAL DOCKER', title: 'Local repository + Modal', flow: ['Local code', 'Modal sandbox', 'Cloud execution'], body: 'Removes the local Docker dependency, but code and commands leave the host; confirm cloud region, logs, and data boundaries first.' },
        { tag: 'C · BATCH EVALUATION', title: 'run-batch + SWE-bench', flow: ['Instance set', 'num_workers', 'preds + traj'], body: 'Suitable for benchmarks and historical Issue batches; concurrency amplifies cost and host / Docker load, so smoke-test slice :3 first.' },
      ], caption: 'Every route keeps model keys in the host process environment or secret manager; never write keys into YAML, a Git repository, or a container image.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) { return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small> }

export function SweArchitectureDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].architecture
  return <figure className="paper-diagram architecture-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><div className="arch-grid">
    <div className="arch-column input-column"><span className="diagram-label">{c.inputLabel}</span><div className="diagram-box yellow"><GitBranch /><strong>{c.taskTitle}</strong><Lines lines={c.taskLines} /></div><div className="diagram-box pink"><KeyRound /><strong>{c.secretTitle}</strong><Lines lines={c.secretLines} /></div></div><div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
    <div className="arch-core"><span className="diagram-label">{c.coreLabel}</span><div className="core-loop"><div className="diagram-box blue"><span className="box-index">C</span><strong>{c.configTitle}</strong><Lines lines={c.configLines} /></div><div className="loop-arrows" aria-hidden="true"><span>history <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> action</span></div><div className="diagram-box green"><span className="box-index">A</span><strong>Agent.forward()</strong><Lines lines={c.agentLines} /></div><div className="loop-arrows" aria-hidden="true"><span>command <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div><div className="diagram-box yellow"><TerminalSquare /><strong>SWEEnv + SWE-ReX</strong><Lines lines={c.envLines} /></div></div></div><div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
    <div className="arch-column output-column"><span className="diagram-label">{c.outputLabel}</span><div className="diagram-box green"><Check /><strong>{c.patchTitle}</strong><Lines lines={c.patchLines} /></div><div className="diagram-box blue"><FileJson /><strong>{c.trajectoryTitle}</strong><Lines lines={c.trajectoryLines} /></div></div>
  </div><div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div><figcaption>{c.caption}</figcaption></figure>
}

export function SweWorkflowDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].workflow
  return <figure className="paper-diagram workflow-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><ol className="workflow-steps">{c.steps.map(([title, text], index) => <li key={title} className={['yellow','blue','pink','green','blue','yellow'][index]}><span className="flow-number">{String(index+1).padStart(2,'0')}</span><strong>{title}</strong><p>{text}</p>{index<c.steps.length-1&&<ArrowDown className="flow-down" aria-hidden="true" />}</li>)}</ol><div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>{c.loopLabel}</span><strong>{c.loopText}</strong></div><figcaption>{c.caption}</figcaption></figure>
}

export function SweDataEventDiagram({ locale }: { locale: Locale }) {
  const c=copy[locale].data
  return <figure className="paper-diagram data-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><div className="event-layout"><ol className="event-stream">{c.events.map(([role,title,text],index)=><li key={`${role}-${index}`} className={index===5?'exit-event':''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol><div className="trajectory-note"><Database /><strong>trajectories/&lt;user&gt;/&lt;experiment&gt;/</strong><code>run_batch.config.yaml<br />preds.json<br />run_batch.*.log<br />run_batch_exit_statuses.yaml<br />instance/*.traj<br />instance/*.config.yaml</code><p>{c.note}</p></div></div><figcaption>{c.caption}</figcaption></figure>
}

export function SweDeploymentDiagram({ locale }: { locale: Locale }) {
  const c=copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram"><div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div><div className="deployment-lanes">{c.lanes.map((lane,index)=><div className={`deploy-lane ${['yellow','green','blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div><figcaption>{c.caption}</figcaption></figure>
}
