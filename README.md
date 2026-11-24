# Agent 软件工厂 · 开源方案调研室

每天调研并收录一个「Agent 软件工厂」开源方案（用 Agent 系统自动化软件开发的工具），产出带架构图、部署手册与核验记录的完整分析页。每个新方案必须同时交付中文与英文版本。

- **公开站点（GitHub Pages）**：https://lance-r17.github.io/agent-software-factory/
- **技术栈**：React + TypeScript + Vite + Tailwind，HashRouter 静态站，`npm ci && npm run build` 产出 `dist/`。
- **语言路由**：中文保持 `/` 与 `/solutions/<slug>`；英文使用 `/en` 与 `/en/solutions/<slug>`。公开 Hash URL 分别为 `#/`、`#/solutions/<slug>`、`#/en`、`#/en/solutions/<slug>`。
- **语言切换**：头部 EN / ZH 按钮保留当前方案与页内锚点；导航、正文、图示、Tabs、部署手册、模态框、复制和下载反馈均按当前语言显示。

## 收录流水线

```
check_site.py + 防重检查 → 安全检查并同步最新 GitHub main
→ 候选池选题 → 创建选题 issue（中英文 DoD 合同）→ 官方一手资料调研 + 本地核验
→ 中文页面 / 手册 + 英文页面 / 手册 → 生产构建 + 中英文桌面/移动浏览器验收
→ 保存网站版本（预览）→ solution 分支 + PR（Closes #issue）
→ 人工审阅 merge → main → Actions 构建并发布到 GitHub Pages
```

- **开工先同步**：检查现有网站和工作区，执行 `git fetch origin main`，必要时切回本地 `main`，只执行 `git pull --ff-only origin main`。脏工作区或分叉必须停止，不 reset、不 rebase、不覆盖已有网站。
- **选题即 issue**：每个新选题先开 issue，写清候选信息与验收标准；调研失败保留 issue 并评论留痕。
- **双语即 DoD**：新方案必须同时提供中文路由 `/solutions/<slug>`、英文路由 `/en/solutions/<slug>`、两种语言的完整正文与 SKILL.md 部署手册。英文页面可见文本和可访问性标签不得残留中文。
- **双语验收**：两种语言都检查路由、语言切换、Tabs（含移动端 dropdown）、手册模态框、复制、下载和移动端无横向溢出；英文下载文件必须是英文 Markdown。
- **PR 即终审**：每次收录对应一条 `solution/<slug>-<date>` 分支的 PR，正文含中英文路由、核验日期、核验等级、实测范围与来源。PR 只创建、不自动合并，merge 后 issue 随 `Closes` 自动关闭。
- **发布即 Actions**：merge 到 main 触发 `.github/workflows/pages.yml`，从源码构建并部署 Pages。公开站只包含审阅通过的内容。
- **历史方案**：OpenHands Agent Canvas v1.43.0、mini-SWE-agent v2.4.6、SWE-agent v1.1.0 为建仓前已收录方案，不补建方案 issue/PR；全站双语功能由独立 feature 分支和 PR 交付。

## 可安装 Skills

部署手册正文独立于网页注册表，按 Agent Skills 开放格式存储。网页通过 Vite `?raw` 在构建时读取 Markdown，因此现有同步渲染、全文模态框、复制和下载不依赖运行时请求。

```text
skills/
├── deploy/
│   ├── zh-CN/<skill-name>/SKILL.md
│   └── en/<skill-name>/SKILL.md
└── analyze/
    └── agent-software-factory-research/
        ├── SKILL.md
        ├── scripts/
        ├── references/
        └── assets/discovery-queries.json
```

每个目录名必须与 SKILL.md frontmatter 的 `name` 一致。安装时只复制所需语言或工作流目录，避免同名中英文 Skill 在同一作用域冲突。例如：

```bash
mkdir -p ~/.agents/skills
cp -R skills/deploy/zh-CN/mini-swe-agent-deploy ~/.agents/skills/
cp -R skills/analyze/agent-software-factory-research ~/.agents/skills/
```

Claude Code 等使用其他发现目录的客户端，可以改为复制到宿主指定位置。开放格式统一的是 Skill 包结构，不是各客户端的安装路径或权限模型。

每日定时任务在代码合并后读取 `skills/analyze/agent-software-factory-research/SKILL.md`；候选与已研究 state 仍由任务数据目录持有，不进入 Git。新增方案手册时，不再把 Markdown 正文嵌入 `deploySkills.ts` 或 `deploySkillsEn.ts`。

在仓库根目录校验所有 Skill、资源引用和网页注册表：

```bash
python3 skills/analyze/agent-software-factory-research/scripts/validate_repository.py --repo-root .
```

候选扩搜第一阶段只运行 dry-run。Agent 先把审核后的官方来源整理到 `/tmp/discovery-curated.json`，再执行：

```bash
cd skills/analyze/agent-software-factory-research
python3 scripts/discover_candidates.py import \
  --input /tmp/discovery-curated.json \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json \
  --dry-run
python3 scripts/rank_candidates.py --candidates /path/to/state/candidates.json
(cd scripts && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_candidate_discovery.py)
```

dry-run 不写候选或发现历史。正式入池、`--strategy ranked` 和定时任务切换必须在审核通过后显式启用。

## Fast Track 候选提交

首页 `#submit` 提供中英文仓库 URL 提交入口。页面只规范化 GitHub 仓库根地址，然后直接通过查询参数预填新 Issue 的标题、正文和标签，不依赖 Issue Form 是否已进入 main；用户仍需登录 GitHub 并确认创建 Issue。Pages 不保存 URL、不包含后端或 GitHub Token，也不直接修改候选池状态。

- Issue Form：`.github/ISSUE_TEMPLATE/fast-track.yml`，每个 Issue 只接收一个仓库，可选填写根许可证文件证据和补充说明。
- 所需标签：`candidate:fast-track` 与 `status:queued`。仓库必须先创建这两个标签，模板才能正确应用它们。
- 页面只生成提交链接，不把“打开 GitHub”表述为“已提交”或“已入池”。
- 后续合规审核、标签流转和正式入池由独立自动化任务处理；官方仓库、归档、许可证和去重门槛不因 fast track 而降低。

## 已收录方案

| 方案 | 版本 | 中文路由 | 英文路由 | 核验日期 |
| --- | --- | --- | --- | --- |
| OpenHands Agent Canvas | v1.43.0 | `#/solutions/openhands-agent-canvas` | `#/en/solutions/openhands-agent-canvas` | 2026-11-20 |
| mini-SWE-agent | v2.4.6 | `#/solutions/mini-swe-agent` | `#/en/solutions/mini-swe-agent` | 2026-11-21 |
| SWE-agent（遗产版） | v1.1.0 | `#/solutions/swe-agent` | `#/en/solutions/swe-agent` | 2026-11-21 |
| Agentless | v1.5.0 | `#/solutions/agentless` | `#/en/solutions/agentless` | 2026-11-22 |

## 安全红线

模型 key 不进容器、GitHub Token 不进容器、密钥不写进 YAML 或 Git。本仓库只含公开调研内容，无任何密钥。
