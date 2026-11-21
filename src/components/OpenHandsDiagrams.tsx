import { ArrowDown, ArrowLeft, ArrowRight, Bot, CalendarClock, Check, Container, FileCode2, GitBranch, GitMerge, GitPullRequest, Globe, KeyRound, MonitorSmartphone, RotateCcw, Server, ShieldAlert, Workflow } from 'lucide-react'

export function CanvasArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>图 1 · 服务架构</span><span>Canvas 是控制面，不是执行沙箱</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">输入 / 触发源</span>
        <div className="diagram-box yellow"><MonitorSmartphone /><strong>浏览器 UI</strong><small>React Canvas client<br />localhost:8000<br />会话 / 文件 / 设置</small></div>
        <div className="diagram-box pink"><CalendarClock /><strong>自动化触发</strong><small>cron 调度<br />GitHub / Linear webhook<br />预置模板</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">agent-canvas 本地栈（单机）</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">I</span><strong>Ingress</strong><small>127.0.0.1:8000<br />按路径分发<br />静态 :3001</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>/api/* /sockets <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> 事件流</span></div>
          <div className="diagram-box green"><span className="box-index">S</span><strong>Agent Server</strong><small>:18000 · 会话 / 工具<br />profiles / secrets<br />REST + WebSocket</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>/api/automation <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> 运行历史</span></div>
          <div className="diagram-box yellow"><span className="box-index">A</span><strong>Automation</strong><small>:18001 · 调度器<br />webhook 事件源<br />dispatch 会话</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">执行边界 / 交付</span>
        <div className="diagram-box green"><Container /><strong>Workspace / 沙箱</strong><small>宿主目录或<br />每会话 Docker 容器<br />Cloud / VM 后端</small></div>
        <div className="diagram-box blue"><GitPullRequest /><strong>工程交付</strong><small>分支 + commit<br />PR / review / merge<br />Issue 回评</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>边界外：</strong>Canvas 只做呈现与请求转发；真正接触文件系统、网络和密钥的是 Agent Server 与其选中的执行环境。</div>
    <figcaption>官方仓库边界：OpenHands/OpenHands 是前端与本地编排；Agent、工具、会话与事件在 OpenHands/software-agent-sdk；调度在 OpenHands/automation。</figcaption>
  </figure>
}

const eventSteps = [
  ['01', '创建或恢复会话', '人工对话、cron 或 webhook 触发；Automation Server 把任务 dispatch 给 Agent Server。'],
  ['02', '组装上下文', '装入技能、AGENTS.md、MCP 工具与 Agent Profile 允许的 secrets。'],
  ['03', '模型决策', '经 LiteLLM 调用配置的模型，或由 ACP 委托给 Claude Code / Codex 等外部 Agent。'],
  ['04', '执行动作', 'bash、文件编辑、浏览器等工具在工作区或容器内运行。'],
  ['05', '观察回流', 'Action / Observation 经 pydantic 校验后写入事件流，实时推回浏览器。'],
  ['06', '交付与验收', 'FinishAction 结束循环；PR、评审状态与合并由人或 watchdog 决定。'],
]

export function EventLoopDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 2 · 会话事件循环</span><span>事件流是唯一的对话事实来源</span></div>
    <ol className="workflow-steps">
      {eventSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < eventSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>未收到 FinishAction 且未触及限制</span><strong>返回 03，继续下一轮</strong></div>
    <figcaption>事件流按时间顺序记录动作与观察；成本、token 与多 Agent 委托元数据也在会话状态中累计。</figcaption>
  </figure>
}

export function StateOwnershipDiagram() {
  const events = [
    ['Agent Server', '会话与配置', '对话历史、Agent / LLM profiles、secrets、MCP 配置。'],
    ['Automation', '自动化资产', '自动化定义、调度、webhook 事件源与运行历史。'],
    ['Workspace', '代码与产物', 'Agent 读写的一切文件；容器化时经 bind mount 持久。'],
    ['Canvas', '连接信息', '只保存各后端的地址与凭据引用，不持有对话本体。'],
    ['~/.openhands', '本地状态目录', 'npm / npx 安装的设置、密钥与会话；Docker 用 openhands-data 卷。'],
    ['api-key.txt', '会话密钥', 'Docker 自动生成于状态目录；重启复用，泄漏即失守。'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>图 3 · 状态归属</span><span>升级与备份都围绕状态目录设计</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 5 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><KeyRound /><strong>两类密钥别混淆</strong><code>会话 / 后端密钥<br />LOCAL_BACKEND_API_KEY<br />api-key.txt<br />—<br />模型密钥<br />Settings → LLM<br />LiteLLM provider key</code><p>模型 key 解不开本地后端；会话 key 也不该出现在 Dockerfile、镜像层或截图里。</p></div>
    </div>
    <figcaption>切换后端就切换了对话、设置与自动化的归属——排障时先确认当前连的是哪个后端。</figcaption>
  </figure>
}

export function FactoryPipelineDiagram() {
  return <figure className="paper-diagram factory-diagram">
    <div className="diagram-topline"><span>图 4 · 官方软件工厂流水线</span><span>四个 automation 各管一段，凭证互相隔离</span></div>
    <div className="factory-conveyor" aria-label="Issue 到合并的四段自动化流水线">
      <div className="conveyor-step external"><span>triage token</span><GitBranch /><strong>分诊</strong><p>定优先级、查依赖、写验收标准，打 ready-for-dev 标签</p></div><ArrowRight className="conveyor-arrow" />
      <div className="conveyor-step internal"><span>developer token</span><Bot /><strong>开发</strong><p>按标签开工，factory/issue 前缀分支，提交 PR 待评审</p></div><ArrowRight className="conveyor-arrow" />
      <div className="conveyor-step internal"><span>reviewer token</span><FileCode2 /><strong>评审</strong><p>检出 PR 精确 head，跑仓库测试，发原生 review；不能 push</p></div><ArrowRight className="conveyor-arrow" />
      <div className="conveyor-step external"><span>确定性 · 无 Agent</span><GitMerge /><strong>看门狗</strong><p>只在验收状态与 Actions 全绿时合并当前分支</p></div>
    </div>
    <figcaption>需要 Agent Canvas ≥ 1.24.0 与每会话 Docker 容器。三个细粒度 GitHub PAT 分别绑定三个 Agent Profile，profile 只允许看到自己的 secret。</figcaption>
  </figure>
}

export function DeployRoutesDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>图 5 · 部署路线</span><span>隔离强度递增，可观测性不变</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · 本机体验</span><h3>npm 全栈本地跑</h3><div className="lane-flow"><span>Node ≥ 24 + uv</span><ArrowRight size={12} aria-hidden="true" /><span>agent-canvas</span><ArrowRight size={12} aria-hidden="true" /><span>localhost:8000</span></div><p>最快但无隔离：官方明确警告 Agent 将以你的账户权限读写文件系统。只用于可信机器上的体验。</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · 本机隔离</span><h3>Docker 单容器</h3><div className="lane-flow"><span>固定 tag 镜像</span><ArrowRight size={12} aria-hidden="true" /><span>挂载 /projects</span><ArrowRight size={12} aria-hidden="true" /><span>127.0.0.1:8000</span></div><p>Canvas 与后端都在容器里，状态落在 openhands-data 卷。再加 OH_CONVERSATION_RUNTIME=docker 可让每个会话再进独立加固容器。</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · 常驻工厂</span><h3>VM + public 模式</h3><div className="lane-flow"><span>防火墙只开 22/443</span><ArrowRight size={12} aria-hidden="true" /><span>--public + API key</span><ArrowRight size={12} aria-hidden="true" /><span>nginx + TLS</span></div><p>systemd 保活，nginx 终结 TLS。API key 不注入页面，所有 /api/* 需 X-Session-API-Key。</p></div>
    </div>
    <figcaption>三条路线共用同一套 UI 与事件流；差别只在执行边界与凭证注入方式。Cloud / Enterprise 是托管版本，不在本页自托管范围内。</figcaption>
  </figure>
}

export function FactoryRolesDiagram() {
  return <div className="explanation-grid">
    <div className="text-block"><h3><Server size={18} /> 谁决定“何时运行”</h3><p>Automation Server 持有 cron 与 webhook，只负责调度与 dispatch。watchdog 是确定性检查器，不启动 Agent——这是官方设计里最像“工厂质检门”的角色。</p></div>
    <div className="text-block"><h3><Workflow size={18} /> 谁决定“运行什么”</h3><p>Agent Server 与 SDK 负责会话、工具与事件流。Agent Profile 把模型、secrets、MCP 服务器和子 Agent 开关打包成可复用身份，让每段流水线各拿各的钥匙。</p></div>
    <div className="text-block"><h3><Globe size={18} /> 谁在边界之外</h3><p>Canvas 浏览器端不接触文件系统；GitHub 合并权限在 watchdog 的确定性逻辑与仓库分支保护里。任何一段都不该同时拥有“写代码”和“合并代码”两种凭证。</p></div>
    <div className="text-block"><h3><Check size={18} /> 官方跑通的证据</h3><p>官方软件工厂文档记录了对演示仓库的完整走查：六个 Issue 分诊后六个开发会话并发进入 Docker，评审 Agent 逐个验收，watchdog 完成合并。这是官方记录，不是本站复测。</p></div>
  </div>
}
