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
}

export const solutions: Solution[] = [
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
