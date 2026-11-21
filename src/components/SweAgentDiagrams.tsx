import { ArrowDown, ArrowLeft, ArrowRight, Boxes, Check, Database, FileJson, GitBranch, History, KeyRound, RotateCcw, ShieldAlert, TerminalSquare, Wrench, type LucideIcon } from 'lucide-react'

export function SweArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>图 1 · 逻辑架构</span><span>SWEEnv 是 SWE-ReX 之上的薄封装</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">输入 / 你的系统</span>
        <div className="diagram-box yellow"><GitBranch /><strong>任务与代码</strong><small>GitHub Issue / 文本<br />GitHub 或本地仓库<br />SWE-bench 实例</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>宿主侧凭据</strong><small>OPENAI / ANTHROPIC key<br />可选 GITHUB_TOKEN<br />不写进 YAML 或 Git</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">sweagent CLI 与 Agent 进程</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">C</span><strong>YAML 配置</strong><small>agent / env / tools<br />模板与解析器<br />成本与超时限制</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>history <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> action</span></div>
          <div className="diagram-box green"><span className="box-index">A</span><strong>Agent.forward()</strong><small>HistoryProcessor 压缩<br />function_calling 解析<br />统计成本与超时</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>command <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
          <div className="diagram-box yellow"><TerminalSquare /><strong>SWEEnv + SWE-ReX</strong><small>Deployment 启停容器<br />shell session 执行<br />安装 ACI 工具束</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">输出 / 仍需验收</span>
        <div className="diagram-box green"><Check /><strong>补丁与预测</strong><small>submit 提取 diff<br />run-batch 汇总 preds.json<br />不直接等于测试通过</small></div>
        <div className="diagram-box blue"><FileJson /><strong>轨迹与日志</strong><small>*.traj / config.yaml<br />info / warning / debug log<br />exit_statuses.yaml</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>边界外：</strong>Issue 队列、权限审批、确定性合并、凭证轮换与团队审计都不是 v1.1.0 的内建平台能力。</div>
    <figcaption>核心链路：CLI 装配配置，Agent 产生动作，SWEEnv 借助 SWE-ReX 在本地 Docker、Modal、Fargate 等部署中执行。</figcaption>
  </figure>
}

const flowSteps = [
  ['01', '合并配置', '默认 YAML 与 --config 覆盖项合成本次运行配置，包含模型、工具、仓库与预算。'],
  ['02', '启动部署', 'SWE-ReX 默认拉起 python:3.11 Docker；也可切换到 Modal、Fargate 或 local。'],
  ['03', '注入 ACI', 'registry、edit_anthropic、review_on_submit_m 等工具束复制进环境并安装。'],
  ['04', '模型决策', 'HistoryProcessor 压缩历史，模型用 function calling 返回一个结构化动作。'],
  ['05', '执行观察', 'ToolHandler 在 shell session 中执行命令，把输出、状态与异常写回历史。'],
  ['06', '提交留证', 'submit 提取工作区 diff；轨迹、配置与日志落盘，批处理再汇总 preds.json。'],
]

export function SweWorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 2 · 单任务闭环</span><span>每一步都受 execution / install / total timeout 约束</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>若未 submit 且未超预算</span><strong>返回 04，继续下一轮</strong></div>
    <figcaption>默认限制：单命令 30 秒、工具安装每条 300 秒、全部命令合计 1800 秒；连续 3 次命令超时即退出。</figcaption>
  </figure>
}

export function SweDataEventDiagram() {
  const events = [
    ['config', '运行指纹', '合并后的 config.yaml 记录模型、模板、工具束、仓库与限制。'],
    ['query', '模型输入', 'v1.1.0 起每步保存当前精确 query，取代旧 messages 字段。'],
    ['thought', '解析前推理', '模型原始输出中分离出的 thought，用于审计而不是直接执行。'],
    ['action', '结构化动作', 'function_calling 或 thought_action 解析器得到 shell / edit / submit。'],
    ['observation', '环境反馈', 'stdout、stderr、返回码、超时，以及工具状态 JSON。'],
    ['exit', '结果元数据', 'Submitted、CostLimitExceeded、TotalExecutionTimeExceeded 等退出原因。'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>图 3 · 数据与事件流</span><span>轨迹是研究对象，也是外层流水线的验收接口</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>trajectories/&lt;user&gt;/&lt;experiment&gt;/</strong><code>run_batch.config.yaml<br />preds.json<br />run_batch.*.log<br />run_batch_exit_statuses.yaml<br />instance/*.traj<br />instance/*.config.yaml</code><p>轨迹可能包含私有源码、绝对路径和误打印的密钥；公开分享前必须脱敏并限制保留期。</p></div>
    </div>
    <figcaption>批处理的 preds.json 可交给 SWE-bench 评测；评测是单独步骤，不是 run-batch 的自动结论。</figcaption>
  </figure>
}

export function SweDeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>图 4 · 部署路线</span><span>先把执行面隔离，再扩大批量与云端范围</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · 单仓库复现</span><h3>源码安装 + 加固 Docker</h3><div className="lane-flow"><span>宿主 CLI</span><ArrowRight size={12} aria-hidden="true" /><span>上传本地副本</span><ArrowRight size={12} aria-hidden="true" /><span>断网容器执行</span></div><p>模型 key 留在宿主；仓库由 SWE-ReX 上传；容器断网、丢弃 capabilities、限制 CPU / 内存 / PID。</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · 无本地 Docker</span><h3>本地仓库 + Modal</h3><div className="lane-flow"><span>本地代码</span><ArrowRight size={12} aria-hidden="true" /><span>Modal sandbox</span><ArrowRight size={12} aria-hidden="true" /><span>云端执行</span></div><p>绕开本机 Docker 依赖，但代码与命令离开本机；先确认云端区域、日志与数据边界。</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · 批量评测</span><h3>run-batch + SWE-bench</h3><div className="lane-flow"><span>实例集</span><ArrowRight size={12} aria-hidden="true" /><span>num_workers</span><ArrowRight size={12} aria-hidden="true" /><span>preds + traj</span></div><p>适合基准和历史 Issue 批处理；并发会放大成本与宿主机 / Docker 负载，先用 slice :3 烟测。</p></div>
    </div>
    <figcaption>所有路线的模型 key 都在宿主进程环境或密钥管理器中；不要把 key 写进 YAML、Git 仓库或容器镜像。</figcaption>
  </figure>
}

export function SweBatchPipelineDiagram() {
  const steps: { title: string; text: string; Icon: LucideIcon }[] = [
    { title: '实例来源', text: 'swe_bench / file / huggingface / expert_file', Icon: Boxes },
    { title: '并发执行', text: 'num_workers 控制 worker；失败实例写入 exit statuses', Icon: Wrench },
    { title: '预测汇总', text: 'merge-preds 生成或修复 preds.json', Icon: FileJson },
    { title: '人工审查', text: 'inspect / inspector / quick-stats 看轨迹与成本', Icon: History },
    { title: '外部评测', text: 'SWE-bench harness 或项目 CI 独立运行', Icon: Check },
  ]
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 5 · 批处理流水线</span><span>run-batch 产出预测，不负责证明补丁正确</span></div>
    <div className="factory-conveyor" aria-label="SWE-agent 批量实验流水线">
      {steps.map(({ title, text, Icon }, index) => <div key={title} className={`conveyor-step ${index === 4 ? 'external' : 'internal'}`}><span>{index === 4 ? '外层补齐' : 'SWE-agent'}</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}
    </div>
    <figcaption>先把 3 个实例的 smoke run 跑通，再扩大 slice 与 worker；不要用提高预算来掩盖循环或解析失败。</figcaption>
  </figure>
}
