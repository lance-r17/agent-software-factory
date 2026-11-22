---
name: agent-software-factory-research
description: 每天只调研并收录一个新的 Agent Software Factory 开源方案，完成多来源候选发现、候选去重与可解释排序、官方资料与实测证据分级、双语详情页和可安装部署 Skill、生产浏览器验收、网站快照以及 GitHub Issue/PR 交接。用于每日定时研究、solution 分支页面生成、方案库维护或复现本仓库的研究流水线；不用于重建网站、批量收录、自动合并或伪造执行记录。
---

# Agent Software Factory 每日研究

在现有网站中每天恰好收录一个新方案。把确定性检查交给脚本，把方案分析、证据判断和双语写作留给 Agent；不要用模板生成浅层内容代替真实研究。

## 不可破坏的边界

- 继续维护宿主指定网站。找不到项目时按宿主恢复手册处理，绝不重新脚手架或另建网站。
- 每天最多一个例行方案。当天已有成功记录、工作区脏、main 领先或分叉、远端校验异常时停止。
- 官方声明、社区经验和本地实测分开记录。没有执行模型、真实 Issue 修复或基准时明确写未执行。
- 中英文页面都必须是完整正文、图示和 SKILL.md 手册；英文可见文本、代码注释和 aria 标签不得残留中文。
- 只创建或更新 Issue/PR，不自动 merge、不关闭 Issue、不删除分支。公开 Pages 只在人工 merge 且 Actions 成功后更新。
- 模型 key、GitHub Token 和长期凭据不得写入网站、YAML、Git、日志或状态文件。

## 输入与宿主适配

开始前列出并确认：

- 网站项目目录、任务数据目录、候选文件和已研究状态文件。
- 当前日期与时区、仓库名、当天分支和既有 Issue/PR 搜索方式。
- 宿主提供的构建、真实浏览器、静态版本、快照和 GitHub 工具。

其他 Agent 安装本 Skill 后可以使用不同宿主目录和工具，但必须保留相同的安全停止条件与验收证据。脚本只读候选和状态文件，不替宿主写状态。

## 执行顺序

### 1. 完整读取宿主流程并防重

先读宿主任务目录中的 `GITHUB_FLOW.md`；没有该文件时使用 `references/research-workflow.md` 中的流程，但仍需遵守当前项目的 Git 安全手册。

按宿主规定顺序运行站点检查、当日防重和安全同步。禁止 `reset --hard`、`clean -fd`、强制 checkout 和强推。

### 2. 发现并选择唯一候选

读取 `references/discovery-sources.md` 和 `assets/discovery-queries.json`，按白名单来源扩搜。把 Agent 审核后的候选整理到 `/tmp/discovery-curated.json`，第一阶段只运行 dry-run：

```bash
python3 scripts/discover_candidates.py import \
  --input /tmp/discovery-curated.json \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json \
  --dry-run
```

dry-run 不写 state。未经审核的搜索结果不得直接入池；正式导入和 ranked 选题必须在宿主明确启用后执行。发现失败时回退到现有候选池。

选择时运行：

```bash
python3 scripts/select_candidate.py \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json
```

启用评分后增加 `--strategy ranked`。`status=stop` 时结束当天任务；`status=empty` 时报告候选池为空；只有 `status=selected` 才继续。搜索并复用同 slug 的 Issue/PR，不重复创建。

### 3. 研究并固定证据边界

读取 `references/research-workflow.md`，确定官方仓库、精确版本或提交、许可证、架构、工作流、数据契约、部署命令、风险和维护信号。先完成官方一手资料研究，再在隔离环境做与实际范围匹配的核验。

### 4. 生成双语页面与部署 Skills

读取 `references/page-authoring.md`。从最新 main 创建宿主要求的方案分支，保留既有路由和视觉系统。新增正文、图示和部署手册时，同时注册中文与英文路由。

部署手册正文存放为独立 `SKILL.md`，网页注册表只保留卡片元数据与 `?raw` 静态导入。新增 Skill 的 `name` 必须与所在目录同名。

### 5. 验证仓库与生产页面

运行：

```bash
python3 scripts/validate_repository.py --repo-root /path/to/repository
```

再按 `references/acceptance.md` 执行 Skill 格式校验、生产构建、中英文桌面和 375px 浏览器验收、真实复制与下载、静态版本和逐文件 SHA-256 快照。

### 6. 交接与记录

遵循宿主 GitHub 手册生成变更清单并推送当天方案分支。核对远端分支 tip、PR head 和本地 HEAD 一致后创建或更新详细 PR。只用宿主脚本记录结果，不手工编辑 state。

调研失败时保留选题 Issue 并写明失败原因；不得用文档整理冒充执行成功，也不得为避开失败而另选第二个方案。

## 按需资源

- `references/discovery-sources.md`：来源白名单、审核输入、dry-run、评分和上线策略。
- `assets/discovery-queries.json`：分来源查询、结果上限和失败策略。
- `references/research-workflow.md`：候选、Issue、证据分级、隔离核验、GitHub 和状态记录细则。
- `references/page-authoring.md`：现有 React/HashRouter 页面的双语实现与 Skill 注册合同。
- `references/acceptance.md`：构建、浏览器、快照、安全和 PR 验收清单。
- `scripts/discover_candidates.py`：审核后候选的规范化、去重、原子导入和 dry-run。
- `scripts/rank_candidates.py`：硬门槛、可解释评分和稳定排序。
- `scripts/select_candidate.py`：确定性防重和候选选择；只读，不写 state。
- `scripts/validate_repository.py`：校验 Skill 包、资源引用和网页 raw import 注册表；需要 Python 3 与 PyYAML。
