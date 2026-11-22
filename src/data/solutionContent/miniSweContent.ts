const zh = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 02', breadcrumb: '方案库', titleA: '把软件工厂压缩成', titleB: '一个', highlight: '可审计的循环',
    lead: '它不是功能齐全的研发平台，而是一枚足够小、足够透明的“工作单元”：模型提出 bash 动作，执行环境返回观察，线性轨迹保存每一轮决策，直到提交或撞到限制。',
    primary: '进入复现手册', repository: '官方仓库', noteKicker: '一句话判断', verdictA: '适合当作工厂内核，', verdictB: '不适合直接当治理平台。',
    bullets: ['源码与控制流容易读懂', '本地、Docker、HPC 后端可换', '成本与轨迹是一等公民', 'Issue 调度、PR 审批需外层补齐'], copy: '复制本页链接', copied: '链接已复制',
  },
  facts: { labels: ['核验版本', '维护信号', '运行基线', '许可证 / 成熟度', '事实核验日'], maintenanceValue: 'main 最近提交', notes: ['2026-07-23 Release', '2026-09-03；未见弃用声明', 'bash；容器运行时可选', '包元数据仍标 Alpha', '时效信息以此为准'] },
  evidence: { title: '为什么不是旧版 SWE-agent？', body: '旧仓库 README 明确写道，当前开发精力主要放在 mini-SWE-agent，且一般建议后续使用 mini。本页因此研究 mini，而不是把已被官方替代的主干包装成新部署首选。', link: '旧版官方说明' },
  architecture: {
    kicker: '01 · SYSTEM MAP', title: '三类协议，一条消息流水线', intro: 'mini 的价值不在“功能少”，而在每一步都能映射到源码：谁生成动作、谁执行、谁保存状态，没有隐藏的工作流引擎。', sources: ['官方控制流', 'DefaultAgent 源码', '执行环境'],
  },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: '完整工作流：查询、执行、观察，再循环', intro: '一个动作对应一次独立执行。这样牺牲了 shell 会话的连续性，却换来更明确的超时边界、更容易替换的沙箱和可重放的消息序列。',
    explanations: [
      { title: '为什么没有常驻 shell 反而是特性？', body: '常驻会话需要猜测命令何时结束，还可能被一条异常命令破坏。mini 让每次执行独立结束；如果下一条命令依赖目录或环境变量，就在同一动作里写 `cd … && …` 或显式传入环境。' },
      { title: '提交不是测试通过', body: '环境只识别输出首行是否是指定的完成信号。它不会替你判断测试是否足够、补丁是否符合需求。外层流水线必须继续检查 diff、运行 CI，并保留人工合并闸门。' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: '组件不多，但职责必须分清', intro: 'v2 的关键变化是 Model 负责解析与观察格式，Agent 负责协调和限制，Environment 只负责执行与识别提交信号。',
    caption: 'mini-SWE-agent 核心组件分工', headers: ['组件', '输入', '职责', '不做什么'],
    rows: [
      { chip: 'Model', tone: 'blue', input: '线性 messages', role: '调用 LiteLLM / OpenRouter；v2 默认原生工具调用；也可文本解析；格式化 observation。', boundary: '不直接操作仓库，不决定沙箱权限。' },
      { chip: 'DefaultAgent', tone: 'green', input: 'task + Model + Environment', role: '渲染模板；循环 query / execute_actions；统计成本与调用数；处理控制流异常。', boundary: '不提供 Issue 队列、任务 DAG 或多 Agent 协商。' },
      { chip: 'InteractiveAgent', tone: 'yellow', input: '模型动作 + 用户输入', role: 'confirm / yolo / human 三模式；支持动作白名单与退出确认。', boundary: 'confirm 不是安全沙箱，人按 Enter 仍可能批准危险命令。' },
      { chip: 'Environment', tone: 'pink', input: '{ command }', role: 'local 用 subprocess；Docker 用 docker exec；返回 output / returncode / exception。', boundary: '不自动保证补丁正确，也不天然防提示注入。' },
      { chip: 'Run scripts', tone: 'blue', input: 'CLI 或 benchmark 实例', role: '装配配置；mini 保存最近运行；SWE-bench runner 可并发批处理。', boundary: 'v2 已移除专用 github_issue.py，不再内建完整 Issue 到 PR 的机器人。' },
    ], sources: ['v2 迁移指南', 'mini CLI', 'CLI 源码'],
  },
  data: {
    kicker: '04 · DATA & EVENTS', title: '轨迹既是调试器，也是自动化验收接口', intro: '线性历史让“发给模型的上下文”和“保存下来的执行轨迹”高度一致；自动化系统可以读取 exit_status，而不是只看进程是否退出。',
    codeTitle: '读取验收字段', noteTitle: '建议保留的四种结果', notes: ['`Submitted`：Agent 自称完成，继续跑验收。', '`LimitsExceeded`：预算或步数耗尽，不是成功。', '`TimeExceeded`：墙钟时间耗尽，需缩小任务。', '`RepeatedFormatError`：模型输出连续不符合工具契约。'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: '为什么它能成为“软件工厂”的工作单元？', intro: '因为它把需求文本转换成可审查的仓库变更，并让加工过程、执行结果和退出原因都可序列化。但完整工厂仍要由你补上接单、质检和交付。',
    aria: '完整软件工厂流水线', outer: '外层补齐', internal: 'mini 内建',
    steps: [{ title: '接单', lines: ['Issue / cron / 人工任务'] }, { title: '加工', lines: ['理解', '修改', '自测'] }, { title: '留证', lines: ['trajectory + submission'] }, { title: '质检与交付', lines: ['CI', '人审', 'PR / merge'] }],
    yesTitle: '特别适合', noTitle: '不适合直接承担',
    yes: ['研究 Agent scaffold、模型能力和 bash-only 基线。', '在一次性仓库副本上处理边界清晰的修复任务。', '需要批量 SWE-bench / ProgramBench 实验和可比较轨迹。', '团队希望自定义 Model / Environment，而不维护重型平台。', '作为外层调度器中的单任务执行器，由 CI 与人审兜底。'],
    no: ['跨仓库、多角色、长周期项目规划与任务 DAG。', '生产主机上的无隔离自动修复或直接自动合并。', '强合规所需的身份、细粒度授权、审批和租户治理。', '必须保证执行确定性与补丁正确性的无人值守场景。', '不愿维护模型 API、容器镜像、测试和密钥系统的团队。'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: '从固定版本开始，逐步扩大权限', intro: '以下命令以 Linux 和 /srv/agent-factory 为例。除特别标注外均属于“官方资料整理 + 本页部署设计”，不是已执行的生产验证。',
    verificationTitle: '本次实际执行验证', verification: { start: '已在隔离临时目录安装 ', between: '，成功导入并读取版本，成功运行 ', after: '。', bold: '未调用模型、未运行 Docker 路线、未执行真实仓库修复。' },
    prereqTitle: '依赖与版本清单',
    prereqs: [
      { label: 'Python', value: '≥ 3.10', note: '项目强制；示例选 3.12' }, { label: 'Shell', value: 'bash', note: 'local 或容器内需要' },
      { label: '核心包', value: 'mini-swe-agent 2.4.6', note: '本页固定版本' }, { label: '关键依赖', value: 'pydantic ≥ 2.0', note: 'litellm ≥ 1.75.5，排除 1.82.7 / 1.82.8' },
      { label: '可选运行时', value: 'Docker / Podman', note: 'SWE-bench 还可用 Singularity / Apptainer' }, { label: '外层自动化', value: 'Git / gh / jq', note: '仅示例流水线需要，非 mini 内建' },
      { label: '端口', value: '无', note: 'CLI 不启动 HTTP 服务，无需开放端口' },
    ],
    directoryTitle: '建议目录与归属', directoryTree: `/srv/agent-factory/\n├── .venv/                 # 宿主 Python 环境\n├── factory.local.yaml     # 无隔离，仅演示\n├── factory.docker.yaml    # 沙箱与资源限制\n├── workspace/project/     # 唯一可写仓库副本\n└── runs/                  # issue / patch / traj / logs\n\n模型 API key：宿主进程环境或密钥管理器\n容器内：默认不放模型 key，不挂 Docker socket`,
    boundaryLead: '工作区原则：', boundaryText: '先建目录再挂载，避免 Docker 自动创建 root 拥有目录。真实项目应使用已安装依赖且固定 digest 的镜像。',
    installTitle: '01 · 安装与入口自检', envTitle: '02 · 模型、密钥与总预算', commandSourceLabel: '命令依据', commandSources: ['Quick start', '全局配置', 'YAML 配置', '依赖声明'], tabsAria: '部署配置路线',
    tabs: [
      { id: 'local', label: 'A · 本地确认模式', title: '读懂 Agent 的最短路径', yamlCode: 'LOCAL_YAML', runCode: 'LOCAL_RUN', note: 'local 会直接继承宿主环境并执行 subprocess，没有文件系统隔离。请只在一次性项目副本中运行，保持 confirm，不要对生产目录使用。' },
      { id: 'docker', label: 'B · Docker 沙箱', title: '无人值守前的最小限权模板', yamlCode: 'DOCKER_YAML', runCode: 'DOCKER_RUN', note: '该模板主动断网，因此不能在线安装依赖或推送代码。真实项目要预构建依赖镜像并固定 digest；若确需联网，改为域名级出口代理，而不是简单放开全部网络。' },
    ],
  },
  skill: { kicker: '07 · AGENT SKILL', title: '把这份部署手册直接交给 AI Agent', intro: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置两条路线选择表、YAML 模板、八道验收闸门与故障速查。先预览核对结构，再复制或下载，交给任何编码 Agent 即可按图施工。' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: '自动化接入：让外层系统接单，让 CI 决定是否交付', intro: 'v2 已移除旧的专用 github_issue 脚本。不要把 v1 教程里的入口照搬到新项目；用外层调度器取 Issue，再调用 mini CLI。',
    caption: 'mini-SWE-agent 外层自动化职责与权限边界', headers: ['环节', '输入与权限', '职责', '明确边界'],
    rows: [
      { chip: 'outer-scheduler', tone: 'yellow', input: '已批准 Issue、run_id、工作区副本', role: '取任务、写配置、准备一次性运行环境。', boundary: '不暴露宿主其他目录或长期凭据。' },
      { chip: 'mini-cli', tone: 'green', input: '模型配置、限权工作区', role: '执行最小循环，保存轨迹并生成 submission。', boundary: '不持有 GitHub Token，不负责推送或合并。' },
      { chip: 'ci-review', tone: 'pink', input: '补丁、轨迹、仓库测试', role: '检查 diff，在干净环境跑 CI，并进行人工审阅。', boundary: '进程退出或 Submitted 不等于验收通过。' },
      { chip: 'outer-delivery', tone: 'blue', input: '已批准变更、独立 GitHub 凭据', role: '在检查全绿后推送分支并创建 PR。', boundary: '交付凭据与 mini 运行环境分离；不自动合并。' },
    ],
    codeTitle: '03 · 接单到补丁的外层流水线示例', notesTitle: '接入前必须回答',
    notes: [
      { title: '谁能触发？', body: 'Issue 文本是不可信输入，公开仓库触发器应先经过维护者批准。' }, { title: '谁能写？', body: '只挂工作区副本；GitHub Token 不进入容器，推送由外层独立步骤完成。' },
      { title: '什么叫成功？', body: 'Submitted + diff 检查 + 完整 CI + 人工审阅，缺一项都不合并。' }, { title: '如何重试？', body: '新 run_id、新容器、新工作区；不要在失败现场盲目重放危险命令。' },
    ],
    warningLead: '最常见的 v2 配置坑：', warningBody: '一旦使用 `-c`，内置默认配置不会自动作为基底加载。覆盖某个字段时也要写 `-c mini.yaml -c your.yaml`，否则可能连模板都缺失。',
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: '验收清单：把“运行结束”拆成八道闸门', intro: '第一次复现不必追求自动 PR。先证明权限边界、轨迹和补丁都可检查，再逐步自动化。',
    items: [
      { title: '版本可重复', body: '导入版本为 2.4.6；保存 `pip freeze`，不直接跟随 latest。' }, { title: '配置可解释', body: '启动日志同时包含 mini.yaml 与自定义 YAML；模型名带 provider。' },
      { title: '工作区可丢弃', body: '只挂副本，宿主其他目录与 Docker socket 不可写。' }, { title: '密钥不进补丁', body: '轨迹、patch、日志扫描无 API key；容器内默认无模型密钥。' },
      { title: '限制确实生效', body: '分别演练命令超时、单任务成本 / 步数限制和墙钟限制。' }, { title: '轨迹可读取', body: 'JSON 含版本、配置、消息、模型统计与明确的 exit_status。' },
      { title: '变更可审查', body: '`git diff --check` 通过，补丁仅含预期文件，无二进制与临时脚本。' }, { title: '测试与合并分离', body: '干净环境重跑 CI；Agent 不掌握合并权限，由人工最终批准。' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: '常见故障：先辨认是哪一层出了问题', intro: '模型、配置、宿主、容器和外层流水线的故障表现可能相似。按下面顺序定位，避免一味调大超时或预算。', causeLabel: '原因', actionLabel: '处理',
    items: [
      { title: '使用 -c 后提示模板或配置缺失', cause: 'v2 的多个配置会递归合并，但一旦指定 -c，默认 mini.yaml 不再自动加入。', action: '改为 `mini -c mini.yaml -c factory.local.yaml …`。若使用文本解析模型，还要保证 action_regex 与所有模板格式一致。' },
      { title: 'API key 已设置，仍出现 AuthenticationError', cause: '模型 provider 前缀、密钥变量名、环境加载顺序或 provider 侧鉴权都可能出错。官方 Issues 中有相关报告，其中 #558 在本次核验时仍为 open。', action: '在宿主检查变量是否存在而非打印密钥；确认模型名如 `anthropic/…`；临时用官方 `mini-extra config edit` 查看配置路径。不要把“容器里也有 key”当作修复手段。', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/issues/558', label: 'Issue #558' } },
      { title: '上一轮 cd 或 export 下一轮消失', cause: '默认每个动作都是新的 subshell，这是明确设计，不是状态丢失 bug。', action: '在同一个动作中写 `cd /workspace && pytest`，或配置 environment.cwd；需要持久环境时写入工作区文件并显式加载。' },
      { title: 'Docker 拉镜像超时或容器无法执行', cause: '网络、架构、Docker daemon 权限或镜像内缺少 bash。SWE-bench 官方 Linux 镜像还假定 x86 架构。', action: '先手动 `docker info`、`docker pull`、`docker exec … ls`；将 pull_timeout 从默认 120 秒调高。普通命令超时由 environment.timeout 控制，默认 30 秒。', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/issues/499', label: 'pull timeout Issue #499' } },
      { title: 'CI 中一直等待输入，或任务结束不退出', cause: 'mini 默认 confirm，提交时也默认询问。无人值守模式需要显式关闭两类确认。', action: '只在限权沙箱中使用 `--yolo --exit-immediately`；保留成本、步数和墙钟上限。不要为了无人值守而在宿主机开 yolo。' },
      { title: 'exit_status 是 LimitsExceeded / TimeExceeded', cause: '任务太大、模型循环、测试太慢或预算过小。进程正常结束不代表修复完成。', action: '先缩小任务和测试范围，查看轨迹定位循环；再有依据地调整上限。不要将 cost_limit=0 当作常规修复，因为 0 表示不限。' },
      { title: '旧教程里的 mini -v / github_issue.py 不存在', cause: 'v2 删除了 Visual UI、专用 github_issue 运行脚本、轮换 key 和旧模型类；解析相关字段也从 agent 移到了 model。', action: '按官方 v2 指南迁移；确需留在 v1 时固定 `mini-swe-agent~=1.0`，但不要把 v1 配置直接用于本页 v2 命令。', source: { href: 'https://mini-swe-agent.com/latest/advanced/v2_migration/', label: '官方迁移清单' } },
    ],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: '安全边界、升级与备份要一起设计', intro: '小内核减少了代码复杂度，却不会自动解决模型不可信输出、依赖供应链和仓库提示注入。',
    cards: [
      { level: '高', tone: 'high', title: 'local 无隔离', body: '子进程继承宿主环境并能执行任意 shell。只用一次性副本；生产任务采用更强沙箱，confirm 不能替代隔离。' },
      { level: '高', tone: 'high', title: 'Issue / 代码提示注入', body: '仓库文档和 Issue 都是不可信内容。分离触发与写权限，限制网络，禁止 Agent 自动合并。' },
      { level: '中', tone: 'medium', title: '容器默认并非最小权限', body: '官方默认 run_args 只有 --rm；本页的断网、cap-drop、资源限制是额外加固。高对抗任务仍需微 VM 等更强边界。' },
      { level: '中', tone: 'medium', title: '依赖供应链', body: '项目明确排除遭 compromised 的 litellm 1.82.7 / 1.82.8。升级时锁依赖、审 Release、保留 SBOM，不要只更新 Agent 包。', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.2.8', label: '官方安全 Release' } },
      { level: '中', tone: 'medium', title: '轨迹泄漏', body: '消息与输出可能含私有源码、路径和误打印的密钥。限制 runs/ 权限，设定保留期，公开分享前脱敏。' },
      { level: '治理', tone: 'low', title: 'Alpha 与维护节奏', body: '包元数据仍为 Development Status :: 3 - Alpha；最近提交与最新 Release 存在时间间隔。采用前固定版本并自行跑回归。' },
    ],
    upgradeTitle: '升级流程', backupTitle: '备份与成本控制',
    upgrade: ['备份自定义 YAML、runs/ 和依赖锁；阅读目标 Release 与迁移指南。', '在新虚拟环境安装目标版本，保留当前 2.4.6 环境可回滚。', '用无敏感数据的小型仓库跑同一任务，比较轨迹结构、成本和测试结果。', '核对 Model / Environment 协议、配置键、完成信号与退出状态。', '通过完整 CI 后分批切换；异常时重装固定旧版并恢复配置。'],
    backup: ['备份 runs/、自定义 YAML、依赖锁、测试脚本和镜像 digest；不要提交 .env。', '密钥文件若确需备份，单独加密并限制访问，不与普通轨迹放在同一归档。', '同时设置单任务与全局成本 / 调用限制；提供商侧再设预算和告警。', '升级前记录容器镜像 digest 与基准任务结果，避免“代码没变但环境漂了”。'],
  },
  sources: {
    kicker: '12 · SOURCES', title: '主要来源与核验范围', introBefore: '官方事实核验日期：', introAfter: '。社区与 Issue 仅用于发现故障，不替代当前官方文档。',
    items: [
      { title: '官方 GitHub 仓库', body: '定位、README、默认选择与源码入口' }, { title: 'Release v2.4.6', body: '2026-07-23；解析失败调用计入成本限制的修复' },
      { title: 'main 提交记录', body: '本次读取最近提交为 2026-09-03' }, { title: '官方控制流与 DefaultAgent', body: '循环、异常、提交信号与序列化' },
      { title: 'Environments', body: 'local / Docker / Singularity / Bubblewrap 等边界' }, { title: 'YAML 与 v2 迁移指南', body: '配置合并、模板、工具调用和破坏性变更' },
      { title: '全局配置与 mini CLI', body: '模型、密钥、总预算、输出路径和交互模式' }, { title: 'pyproject.toml', body: 'Python、依赖约束、MIT 与 Alpha 元数据' },
    ],
    boundaryLead: '没有写成结论的内容：', boundaryBody: '未实测真实模型修复质量，未验证所有模型供应商，未验证 SWE-bench 分数在你的仓库上的可迁移性，也未声称 Docker 示例能抵御恶意内核级攻击。官方 “>74%” 是其 benchmark 语境下的项目声明，不是本页独立复测结果。',
  },
  nav: { aria: '继续浏览', back: '返回可搜索方案库', compare: '上一个收录', next: 'OpenHands Agent Canvas' },
}

type ContentShape<T> = { [K in keyof T]: T[K] extends readonly (infer U)[] ? ContentShape<U>[] : T[K] extends object ? ContentShape<T[K]> : unknown }

const en = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 02', breadcrumb: 'Library', titleA: 'A software factory reduced to', titleB: 'one ', highlight: 'auditable loop',
    lead: 'It is not a full development platform, but a small, transparent work unit: the model proposes a bash action, the environment returns an observation, and a linear trajectory records every decision until submission or a hard limit.',
    primary: 'Open the reproduction guide', repository: 'Official repository', noteKicker: 'BOTTOM LINE', verdictA: 'A strong factory kernel,', verdictB: 'not a governance platform.',
    bullets: ['Readable source and control flow', 'Replaceable local, Docker, and HPC backends', 'Cost and trajectories are first-class', 'Issue dispatch and PR approval need an outer system'], copy: 'Copy page link', copied: 'Link copied',
  },
  facts: { labels: ['Version checked', 'Maintenance signal', 'Runtime baseline', 'License / maturity', 'Facts verified'], maintenanceValue: 'Latest main commit', notes: ['Released 2026-07-23', '2026-09-03; no deprecation notice found', 'bash; container runtime optional', 'Package metadata still says Alpha', 'Time-sensitive facts use this date'] },
  evidence: { title: 'Why not the legacy SWE-agent?', body: 'The legacy repository README says current development is focused mainly on mini-SWE-agent and generally recommends mini going forward. This analysis therefore covers mini rather than presenting the officially superseded mainline as the preferred new deployment.', link: 'Legacy official notice' },
  architecture: {
    kicker: '01 · SYSTEM MAP', title: 'Three protocols, one message pipeline', intro: 'Mini’s value is not merely having fewer features. Every step maps to readable source: who creates an action, who executes it, and who persists state, with no hidden workflow engine.', sources: ['Official control flow', 'DefaultAgent source', 'Execution environments'],
  },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: 'The full loop: query, execute, observe, repeat', intro: 'Each action runs independently. This sacrifices persistent shell state but creates clearer timeout boundaries, replaceable sandboxes, and a replayable message sequence.',
    explanations: [
      { title: 'Why no persistent shell can be a feature', body: 'A persistent session must guess when a command has finished and can be corrupted by one abnormal command. Mini ends each execution independently. If the next command needs a directory or environment variable, write `cd … && …` in the same action or pass the environment explicitly.' },
      { title: 'Submission is not passing tests', body: 'The environment only recognizes the designated completion signal on the first output line. It does not judge whether tests are sufficient or the patch meets the requirement. The outer pipeline must still inspect the diff, run CI, and retain human merge approval.' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: 'Few components, distinct responsibilities', intro: 'The key v2 change is that Model owns parsing and observation formatting, Agent coordinates and enforces limits, and Environment only executes and recognizes the submission signal.',
    caption: 'mini-SWE-agent core component responsibilities', headers: ['Component', 'Input', 'Responsibility', 'What it does not do'],
    rows: [
      { chip: 'Model', tone: 'blue', input: 'Linear messages', role: 'Calls LiteLLM / OpenRouter; uses native tool calling by default in v2; can parse text; formats observations.', boundary: 'Does not operate the repository directly or decide sandbox permissions.' },
      { chip: 'DefaultAgent', tone: 'green', input: 'task + Model + Environment', role: 'Renders templates; loops query / execute_actions; tracks cost and calls; handles control-flow exceptions.', boundary: 'Provides no Issue queue, task DAG, or multi-Agent negotiation.' },
      { chip: 'InteractiveAgent', tone: 'yellow', input: 'Model actions + user input', role: 'confirm / yolo / human modes; action allowlists and exit confirmation.', boundary: 'Confirm is not a security sandbox; pressing Enter can still approve a dangerous command.' },
      { chip: 'Environment', tone: 'pink', input: '{ command }', role: 'Uses subprocess locally or docker exec; returns output / returncode / exception.', boundary: 'Does not prove patch correctness or inherently prevent prompt injection.' },
      { chip: 'Run scripts', tone: 'blue', input: 'CLI or benchmark instance', role: 'Assemble configuration; mini saves the latest run; the SWE-bench runner supports concurrent batches.', boundary: 'v2 removed the dedicated github_issue.py; there is no complete built-in Issue-to-PR bot.' },
    ], sources: ['v2 migration guide', 'mini CLI', 'CLI source'],
  },
  data: {
    kicker: '04 · DATA & EVENTS', title: 'The trajectory is both debugger and automation acceptance interface', intro: 'Linear history keeps the context sent to the model closely aligned with the saved execution trace. Automation can read exit_status instead of treating process exit as success.',
    codeTitle: 'Read acceptance fields', noteTitle: 'Four outcomes worth preserving', notes: ['`Submitted`: the Agent claims completion; continue acceptance.', '`LimitsExceeded`: budget or steps exhausted; not success.', '`TimeExceeded`: wall-clock budget exhausted; narrow the task.', '`RepeatedFormatError`: model output repeatedly violates the tool contract.'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: 'Why it works as a software-factory work unit', intro: 'It turns requirement text into reviewable repository changes and serializes the process, execution result, and exit reason. A complete factory still needs you to supply intake, quality control, and delivery.',
    aria: 'Complete software factory pipeline', outer: 'Outer system', internal: 'Built into mini',
    steps: [{ title: 'Intake', lines: ['Issue / cron / manual task'] }, { title: 'Execution', lines: ['Understand', 'Edit', 'Self-test'] }, { title: 'Evidence', lines: ['trajectory + submission'] }, { title: 'Quality & delivery', lines: ['CI', 'Review', 'PR / merge'] }],
    yesTitle: 'Especially suitable for', noTitle: 'Not a direct fit for',
    yes: ['Research into Agent scaffolds, model capability, and bash-only baselines.', 'Well-bounded fixes on disposable repository copies.', 'Batch SWE-bench / ProgramBench experiments with comparable trajectories.', 'Teams that want custom Model / Environment protocols without maintaining a heavy platform.', 'A single-task executor inside an outer scheduler, backed by CI and human review.'],
    no: ['Cross-repository, multi-role, long-running project planning and task DAGs.', 'Unisolated automatic fixes on production hosts or direct automatic merge.', 'Identity, granular authorization, approval, and tenant governance required by strong compliance.', 'Unattended scenarios that require deterministic execution and guaranteed patch correctness.', 'Teams unwilling to operate model APIs, container images, tests, and secret systems.'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: 'Start with a pinned version and expand permissions gradually', intro: 'The commands use Linux and /srv/agent-factory. Except where explicitly noted, they combine official-source guidance with this page’s deployment design; they are not executed production validation.',
    verificationTitle: 'Checks actually executed for this analysis', verification: { start: '', between: ' was installed in an isolated temporary directory, imported successfully with its version read, and ', after: ' ran successfully. ', bold: 'No model was called, no Docker route was run, and no real repository repair was attempted.' },
    prereqTitle: 'Dependencies and versions',
    prereqs: [
      { label: 'Python', value: '≥ 3.10', note: 'Required by the project; example uses 3.12' }, { label: 'Shell', value: 'bash', note: 'Required locally or inside the container' },
      { label: 'Core package', value: 'mini-swe-agent 2.4.6', note: 'Pinned in this analysis' }, { label: 'Key dependencies', value: 'pydantic ≥ 2.0', note: 'litellm ≥ 1.75.5, excluding 1.82.7 / 1.82.8' },
      { label: 'Optional runtime', value: 'Docker / Podman', note: 'Singularity / Apptainer also available for SWE-bench' }, { label: 'Outer automation', value: 'Git / gh / jq', note: 'Only the example pipeline; not built into mini' },
      { label: 'Ports', value: 'None', note: 'The CLI starts no HTTP service and needs no open port' },
    ],
    directoryTitle: 'Suggested directories and ownership', directoryTree: `/srv/agent-factory/\n├── .venv/                 # Host Python environment\n├── factory.local.yaml     # Unisolated demo only\n├── factory.docker.yaml    # Sandbox and resource limits\n├── workspace/project/     # Only writable repository copy\n└── runs/                  # issue / patch / traj / logs\n\nModel API key: host process environment or secret manager\nInside container: no model key by default; no Docker socket`,
    boundaryLead: 'Workspace rule:', boundaryText: ' create directories before mounting so Docker does not create root-owned paths. Real projects should use an image with dependencies installed and an immutable digest.',
    installTitle: '01 · Install and entry-point smoke check', envTitle: '02 · Model, secrets, and global budget', commandSourceLabel: 'Command sources', commandSources: ['Quick start', 'Global configuration', 'YAML configuration', 'Dependency declaration'], tabsAria: 'Deployment configuration routes',
    tabs: [
      { id: 'local', label: 'A · Local confirmation', title: 'The shortest route to understanding the Agent', yamlCode: 'LOCAL_YAML', runCode: 'LOCAL_RUN', note: 'The local environment inherits the host and executes subprocesses without filesystem isolation. Use only a disposable project copy, keep confirm enabled, and never point this route at a production directory.' },
      { id: 'docker', label: 'B · Docker sandbox', title: 'A least-privilege template before unattended runs', yamlCode: 'DOCKER_YAML', runCode: 'DOCKER_RUN', note: 'This template deliberately disables networking, so it cannot install dependencies online or push code. Prebuild a dependency image and pin its digest for real projects. If network access is essential, use a domain-level egress proxy instead of opening all network access.' },
    ],
  },
  skill: { kicker: '07 · AGENT SKILL', title: 'Hand this deployment manual directly to an AI Agent', intro: 'A complete SKILL.md instruction set: frontmatter defines the use case, and the body includes a two-route selection table, YAML templates, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it for any coding Agent.' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: 'Let the outer system intake work and CI decide delivery', intro: 'v2 removed the old dedicated github_issue script. Do not copy a v1 entry point into a new project; let an outer scheduler fetch the Issue and invoke the mini CLI.',
    caption: 'Roles and permission boundaries for mini-SWE-agent outer automation', headers: ['Stage', 'Inputs and permissions', 'Responsibility', 'Explicit boundary'],
    rows: [
      { chip: 'outer-scheduler', tone: 'yellow', input: 'Approved Issue, run_id, workspace copy', role: 'Fetches work, writes configuration, and prepares a disposable runtime.', boundary: 'Does not expose unrelated host directories or long-lived credentials.' },
      { chip: 'mini-cli', tone: 'green', input: 'Model configuration and constrained workspace', role: 'Runs the minimal loop, saves the trajectory, and produces a submission.', boundary: 'Has no GitHub Token and does not push or merge.' },
      { chip: 'ci-review', tone: 'pink', input: 'Patch, trajectory, and repository tests', role: 'Checks the diff, runs clean-environment CI, and performs human review.', boundary: 'Process exit or Submitted alone is not acceptance.' },
      { chip: 'outer-delivery', tone: 'blue', input: 'Approved changes and separate GitHub credentials', role: 'Pushes the branch and opens a PR after all checks pass.', boundary: 'Delivery credentials stay outside the mini runtime; no automatic merge.' },
    ],
    codeTitle: '03 · Example outer pipeline from Issue to patch', notesTitle: 'Answer these before integration',
    notes: [
      { title: 'Who can trigger?', body: 'Issue text is untrusted input; public-repository triggers need maintainer approval first.' }, { title: 'What can it write?', body: 'Mount only the workspace copy; keep the GitHub Token out of the container and push in a separate outer step.' },
      { title: 'What counts as success?', body: 'Submitted + diff checks + full CI + human review. Missing any one means no merge.' }, { title: 'How does retry work?', body: 'Use a new run_id, container, and workspace; never blindly replay dangerous commands in a failed environment.' },
    ],
    warningLead: 'The most common v2 configuration trap:', warningBody: ' once `-c` is used, the built-in default is not automatically loaded as a base. When overriding a field, also write `-c mini.yaml -c your.yaml`, or even required templates may be missing.',
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: 'Acceptance: split “the run ended” into eight gates', intro: 'A first reproduction does not need automatic PRs. Prove that permission boundaries, trajectories, and patches are inspectable before increasing automation.',
    items: [
      { title: 'Repeatable version', body: 'The imported version is 2.4.6; save `pip freeze` and do not follow latest directly.' }, { title: 'Explainable configuration', body: 'Startup logs include both mini.yaml and the custom YAML; the model name has a provider prefix.' },
      { title: 'Disposable workspace', body: 'Only a copy is mounted; other host directories and the Docker socket are not writable.' }, { title: 'No secrets in the patch', body: 'Trajectory, patch, and log scans find no API key; the container has no model secret by default.' },
      { title: 'Limits actually work', body: 'Exercise command timeout, per-task cost / step limits, and the wall-clock limit separately.' }, { title: 'Readable trajectory', body: 'The JSON contains version, configuration, messages, model statistics, and an explicit exit_status.' },
      { title: 'Reviewable changes', body: '`git diff --check` passes; the patch contains only expected files, with no binaries or temporary scripts.' }, { title: 'Testing and merge are separate', body: 'Rerun CI in a clean environment; the Agent has no merge privilege and a human gives final approval.' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: 'Common failures: identify the layer first', intro: 'Model, configuration, host, container, and outer-pipeline failures can look similar. Debug in this order instead of simply increasing every timeout and budget.', causeLabel: 'Cause', actionLabel: 'Action',
    items: [
      { title: 'Templates or configuration are missing after using -c', cause: 'Multiple v2 configurations merge recursively, but specifying -c stops the default mini.yaml from being included automatically.', action: 'Use `mini -c mini.yaml -c factory.local.yaml …`. With a text-parsing model, also ensure action_regex matches every template format.' },
      { title: 'AuthenticationError despite a configured API key', cause: 'The provider prefix, secret variable name, environment loading order, or provider-side authentication may be wrong. Official Issues contain related reports; #558 was still open at verification time.', action: 'Check variable presence on the host without printing the secret; use a model name such as `anthropic/…`; inspect configuration paths with the official `mini-extra config edit`. Do not treat “put the key in the container too” as a fix.', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/issues/558', label: 'Issue #558' } },
      { title: 'A cd or export disappears in the next turn', cause: 'Every action uses a new subshell by default. This is deliberate design, not a state-loss bug.', action: 'Write `cd /workspace && pytest` in the same action or configure environment.cwd. For persistent environment state, write a workspace file and load it explicitly.' },
      { title: 'Docker image pulls time out or the container cannot execute', cause: 'Network, architecture, daemon permissions, or missing bash inside the image. Official SWE-bench Linux images also assume x86 architecture.', action: 'Run `docker info`, `docker pull`, and `docker exec … ls` manually first; raise pull_timeout from its 120-second default. Ordinary command timeout is controlled by environment.timeout, which defaults to 30 seconds.', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/issues/499', label: 'Pull timeout Issue #499' } },
      { title: 'CI waits for input or does not exit after completion', cause: 'Mini defaults to confirm and also asks for confirmation on submission. Unattended runs must explicitly disable both kinds of confirmation.', action: 'Use `--yolo --exit-immediately` only inside a constrained sandbox; retain cost, step, and wall-clock limits. Never enable yolo on the host merely to make CI unattended.' },
      { title: 'exit_status is LimitsExceeded / TimeExceeded', cause: 'The task is too large, the model is looping, tests are slow, or the budget is too small. Normal process exit does not mean the fix is complete.', action: 'Narrow the task and test scope first, then inspect the trajectory for loops before adjusting limits with evidence. Do not routinely set cost_limit=0, because zero means unlimited.' },
      { title: 'An old tutorial’s mini -v / github_issue.py does not exist', cause: 'v2 removed the Visual UI, the dedicated github_issue run script, key rotation, and legacy model classes; parsing fields also moved from agent to model.', action: 'Follow the official v2 migration guide. If you must stay on v1, pin `mini-swe-agent~=1.0`, but never apply v1 configuration directly to this page’s v2 commands.', source: { href: 'https://mini-swe-agent.com/latest/advanced/v2_migration/', label: 'Official migration list' } },
    ],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: 'Design security boundaries, upgrades, and backups together', intro: 'A small kernel reduces code complexity but does not automatically solve untrusted model output, dependency supply-chain risk, or repository prompt injection.',
    cards: [
      { level: 'High', tone: 'high', title: 'Local has no isolation', body: 'Subprocesses inherit the host environment and can execute arbitrary shell. Use disposable copies only; use a stronger sandbox for production. Confirm cannot replace isolation.' },
      { level: 'High', tone: 'high', title: 'Issue / code prompt injection', body: 'Repository documentation and Issues are untrusted content. Separate trigger and write privileges, constrain network access, and prohibit automatic Agent merge.' },
      { level: 'Medium', tone: 'medium', title: 'Default containers are not least privilege', body: 'The official default run_args contains only --rm; this page’s network, capability, and resource controls are additional hardening. Highly adversarial tasks still need stronger boundaries such as microVMs.' },
      { level: 'Medium', tone: 'medium', title: 'Dependency supply chain', body: 'The project explicitly excludes compromised litellm 1.82.7 / 1.82.8. Lock dependencies, review releases, and retain an SBOM during upgrades instead of updating only the Agent package.', source: { href: 'https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.2.8', label: 'Official security release' } },
      { level: 'Medium', tone: 'medium', title: 'Trajectory leakage', body: 'Messages and output may contain private source, paths, and accidentally printed secrets. Restrict runs/ permissions, set retention, and redact before public sharing.' },
      { level: 'Governance', tone: 'low', title: 'Alpha status and maintenance cadence', body: 'Package metadata still says Development Status :: 3 - Alpha, and recent commits and the latest release are separated in time. Pin a version and run your own regression before adoption.' },
    ],
    upgradeTitle: 'Upgrade procedure', backupTitle: 'Backup and cost control',
    upgrade: ['Back up custom YAML, runs/, and the dependency lock; read the target release and migration guide.', 'Install the target version in a new virtual environment while keeping 2.4.6 available for rollback.', 'Run the same task on a small non-sensitive repository; compare trajectory structure, cost, and tests.', 'Check Model / Environment protocols, configuration keys, completion signals, and exit statuses.', 'Roll out gradually after full CI; reinstall the pinned old version and restore configuration on failure.'],
    backup: ['Back up runs/, custom YAML, dependency locks, test scripts, and image digests; never commit .env.', 'If secret files truly need backup, encrypt them separately with restricted access rather than archiving them with ordinary traces.', 'Set per-task and global cost / call limits together; add provider-side budgets and alerts.', 'Record image digests and benchmark-task results before upgrades so an unchanged codebase does not hide environment drift.'],
  },
  sources: {
    kicker: '12 · SOURCES', title: 'Primary sources and verification scope', introBefore: 'Official facts were checked on ', introAfter: '. Community content and Issues are used to discover failures, not to replace current official documentation.',
    items: [
      { title: 'Official GitHub repository', body: 'Positioning, README, defaults, and source entry points' }, { title: 'Release v2.4.6', body: '2026-07-23; counts billed parse-failure calls toward the cost limit' },
      { title: 'main commit history', body: 'The latest commit read for this analysis was dated 2026-09-03' }, { title: 'Official control flow and DefaultAgent', body: 'Loop, exceptions, submission signal, and serialization' },
      { title: 'Environments', body: 'Boundaries for local / Docker / Singularity / Bubblewrap and others' }, { title: 'YAML and v2 migration guides', body: 'Configuration merging, templates, tool calling, and breaking changes' },
      { title: 'Global configuration and mini CLI', body: 'Model, secrets, global budget, output paths, and interaction modes' }, { title: 'pyproject.toml', body: 'Python, dependency constraints, MIT, and Alpha metadata' },
    ],
    boundaryLead: 'Not claimed as verified:', boundaryBody: ' real model repair quality was not measured, not all model providers were tested, SWE-bench transferability to your repository was not established, and the Docker example is not claimed to resist malicious kernel-level attacks. The official “>74%” is the project’s statement in its benchmark context, not an independent result from this page.',
  },
  nav: { aria: 'Continue browsing', back: 'Back to the searchable library', compare: 'Previous field note', next: 'OpenHands Agent Canvas' },
} satisfies ContentShape<typeof zh>

export const miniSweContent = { zh, en }
