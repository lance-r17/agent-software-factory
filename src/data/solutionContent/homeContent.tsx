import type { ReactNode } from 'react'

type ChangelogEntry = { date: string; tone: string; title: string; body: string }
type HomeContent = {
  card: { verified: string; readPrefix: string; readSuffix: string }
  hero: {
    kicker: string; title: ReactNode; body: string; browse: string; latest: string
    sketchAria: string; sketchTitle: string; nodes: string[]; sketchFooter: string
  }
  library: {
    kicker: string; title: string; countLabel: string; searchPlaceholder: string; searchAria: string; clearAria: string
    filterAria: string; filterLabels: string[]; emptyTitle: string; emptyBody: string; reset: string
  }
  method: { kicker: string; title: ReactNode; intro: string; steps: { title: string; body: string }[] }
  changelog: { kicker: string; title: string; entries: ChangelogEntry[] }
}

const zh = {
  card: { verified: '核验', readPrefix: '查看 ', readSuffix: ' 完整分析' },
  hero: {
    kicker: 'DAILY OPEN-SOURCE FIELD NOTES · 2026',
    title: <>把“用 Agent<br />写软件的工厂”<span className="whitespace-nowrap">拆成</span><br /><span className="circled">可复现的图纸</span></>,
    body: '每天只选一个开源方案，从官方资料拆解它的架构、运行链路、本地部署与安全边界。少一点功能罗列，多一点真正跑得通的证据。',
    browse: '浏览方案库', latest: '最新：ASE 2.1.6', sketchAria: '从需求、规划、编码、测试到人工验收交付的 Agent 软件工厂流程示意图', sketchTitle: '一座 Agent 工厂的纸面模型',
    nodes: ['需求与仓库上下文', '任务规划与角色编排', '沙箱执行与自主修正', '测试、评审与人工验收'], sketchFooter: '交付的是可运行代码，不是一段聊天记录。',
  },
  library: {
    kicker: '01 · SOLUTION LIBRARY', title: '先选适合你的工厂引擎', countLabel: '个方案已收录', searchPlaceholder: '搜索方案、技术或场景', searchAria: '搜索方案库', clearAria: '清空搜索', filterAria: '按类型筛选',
    filterLabels: ['全部', '仓库自治', '编程 Agent'], emptyTitle: '暂时没有匹配的研究便签', emptyBody: '试试更短的关键词，或清除类型筛选。', reset: '重置筛选',
  },
  method: {
    kicker: '02 · OUR METHOD', title: <>每天一个方案，<br />四层证据拆解。</>, intro: '不把开源项目写成宣传页，而是当成一次生产候选评估。官方事实与本地实测分开标注。',
    steps: [
      { title: '架构地图', body: '核心组件、数据流、模型与工具边界、扩展接口。' }, { title: '复现手册', body: '依赖版本、精确命令、配置模板、目录结构与验证结果。' },
      { title: '工程验收', body: '权限、密钥、测试、失败恢复、成本与维护信号。' }, { title: '适配判断', body: '适合什么、不适合什么，以及还需要补齐哪些系统。' },
    ],
  },
  changelog: {
    kicker: '03 · CHANGELOG', title: '调研更新记录', entries: [
      { date: '2026-11-27', tone: 'green', title: '收录 ASE 2.1.6 · tag@8c1c959', body: 'Claude Code 工程插件、数十个技能、命名任务、Task Store、enterprise 生命周期与可选 Agent Fleet；隔离发布包、Node 22.22 CLI、MCP 列表和 Fleet 配置生成通过，真实模型与 Fleet 启动未执行。' },
      { date: '2026-11-26', tone: 'yellow', title: '收录 Loom v0.3.0 · main@fc4c0ba', body: 'Rust MCP 交付状态机、请求清单、字段组读取、TaskResult、评审修复与 .loom 恢复；脚本语法和 7 项 Python 测试通过，Release、Rust、真实模型与 Docker 未执行。' },
      { date: '2026-11-25', tone: 'blue', title: '收录 Omnigent v0.23.0', body: '多 harness 控制层、Agent YAML、策略与沙箱边界、Polly 并行 worktree 和跨供应商评审；官方 wheel、双 CLI 与 Polly 严格规格解析通过，真实模型与 PR 未执行。' },
      { date: '2026-11-24', tone: 'green', title: '收录 SWE-AF main@0de5364', body: 'AgentField 工程节点、Issue DAG、worktree 并行、三层失败控制、技术债与 checkpoint；Python 隔离实测 2,641 项测试通过，真实模型与 Go 未执行。' },
      { date: '2026-11-23', tone: 'pink', title: '收录 MetaGPT v0.8.1', body: '角色化 SOP、Team / Environment / ProjectRepo 分工、文档先行与隔离生成路线；实测固定源码的依赖漂移、核心导入和 CLI 兼容组合。' },
      { date: '2026-11-22', tone: 'blue', title: '收录 Agentless v1.5.0', body: '层级定位、多样本修复、验证选择与 JSONL 证据链；已实测源码安装和依赖兼容组合，并记录 SWE-bench 未锁定依赖漂移。' },
      { date: '2026-11-21', tone: 'yellow', title: '收录 SWE-agent v1.1.0 · 遗产研究线', body: 'ACI 与组件分工、源码安装、加固 Docker / Modal 路线、批处理、迁移边界与官方维护状态说明。' },
      { date: '2026-11-21', tone: 'green', title: '收录 mini-SWE-agent v2.4.6', body: '最小闭环、轨迹契约、本地 / Docker 路线、成本与安全闸门、八道验收清单；隔离环境已实测包导入与 CLI 入口。' },
      { date: '2026-11-20', tone: 'pink', title: '首期上线：OpenHands Agent Canvas v1.43.0', body: 'Conversation / Plan 双界面架构、Electron + FastAPI 启动链、本地 Docker 复现、GitHub PR 自动化与真实环境验证。' },
      { date: '每天', tone: 'blue', title: '新增一个可复现的开源方案', body: '优先选择仍在维护、定位有差异、文档完整且具备本地复现条件的项目。' },
    ],
  },
} satisfies HomeContent

const en = {
  card: { verified: 'Verified', readPrefix: 'Read the ', readSuffix: ' analysis' },
  hero: {
    kicker: 'DAILY OPEN-SOURCE FIELD NOTES · 2026',
    title: <>Make “factories that<br />write software with Agents”<br /><span className="circled">reproducible.</span></>,
    body: 'Every day, we select one open-source solution and use official sources to map its architecture, runtime workflow, local deployment, and security boundaries. Less feature-listing, more evidence you can run.',
    browse: 'Browse the library', latest: 'Latest: ASE 2.1.6', sketchAria: 'An Agent software factory pipeline from a requirement through planning, coding, and testing to a human-reviewed delivery', sketchTitle: 'An Agent factory, on paper',
    nodes: ['Requirement & repository context', 'Task planning & role orchestration', 'Sandboxed implementation & self-review', 'Tests, review & human acceptance'], sketchFooter: 'Working software, not a chat log.',
  },
  library: {
    kicker: '01 · SOLUTION LIBRARY', title: 'Choose the right engine first', countLabel: 'solutions indexed', searchPlaceholder: 'Search by solution, technology, or scenario', searchAria: 'Search the solution library', clearAria: 'Clear search', filterAria: 'Filter by category',
    filterLabels: ['All', 'Repository automation', 'Coding agents'], emptyTitle: 'No matching notes yet', emptyBody: 'Try a shorter keyword or clear the category filter.', reset: 'Reset filters',
  },
  method: {
    kicker: '02 · OUR METHOD', title: <>One solution a day.<br />Four evidence layers.</>, intro: 'We evaluate each open-source project as a production candidate, not a promotional page. Official facts and local checks are labeled separately.',
    steps: [
      { title: 'Architecture map', body: 'Core components, data flow, model and tool boundaries, and extension interfaces.' }, { title: 'Reproduction manual', body: 'Dependencies, exact commands, configuration templates, directory layout, and verification.' },
      { title: 'Engineering acceptance', body: 'Permissions, secrets, testing, failure recovery, cost, and maintenance signals.' }, { title: 'Fit assessment', body: 'What it suits, what it does not, and which gaps still require other systems.' },
    ],
  },
  changelog: {
    kicker: '03 · CHANGELOG', title: 'Research log', entries: [
      { date: '2026-11-27', tone: 'green', title: 'ASE 2.1.6 · tag@8c1c959 added', body: 'Claude Code engineering plugin, dozens of skills, named tasks, Task Store, enterprise lifecycle, and optional Agent Fleet; isolated Release, Node 22.22 CLI, MCP listing, and Fleet configuration passed, while real models and Fleet startup were not executed.' },
      { date: '2026-11-26', tone: 'yellow', title: 'Loom v0.3.0 · main@fc4c0ba added', body: 'Rust MCP delivery state, request manifests, field-group reads, TaskResults, review and repair, plus .loom recovery; syntax and seven Python tests passed, while Release, Rust, real models, and Docker were not executed.' },
      { date: '2026-11-25', tone: 'blue', title: 'Omnigent v0.23.0 added', body: 'Multi-harness control, Agent YAML, policy and sandbox boundaries, Polly parallel worktrees, and cross-vendor review; official wheel, both CLIs, and strict Polly spec parsing passed, while real models and PRs were not executed.' },
      { date: '2026-11-24', tone: 'green', title: 'SWE-AF main@0de5364 added', body: 'AgentField engineering nodes, Issue DAG, worktree parallelism, three-tier failure control, technical debt, and checkpoints; 2,641 isolated Python tests passed, while real models and Go were not executed.' },
      { date: '2026-11-23', tone: 'pink', title: 'MetaGPT v0.8.1 added', body: 'Role-based SOPs, Team / Environment / ProjectRepo responsibilities, documentation-first and isolated-generation routes; fixed-source dependency drift, core imports, and CLI compatibility were checked.' },
      { date: '2026-11-22', tone: 'blue', title: 'Agentless v1.5.0 added', body: 'Three-phase localization, repair, validation and selection; source installation plus dependency compatibility were checked, and the unpinned SWE-bench drift is documented.' },
      { date: '2026-11-21', tone: 'yellow', title: 'SWE-agent v1.1.0 · Legacy line indexed', body: 'ACI and component responsibilities, source installation, hardened Docker / Modal routes, batch pipelines, migration boundaries, and the official maintenance notice.' },
      { date: '2026-11-21', tone: 'green', title: 'mini-SWE-agent v2.4.6 added', body: 'Minimal closed loop, trajectory contracts, local / Docker routes, cost and security controls, and acceptance gates. Package import and CLI help were checked in an isolated environment.' },
      { date: '2026-11-20', tone: 'pink', title: 'First note: OpenHands Agent Canvas v1.43.0', body: 'Conversation / Plan architecture, Electron + FastAPI startup chain, local Docker reproduction, GitHub PR automation, and real environment checks.' },
      { date: 'Every day', tone: 'blue', title: 'One new reproducible open-source solution', body: 'Selection favors active projects with clear differentiation, complete documentation, and local reproduction potential.' },
    ],
  },
} satisfies HomeContent

export const homeContent = { zh, en }
