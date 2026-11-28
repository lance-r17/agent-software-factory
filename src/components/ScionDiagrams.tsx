import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · Hub 驱动的多 Agent 协作架构', topRight: '模板定义角色，harness-config 定义运行机制', inputLabel: '输入 / 边界',
      issueTitle: '项目与已批准目标', issueLines: ['Project ID 与仓库上下文', '模板、技能、Profile 与验收意图', '人员和 Agent 都可发起协作'], secretTitle: '身份与分级凭据', secretLines: ['Hub 管理身份、token 与访问策略', 'Agent 使用独立配置和凭据', '秘密进入受控后端，不进模板或 Git'], coreLabel: 'Scion 控制与执行面',
      localizeTitle: 'Hub + Project + Template', localizeLines: ['持久化 Agent、项目与模板状态', '统一 CLI / API / Web 控制入口', '分派生命周期并维护协作视图'], repairTitle: 'Runtime Broker + Runtime', repairLines: ['Broker 准备工作区并运行 Agent', 'Docker / Podman / Kubernetes 等执行', '托管 Agent 可绕过 Broker 走供应商 API'], validateTitle: 'Agent + Workspace + Skills', validateLines: ['每个 Agent 有身份、home 与任务', 'shared / worktree / clone / empty', '平台技能和 sciontool 报告状态'], outputLabel: '输出 / 外部验收',
      outputLines: ['分支、提交、消息、日志与共享产物', 'stopped / suspended / error 等运行状态', '可信 CI、人工 PR 与发布仍在外层'], evidenceTitle: '协作与恢复边界', evidenceLines: ['委派、消息、通知与人工 attach', '会话恢复依赖 harness 与持久 home', '状态可观察不等于代码已验收'],
      boundaryLead: '边界外：', boundaryBody: 'Scion 不是模型、免费算力、需求审批系统或可信 CI；它不能替代仓库最小授权、秘密扫描、测试、人工 merge 和生产发布。',
      caption: 'Hub 是状态与分派中心，Runtime Broker 连接实际 Runtime，Agent 在隔离身份和工作区中执行；模板与 harness-config 保持职责分离。',
    },
    workflow: {
      topLeft: '图 2 · 从目标到人工交付的协作工作流', topRight: '每一次状态变化都要映射到真实证据',
      steps: [
        ['批准目标与项目', '外层维护者确认需求、仓库范围、模型预算、验收合同和谁拥有最终决定。'],
        ['选择角色与运行环境', '模板给出 instructions、skills 和模型尺寸别名；Profile / harness-config 决定 Runtime、镜像、具体模型和凭据。'],
        ['建立项目与工作区', '在项目根初始化 .scion；按隔离需求选择共享目录、每 Agent worktree、独立 clone 或空目录。'],
        ['经 Hub 创建并分派', 'CLI、Web 或 API 把 Agent 创建和生命周期命令交给 Hub，Broker 再调用对应 Runtime。'],
        ['隔离执行与报告', 'Agent 在容器中运行受支持 harness，使用 sciontool、消息和日志报告 working、blocked、completed 等状态。'],
        ['委派、评审与修复', 'Agent 可以委派和交换发现；人可 attach 或回复。修复仍需有界轮次、预算和独立验证。'],
        ['保留产物并恢复', '停止、挂起、恢复和错误重启是不同路径；交付前确认提交、分支、共享文件与日志已经保存。'],
        ['外层验收与人工 merge', '在干净副本重跑测试、扫描秘密并审 PR；Scion 的内部 completed 状态不自动产生交付授权。'],
      ],
      loopLabel: '有界反馈回路', loopText: '执行 / 观察 / 消息 → 修复 → 重新验证', caption: 'Scion 管理 Agent 生命周期与协作，不把 running、completed 或 suspended 等同于代码质量或生产发布。',
    },
    data: {
      topLeft: '图 3 · 状态、消息与产物契约', topRight: 'Phase、Activity、Detail 分开，不把一种信号当成全部事实',
      events: [
        ['define', '角色与环境分开', 'scion-agent.yaml 描述角色；settings / Profile / harness-config 提供运行环境，模板中的 image 等环境键会被忽略并警告。'],
        ['dispatch', 'Hub 持久化并分派', 'Hub 保存 Agent、Project 和 Template 的权威状态，向目标 Broker 发出生命周期操作。'],
        ['execute', 'Runtime 产生运行事实', 'Broker 准备 home、workspace、配置和凭据，并观察容器；托管 Agent 则由供应商 API 管理。'],
        ['observe', '三维状态与消息', 'Phase 表示容器生命周期，Activity 表示 Agent 活动，Detail 提供上下文；消息和 heartbeat 补充协作事实。'],
        ['deliver', '分支与共享产物', 'worktree / clone 分支、提交、共享目录、日志和通知需要与外层 diff、测试、PR 和人工决定关联。'],
      ],
      note: '.scion、Agent home、消息、日志和共享目录可能包含需求、源码、模型输出、token 引用和凭据。应限制挂载、网络、保留期与读取主体；clone-per-agent 使用注入的 GITHUB_TOKEN，而不是宿主 SSH 私钥。', caption: '状态与消息描述运行过程，真正的软件交付仍需可重跑 diff、测试、评审和人工决定。',
    },
    deployment: {
      topLeft: '图 4 · 部署与验证路线', topRight: '本次仅 C 级资料与源码核验；所有运行命令均未在本站执行',
      lanes: [
        { tag: 'A · 固定 Release', title: '校验二进制与 SHA256SUMS', flow: ['固定 v0.3.0', '核验 checksum', 'version / doctor'], body: '官方路线，未实测。Go install 不嵌入 Web UI；完整源码构建使用 make all。当前环境无 Go，不能声称编译成功。' },
        { tag: 'B · Workstation', title: 'loopback Hub + Broker + Web', flow: ['server start', 'onboarding', 'init + start'], body: '官方路线，未实测。需要可用容器 Runtime、模型凭据和镜像；本机 Git 2.39.5 不满足 worktree 的 2.48 门槛。' },
        { tag: 'C · Hosted', title: '单节点或 HA 团队控制面', flow: ['身份与 TLS', 'SQLite / Postgres', 'Broker 与共享存储'], body: '官方路线，未实测。HA 需要 Postgres、对象存储和复制 Hub；应按模式重新验收认证、秘密、恢复和 Broker 网络。' },
      ],
      caption: '先证明固定制品和本机前置条件，再做无模型只读检查，最后才是小任务与团队部署；不得跨级继承验收结论。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · HUB-DRIVEN MULTI-AGENT COLLABORATION', topRight: 'Templates define roles; harness configs define execution mechanics', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Project and approved goal', issueLines: ['Project ID and repository context', 'Template, skills, Profile, and acceptance intent', 'People and Agents can initiate collaboration'], secretTitle: 'Identity and scoped credentials', secretLines: ['The Hub manages identity, tokens, and access policy', 'Each Agent receives its own configuration and credentials', 'Secrets use controlled backends, never templates or Git'], coreLabel: 'SCION CONTROL AND EXECUTION PLANES',
      localizeTitle: 'Hub + Project + Template', localizeLines: ['Persists Agent, Project, and Template state', 'One CLI / API / Web control surface', 'Dispatches lifecycle and shares collaboration views'], repairTitle: 'Runtime Broker + Runtime', repairLines: ['The Broker prepares workspaces and runs Agents', 'Docker / Podman / Kubernetes and other Runtimes', 'Managed Agents can bypass Brokers via provider APIs'], validateTitle: 'Agent + Workspace + Skills', validateLines: ['Each Agent has identity, home, and a task', 'shared / worktree / clone / empty workspaces', 'Platform skills and sciontool report status'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Branches, commits, messages, logs, and shared artifacts', 'Runtime states such as stopped / suspended / error', 'Trusted CI, human PR review, and release stay outside'], evidenceTitle: 'Collaboration and recovery boundaries', evidenceLines: ['Delegation, messages, notifications, and human attach', 'Session resume needs harness support and a persistent home', 'Observable state does not prove accepted code'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Scion is not a model, free compute, a goal-approval system, or trusted CI. It cannot replace least-privilege repository access, secret scanning, tests, human merge, or production release.',
      caption: 'The Hub owns state and dispatch, Runtime Brokers connect actual Runtimes, and Agents execute with isolated identities and workspaces; templates and harness configs retain separate responsibilities.',
    },
    workflow: {
      topLeft: 'FIG 2 · APPROVED GOAL TO HUMAN DELIVERY', topRight: 'Every state change must map to real evidence',
      steps: [
        ['Approve the goal and Project', 'Outer maintainers confirm the requirement, repository scope, model budget, acceptance contract, and final decision owner.'],
        ['Choose the role and environment', 'Templates supply instructions, skills, and model-size aliases; Profiles / harness configs select Runtime, image, concrete model, and credentials.'],
        ['Create the Project and workspace', 'Initialize .scion at the project root and choose a shared directory, per-Agent worktree, independent clone, or empty directory.'],
        ['Create and dispatch through the Hub', 'CLI, Web, or API sends Agent creation and lifecycle commands to the Hub; a Broker invokes the selected Runtime.'],
        ['Execute and report in isolation', 'The Agent runs a supported harness in a container and uses sciontool, messages, and logs to report working, blocked, completed, and other states.'],
        ['Delegate, review, and repair', 'Agents delegate and exchange findings while people can attach or reply. Repairs still need bounded rounds, budgets, and independent checks.'],
        ['Retain artifacts and recover', 'Stop, suspend, resume, and error restart are distinct paths. Confirm commits, branches, shared files, and logs before delivery.'],
        ['Accept externally and merge manually', 'Rerun tests in a clean copy, scan secrets, and review the PR. Internal completed state never grants delivery authorization.'],
      ],
      loopLabel: 'Bounded feedback loop', loopText: 'Execute / observe / message → repair → verify again', caption: 'Scion manages Agent lifecycle and collaboration; running, completed, or suspended never means code quality or production release.',
    },
    data: {
      topLeft: 'FIG 3 · STATE, MESSAGE, AND ARTIFACT CONTRACTS', topRight: 'Phase, Activity, and Detail remain separate signals',
      events: [
        ['define', 'Separate role from environment', 'scion-agent.yaml describes the role; settings / Profiles / harness configs provide the environment. Environment keys such as image in templates are ignored with warnings.'],
        ['dispatch', 'The Hub persists and dispatches', 'The Hub stores authoritative Agent, Project, and Template state and sends lifecycle operations to the selected Broker.'],
        ['execute', 'The Runtime produces runtime facts', 'The Broker prepares home, workspace, configuration, and credentials and observes containers; managed Agents use provider APIs instead.'],
        ['observe', 'Three-dimensional state and messages', 'Phase describes container lifecycle, Activity describes Agent work, and Detail adds context; messages and heartbeats add collaboration facts.'],
        ['deliver', 'Branches and shared artifacts', 'Worktree / clone branches, commits, shared directories, logs, and notifications must join outer diffs, tests, PRs, and human decisions.'],
      ],
      note: '.scion, Agent homes, messages, logs, and shared directories can contain requirements, source, model output, token references, and credentials. Restrict mounts, networking, retention, and readers. clone-per-agent uses an injected GITHUB_TOKEN rather than host SSH private keys.', caption: 'State and messages describe execution. Real software delivery still needs repeatable diffs, tests, review, and human decisions.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT AND VERIFICATION ROUTES', topRight: 'Level-C documentation and source review only; no route command ran here',
      lanes: [
        { tag: 'A · PINNED RELEASE', title: 'Verify the binary against SHA256SUMS', flow: ['Pin v0.3.0', 'Verify checksum', 'version / doctor'], body: 'Official route, not tested here. go install does not embed the Web UI; a full clone build uses make all. Go is absent here, so no build success is claimed.' },
        { tag: 'B · WORKSTATION', title: 'Loopback Hub + Broker + Web', flow: ['server start', 'onboarding', 'init + start'], body: 'Official route, not tested here. It needs a working container Runtime, model credentials, and images; host Git 2.39.5 is below the worktree requirement of 2.48.' },
        { tag: 'C · HOSTED', title: 'Single-node or HA team control plane', flow: ['Identity and TLS', 'SQLite / Postgres', 'Brokers and shared storage'], body: 'Official route, not tested here. HA needs Postgres, object storage, and replicated Hubs; recheck auth, secrets, recovery, and Broker networking per mode.' },
      ],
      caption: 'Prove pinned artifacts and prerequisites first, then model-free read-only checks, and only then small tasks or team deployment; acceptance never crosses levels automatically.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function ScionArchitectureDiagram({ locale }: { locale: Locale }) {
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
          <div className="loop-arrows" aria-hidden="true"><span>dispatch <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> state</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>provision <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> events</span></div>
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

export function ScionWorkflowDiagram({ locale }: { locale: Locale }) {
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

export function ScionDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.scion/</strong><code>projects + agents<br />templates + skills<br />phase + activity + detail<br />messages + heartbeats<br />workspaces + artifacts</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function ScionDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
