import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert, TerminalSquare } from 'lucide-react'

export function ArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>图 1 · 逻辑架构</span><span>Agent 不持有模型密钥以外的“平台权限”</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">输入 / 你的系统</span>
        <div className="diagram-box yellow"><GitBranch /><strong>任务与代码</strong><small>task 文本<br />Git 工作区<br />测试与依赖镜像</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>模型凭据</strong><small>MSWEA_MODEL_NAME<br />PROVIDER_API_KEY</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">mini-SWE-agent 进程</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">M</span><strong>Model adapter</strong><small>LiteLLM / OpenRouter<br />生成动作 · 解析工具调用<br />格式化观察</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>messages <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> observation</span></div>
          <div className="diagram-box green"><span className="box-index">A</span><strong>DefaultAgent</strong><small>线性 messages<br />成本 / 步数 / 墙钟限制<br />异常驱动控制流</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>action <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> output</span></div>
          <div className="diagram-box yellow"><TerminalSquare /><strong>Environment</strong><small>local subprocess<br />docker exec<br />singularity / bwrap…</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">输出 / 仍需验收</span>
        <div className="diagram-box green"><Check /><strong>工作区变更</strong><small>源代码与测试<br />候选 git diff<br />不是自动合格补丁</small></div>
        <div className="diagram-box blue"><FileJson /><strong>轨迹 JSON</strong><small>消息与工具结果<br />配置与模型统计<br />exit_status</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>边界外：</strong> Issue 调度、PR 审批、权限系统、制品仓库、自动合并均不是 mini 的内建平台能力。</div>
    <figcaption>核心只有三类可替换协议：Model、Agent、Environment。v2 把动作解析与观察格式化移到 Model，Agent 成为更薄的协调器。</figcaption>
  </figure>
}

const flowSteps = [
  ['01', '渲染任务', 'system_template + instance_template，把 task 与环境信息放入初始消息。'],
  ['02', '查询模型', 'Model.query(messages) 返回原生消息与一个或多个 bash 动作。'],
  ['03', '检查闸门', '在查询前检查 step_limit、cost_limit、wall_time_limit_seconds。'],
  ['04', '执行命令', '每个动作进入独立 subprocess 或 docker exec；目录与 export 默认不跨动作保留。'],
  ['05', '写回观察', 'returncode、stdout/stderr 与异常被模型适配器格式化后追加到 messages。'],
  ['06', '提交或终止', '魔法字符串触发 Submitted；超限、重复格式错误与用户中断也能结束循环。'],
]

export function WorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 2 · 单任务闭环</span><span>每一步后都会保存 trajectory（配置 output_path 时）</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>若最后一条消息不是 role = exit</span><strong>返回 02，继续下一轮</strong></div>
    <figcaption>提交信号：<code>echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT</code>。必须独占命令，且成功返回后才算 Submitted。</figcaption>
  </figure>
}

export function DataEventDiagram() {
  const events = [
    ['system', '行为契约', '告诉模型只能用 bash、如何编辑、怎样提交。'],
    ['user', '任务实例', 'Issue 文本、仓库信息和验收要求。'],
    ['assistant', '动作消息', '原生 tool call 或文本解析后的 actions。'],
    ['tool', '执行观察', '输出、返回码、超时或异常；过长输出默认截头尾。'],
    ['assistant', '下一轮决策', '读取观察，继续定位、修改或测试。'],
    ['exit', '退出记录', 'Submitted / LimitsExceeded / TimeExceeded / RepeatedFormatError。'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>图 3 · 数据与事件流</span><span>轨迹就是消息历史 + 配置 + 结果元数据</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>*.traj.json</strong><code>info.mini_version<br />info.model_stats<br />info.config<br />info.exit_status<br />info.submission<br />messages[]</code><p>可能包含源码、命令输出与敏感路径，应按内部日志保护，不宜直接公开上传。</p></div>
    </div>
    <figcaption>FormatError 不会简单丢弃：v2.4.6 专门修复了“响应解析失败但模型调用已计费”未计入 cost_limit 的问题。</figcaption>
  </figure>
}

export function DeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>图 4 · 部署路线</span><span>从可读 demo 到无人值守批处理，信任边界逐步收紧</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · 第一次体验</span><h3>本地 + confirm</h3><div className="lane-flow"><span>你的终端</span><ArrowRight size={12} aria-hidden="true" /><span>项目副本</span><ArrowRight size={12} aria-hidden="true" /><span>人工确认每条命令</span></div><p>最快，但 local 无隔离。只用可丢弃副本，不挂载真实凭据。</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · 推荐复现</span><h3>Docker + 限权</h3><div className="lane-flow"><span>宿主 Agent</span><ArrowRight size={12} aria-hidden="true" /><span>受限容器</span><ArrowRight size={12} aria-hidden="true" /><span>挂载工作区</span></div><p>模型 key 留在宿主；容器只拿代码。禁网、禁 capabilities、限 CPU / 内存 / PID。</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · 自动化工厂</span><h3>调度器 + 验收</h3><div className="lane-flow"><span>Issue / cron</span><ArrowRight size={12} aria-hidden="true" /><span>mini</span><ArrowRight size={12} aria-hidden="true" /><span>测试 + diff + 人审</span></div><p>调度、重试和 PR 由外层完成；Submitted 也不能替代测试与人工合并。</p></div>
    </div>
    <figcaption>三条路线都无需常驻端口。只有 SWE-bench / ProgramBench 等批量 runner 需要额外数据集、镜像与运行时依赖。</figcaption>
  </figure>
}
