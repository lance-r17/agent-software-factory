# 双语页面与部署 Skill 编写合同

## 1. 保留现有应用

先读 `src/main.tsx`、`src/App.tsx`、`src/components/Layout.tsx` 和既有方案页。项目使用 HashRouter：公开 URL 形如 `#/solutions/<slug>` 与 `#/en/solutions/<slug>`，不要用无哈希路径做生产直达测试。

不得重新初始化网站。复用现有 PageShell、SectionHeading、CodeBlock、RouteTabs、DeploySkillCard、图示 CSS 和 lucide-react 图标；不增加 emoji 图标、无目标按钮或占位链接。

## 2. 双语共享布局与类型化内容

新方案默认使用“一个共享布局 + zh/en 类型化内容”，不要复制完整 `*En.tsx` 页面或图示。

- 页面组件接收 `locale`，App 的中文和英文路由使用同一组件并分别传 `zh` / `en`。
- 文案、表格、Tabs、故障、风险、来源和代码注释放入 `src/data/solutionContent/<slug>`；布局保留 section 顺序、className 和交互。
- 用明确接口或递归 `ContentShape<typeof zh>` 约束英文对象，字段缺失必须在 TypeScript 构建时失败。
- 图示共用 SVG/lucide 结构，语言标签来自内容对象或图示内的双语 copy；不要新增完整 En 图示副本。
- 简单文本使用字符串和结构化数组。确需富文本时使用类型化 TSX/ReactNode；不要把不可信 HTML 字符串注入页面。
- 中文和英文可以保留必要的措辞差异，但不应复制排版。只有确实存在语言专属结构时才使用显式、可审查的配置，避免散布大量 locale 条件分支。
- 重构既有页面时，首个 PR 不顺手润色文案或改 CSS；先证明正文、DOM 和视觉不变。内容改进另开变更。

## 3. 每个方案的页面内容

中文和英文页面都应根据方案实际内容完整覆盖：

1. Hero、版本、提交、许可证、核验日期和一句话适配判断。
2. 官方 benchmark 或社区声明的语境与证据边界。
3. 架构图、工作流图、组件分工和数据/事件契约。
4. 在软件工厂中的正确位置、权限边界和自动化接入适配层。
5. 依赖与精确部署命令，明确哪些已执行、哪些只来自官方。
6. 部署路线 Tabs、SKILL.md 手册、验收、故障、风险、升级备份和主要来源。
7. 下一方案链接必须指向已存在页面，否则不添加。

同步更新首页中英文卡片、最新方案链接、页面标题和更新记录。保留所有既有页面和导航。

## 4. 独立部署 Skill 目录

部署手册按语言和 Skill frontmatter 的 `name` 建目录：

```text
skills/deploy/zh-CN/<skill-name>/SKILL.md
skills/deploy/en/<skill-name>/SKILL.md
```

`name` 必须匹配 `<skill-name>`。中英文同名 Skill 分属不同语言根目录，安装时只复制所需语言，避免同一作用域名称冲突。

手册应保持可独立执行：frontmatter、适用场景、前置检查、路线选择、精确命令、密钥边界、验收、故障和安全红线。只有确有需要时才添加 `scripts/` 或 `references/`，并使用相对路径。

## 5. 网页注册表

`src/data/deploySkills.ts` 和 `src/data/deploySkillsEn.ts` 只保留：

- `DeploySkill` 类型与卡片元数据。
- 对 `SKILL.md?raw` 的静态导入。
- 既有导出的方案对象，不改变页面 import API。

示例：

```ts
import miniSweAgentDeployMarkdown from '../../skills/deploy/zh-CN/mini-swe-agent-deploy/SKILL.md?raw'

// metadata remains unchanged
content: miniSweAgentDeployMarkdown
```

使用构建时 raw import，不改用运行时 fetch。这样现有同步渲染、模态框、剪贴板和 Blob 下载都不需要增加加载态或网络错误分支。

新增每日方案时，把中文和英文手册分别新增到对应语言目录，再在两个注册表添加元数据和导入。不要把 Markdown 正文重新嵌回 TypeScript 模板字符串。

## 6. 双语与交互检查

- 英文正文、代码注释、下载 Markdown 和 aria/title/alt 不得含中文。
- 语言切换保留当前 solution 与页内锚点。
- 桌面 Tabs 支持点击和方向键；移动 dropdown 支持选择、Escape 和焦点恢复。
- 手册模态框支持打开、关闭、Escape、复制反馈和真实 `.md` 下载。
- 页面可见链接必须有真实目标；页内锚点必须存在。

运行 `scripts/validate_repository.py --repo-root <repo>`，确保所有部署 Skill 都被注册表引用，且没有遗漏或遗留内联正文。
