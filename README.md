# Agent 软件工厂 · 开源方案调研室

每天调研并收录一个「Agent 软件工厂」开源方案（用 Agent 系统自动化软件开发的工具），产出带架构图、部署手册与核验记录的完整分析页。

- **公开站点（GitHub Pages）**：https://lance-r17.github.io/agent-software-factory/
- **技术栈**：React + TypeScript + Vite + Tailwind，HashRouter 静态站，`npm ci && npm run build` 产出 `dist/`。

## 收录流水线

```
候选池选题 → 创建选题 issue（DoD 合同）→ 官方一手资料调研 + 本地核验
→ 页面 + SKILL.md 部署手册 → 生产构建 + 桌面/移动浏览器验收
→ 保存网站版本（预览）→ solution 分支 + PR（Closes #issue）
→ 人工审阅 merge → main → Actions 构建并发布到 GitHub Pages
```

- **选题即 issue**：每个新选题先开 issue，写清候选信息与验收标准；调研失败保留 issue 并评论留痕。
- **PR 即终审**：每次收录对应一条 `solution/<slug>-<date>` 分支的 PR，正文含路由、核验日期、核验等级、实测范围与来源。PR 只创建、不自动合并，merge 后 issue 随 `Closes` 自动关闭。
- **发布即 Actions**：merge 到 main 触发 `.github/workflows/pages.yml`，从源码构建并部署 Pages。公开站只包含审阅通过的内容。
- **历史方案**：OpenHands Agent Canvas v1.43.0、mini-SWE-agent v2.4.6、SWE-agent v1.1.0 为建仓前已收录方案，不补建 issue/PR。

## 已收录方案

| 方案 | 版本 | 路由 | 核验日期 |
| --- | --- | --- | --- |
| OpenHands Agent Canvas | v1.43.0 | `#/solutions/openhands-agent-canvas` | 2026-11-20 |
| mini-SWE-agent | v2.4.6 | `#/solutions/mini-swe-agent` | 2026-11-21 |
| SWE-agent（遗产版） | v1.1.0 | `#/solutions/swe-agent` | 2026-11-21 |

## 安全红线

模型 key 不进容器、GitHub Token 不进容器、密钥不写进 YAML 或 Git。本仓库只含公开调研内容，无任何密钥。
