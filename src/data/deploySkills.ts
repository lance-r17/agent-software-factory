import openHandsDeployMarkdown from '../../skills/deploy/zh-CN/openhands-agent-canvas-deploy/SKILL.md?raw'
import miniSweAgentDeployMarkdown from '../../skills/deploy/zh-CN/mini-swe-agent-deploy/SKILL.md?raw'
import sweAgentDeployMarkdown from '../../skills/deploy/zh-CN/swe-agent-deploy/SKILL.md?raw'
import agentlessDeployMarkdown from '../../skills/deploy/zh-CN/agentless-deploy/SKILL.md?raw'
import metagptDeployMarkdown from '../../skills/deploy/zh-CN/metagpt-deploy/SKILL.md?raw'
import sweAfDeployMarkdown from '../../skills/deploy/zh-CN/swe-af-deploy/SKILL.md?raw'
import omnigentDeployMarkdown from '../../skills/deploy/zh-CN/omnigent-deploy/SKILL.md?raw'
export type DeploySkill = {
  slug: string
  fileName: string
  title: string
  description: string
  version: string
  verifyDate: string
  accent: 'pink' | 'green' | 'blue' | 'yellow'
  routes: { id: string; label: string }[]
  outline: string[]
  content: string
}

export const openHandsDeploySkill: DeploySkill = {
  slug: 'openhands-agent-canvas',
  fileName: 'openhands-agent-canvas-deploy.md',
  title: 'OpenHands Agent Canvas 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v1.43.0',
  verifyDate: '2026-11-21',
  accent: 'pink',
  routes: [
    { id: 'A', label: 'npm 本地全栈' },
    { id: 'B', label: 'Docker 单容器' },
    { id: 'C', label: '每会话一容器' },
    { id: 'D', label: 'VM 常驻服务' },
  ],
  outline: [
    '0 · 硬性前置检查（Node ≥ 24 / uv / Docker）',
    '1 · 四条部署路线选择表',
    '2 · 路线 A：npm 本地全栈',
    '3 · 路线 B：Docker 单容器',
    '4 · 路线 C：每会话一容器',
    '5 · 路线 D：VM 常驻服务',
    '6 · 密钥与状态管理',
    '7 · 可选：官方软件工厂接入',
    '8 · 八道验收闸门',
    '9 · 常见故障速查（8 条）',
    '10 · 升级与备份',
    '11 · 安全红线与来源',
  ],
  content: openHandsDeployMarkdown,
}

export const miniSweAgentDeploySkill: DeploySkill = {
  slug: 'mini-swe-agent',
  fileName: 'mini-swe-agent-deploy.md',
  title: 'mini-SWE-agent 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置两条路线选择表、YAML 模板、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v2.4.6',
  verifyDate: '2026-11-21',
  accent: 'green',
  routes: [
    { id: 'A', label: '本地确认模式' },
    { id: 'B', label: 'Docker 沙箱' },
  ],
  outline: [
    '0 · 硬性前置检查（Python ≥ 3.10 / bash）',
    '1 · 两条部署路线选择表',
    '2 · 安装与入口自检',
    '3 · 模型、密钥与总预算',
    '4 · 路线 A：本地确认模式',
    '5 · 路线 B：Docker 沙箱',
    '6 · 可选：外层自动化接入',
    '7 · 八道验收闸门',
    '8 · 常见故障速查（7 条）',
    '9 · 升级与备份',
    '10 · 安全红线与来源',
  ],
  content: miniSweAgentDeployMarkdown,
}


export const sweAgentDeploySkill: DeploySkill = {
  slug: 'swe-agent',
  fileName: 'swe-agent-deploy.md',
  title: 'SWE-agent 遗产版部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明维护期适用场景，正文内置四条路线选择表、源码安装命令、密钥边界、八道验收闸门与迁移红线。用于复现历史 SWE-agent pipeline；新项目默认改用 mini-SWE-agent。',
  version: 'v1.1.0',
  verifyDate: '2026-11-21',
  accent: 'blue',
  routes: [
    { id: 'A', label: '源码安装 + 加固 Docker' },
    { id: 'B', label: '本地仓库 + Modal' },
    { id: 'C', label: 'run-batch 批量基准' },
    { id: 'D', label: '轨迹审查与统计' },
  ],
  outline: [
    '0 · 硬性前置检查（Python ≥ 3.11 / Docker 或 Modal）',
    '1 · 四条路线选择表',
    '2 · 源码安装与 CLI 自检',
    '3 · 密钥与仓库边界',
    '4 · 路线 A：源码安装 + 加固 Docker',
    '5 · 路线 B：本地仓库 + Modal',
    '6 · 路线 C：run-batch 批量基准',
    '7 · 路线 D：轨迹审查与统计',
    '8 · 八道验收闸门',
    '9 · 常见故障速查（7 条）',
    '10 · 升级、迁移与备份',
    '11 · 安全红线与来源',
  ],
  content: sweAgentDeployMarkdown,
}


export const agentlessDeploySkill: DeploySkill = {
  slug: 'agentless',
  fileName: 'agentless-deploy.md',
  title: 'Agentless 部署 Skill',
  description: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置依赖漂移修复、五条复现路线、密钥边界、八道验收闸门与故障速查。交给任何编码 Agent 即可按图施工。',
  version: 'v1.5.0',
  verifyDate: '2026-11-22',
  accent: 'blue',
  routes: [
    { id: 'A', label: '兼容环境' },
    { id: 'B', label: '层级定位' },
    { id: 'C', label: '多样本修复' },
    { id: 'D', label: '验证选择' },
    { id: 'E', label: '成本审计' },
  ],
  outline: [
    '0 · 硬性前置检查（Python 3.11 / 固定 v1.5.0）',
    '1 · 官方依赖漂移与实测兼容锁',
    '2 · 五条复现路线选择表',
    '3 · 源码安装与 11 个入口自检',
    '4 · 模型、数据集与目录边界',
    '5 · 官方 SWE-bench 阶段命令',
    '6 · 外层自动化接入门禁',
    '7 · 八道验收闸门',
    '8 · 常见故障速查（8 条）',
    '9 · 升级、备份与成本控制',
    '10 · 安全红线与来源',
  ],
  content: agentlessDeployMarkdown,
}


export const metagptDeploySkill: DeploySkill = {
  slug: 'metagpt',
  fileName: 'metagpt-deploy.md',
  title: 'MetaGPT 部署 Skill',
  description: 'SKILL.md 格式的独立部署指令：固定 v0.8.1 与提交，记录 LanceDB / Click 实测兼容组合，内置离线核验、文档先行、隔离完整生成和序列化恢复四条路线，以及密钥边界、验收与故障速查。',
  version: 'v0.8.1',
  verifyDate: '2026-11-23',
  accent: 'pink',
  routes: [
    { id: 'A', label: '离线核验' },
    { id: 'B', label: '文档先行' },
    { id: 'C', label: '隔离完整生成' },
    { id: 'D', label: '序列化恢复' },
  ],
  outline: [
    '0 · 版本合同与证据边界',
    '1 · 硬性前置检查',
    '2 · 四条部署路线选择表',
    '3 · 路线 A：固定源码与兼容安装',
    '4 · 离线配置、核心导入与 CLI 自检',
    '5 · 真实模型配置',
    '6 · 路线 B：文档先行',
    '7 · 路线 C：隔离完整生成与 QA',
    '8 · 路线 D：序列化恢复',
    '9 · 外层自动化接入门禁',
    '10 · 八道验收闸门',
    '11 · 常见故障速查',
    '12 · 升级、备份、安全红线与来源',
  ],
  content: metagptDeployMarkdown,
}


export const sweAfDeploySkill: DeploySkill = {
  slug: 'swe-af',
  fileName: 'swe-af-deploy.md',
  title: 'SWE-AF 部署 Skill',
  description: 'SKILL.md 格式的独立部署指令：固定 main@0de5364，记录 2,641 项 Python 实测与 Go 未测边界，内置离线核验、Python Compose、Go 节点和单 Issue 委托四条路线，以及密钥、回调、预算、恢复与人工 merge 门禁。',
  version: 'main@0de5364',
  verifyDate: '2026-11-24',
  accent: 'green',
  routes: [
    { id: 'A', label: 'Python 离线核验' },
    { id: 'B', label: 'Python Compose' },
    { id: 'C', label: 'Go 节点' },
    { id: 'D', label: '单 Issue 委托' },
  ],
  outline: [
    '0 · 版本合同与证据边界',
    '1 · 硬性前置检查',
    '2 · 四条部署路线选择表',
    '3 · 路线 A：Python 离线核验',
    '4 · 路线 B：Python Compose 全栈',
    '5 · 路线 C：Go 节点',
    '6 · 路线 D：单 Issue 委托',
    '7 · 恢复、状态与自动化门禁',
    '8 · 八道验收闸门',
    '9 · 常见故障速查',
    '10 · 升级、备份与安全红线',
    '11 · 官方来源',
  ],
  content: sweAfDeployMarkdown,
}


export const omnigentDeploySkill: DeploySkill = {
  slug: 'omnigent',
  fileName: 'omnigent-deploy.md',
  title: 'Omnigent 部署 Skill',
  description: 'SKILL.md 格式的独立部署指令：固定 v0.23.0 与提交，记录官方 wheel、CLI 和 Polly 规格的 B 级实测，内置离线、本地控制层、Docker 服务和 Polly 并行工程四条路线，以及 Agent 契约、密钥、沙箱、评审与人工 merge 门禁。',
  version: 'v0.23.0',
  verifyDate: '2026-11-25',
  accent: 'blue',
  routes: [
    { id: 'A', label: '离线包与规格核验' },
    { id: 'B', label: '本地控制层' },
    { id: 'C', label: 'Docker + Postgres' },
    { id: 'D', label: 'Polly 并行工程' },
  ],
  outline: [
    '0 · 版本合同与证据边界',
    '1 · 硬性前置检查',
    '2 · 四条部署路线选择表',
    '3 · 路线 A：固定版本离线核验',
    '4 · 路线 B：本地控制层',
    '5 · 路线 C：Docker 服务',
    '6 · 路线 D：Polly 并行工程示例',
    '7 · Agent 契约与自动化门禁',
    '8 · 八道验收闸门',
    '9 · 常见故障速查',
    '10 · 升级、备份与安全红线',
    '11 · 官方来源',
  ],
  content: omnigentDeployMarkdown,
}
