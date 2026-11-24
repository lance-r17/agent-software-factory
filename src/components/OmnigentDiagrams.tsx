import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 多 HARNESS 控制架构', topRight: '服务状态、执行宿主与治理边界分离', inputLabel: '输入 / 边界',
      issueTitle: '已批准任务', issueLines: ['验收合同 + 仓库范围', 'Agent YAML + harness / model', '预算、超时与工具上限'],
      secretTitle: '部署侧凭据', secretLines: ['provider key / CLI 登录', '可选最小权限 Git 凭据', '按名称转发，不进 YAML / Git'], coreLabel: 'OMNIGENT 控制与执行栈',
      localizeTitle: 'Server 控制平面', localizeLines: ['会话、条目与项目', 'REST + SSE / WebSocket', '策略、凭据引用与 artifacts'],
      repairTitle: 'Host / Runner', repairLines: ['本机或远端执行宿主', 'CLI / SDK / ACP 适配', 'workspace、子 Agent 与事件'],
      validateTitle: '策略与沙箱', validateLines: ['session → agent → server', 'ALLOW / DENY / ASK', 'OS / 云隔离与网络限制'], outputLabel: '输出 / 外部验收',
      outputLines: ['会话、分支、提交与 PR', '固定 diff、测试与评审', '人工复核后决定是否 merge'],
      evidenceTitle: '可追溯证据', evidenceLines: ['Agent bundle + 运行指纹', 'conversation_id + registry', 'base / head + blocking findings'],
      boundaryLead: '边界外：', boundaryBody: '统一控制层不替代可信 CI、内容扫描、制品审查、最终 merge 或生产发布；策略和 worktree 都只是整体隔离的一部分。',
      caption: 'Server 管状态，runner 驱动 harness，策略在动作路径执行；任何一层都不能单独证明生成结果安全或可交付。',
    },
    workflow: {
      topLeft: '图 2 · POLLY 并行交付工作流', topRight: '实现与评审分离，PR 始终等待人工决定',
      steps: [
        ['任务与供应商准入', '外层批准任务、验收、预算和仓库范围；确认至少两个不同供应商的可用 worker。'],
        ['拆分并行安全任务', '只选择文件范围不重叠、无顺序依赖的子任务；其余任务保持串行或重新规划。'],
        ['建立隔离 worktree', '每个任务创建独立 worktree 与 polly/<task_id> 分支，并登记路径。'],
        ['实现与确定性门禁', '实现子 Agent 在限定 worktree 内工作，跑 tests / lint / typecheck 并开自己的 PR。'],
        ['固定 diff 与跨评审', '保存 base / head 对应的不可变 diff；不同供应商 reviewer 只读快照与验收合同。'],
        ['阻塞修复与复验', 'blocking finding 回到同一实现者会话，更新原 PR 后重新生成快照并重复检查。'],
        ['登记与人工 merge', '记录 PR、评审和后续建议；Polly 不 merge，冲突与最终交付由维护者处理。'],
      ],
      loopLabel: '有界反馈回路', loopText: '固定快照 → 独立评审 → 实现者修复', caption: 'reviewer 不编辑代码；没有第二家供应商或快照不可达时，必须停止独立评审声明并升级给人工。',
    },
    data: {
      topLeft: '图 3 · 数据与事件证据流', topRight: '规格定义能力，事件和 diff 证明执行',
      events: [
        ['input', 'Agent bundle 与任务', 'name、executor、tools、policies 和已批准验收合同进入受控会话。'],
        ['session', '持久化条目与 ACP 关联', 'inputItemId 把 ACP prompt 关联到已保存用户条目；它不是授权凭据。'],
        ['execute', '子 Agent 与 worktree', 'conversation_id、worktree、分支和 PR 写入 Polly registry，事件回到 inbox。'],
        ['review', '固定 diff 与结构化发现', 'base / head、验收合同、blocking / non-blocking 发现形成可复验输入。'],
        ['delivery', '外部 CI 与人工验收', '干净副本复验分支、测试、依赖与秘密扫描；内部完成不等于人工接受。'],
      ],
      note: 'Agent bundle、会话、registry、原始模型输出、diff 和 workspace 可能包含私有需求、源码、路径与秘密；需要限权、脱敏和保留期。', caption: 'PR 只是证据载体；策略 ALLOW、会话完成或内部 reviewer 通过都不构成生产就绪承诺。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: '仅离线包与规格核验已实测，其余保留未执行声明',
      lanes: [
        { tag: 'A · 离线核验', title: '官方 wheel + Polly 规格', flow: ['0.23.0', 'pip + compileall', '严格解析'], body: '本页已执行。三包版本一致，pip check、核心导入、双 CLI 与 Polly 规格加载通过；未调用模型。' },
        { tag: 'B · 本地 / DOCKER', title: 'CLI 服务或 Postgres 全栈', flow: [':6767', ':8000', '账号 + artifacts'], body: '官方路线，本站未启动。核对 harness 前置、环境转发、HTTPS、数据库迁移和卷备份。' },
        { tag: 'C · POLLY / 沙箱', title: '并行工程队与独立评审', flow: ['worktrees', '不同供应商', '人工 merge'], body: '未实测。fanout 要求任务无冲突，cross-review 要求固定 diff 与至少两个供应商。' },
      ],
      caption: '先验证最小离线能力，再逐级开放服务、workspace 和写权限；升级不能复用旧的“已验收”结论。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · MULTI-HARNESS CONTROL ARCHITECTURE', topRight: 'Server state, execution hosts, and governance stay separate', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Approved task', issueLines: ['Acceptance contract + repo scope', 'Agent YAML + harness / model', 'Budget, timeout, and tool limits'],
      secretTitle: 'Deployment credentials', secretLines: ['Provider key / CLI login', 'Optional least-privilege Git credential', 'Forward by name; never in YAML / Git'], coreLabel: 'OMNIGENT CONTROL AND EXECUTION STACK',
      localizeTitle: 'Server control plane', localizeLines: ['Sessions, items, and projects', 'REST + SSE / WebSocket', 'Policies, credential refs, and artifacts'],
      repairTitle: 'Host / Runner', repairLines: ['Local or remote execution host', 'CLI / SDK / ACP adapters', 'Workspaces, sub-agents, and events'],
      validateTitle: 'Policies and sandboxes', validateLines: ['Session → Agent → server', 'ALLOW / DENY / ASK', 'OS / cloud isolation and network limits'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['Sessions, branches, commits, and PRs', 'Pinned diffs, tests, and reviews', 'Humans decide whether to merge'],
      evidenceTitle: 'Traceable evidence', evidenceLines: ['Agent bundle + run fingerprint', 'conversation_id + registry', 'base / head + blocking findings'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' The control layer does not replace trusted CI, content scanning, artifact review, final merge, or production release; policies and worktrees are only parts of isolation.',
      caption: 'The server owns state, runners drive harnesses, and policies gate action paths; no single layer proves generated output safe or deliverable.',
    },
    workflow: {
      topLeft: 'FIG 2 · POLLY PARALLEL DELIVERY WORKFLOW', topRight: 'Implementation and review stay separate; every PR awaits a human',
      steps: [
        ['Admit the task and vendors', 'Approve the task, acceptance, budget, and repository scope; confirm available workers from at least two vendors.'],
        ['Split parallel-safe work', 'Select only subtasks with disjoint files and no ordering dependency; keep other work serial or replan it.'],
        ['Create isolated worktrees', 'Create a separate worktree and polly/<task_id> branch for each task and register its path.'],
        ['Implement and run deterministic gates', 'Each implementation sub-agent stays in its worktree, runs tests / lint / typecheck, and opens its own PR.'],
        ['Pin the diff and cross-review', 'Save an immutable diff for base / head; a different-vendor reviewer reads only the snapshot and acceptance contract.'],
        ['Fix blockers and recheck', 'Return blocking findings to the same implementer, update the original PR, regenerate the snapshot, and repeat checks.'],
        ['Register and let humans merge', 'Record PRs, reviews, and follow-ups; Polly never merges, while maintainers resolve conflicts and accept delivery.'],
      ],
      loopLabel: 'Bounded feedback loop', loopText: 'Pin snapshot → independent review → implementer fix', caption: 'Reviewers never edit code; without a second vendor or an accessible snapshot, stop claiming independent review and escalate.',
    },
    data: {
      topLeft: 'FIG 3 · DATA AND EVENT EVIDENCE FLOW', topRight: 'Specs define capabilities; events and diffs prove execution',
      events: [
        ['input', 'Agent bundle and task', 'name, executor, tools, policies, and the approved acceptance contract enter a controlled session.'],
        ['session', 'Persisted items and ACP links', 'inputItemId links an ACP prompt to a saved user item; it is not an authorization credential.'],
        ['execute', 'Sub-agents and worktrees', 'conversation_id, worktree, branch, and PR enter the Polly registry, with events returned through the inbox.'],
        ['review', 'Pinned diff and structured findings', 'base / head, acceptance contract, and blocking / non-blocking findings form repeatable review input.'],
        ['delivery', 'External CI and human acceptance', 'Recheck branches, tests, dependencies, and secret scans in a clean copy; internal completion is not acceptance.'],
      ],
      note: 'Agent bundles, sessions, registries, raw model output, diffs, and workspaces can contain private requirements, source, paths, and secrets; apply access control, redaction, and retention.', caption: 'A PR carries evidence; policy ALLOW, session completion, or internal reviewer approval is not a production-readiness promise.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Only offline package and spec checks were executed; other routes remain unexecuted',
      lanes: [
        { tag: 'A · OFFLINE VERIFICATION', title: 'Official wheel + Polly spec', flow: ['0.23.0', 'pip + compileall', 'Strict parsing'], body: 'Executed here. All three package versions match; pip check, core imports, both CLIs, and Polly spec loading passed without a model call.' },
        { tag: 'B · LOCAL / DOCKER', title: 'CLI server or Postgres full stack', flow: [':6767', ':8000', 'Accounts + artifacts'], body: 'Official routes, not started here. Check harness prerequisites, environment forwarding, HTTPS, database migration, and volume backup.' },
        { tag: 'C · POLLY / SANDBOX', title: 'Parallel engineering team and independent review', flow: ['Worktrees', 'Different vendors', 'Human merge'], body: 'Not tested. Fanout requires non-conflicting tasks, while cross-review needs a pinned diff and at least two vendors.' },
      ],
      caption: 'Verify minimum offline capability before opening services, workspaces, and write access; upgrades cannot reuse an old acceptance result.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function OmnigentArchitectureDiagram({ locale }: { locale: Locale }) {
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
          <div className="loop-arrows" aria-hidden="true"><span>session <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> policy</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>events <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> evidence</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>PR + evidence</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function OmnigentWorkflowDiagram({ locale }: { locale: Locale }) {
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

export function OmnigentDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>.polly/</strong><code>registry.json<br />worktree + branch<br />conversation_id + PR<br />base / head + diff<br />blocking + follow-ups</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function OmnigentDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
