export type Solution = {
  slug: string
  title: string
  subtitle: string
  description: string
  version: string
  license: string
  stars: string
  verifiedAt: string
  tags: string[]
  category: '仓库自治' | '编程 Agent'
  tone: 'pink' | 'green' | 'blue' | 'yellow'
  lifecycle?: 'active' | 'watch' | 'archived'
  archivedAt?: string
  archiveReason?: string
  archiveEvidenceUrl?: string
  successorSlug?: string
}

export const solutions: Solution[] = [
  {
    slug: 'omnigent', title: 'Omnigent', subtitle: '把异构编码 Agent 纳入同一控制、协作与策略层',
    description: 'Apache-2.0 多 Agent 元 harness：统一 CLI / Web UI、服务与执行宿主，Agent YAML 声明子 Agent 和策略；Polly 示例以并行 worktree、固定 diff 和跨供应商评审交付 PR。固定 v0.23.0；仅实测安装、CLI 与规格解析。',
    version: 'v0.23.0', license: 'Apache-2.0', stars: '多 Agent 控制层', verifiedAt: '2026-11-25',
    tags: ['Python 3.12+', '多 harness', '策略门禁', 'Polly worktree'], category: '仓库自治', tone: 'blue',
  },
  {
    slug: 'swe-af', title: 'SWE-AF', subtitle: '用 Issue DAG、三层控制环和 checkpoint 驱动自治工程队',
    description: 'AgentField 上的 Apache-2.0 软件工厂节点：目标经 PRD、架构和 Issue DAG 进入 worktree 并行编码、评审、QA、合并与验证。固定 main@0de5364；Python 2,641 项测试通过，真实模型与 Go 未执行。',
    version: 'main@0de5364', license: 'Apache-2.0', stars: '自治工程队', verifiedAt: '2026-11-24',
    tags: ['Python 3.12', 'Issue DAG', '三层控制环', 'checkpoint'], category: '仓库自治', tone: 'green',
  },
  {
    slug: 'metagpt', title: 'MetaGPT', subtitle: '把软件公司的 SOP 落成角色、消息与文件产物',
    description: 'FoundationAgents 的 MIT 多角色框架：ProductManager、Architect、ProjectManager、Engineer 与可选 QA 通过共享环境和 ProjectRepo 协作。本页固定 v0.8.1，实测依赖漂移、核心导入与 CLI 兼容组合；真实模型生成未执行。',
    version: 'v0.8.1', license: 'MIT', stars: '角色化 SOP', verifiedAt: '2026-11-23',
    tags: ['Python 3.11', '多角色 SOP', '消息订阅', 'ProjectRepo'], category: '编程 Agent', tone: 'pink',
  },
  {
    slug: 'agentless', title: 'Agentless', subtitle: '不用自由工具循环，把修复拆成定位、生成、验证选择',
    description: 'OpenAutoCoder 的 MIT 研究流水线：层级定位、多样本补丁、回归 / 复现测试与多数投票。适合研究固定流程和 SWE-bench 复现；官方依赖未锁定，本页给出 2026 年实测兼容组合。',
    version: 'v1.5.0', license: 'MIT', stars: '2.1k', verifiedAt: '2026-11-22',
    tags: ['Python 3.11', 'SWE-bench', '固定流水线', 'JSONL 证据'], category: '编程 Agent', tone: 'blue',
  },
  {
    slug: 'swe-agent', title: 'SWE-agent', subtitle: 'SWE-bench 时代的高影响力 Agent 框架，现由 mini 接棒',
    description: 'Python ≥ 3.11 的 MIT 研究框架，完整呈现 ACI、工具束、轨迹与批量实验。官方已进入维护模式并推荐 mini-SWE-agent；本页固定 v1.1.0，保留源码复现、Docker / Modal 路线与历史迁移边界。',
    version: 'v1.1.0', license: 'MIT', stars: '遗产研究', verifiedAt: '2026-11-21',
    tags: ['Python ≥ 3.11', 'SWE-ReX', 'ACI', '研究 / 批处理'], category: '编程 Agent', tone: 'yellow',
    lifecycle: 'archived', archivedAt: '2026-11-23',
    archiveReason: '官方 README 声明开发重心已转向 mini-SWE-agent（superseded）。',
    archiveEvidenceUrl: 'https://github.com/SWE-agent/SWE-agent#readme',
    successorSlug: 'mini-swe-agent',
  },
  {
    slug: 'mini-swe-agent', title: 'mini-SWE-agent', subtitle: '用约 100 行核心逻辑，跑通模型到补丁的最小闭环',
    description: 'SWE-agent 团队当前的轻量主线。线性 messages、可替换 Model / Environment、完整 trajectory 与成本限制；适合作为外层软件工厂的单任务执行内核，而不是直接替代 CI、人审与权限系统。',
    version: 'v2.4.6', license: 'MIT', stars: '官方主线', verifiedAt: '2026-11-21',
    tags: ['Python ≥ 3.10', 'bash-only', 'Docker 可选', '可序列化轨迹'], category: '编程 Agent', tone: 'green',
  },
  {
    slug: 'openhands-agent-canvas', title: 'OpenHands Agent Canvas', subtitle: '把多步骤研发流程，画成一张可检查的动态白板',
    description: 'OpenHands v1 的全新本地界面：Conversation 是实时会话流，Plan 是带进度和子任务的动态计划。适合希望观察、暂停并接管编码 Agent 的团队，也适合作为软件工厂的人机协作前端。',
    version: 'v1.43.0', license: 'MIT', stars: '28.9k', verifiedAt: '2026-11-20',
    tags: ['Electron + React', 'FastAPI', '多会话', '人工接管'], category: '编程 Agent', tone: 'pink',
  },
]

export const solutionsEn: Solution[] = [
  {
    slug: 'omnigent', title: 'Omnigent', subtitle: 'One control, collaboration, and policy layer for heterogeneous coding Agents',
    description: 'An Apache-2.0 multi-Agent meta-harness with shared CLI / Web UI, server, and execution hosts. Agent YAML declares sub-agents and policies, while Polly demonstrates parallel worktrees, pinned diffs, and cross-vendor review before PR delivery. Pins v0.23.0; only installation, CLI, and spec parsing were tested.',
    version: 'v0.23.0', license: 'Apache-2.0', stars: 'Multi-Agent control', verifiedAt: '2026-11-25',
    tags: ['Python 3.12+', 'Multi-harness', 'Policy gates', 'Polly worktrees'], category: '仓库自治', tone: 'blue',
  },
  {
    slug: 'swe-af', title: 'SWE-AF', subtitle: 'An autonomous engineering team driven by an Issue DAG, three control loops, and checkpoints',
    description: 'An Apache-2.0 software-factory node on AgentField: goals become PRDs, architecture, and an Issue DAG, then parallel worktree coding, review, QA, merge, and verification. Pins main@0de5364; 2,641 Python tests passed, while real models and Go were not executed.',
    version: 'main@0de5364', license: 'Apache-2.0', stars: 'Autonomous team', verifiedAt: '2026-11-24',
    tags: ['Python 3.12', 'Issue DAG', 'Three control loops', 'Checkpoints'], category: '仓库自治', tone: 'green',
  },
  {
    slug: 'metagpt', title: 'MetaGPT', subtitle: 'Software-company SOPs expressed as roles, messages, and file artifacts',
    description: 'FoundationAgents’ MIT-licensed multi-role framework: ProductManager, Architect, ProjectManager, Engineer, and optional QA collaborate through a shared environment and ProjectRepo. This analysis pins v0.8.1 and checks dependency drift, core imports, and CLI compatibility; real model generation was not executed.',
    version: 'v0.8.1', license: 'MIT', stars: 'Role-based SOP', verifiedAt: '2026-11-23',
    tags: ['Python 3.11', 'Multi-role SOP', 'Message subscriptions', 'ProjectRepo'], category: '编程 Agent', tone: 'pink',
  },
  {
    slug: 'agentless', title: 'Agentless', subtitle: 'A fixed pipeline for localization, repair, validation, and selection',
    description: 'OpenAutoCoder’s MIT-licensed research pipeline: hierarchical localization, multi-sample patches, regression / reproduction tests, and majority voting. Useful for studying fixed pipelines and SWE-bench reproduction; its official dependencies are unpinned, so this page records a compatibility combination verified in 2026.',
    version: 'v1.5.0', license: 'MIT', stars: '2.1k', verifiedAt: '2026-11-22',
    tags: ['Python 3.11', 'SWE-bench', 'Fixed pipeline', 'JSONL evidence'], category: '编程 Agent', tone: 'blue',
  },
  {
    slug: 'swe-agent', title: 'SWE-agent', subtitle: 'The influential SWE-bench-era agent framework, now succeeded by mini',
    description: 'An MIT-licensed research framework requiring Python 3.11 or later, with a complete ACI, tool bundles, trajectories, and batch experiments. The official project is in maintenance mode and recommends mini-SWE-agent. This analysis pins v1.1.0 and preserves source reproduction, Docker / Modal routes, and migration boundaries.',
    version: 'v1.1.0', license: 'MIT', stars: 'Legacy research', verifiedAt: '2026-11-21',
    tags: ['Python ≥ 3.11', 'SWE-ReX', 'ACI', 'Research / batches'], category: '编程 Agent', tone: 'yellow',
    lifecycle: 'archived', archivedAt: '2026-11-23',
    archiveReason: 'The official README states that active development has moved to mini-SWE-agent (superseded).',
    archiveEvidenceUrl: 'https://github.com/SWE-agent/SWE-agent#readme',
    successorSlug: 'mini-swe-agent',
  },
  {
    slug: 'mini-swe-agent', title: 'mini-SWE-agent', subtitle: 'A minimal model-to-patch loop with roughly 100 lines of core logic',
    description: 'The lightweight, current mainline from the SWE-agent team. Linear messages, replaceable Model / Environment protocols, complete trajectories, and cost limits make it a strong single-task execution kernel inside a larger software factory—not a replacement for CI, human review, or access control.',
    version: 'v2.4.6', license: 'MIT', stars: 'Official mainline', verifiedAt: '2026-11-21',
    tags: ['Python ≥ 3.10', 'bash-only', 'Optional Docker', 'Serializable traces'], category: '编程 Agent', tone: 'green',
  },
  {
    slug: 'openhands-agent-canvas', title: 'OpenHands Agent Canvas', subtitle: 'A live whiteboard for inspecting multi-step development work',
    description: 'A new local interface for OpenHands v1: Conversation is the live session stream, while Plan is a dynamic plan with progress and subtasks. It suits teams that want to observe, pause, and take over coding agents, and can serve as the human-agent collaboration front end of a software factory.',
    version: 'v1.43.0', license: 'MIT', stars: '28.9k', verifiedAt: '2026-11-20',
    tags: ['Electron + React', 'FastAPI', 'Multiple sessions', 'Human takeover'], category: '编程 Agent', tone: 'pink',
  },
]
