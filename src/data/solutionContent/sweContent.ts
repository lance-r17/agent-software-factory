const zh = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 03 · LEGACY LINE', breadcrumb: '方案库', titleA: '把 ACI 研究做成', titleB: '一套', highlight: '完整但已交棒的框架',
    lead: '这是 SWE-bench 生态里最有历史影响力的开源 Agent 框架：YAML 驱动、工具束可替换、轨迹面向研究。它的官方现状也必须写在最前面：mini-SWE-agent 已经取代它，主线进入维护模式。',
    primary: '进入复现手册', repository: '官方仓库', noteKicker: '一句话判断', verdictA: '适合研究历史框架与批量实验，', verdictB: '不适合作为新工厂首选底座。',
    bullets: ['ACI 与工具束设计完整', '轨迹、批处理、检视工具成熟', 'Docker / Modal / Fargate 后端可换', '官方已被 mini 取代，维护模式'], copy: '复制本页链接', copied: '链接已复制',
  },
  facts: { labels: ['核验版本', '维护信号', '运行基线', '许可证 / 定位', '事实核验日'], maintenanceValue: '官方 README', notes: ['2025-05-22 Release', '推荐改用 mini-SWE-agent', '默认 Docker python:3.11', '研究型 ACI 框架', '时效信息以此为准'] },
  evidence: { title: '为什么还要收录一个“已被取代”的方案？', body: '因为大量历史教程、SWE-bench pipeline 和 ACI 研究仍指向 SWE-agent 1.x。正确收录方式不是把它包装成新部署首选，而是标明维护状态、保留可复现路径，并说明何时应该改用 mini-SWE-agent。', link: '官方替代声明' },
  architecture: { kicker: '01 · SYSTEM MAP', title: 'CLI、Agent、环境三层分工', intro: 'SWE-agent 1.x 的结构比 mini 更完整，也更重：sweagent CLI 负责装配，Agent 负责模型与工具决策，SWEEnv 通过 SWE-ReX 管理部署和 shell session。', sources: ['官方架构文档', 'SWEEnv 源码', 'SWE-ReX 执行后端'] },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: '从 YAML 到 submit：一条研究型工作流', intro: '每一步都被设计成可配置、可记录、可重放。它牺牲了一点简洁性，换来对 prompt、工具、历史和批处理实验的细粒度控制。',
    explanations: [
      { title: 'ACI 是 SWE-agent 的核心遗产', body: '它不是简单把 bash 暴露给模型，而是提供窗口化文件查看、搜索、编辑、提交等工具束；编辑前还会做语法检查。后来的很多编码 Agent 都沿用了这套“模型需要好的计算机接口”的思想。' },
      { title: '完整框架也意味着更多迁移面', body: '模板、工具束、解析器、HistoryProcessor、部署后端、批处理实例源都可配置。对研究是优点；对新团队的长期维护则是负担，尤其官方已经建议改用 mini。' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: '组件分工：谁思考，谁执行，谁留证', intro: '读源码时抓住这条线：Agent.forward() 生成动作，ToolHandler 解析与执行，SWEEnv 只负责环境与部署，输出文件由 run hooks 和 runner 汇总。', caption: 'SWE-agent 核心组件分工', headers: ['组件', '输入', '职责', '不做什么'],
    rows: [
      { chip: 'sweagent CLI', tone: 'blue', input: 'run / run-batch / inspect', role: '解析层级参数，合并 YAML，创建 runner；提供轨迹查看、合并预测与统计工具。', boundary: '不内建完整 Issue 调度平台。' },
      { chip: 'Agent', tone: 'green', input: 'history + model + tools', role: 'forward() 查询模型，处理重试、成本限制、提交与异常退出。', boundary: '不直接管理 Docker 或云资源。' },
      { chip: 'HistoryProcessor', tone: 'yellow', input: '完整消息历史', role: '按配置压缩、缓存或改写历史，控制进入模型的上下文。', boundary: '不保证压缩后仍保留全部事实。' },
      { chip: 'ToolHandler / ACI', tone: 'pink', input: '工具束与动作文本', role: '安装 registry / editor / review 工具，解析 function calling，执行 submit 检查。', boundary: '不天然阻止危险 shell；边界取决于部署层。' },
      { chip: 'SWEEnv + SWE-ReX', tone: 'blue', input: 'deployment + repo', role: '启动 Docker / Modal / Fargate / local runtime，复制仓库，执行 shell 命令。', boundary: '不评价补丁语义，不替 CI 验收。' },
      { chip: 'Inspector / preds', tone: 'green', input: '.traj / 实验目录', role: '终端或网页查看轨迹；quick-stats 汇总；preds.json 交给外部评测。', boundary: '不把“生成预测”包装成“修复成功”。' },
    ], sources: ['ACI 设计说明', '工具束源码', 'Agent 参考'],
  },
  data: {
    kicker: '04 · DATA & EVENTS', title: '轨迹格式在 v1.1.0 有一次关键变化', intro: '旧字段 messages 被 query 取代：现在每一步保存的是当前模型看到的精确输入。做跨版本分析时，这一点最容易误判。', codeTitle: '读取轨迹验收字段', noteTitle: 'v1.1.0 迁移要点',
    notes: ['`messages` 改为 `query`，不要混用旧解析脚本。', '多个 windowed 工具束改名；旧配置里的 `review_on_submit` 已移除，改用 `review_on_submit_m`。', '新增 SWE-bench multilingual / multimodal 与 SWE-smith 支持。'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: '它在工厂里的正确位置：研究线与历史兼容层', intro: 'SWE-agent 不是过时的“坏方案”，而是被更小后继者承接的完整框架。把它用于合适场景，同时把新平台默认指向 mini。', aria: '完整软件工厂流水线', outer: '外层补齐', internal: 'SWE-agent',
    steps: [{ title: '接单', lines: ['Issue / 数据集 / 人工任务'] }, { title: '加工', lines: ['ACI 工具', '修改', '自测'] }, { title: '留证', lines: ['traj + preds + logs'] }, { title: '质检与交付', lines: ['SWE-bench / CI', '人审', 'merge'] }],
    yesTitle: '特别适合', noTitle: '不适合直接承担',
    yes: ['复现 2024–2025 年 SWE-agent / SWE-bench 研究与历史 pipeline。', '研究 Agent-Computer Interface、工具束、prompt 与历史压缩策略。', '需要 run-batch、inspector、merge-preds、quick-stats 这套实验工具。', '维护仍在使用 v1.x YAML 配置或 SWE-smith / 多语评测的团队。', '作为 mini-SWE-agent 的对照组，比较“完整框架”与“最小内核”。'],
    no: ['新团队的默认生产 Agent 底座——官方推荐改用 mini-SWE-agent。', '需要活跃功能演进、现代平台治理和长期升级承诺的场景。', '把 GitHub Issue 直接接入自动修复并自动合并的无人值守流水线。', '强合规所需的身份、审批、审计、租户隔离与凭证轮换。', '不愿维护 Docker / 云沙箱 / 模型密钥 / 依赖锁的团队。'], sources: ['v1.1.0 变更与维护状态', '后继者 mini-SWE-agent', 'ACI 论文'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: '先固定 v1.1.0，再选择执行后端', intro: '官方安装首选是源码 editable 安装；PyPI 不是本方案当前的可靠分发路径。以下命令除“安装与 CLI 自检”外均属于官方资料整理与本页部署设计。', verificationTitle: '本次实际执行验证',
    verification: '已克隆并核对 `v1.1.0`（commit `0f3acaf`），在隔离临时目录完成源码安装，成功运行 `sweagent --help`、`run --help`、`run-batch --help` 与轨迹查看器帮助。**当前沙箱没有 Docker，也没有模型密钥，因此未执行真实 Issue 修复、未调用模型、未运行 SWE-bench。**',
    prereqTitle: '依赖与版本清单', prereqs: [
      { label: 'Python', value: '≥ 3.11', note: 'pyproject 强制；示例用 3.11' }, { label: '核心包', value: 'sweagent 1.1.0', note: '源码 editable 安装' },
      { label: '执行后端', value: 'SWE-ReX ≥ 1.2.0', note: '本次解析到 1.4.0' }, { label: '默认镜像', value: 'python:3.11', note: 'Docker 路线；固定 tag / digest' },
      { label: '可选后端', value: 'Modal / Fargate / local', note: '云端或无沙箱本地' }, { label: '模型接入', value: 'litellm', note: 'OpenAI / Anthropic / Together 等' },
      { label: '端口', value: 'inspector 默认网页端口', note: 'CLI 修复任务本身无需常驻端口' },
    ],
    directoryTitle: '建议目录与归属', directoryTree: `/srv/agent-factory/\n├── .venv/                 # 宿主 Python 环境\n├── vendor/SWE-agent/      # v1.1.0 editable 源码\n├── factory.docker.yaml    # 断网与资源限制\n├── workspace/project/     # 唯一可写仓库副本\n└── runs/                  # task / traj / preds / logs\n\n模型 API key：宿主进程环境或密钥管理器\nGitHub Token：不进容器；私有仓库先由宿主预取`,
    boundaryLead: '非 editable 安装注意：', boundaryText: '若不是源码 editable 安装，必须额外设置 `SWE_AGENT_CONFIG_DIR`、`SWE_AGENT_TOOLS_DIR`、`SWE_AGENT_TRAJECTORY_DIR`；这也是本页坚持官方源码路线的原因。',
    installTitle: '01 · 安装与入口自检', envTitle: '02 · 密钥边界', commandSourceLabel: '命令依据', commandSources: ['源码安装', '单 Issue 示例', '批处理模式', '环境变量'], tabsAria: 'SWE-agent 部署配置路线',
    tabs: [
      { id: 'docker', label: 'A · 加固 Docker', title: '单仓库复现的推荐遗产路线', yaml: 'DOCKER_YAML', yamlText: '', runCode: 'DOCKER_RUN', note: '仓库走 local repo 上传而不是容器内 git clone，因此可以断网。该路线能隔离命令执行，但 SWE-agent 1.x 已进入维护期，适合复现历史 pipeline 与研究 ACI，不建议作为新平台底座。' },
      { id: 'modal', label: 'B · Modal 云端', title: '没有本机 Docker 时的替代执行面', yaml: '', yamlText: '# 该路线不需要额外 YAML；用 CLI 覆盖 deployment 与 repo。\n# 代码会上传到 Modal sandbox，先确认组织的数据边界。', runCode: 'MODAL_RUN', note: 'Modal 能解决“本机没有 Docker”的问题，却不能解决密钥与数据治理。模型 key 仍在宿主侧用于 API 调用；仓库、命令输出与轨迹会进入云端运行环境。' },
      { id: 'batch', label: 'C · 批量基准', title: 'SWE-bench / 历史 Issue 批处理', yaml: '', yamlText: '# 批处理通过 CLI 参数指定 instances。\n# 支持 swe_bench、file、huggingface、expert_file 等来源。', runCode: 'BATCH_RUN', note: 'run-batch 的价值是标准化批量实验与 preds.json 汇总；它不是验收器。先用 slice=:3 和 num_workers=3 烟测，再扩大规模。' },
      { id: 'inspect', label: 'D · 轨迹审查', title: '把研究输出变成可调试证据', yaml: '', yamlText: '# 不需要启动 Agent；只读取已有 .traj / preds.json / logs。', runCode: 'INSPECT_CODE', note: '轨迹查看器是 SWE-agent 仍有价值的重要原因。迁移到 mini 或其他框架前，可以用它比较同一任务的历史决策、成本与失败路径。' },
    ],
  },
  skill: { kicker: '07 · AGENT SKILL', title: '把这份遗产部署手册直接交给 AI Agent', intro: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。先预览核对结构，再复制或下载。' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: '自动化接入：SWE-agent 负责加工，外层系统负责闸门', intro: '完整框架依然没有内建现代工厂所需的审批与权限系统。正确接法是让外层调度器取 Issue、预取仓库、调用 CLI，再把轨迹与补丁交给 CI 和人工审阅。', caption: 'SWE-agent 批处理与外层交付各阶段的职责边界', headers: ['阶段', '输入与控制', '产出或职责', '明确边界'],
    rows: [
      { chip: 'instances', tone: 'yellow', input: 'swe_bench / file / huggingface / expert_file', role: '提供可追踪的批量实验实例。', boundary: '实例来源不证明补丁正确，也不授予仓库写权限。' },
      { chip: 'run-batch', tone: 'green', input: 'num_workers、独立工作区、退出状态', role: '并发执行实例并记录失败状态。', boundary: 'worker 完成不等于全部实例成功。' },
      { chip: 'merge-preds', tone: 'blue', input: '各实例预测与退出状态', role: '汇总或修复 preds.json。', boundary: '只合并预测文件，不执行最终评测或交付。' },
      { chip: 'human-review', tone: 'pink', input: 'inspect / inspector / quick-stats', role: '检查轨迹、成本、补丁和异常实例。', boundary: '人工审查不能由 Agent 自评替代。' },
      { chip: 'external-eval', tone: 'blue', input: 'SWE-bench harness 或项目 CI', role: '在 Agent 之外独立验证补丁。', boundary: 'Agent 不掌握最终评测、推送或合并权限。' },
    ], codeTitle: '03 · 接单到补丁的外层流水线示例', notesTitle: '接入前必须回答',
    notes: [
      { title: '谁能触发？', body: 'Issue 文本是不可信输入；公开仓库先由维护者批准，再进入 run。' }, { title: '仓库如何进入？', body: '用 local repo 从宿主上传，避免长期 GITHUB_TOKEN 随 clone URL 进入容器。' },
      { title: '什么叫成功？', body: '`exit_status == "submitted"` + 有 submission + 干净环境 CI + 人工审阅。' }, { title: '为什么不用它当新底座？', body: '官方主线维护模式；新自动化应优先 mini 或仍在演进的平台。' },
    ], warningLead: '私有仓库红线：', warningBody: '`GithubRepoConfig` 会把 `GITHUB_TOKEN` 拼进容器内执行的 git remote URL。处理私有或不可信仓库时，改由宿主预取代码并配置 `env.repo.type=local`。',
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: '验收清单：先证明边界，再证明能力', intro: '第一次复现不必追求 SWE-bench 分数。先证明版本、密钥、沙箱、轨迹和补丁都可检查，再谈批量。',
    items: [
      { title: '版本可重复', body: 'git tag 为 v1.1.0；`sweagent --help` 显示 1.1.0；保存依赖锁。' }, { title: '配置可解释', body: '启动日志包含默认 YAML 与自定义 YAML；模型名、解析器与工具束符合预期。' },
      { title: '执行面隔离', body: 'Docker 参数含断网、cap-drop、no-new-privileges 与资源上限；不使用 local 处理不可信仓库。' }, { title: '密钥不越界', body: 'YAML、Git、容器环境与轨迹扫描均无模型 key；GitHub Token 不进容器。' },
      { title: '限制确实生效', body: '演练 execution_timeout、install_timeout、total_execution_timeout 与成本上限。' }, { title: '轨迹可读取', body: '`.traj` 含 query、thought、action、observation、model_stats 与 exit_status。' },
      { title: '补丁可审查', body: 'submission 非空；应用到干净副本后 `git apply --check` 与测试通过。' }, { title: '评测与合并分离', body: 'run-batch 只产出 preds.json；SWE-bench / CI 与人工最终批准在 Agent 之外。' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: '常见故障：先分清安装、执行面、模型和解析器', intro: 'SWE-agent 的报错可能来自 Python 环境、Docker、Modal、模型 provider、function calling 或旧配置迁移。按下面顺序定位。', causeLabel: '原因', actionLabel: '处理',
    items: [
      { title: 'sweagent 命令找不到或版本不对', cause: '安装到了另一个 Python 环境，或 PyPI 上旧包 / 非预期包干扰。', action: '确认 `which python` 与 `which sweagent` 同属一个 venv；按官方路线从 v1.1.0 源码 `pip install --editable .`，再运行 `python -m sweagent --help`。' },
      { title: '导入时报 config / tools / trajectories 目录不存在', cause: '非 editable 安装不会把仓库顶层 config、tools、trajectories 放到包旁。', action: '优先改走源码 editable；若必须非 editable，设置 `SWE_AGENT_CONFIG_DIR`、`SWE_AGENT_TOOLS_DIR`、`SWE_AGENT_TRAJECTORY_DIR` 指向源码树。' },
      { title: '启动报 Docker socket 权限或 docker: not found', cause: '默认执行后端是 Docker；本机没有 Docker 或当前用户不能访问 daemon。', action: '先 `docker run hello-world` 验证；按官方排障页处理 socket / 用户组。没有 Docker 时改用 Modal 路线，而不是退到无沙箱 local。', source: { href: 'https://swe-agent.com/latest/installation/tips/', label: '官方 Docker 排障' } },
      { title: '模型 401 / 404 / 成本统计报错', cause: 'provider key、模型名、base URL 或 litellm 成本表任一环节出错。本地模型还可能缺 provider 前缀。', action: '只检查变量是否存在，不打印密钥；模型名使用 `provider/model` 或官方示例名。本地模型把成本限制设为 0，并设置 `max_input_tokens`。', source: { href: 'https://swe-agent.com/latest/installation/keys/', label: '模型与密钥配置' } },
      { title: '模型不返回合法动作', cause: '默认解析器是 function_calling；模型不支持工具调用或模板没写清工具格式。', action: '换支持 function calling 的模型，或把 `agent.tools.parse_function.type` 改为 `thought_action`，同时确保模板向模型展示工具文档。' },
      { title: '旧配置提示 review_on_submit 或工具束不存在', cause: 'v1.1.0 重命名了多个 windowed 工具束，并移除了 `review_on_submit`。', action: '按 v1.1.0 changelog 迁移到 `review_on_submit_m` 与新 bundle 名；不要把 v0.7 / v1.0 YAML 原样套用到本页。', source: { href: 'https://swe-agent.com/latest/installation/changelog/', label: 'v1.1.0 破坏性变更' } },
      { title: '批处理只有部分实例，preds.json 缺失或过期', cause: 'worker 异常、实例未完成或目录中有历史结果。run-batch 不会自动证明所有预测最新。', action: '看 `run_batch_exit_statuses.yaml` 与实例日志；用 `sweagent remove-unfinished` 清理后在实验目录运行 `sweagent merge-preds`。' },
    ],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: '最大风险不是技术旧，而是把维护期项目当新底座', intro: 'SWE-agent 的 ACI 思想仍然重要，但生命周期、密钥边界和执行隔离必须一起写进采用决策。',
    cards: [
      { level: '高', tone: 'high', title: '官方已进入维护模式', body: 'README 与文档明确推荐 mini-SWE-agent。新平台默认选 mini；SWE-agent 只用于历史兼容、研究对照或必须复现的 pipeline。' },
      { level: '高', tone: 'high', title: 'Token 可能进入容器命令', body: 'GitHubRepoConfig 会把 GITHUB_TOKEN 拼进容器内 git URL。私有仓库应由宿主预取并 local 上传，或使用短期、最小权限凭证。' },
      { level: '高', tone: 'high', title: 'Issue 与仓库提示注入', body: '模型会执行来自任务文本诱导的 shell。断网、资源限制、干净副本、CI 与人工合并缺一不可。' },
      { level: '中', tone: 'medium', title: '本地模型 / function calling 错配', body: '默认解析器假设模型支持工具调用；本地模型还要关闭成本追踪并处理 prompt cache 配置，否则会在第一步失败。' },
      { level: '中', tone: 'medium', title: '轨迹泄漏', body: '轨迹保存 query、源码、命令输出与路径；可能包含误打印的密钥。runs/ 需限权、保留期与脱敏。' },
      { level: '治理', tone: 'low', title: 'Benchmark 语境不可迁移', body: '官方 SWE-bench 成绩依赖特定模型、预算与数据集；不能直接承诺在你的私有仓库上达到同样修复率。' },
    ], upgradeTitle: '升级 / 迁移流程', backupTitle: '备份与成本控制',
    upgrade: ['固定 v1.1.0 与依赖锁；备份 YAML、runs/、镜像 digest 与实验说明。', '新需求先评估 mini-SWE-agent；确需留在 SWE-agent 时，只跟踪安全与必要修复。', '跨版本前核对 trajectory 字段、工具束名、解析器与 SWE-ReX 接口。', '用同一小任务比较新旧框架的成本、轨迹结构与补丁质量。', '保留旧源码环境与实验输出，直到新路线通过完整验收。'],
    backup: ['备份自定义 YAML、runs/、任务清单、依赖锁与镜像 digest；不备份明文密钥。', '单实例与总成本限制同时设置；provider 侧再设预算与告警。', '批处理先用 slice=:3、num_workers=3 烟测，再按日志扩大。', '轨迹与 preds 是研究资产，但也可能含敏感代码；按内部日志等级保护。'],
  },
  sources: {
    kicker: '12 · SOURCES', title: '主要来源与核验范围', introBefore: '官方事实核验日期：', introAfter: '。社区内容仅用于发现故障线索，不作为版本与维护状态依据。',
    items: [
      { title: '官方 GitHub 仓库', body: 'README、MIT、维护状态与源码入口' }, { title: 'Release v1.1.0', body: '2025-05-22；SWE-smith 与多语 / 多模态支持' },
      { title: '官方 Changelog', body: '维护模式、v1.1.0 破坏性变更与修复清单' }, { title: '官方架构文档', body: 'CLI、Agent、SWEEnv、SWE-ReX 与 ACI 关系' },
      { title: 'ACI 设计说明', body: '文件查看、搜索、编辑与 linter 的设计动机' }, { title: '源码安装文档', body: 'editable install、Docker 前置与 GUI 依赖' },
      { title: 'Hello world / 单 Issue', body: 'run 命令、模型 key 与执行阶段' }, { title: 'Batch mode', body: 'run-batch、实例来源、workers 与 preds.json' },
      { title: 'Trajectory 输出', body: 'query 字段、日志结构与实验目录布局' },
    ], boundaryLead: '没有写成结论的内容：', boundaryBody: '未调用模型、未运行 Docker、未执行真实 Issue 修复、未复测 SWE-bench 分数，也未验证所有 SWE-ReX 云后端。官方 “state of the art” 表述保留在其历史 benchmark 语境中；本页的采用建议是“遗产兼容与研究”，不是“新生产默认”。',
  },
  nav: { aria: '继续浏览', back: '返回可搜索方案库', compare: '对比阅读', next: 'mini-SWE-agent v2.4.6 · 官方后继者' },
}

type ContentShape<T> = { [K in keyof T]: T[K] extends readonly (infer U)[] ? ContentShape<U>[] : T[K] extends object ? ContentShape<T[K]> : unknown }

const en = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 03 · LEGACY LINE', breadcrumb: 'Library', titleA: 'A complete ACI research framework', titleB: '', highlight: 'that has passed the baton',
    lead: 'This is one of the most historically influential open-source Agent frameworks in the SWE-bench ecosystem: YAML-driven, with replaceable tool bundles and research-oriented trajectories. Its official status belongs up front: mini-SWE-agent has superseded it, and the mainline is in maintenance mode.',
    primary: 'Open the reproduction guide', repository: 'Official repository', noteKicker: 'BOTTOM LINE', verdictA: 'Useful for historical research and batches,', verdictB: 'not the default base for a new factory.',
    bullets: ['Complete ACI and tool-bundle design', 'Mature trajectories, batches, and inspection tools', 'Replaceable Docker / Modal / Fargate backends', 'Officially superseded by mini; maintenance mode'], copy: 'Copy page link', copied: 'Link copied',
  },
  facts: { labels: ['Version checked', 'Maintenance signal', 'Runtime baseline', 'License / positioning', 'Facts verified'], maintenanceValue: 'Official README', notes: ['Released 2025-05-22', 'Recommends mini-SWE-agent instead', 'Default Docker python:3.11', 'Research-oriented ACI framework', 'Time-sensitive facts use this date'] },
  evidence: { title: 'Why index a solution that has been superseded?', body: 'Many historical tutorials, SWE-bench pipelines, and ACI studies still point to SWE-agent 1.x. The correct treatment is not to market it as the preferred new deployment, but to mark its maintenance status, preserve a reproducible path, and explain when to move to mini-SWE-agent.', link: 'Official succession notice' },
  architecture: { kicker: '01 · SYSTEM MAP', title: 'CLI, Agent, and environment: three layers', intro: 'SWE-agent 1.x is more complete and heavier than mini: the sweagent CLI assembles runs, Agent makes model and tool decisions, and SWEEnv manages deployment and shell sessions through SWE-ReX.', sources: ['Official architecture', 'SWEEnv source', 'SWE-ReX execution backend'] },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: 'From YAML to submit: a research workflow', intro: 'Every step is configurable, recordable, and replayable. It trades some simplicity for fine-grained control over prompts, tools, history, and batch experiments.',
    explanations: [
      { title: 'ACI is SWE-agent’s core legacy', body: 'It does more than expose bash to a model: tool bundles provide windowed file viewing, search, editing, and submission, with syntax checks before edits. Many later coding Agents inherited this idea that models need a well-designed computer interface.' },
      { title: 'A complete framework also means more migration surface', body: 'Templates, tool bundles, parsers, HistoryProcessor, deployment backends, and batch instance sources are all configurable. That is a research advantage but a long-term maintenance burden for new teams, especially now that the official project recommends mini.' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: 'Who thinks, who executes, who preserves evidence', intro: 'Follow this line through the source: Agent.forward() creates actions, ToolHandler parses and executes them, SWEEnv owns environment and deployment, and run hooks plus runners aggregate output files.', caption: 'SWE-agent core component responsibilities', headers: ['Component', 'Input', 'Responsibility', 'What it does not do'],
    rows: [
      { chip: 'sweagent CLI', tone: 'blue', input: 'run / run-batch / inspect', role: 'Parses hierarchical parameters, merges YAML, creates runners; provides trajectory viewing, prediction merging, and statistics.', boundary: 'Does not include a complete Issue scheduling platform.' },
      { chip: 'Agent', tone: 'green', input: 'history + model + tools', role: 'forward() queries the model and handles retries, cost limits, submission, and exceptional exits.', boundary: 'Does not manage Docker or cloud resources directly.' },
      { chip: 'HistoryProcessor', tone: 'yellow', input: 'Complete message history', role: 'Compresses, caches, or rewrites history to control the context entering the model.', boundary: 'Does not guarantee that compression preserves every fact.' },
      { chip: 'ToolHandler / ACI', tone: 'pink', input: 'Tool bundles and action text', role: 'Installs registry / editor / review tools, parses function calling, and executes submit checks.', boundary: 'Does not inherently block dangerous shell; the deployment layer sets the boundary.' },
      { chip: 'SWEEnv + SWE-ReX', tone: 'blue', input: 'deployment + repo', role: 'Starts Docker / Modal / Fargate / local runtimes, copies the repository, and executes shell commands.', boundary: 'Does not evaluate patch semantics or replace CI acceptance.' },
      { chip: 'Inspector / preds', tone: 'green', input: '.traj / experiment directory', role: 'Views trajectories in terminal or web; quick-stats summarizes; preds.json goes to external evaluation.', boundary: 'Does not turn “prediction generated” into “repair succeeded.”' },
    ], sources: ['ACI design', 'Tool bundle source', 'Agent reference'],
  },
  data: {
    kicker: '04 · DATA & EVENTS', title: 'v1.1.0 makes a key trajectory-format change', intro: 'The old messages field is replaced by query: each step now stores the exact input seen by the current model. This is the easiest detail to misread in cross-version analysis.', codeTitle: 'Read trajectory acceptance fields', noteTitle: 'v1.1.0 migration essentials',
    notes: ['`messages` becomes `query`; do not reuse old parsing scripts unchanged.', 'Several windowed tool bundles are renamed; old `review_on_submit` is removed in favor of `review_on_submit_m`.', 'Adds SWE-bench multilingual / multimodal and SWE-smith support.'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: 'Its correct factory role: research line and historical compatibility layer', intro: 'SWE-agent is not a bad solution merely because it is older; it is a complete framework succeeded by a smaller successor. Use it where it fits, while pointing new platform defaults toward mini.', aria: 'Complete software factory pipeline', outer: 'Outer system', internal: 'SWE-agent',
    steps: [{ title: 'Intake', lines: ['Issue / dataset / manual task'] }, { title: 'Execution', lines: ['ACI tools', 'Edit', 'Self-test'] }, { title: 'Evidence', lines: ['traj + preds + logs'] }, { title: 'Quality & delivery', lines: ['SWE-bench / CI', 'Review', 'merge'] }],
    yesTitle: 'Especially suitable for', noTitle: 'Not a direct fit for',
    yes: ['Reproducing 2024–2025 SWE-agent / SWE-bench research and historical pipelines.', 'Studying Agent-Computer Interface, tool bundles, prompts, and history-compression strategies.', 'Teams needing the run-batch, inspector, merge-preds, and quick-stats experiment toolset.', 'Maintaining v1.x YAML configurations or SWE-smith / multilingual evaluation.', 'A comparison baseline against mini-SWE-agent: complete framework versus minimal kernel.'],
    no: ['The default production Agent base for a new team; the official project recommends mini-SWE-agent.', 'Scenarios needing active feature evolution, modern platform governance, and long-term upgrade commitments.', 'Unattended pipelines that connect GitHub Issues directly to automatic fixes and automatic merge.', 'Strong-compliance identity, approval, audit, tenant isolation, and credential rotation.', 'Teams unwilling to maintain Docker / cloud sandboxes, model secrets, and dependency locks.'], sources: ['v1.1.0 changes and maintenance status', 'Successor: mini-SWE-agent', 'ACI paper'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: 'Pin v1.1.0, then choose an execution backend', intro: 'The official installation preference is editable source installation; PyPI is not a reliable distribution path for this solution at present. Except for the installation and CLI smoke checks, these commands combine official-source guidance with this page’s deployment design.', verificationTitle: 'Checks actually executed for this analysis',
    verification: '`v1.1.0` was cloned and checked at commit `0f3acaf`, installed from source in an isolated temporary directory, and `sweagent --help`, `run --help`, `run-batch --help`, and trajectory-viewer help all ran successfully. **The current sandbox has no Docker or model keys, so no real Issue repair, model call, or SWE-bench run was executed.**',
    prereqTitle: 'Dependencies and versions', prereqs: [
      { label: 'Python', value: '≥ 3.11', note: 'Required by pyproject; example uses 3.11' }, { label: 'Core package', value: 'sweagent 1.1.0', note: 'Editable source installation' },
      { label: 'Execution backend', value: 'SWE-ReX ≥ 1.2.0', note: 'Version 1.4.0 resolved in this check' }, { label: 'Default image', value: 'python:3.11', note: 'Docker route; pin tag / digest' },
      { label: 'Optional backends', value: 'Modal / Fargate / local', note: 'Cloud or unisolated local' }, { label: 'Model integration', value: 'litellm', note: 'OpenAI / Anthropic / Together and others' },
      { label: 'Ports', value: 'Inspector web port', note: 'CLI repair tasks need no persistent port' },
    ],
    directoryTitle: 'Suggested directories and ownership', directoryTree: `/srv/agent-factory/\n├── .venv/                 # Host Python environment\n├── vendor/SWE-agent/      # v1.1.0 editable source\n├── factory.docker.yaml    # Network and resource limits\n├── workspace/project/     # Only writable repository copy\n└── runs/                  # task / traj / preds / logs\n\nModel API key: host process environment or secret manager\nGitHub Token: outside container; host prefetches private repos`,
    boundaryLead: 'Non-editable installation caveat:', boundaryText: ' without editable source installation, you must additionally set `SWE_AGENT_CONFIG_DIR`, `SWE_AGENT_TOOLS_DIR`, and `SWE_AGENT_TRAJECTORY_DIR`. That is why this page follows the official source route.',
    installTitle: '01 · Install and entry-point smoke check', envTitle: '02 · Secret boundary', commandSourceLabel: 'Command sources', commandSources: ['Source installation', 'Single-Issue example', 'Batch mode', 'Environment variables'], tabsAria: 'SWE-agent deployment configuration routes',
    tabs: [
      { id: 'docker', label: 'A · Hardened Docker', title: 'Recommended legacy route for one-repository reproduction', yaml: 'DOCKER_YAML', yamlText: '', runCode: 'DOCKER_RUN', note: 'The repository uses local-repo upload rather than git clone inside the container, so networking can be disabled. This isolates command execution, but SWE-agent 1.x is in maintenance mode: use it to reproduce historical pipelines and study ACI, not as the foundation of a new platform.' },
      { id: 'modal', label: 'B · Modal cloud', title: 'An alternative execution surface without local Docker', yaml: '', yamlText: '# This route needs no additional YAML; override deployment and repo through the CLI.\n# Code is uploaded to a Modal sandbox, so confirm your organization’s data boundary first.', runCode: 'MODAL_RUN', note: 'Modal removes the local Docker dependency, not secret and data governance. The model key remains on the host for API calls; repository content, command output, and trajectories enter a cloud runtime.' },
      { id: 'batch', label: 'C · Batch benchmarks', title: 'SWE-bench / historical Issue batch processing', yaml: '', yamlText: '# Batch instances are specified through CLI parameters.\n# Sources include swe_bench, file, huggingface, and expert_file.', runCode: 'BATCH_RUN', note: 'run-batch standardizes batch experiments and preds.json aggregation; it is not an acceptance gate. Smoke-test with slice=:3 and num_workers=3 before scaling.' },
      { id: 'inspect', label: 'D · Trajectory review', title: 'Turn research output into debuggable evidence', yaml: '', yamlText: '# No Agent launch is required; read only existing .traj / preds.json / logs.', runCode: 'INSPECT_CODE', note: 'The trajectory viewers remain an important reason to use SWE-agent. Before migrating to mini or another framework, compare historical decisions, costs, and failure paths on the same task.' },
    ],
  },
  skill: { kicker: '07 · AGENT SKILL', title: 'Hand this legacy deployment manual directly to an AI Agent', intro: 'A complete SKILL.md instruction set: frontmatter defines the use case, and the body includes a four-route selection table, exact commands, secret boundaries, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it.' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: 'SWE-agent executes; the outer system owns the gates', intro: 'Even the complete framework lacks the approval and permission system a modern factory needs. Let an outer scheduler fetch Issues, prefetch repositories, invoke the CLI, and hand trajectories plus patches to CI and human review.', caption: 'Stage boundaries for SWE-agent batch processing and outer delivery', headers: ['Stage', 'Inputs and controls', 'Output or responsibility', 'Explicit boundary'],
    rows: [
      { chip: 'instances', tone: 'yellow', input: 'swe_bench / file / huggingface / expert_file', role: 'Provides traceable instances for batch experiments.', boundary: 'The instance source proves neither patch correctness nor repository write permission.' },
      { chip: 'run-batch', tone: 'green', input: 'num_workers, isolated workspaces, and exit statuses', role: 'Runs instances concurrently and records failures.', boundary: 'Worker completion does not mean every instance succeeded.' },
      { chip: 'merge-preds', tone: 'blue', input: 'Per-instance predictions and exit statuses', role: 'Aggregates or repairs preds.json.', boundary: 'Only merges prediction files; it does not perform final evaluation or delivery.' },
      { chip: 'human-review', tone: 'pink', input: 'inspect / inspector / quick-stats', role: 'Reviews trajectories, cost, patches, and failed instances.', boundary: 'Agent self-evaluation cannot replace human review.' },
      { chip: 'external-eval', tone: 'blue', input: 'SWE-bench harness or project CI', role: 'Validates the patch independently outside the Agent.', boundary: 'The Agent does not own final evaluation, push, or merge permission.' },
    ], codeTitle: '03 · Example outer pipeline from Issue to patch', notesTitle: 'Answer these before integration',
    notes: [
      { title: 'Who can trigger?', body: 'Issue text is untrusted input; public repositories require maintainer approval before a run.' }, { title: 'How does the repository enter?', body: 'Upload a local repo from the host rather than placing a long-lived GITHUB_TOKEN in a clone URL inside the container.' },
      { title: 'What counts as success?', body: '`exit_status == "submitted"` + a submission + clean-environment CI + human review.' }, { title: 'Why not use it as a new base?', body: 'The official mainline is in maintenance mode; new automation should prefer mini or an actively evolving platform.' },
    ], warningLead: 'Private-repository red line:', warningBody: ' `GithubRepoConfig` can interpolate `GITHUB_TOKEN` into the git remote URL executed inside the container. For private or untrusted repositories, prefetch on the host and configure `env.repo.type=local`.',
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: 'Acceptance: prove the boundary before the capability', intro: 'A first reproduction does not need a SWE-bench score. Prove that version, secrets, sandbox, trajectories, and patches are inspectable before discussing scale.',
    items: [
      { title: 'Repeatable version', body: 'Git tag is v1.1.0; `sweagent --help` reports 1.1.0; save the dependency lock.' }, { title: 'Explainable configuration', body: 'Startup logs include default and custom YAML; model name, parser, and tool bundle match expectations.' },
      { title: 'Isolated execution surface', body: 'Docker arguments include no network, cap-drop, no-new-privileges, and resource limits; do not use local for untrusted repositories.' }, { title: 'Secrets stay in bounds', body: 'YAML, Git, container environment, and trajectory scans contain no model key; GitHub Token stays out of the container.' },
      { title: 'Limits actually work', body: 'Exercise execution_timeout, install_timeout, total_execution_timeout, and cost limits.' }, { title: 'Readable trajectory', body: '`.traj` contains query, thought, action, observation, model_stats, and exit_status.' },
      { title: 'Reviewable patch', body: 'Submission is non-empty; after applying it to a clean copy, `git apply --check` and tests pass.' }, { title: 'Evaluation and merge are separate', body: 'run-batch produces only preds.json; SWE-bench / CI and final human approval remain outside the Agent.' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: 'Common failures: separate installation, runtime, model, and parser', intro: 'SWE-agent errors can come from the Python environment, Docker, Modal, model provider, function calling, or legacy configuration migration. Debug in this order.', causeLabel: 'Cause', actionLabel: 'Action',
    items: [
      { title: 'sweagent is missing or reports the wrong version', cause: 'It was installed into another Python environment, or an old / unexpected PyPI package is interfering.', action: 'Confirm `which python` and `which sweagent` belong to the same venv; follow the official v1.1.0 source route with `pip install --editable .`, then run `python -m sweagent --help`.' },
      { title: 'Import reports missing config / tools / trajectories directories', cause: 'A non-editable installation does not place the repository’s top-level config, tools, and trajectories beside the package.', action: 'Prefer editable source installation. If non-editable installation is mandatory, point `SWE_AGENT_CONFIG_DIR`, `SWE_AGENT_TOOLS_DIR`, and `SWE_AGENT_TRAJECTORY_DIR` to the source tree.' },
      { title: 'Startup reports Docker socket permission or docker: not found', cause: 'Docker is the default execution backend; the host has no Docker or the current user cannot access its daemon.', action: 'Verify with `docker run hello-world` first and follow the official socket / user-group troubleshooting. Without Docker, use the Modal route rather than falling back to unisolated local execution.', source: { href: 'https://swe-agent.com/latest/installation/tips/', label: 'Official Docker troubleshooting' } },
      { title: 'Model 401 / 404 / cost-accounting errors', cause: 'The provider key, model name, base URL, or litellm cost table may be wrong. Local models can also lack a provider prefix.', action: 'Check variable presence without printing secrets; use `provider/model` or an official example model name. For local models, set the cost limit to 0 and configure `max_input_tokens`.', source: { href: 'https://swe-agent.com/latest/installation/keys/', label: 'Model and key configuration' } },
      { title: 'The model returns no valid action', cause: 'The default parser is function_calling; the model may not support tool calling, or the template may not describe the tool format clearly.', action: 'Use a model with function calling, or change `agent.tools.parse_function.type` to `thought_action` while ensuring the template shows the tool documentation.' },
      { title: 'Legacy configuration mentions missing review_on_submit or tool bundles', cause: 'v1.1.0 renamed several windowed tool bundles and removed `review_on_submit`.', action: 'Migrate to `review_on_submit_m` and the new bundle names using the v1.1.0 changelog; do not apply v0.7 / v1.0 YAML unchanged to this page.', source: { href: 'https://swe-agent.com/latest/installation/changelog/', label: 'v1.1.0 breaking changes' } },
      { title: 'A batch has partial instances and missing or stale preds.json', cause: 'A worker failed, an instance did not finish, or historical results remain in the directory. run-batch does not automatically prove every prediction is current.', action: 'Read `run_batch_exit_statuses.yaml` and instance logs; clean with `sweagent remove-unfinished`, then run `sweagent merge-preds` in the experiment directory.' },
    ],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: 'The biggest risk is treating a maintenance-mode project as a new foundation', intro: 'SWE-agent’s ACI ideas remain important, but lifecycle, secret boundaries, and execution isolation all belong in the adoption decision.',
    cards: [
      { level: 'High', tone: 'high', title: 'Official maintenance mode', body: 'The README and documentation explicitly recommend mini-SWE-agent. Default new platforms to mini; reserve SWE-agent for historical compatibility, research baselines, or pipelines that must be reproduced.' },
      { level: 'High', tone: 'high', title: 'Token can enter container commands', body: 'GitHubRepoConfig can place GITHUB_TOKEN in a container-side git URL. Prefetch private repositories on the host and upload them as local, or use short-lived least-privilege credentials.' },
      { level: 'High', tone: 'high', title: 'Issue and repository prompt injection', body: 'The model can execute shell induced by task text. Network restrictions, resource limits, clean copies, CI, and human merge are all necessary.' },
      { level: 'Medium', tone: 'medium', title: 'Local model / function-calling mismatch', body: 'The default parser assumes tool calling; local models may also need cost tracking disabled and prompt-cache configuration handled, or the first step fails.' },
      { level: 'Medium', tone: 'medium', title: 'Trajectory leakage', body: 'Trajectories store queries, source, command output, and paths, and may contain accidentally printed secrets. runs/ needs restricted access, retention, and redaction.' },
      { level: 'Governance', tone: 'low', title: 'Benchmark context does not transfer automatically', body: 'Official SWE-bench results depend on specific models, budgets, and datasets; they cannot promise the same repair rate on your private repository.' },
    ], upgradeTitle: 'Upgrade / migration procedure', backupTitle: 'Backup and cost control',
    upgrade: ['Pin v1.1.0 and the dependency lock; back up YAML, runs/, image digests, and experiment documentation.', 'Evaluate mini-SWE-agent first for new requirements; if staying on SWE-agent, track only security and necessary fixes.', 'Before crossing versions, check trajectory fields, tool-bundle names, parsers, and SWE-ReX interfaces.', 'Compare old and new frameworks on the same small task for cost, trajectory structure, and patch quality.', 'Retain the old source environment and experiment output until the new route passes full acceptance.'],
    backup: ['Back up custom YAML, runs/, task lists, dependency locks, and image digests; do not back up plaintext secrets.', 'Set per-instance and total cost limits together; add provider-side budgets and alerts.', 'Smoke-test batches with slice=:3 and num_workers=3 before scaling based on logs.', 'Trajectories and preds are research assets that may contain sensitive code; protect them like internal logs.'],
  },
  sources: {
    kicker: '12 · SOURCES', title: 'Primary sources and verification scope', introBefore: 'Official facts were checked on ', introAfter: '. Community content is used only to discover failure leads, not as the basis for version or maintenance status.',
    items: [
      { title: 'Official GitHub repository', body: 'README, MIT, maintenance status, and source entry points' }, { title: 'Release v1.1.0', body: '2025-05-22; SWE-smith and multilingual / multimodal support' },
      { title: 'Official changelog', body: 'Maintenance mode, v1.1.0 breaking changes, and fixes' }, { title: 'Official architecture documentation', body: 'Relationships among CLI, Agent, SWEEnv, SWE-ReX, and ACI' },
      { title: 'ACI design', body: 'Motivation for file viewing, search, editing, and linter design' }, { title: 'Source installation documentation', body: 'Editable install, Docker prerequisites, and GUI dependencies' },
      { title: 'Hello world / single Issue', body: 'run command, model keys, and execution phases' }, { title: 'Batch mode', body: 'run-batch, instance sources, workers, and preds.json' },
      { title: 'Trajectory output', body: 'query field, log structure, and experiment-directory layout' },
    ], boundaryLead: 'Not claimed as verified:', boundaryBody: ' no model was called, no Docker was run, no real Issue repair or SWE-bench score reproduction was performed, and not every SWE-ReX cloud backend was validated. Official “state of the art” wording remains in its historical benchmark context; this page’s recommendation is legacy compatibility and research, not new production default.',
  },
  nav: { aria: 'Continue browsing', back: 'Back to the searchable library', compare: 'Compare with', next: 'mini-SWE-agent v2.4.6 · Official successor' },
} satisfies ContentShape<typeof zh>

export const sweContent = { zh, en }
