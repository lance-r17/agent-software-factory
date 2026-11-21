export type Solution = {
  slug: string
  name: string
  chineseName: string
  version: string
  date: string
  summary: string
  tags: string[]
  paradigm: '单 Agent' | '多 Agent'
  status: string
  accent: 'pink' | 'green' | 'blue' | 'yellow'
  route: string
}

export const solutions: Solution[] = [
  {
    slug: 'mini-swe-agent',
    name: 'mini-SWE-agent',
    chineseName: '百行级软件工程 Agent 内核',
    version: 'v2.4.6',
    date: '2026-11-21',
    summary: '用线性消息历史、bash 工具调用和可替换执行环境，搭出一个能读代码、改代码、跑测试并留下完整轨迹的最小软件工厂内核。',
    tags: ['MIT', 'Python ≥ 3.10', '本地 / Docker', '可审计轨迹'],
    paradigm: '单 Agent',
    status: '官方推荐替代旧版 SWE-agent',
    accent: 'green',
    route: '/solutions/mini-swe-agent',
  },
  {
    slug: 'openhands-agent-canvas',
    name: 'OpenHands Agent Canvas',
    chineseName: '自托管编码 Agent 控制中心',
    version: 'v1.43.0',
    date: '2026-11-21',
    summary: 'Canvas 控制面 + Agent Server + Automation Server 的自托管栈，官方内建分诊、开发、评审、看门狗四段软件工厂流水线，可混用 ACP 兼容 Agent。',
    tags: ['MIT', 'Node ≥ 24', 'Docker / VM', 'ACP 多 Agent'],
    paradigm: '多 Agent',
    status: '2026-11-21 重新核验，取代历史快照',
    accent: 'pink',
    route: '/solutions/openhands-agent-canvas',
  },
  {
    slug: 'swe-agent',
    name: 'SWE-agent',
    chineseName: '完整 ACI 框架遗产版',
    version: 'v1.1.0',
    date: '2026-11-21',
    summary: 'YAML 驱动的研究型软件工程 Agent：Agent + ACI 工具束 + SWE-ReX 执行后端，保留 run-batch、轨迹检视与 SWE-bench 实验链路，但官方已由 mini-SWE-agent 取代。',
    tags: ['MIT', 'Python ≥ 3.11', 'Docker / Modal', 'SWE-bench'],
    paradigm: '单 Agent',
    status: '官方维护模式；用于历史兼容与研究对照',
    accent: 'blue',
    route: '/solutions/swe-agent',
  },
]
