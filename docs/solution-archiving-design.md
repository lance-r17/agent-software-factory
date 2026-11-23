# Agent Software Factory 方案归档机制设计

- 状态：设计已确认（2026-11-23），待 Issue 立项后实施
- 路线：C 起步（策展归档）→ B 演进（reverify 生命周期）→ A 只做硬信号（上游自动检测）
- 原则：归档 ≠ 删除。保留最后一次调研内容；首页默认隐藏，可开关显示，归档页可查；弱信号永不自动判死

## 1. 背景与可行性

方案库随每日收录增长，停止维护的上游项目会沉淀并稀释选型参考价值。需要一种淘汰机制：归档长期失维护的方案、保留其最后一次调研内容、首页默认隐藏但可随时查看。

现状可行性依据：

- `state/researched.json` 条目已有 date/version/verification/sources，部分有 reverified_date，归档元数据可纯增量添加，向后兼容。
- 首页为客户端过滤（现有 category 筛选），归档过滤与开关成本低；详情页为独立静态页面，归档不影响页面存续，内容保留天然成立。
- `repository_resolver.py` 已能读取 GitHub `archived` 标志与仓库元数据；`reverify.py` 提供重新核验挂钩点。
- 先例：SWE-agent 页面已以「遗产研究 / 官方推荐 mini-SWE-agent」处理维护停止，本机制将其形式化。

信号分级（防误伤的核心）：

- 硬信号：GitHub `archived=true`、官方宣布维护停止/弃坑/指定继任者——可据此归档。
- 弱信号：`pushed_at` 久远、issue 不活跃、stars 变化——只进复核队列，绝不单独判死。

## 2. 数据模型（纯增量）

### 2.1 state/researched.json（唯一事实来源）

方案条目新增 `lifecycle` 与 `archive` 字段，缺省即为 active，现有条目零迁移：

```json
{
  "slug": "swe-agent",
  "version": "v1.1.0",
  "date": "2026-11-21",
  "lifecycle": "archived",
  "archive": {
    "archived_at": "2026-11-24",
    "reason": "upstream_maintenance_mode",
    "reason_detail": "官方 README 声明进入维护模式并推荐 mini-SWE-agent",
    "evidence_url": "https://github.com/SWE-agent/SWE-agent#readme",
    "successor_slug": "mini-swe-agent",
    "decided_by": "curated",
    "last_verified_at": "2026-11-21"
  }
}
```

字段约定：

- `lifecycle`：`active`（默认）/ `watch`（B 阶段预留）/ `archived`
- `reason` 枚举：`upstream_archived` / `upstream_maintenance_mode` / `upstream_deprecated` / `no_maintenance_confirmed` / `other`
- `decided_by`：`curated`（策展判断）/ `upstream_flag`（上游硬信号）
- `successor_slug` 可选，指向站内已收录且未归档的继任方案
- 归档时保留条目全部既有字段；`last_verified_at` 标明冻结内容的核验时点
- 复活时 `lifecycle` 改回 active，archive 块移入 `archive_history` 数组留痕，不删除任何字段

### 2.2 src/data/solutions.ts 与 solutionsEn.ts（站点数据）

```ts
export type Solution = {
  // …既有字段不变
  lifecycle?: 'active' | 'watch' | 'archived'  // 缺省 = active
  archivedAt?: string
  archiveReason?: string    // 中英文各自维护，一句话原因
  successorSlug?: string
}
```

## 3. 归档脚本契约（archive_solution.py，宿主 scripts/，与 reverify.py 同级）

```bash
# 归档
python3 scripts/archive_solution.py \
  --slug swe-agent \
  --reason upstream_maintenance_mode \
  --evidence-url https://github.com/SWE-agent/SWE-agent#readme \
  --detail "官方声明维护模式并推荐 mini-SWE-agent" \
  --successor-slug mini-swe-agent \
  --decided-by curated \
  --date 2026-11-24 \
  [--dry-run]

# 复活（项目恢复维护时回退，保留历史记录）
python3 scripts/archive_solution.py --restore --slug swe-agent \
  --detail "上游恢复活跃维护" --date 2026-12-01
```

行为契约：

1. 校验 slug 存在且未归档（`--restore` 反之）；`successor_slug` 必须指向已收录且未归档方案。
2. 原子写入（临时文件 + 替换），与现有 state 纪律一致；`--dry-run` 只打印变更 diff，零写入。
3. 执行前后输出 researched.json 的 SHA-256；不允许触碰 candidates.json。
4. 归档/复活均不删除任何字段。

## 4. UX 设计

### 4.1 首页

- 默认列表过滤：`solutions.filter(s => s.lifecycle !== 'archived')`
- 分类筛选区旁加开关「显示已归档（N）/ Show archived (N)」，默认关闭
- 开启后归档卡片以弱化样式插入（降透明度 + 「已归档」角标），显示 archivedAt 与一句话原因，点击仍进入完整详情页
- 列表底部计数：「共 N 个方案，M 个已归档」

### 4.2 归档页（新路由 `#/archive` + `#/en/archive`）

- 列出全部归档方案：名称、冻结版本、调研日期、归档日期、原因、继任方案链接、完整详情页入口
- 导航栏加「归档 / Archive」入口，首页开关旁也有链接
- 空状态：「暂无归档方案 / No archived solutions」

### 4.3 详情页

- 归档方案页顶部通知条：「本方案已于 {archivedAt} 归档：{archiveReason}。本页保留 {last_verified_at} 的调研内容，仅供历史参考。[查看继任方案 →]」
- 正文、架构图、部署 Skill 全部原样保留，仍可复制下载（下载物同样带归档提示）
- 中英文页面各自完整实现，英文可见文本、代码注释和 aria 标签不得残留中文

## 5. 归档操作流程（C 阶段）

```text
每日研究 Agent 或用户发现弃坑信号
→ 核验证据（resolver 查 archived 标志 / 官方声明 URL）
→ archive_solution.py --dry-run 展示 diff
→ 正式执行更新 state（记录前后 SHA-256）
→ 站点小 PR：solutions.ts/solutionsEn.ts 加 lifecycle 与双语 archiveReason
→ PR 附证据链接，用户人工 merge
→ Actions 重建：首页默认隐藏，归档页可查，详情页保留
```

复活走同样的双向流程，不引入例外。

## 6. 分段式改进路线

| 阶段 | 内容 | 形态 | 状态 |
| --- | --- | --- | --- |
| 一期（C） | archive_solution.py + state schema + 首页开关 / 归档页 / 详情页通知条 | 宿主脚本 + 1 个站点功能 PR | 本期实施 |
| 二期（B） | reverify 扩展 watch 生命周期：90 天未复核入队，Agent 评估后定级 active/watch/archived | 复用现有复核流程 | 待一期稳定后立项 |
| 三期（A） | 定时检测 GitHub `archived` 标志与官方弃坑声明，作为策展输入（`decided_by=upstream_flag`） | 只做硬信号；弱信号一律人工复核 | 待二期稳定后立项 |

## 7. 验收标准（一期）

- 归档脚本 dry-run 零写入；正式执行原子替换且仅改 researched.json，前后 SHA-256 可核对
- 归档条目全部原字段保留；复活后 lifecycle 复原且 archive 块进入 archive_history
- 首页默认不显示归档方案；开关开启后以弱化样式显示并可点入详情页
- `#/archive` 与 `#/en/archive` 路由可用，归档页字段完整（含继任链接与证据）
- 归档详情页顶部通知条含归档日期、原因、内容核验时点；正文与部署 Skill 完整保留
- 中英文页面与下载物均带归档提示，英文无中文残留
- 生产构建与真浏览器验收通过（桌面 + 375px，含归档页与开关交互）
- 不改变每日一个方案、preview 审批、人工 merge 规则

## 8. 非目标

- 不删除任何方案页面、部署 Skill 或历史调研内容
- 不按 stars、commit 频率等单一弱信号自动归档
- 不改变每日一个方案、preview 审批、人工 merge 的既有规则
- 不给旧池候选补 verification
