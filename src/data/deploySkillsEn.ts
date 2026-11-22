import openHandsDeployMarkdownEn from '../../skills/deploy/en/openhands-agent-canvas-deploy/SKILL.md?raw'
import miniSweAgentDeployMarkdownEn from '../../skills/deploy/en/mini-swe-agent-deploy/SKILL.md?raw'
import sweAgentDeployMarkdownEn from '../../skills/deploy/en/swe-agent-legacy-deploy/SKILL.md?raw'
import agentlessDeployMarkdownEn from '../../skills/deploy/en/agentless-deploy/SKILL.md?raw'
import type { DeploySkill } from './deploySkills'

export const openHandsDeploySkillEn: DeploySkill = {
  slug: 'openhands-agent-canvas',
  title: 'OpenHands Agent Canvas deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including host preparation, CLI / source / Docker routes, GitHub automation, acceptance, and troubleshooting.',
  version: 'OpenHands Agent Canvas v1.43.0', verifyDate: '2026-11-20', fileName: 'openhands-agent-canvas-en.md', accent: 'pink',
  routes: [{ id: 'A', label: 'Official CLI' }, { id: 'B', label: 'Global npm' }, { id: 'C', label: 'Source development' }, { id: 'D', label: 'Headless + Docker' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Environment & secrets', '05 Exact commands', '06 GitHub PR automation', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: openHandsDeployMarkdownEn,
}

export const miniSweAgentDeploySkillEn: DeploySkill = {
  slug: 'mini-swe-agent',
  title: 'mini-SWE-agent deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including environment preparation, local confirmation, hardened Docker, trajectory acceptance, and troubleshooting.',
  version: 'mini-SWE-agent v2.4.6', verifyDate: '2026-11-21', fileName: 'mini-swe-agent-en.md', accent: 'green',
  routes: [{ id: 'A', label: 'Local confirmation' }, { id: 'B', label: 'Hardened Docker' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Model & secret environment', '05 Exact commands', '06 Automation integration', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: miniSweAgentDeployMarkdownEn,
}

export const sweAgentDeploySkillEn: DeploySkill = {
  slug: 'swe-agent',
  title: 'SWE-agent (legacy) deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including source installation, hardened Docker, Modal, batch benchmarks, trajectory inspection, and migration boundaries.',
  version: 'SWE-agent v1.1.0 (legacy)', verifyDate: '2026-11-21', fileName: 'swe-agent-legacy-en.md', accent: 'yellow',
  routes: [{ id: 'A', label: 'Hardened Docker' }, { id: 'B', label: 'Modal cloud' }, { id: 'C', label: 'Batch benchmarks' }, { id: 'D', label: 'Trajectory review' }],
  outline: ['01 Scope & version contract', '02 Choose a route', '03 Dependencies & directories', '04 Model & secret environment', '05 Exact commands', '06 Automation integration', '07 Acceptance checklist', '08 Troubleshooting', '09 Risks & lifecycle'],
  content: sweAgentDeployMarkdownEn,
}


export const agentlessDeploySkillEn: DeploySkill = {
  slug: 'agentless',
  title: 'Agentless deployment manual',
  description: 'A complete SKILL.md instruction set for coding Agents, including dependency-drift repair, five reproduction routes, secret boundaries, eight acceptance gates, and troubleshooting.',
  version: 'Agentless v1.5.0', verifyDate: '2026-11-22', fileName: 'agentless-en.md', accent: 'blue',
  routes: [{ id: 'A', label: 'Compatible environment' }, { id: 'B', label: 'Hierarchical localization' }, { id: 'C', label: 'Multi-sample repair' }, { id: 'D', label: 'Validation and selection' }, { id: 'E', label: 'Cost audit' }],
  outline: ['01 Hard prerequisites', '02 Dependency drift and verified pins', '03 Choose a route', '04 Source installation and CLI checks', '05 Model, dataset, and directory boundaries', '06 Official SWE-bench phase commands', '07 Outer automation gates', '08 Eight acceptance gates', '09 Troubleshooting', '10 Upgrades, backup, and cost control', '11 Security red lines and sources'],
  content: agentlessDeployMarkdownEn,
}
