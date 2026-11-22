const zh = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 01 · 重新核验', breadcrumb: '方案库', titleA: '把编码 Agent 放进', titleB: '一个', highlight: '自托管的控制中心',
    lead: '它不再只是“开源版 Devin”：v1 时代的单体应用已经拆成 Canvas 控制面、Agent Server、Automation Server 与可替换的执行后端。官方甚至给出了一条四段式软件工厂流水线：分诊、开发、评审、看门狗合并。',
    primary: '进入复现手册', repository: '官方仓库', noteKicker: '一句话判断', verdictA: '适合当自托管 Agent 控制面，', verdictB: '不适合当零运维玩具。',
    bullets: ['官方内建软件工厂自动化模板', '多后端、多 Agent（ACP）可切换', '每会话 Docker 加固容器', '需要持续运维与密钥治理'], copy: '复制本页链接', copied: '链接已复制',
  },
  facts: { labels: ['核验版本', '维护信号', '运行基线', '许可证', '事实核验日'], maintenanceValue: '近两日连续发版', licenseValue: 'MIT（主仓库）', notes: ['2026-11-20 Release', 'release-please 自动化', '或 Docker / 桌面安装包', 'enterprise/ 目录另有许可', '时效信息以此为准'] },
  evidence: { title: '为什么这页被重写？', bodyBefore: '', bodyAfter: ' 的收录因源码不可恢复只能保留元数据快照。本次重新核验发现官方已把产品重组为 Agent Canvas：OpenHands CLI 不再积极维护，旧 Local GUI 已弃用，GitHub 组织从 All-Hands-AI 更名为 OpenHands，昨日收录的 v1.42.0 也已被 v1.43.0 取代。本页全部结论以本次核验为准。', link: '官方产品线说明' },
  architecture: { kicker: '01 · SYSTEM MAP', title: '控制面与执行面，官方亲手拆开', intro: 'Canvas 只是浏览器里的控制台：呈现状态、转发请求。真正跑 Agent、工具与密钥的是 Agent Server；决定“何时跑”的是 Automation Server；决定“能碰什么”的是你选的执行环境。', sources: ['官方架构文档', 'README 与仓库边界', 'Agent Server / SDK'] },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: '一条事件流贯穿会话始终', intro: '动作与观察按时间顺序写入事件流，浏览器通过 WebSocket 实时订阅。这与 v0 时代论文里的 Agent / Event Stream / Runtime 三件套一脉相承，只是承载者换成了 Agent Server。',
    explanations: [
      { title: '多 Agent 不是多进程混战', body: 'Canvas 可以接入 Claude Code、Codex、Gemini CLI、Pi、OpenCode 等任何 ACP 兼容 Agent；SDK 侧也有子 Agent 委托工具。但凭证边界要记牢：ACP Agent 用的是后端所在机器上的 CLI 登录，浏览器那台机器的登录态不算数。' },
      { title: '会话结束 ≠ 验收通过', body: 'FinishAction 只表示 Agent 自称完成。在软件工厂流水线里，真正的验收由 reviewer Agent 的精确 head 测试、GitHub 状态检查和 watchdog 的确定性合并条件共同构成。' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: '五个仓库，各管一段', intro: '官方把多仓库边界写进了 README：改动应该进到拥有该行为的仓库。理解这条边界，排障时就知道日志该去哪儿看。', caption: 'OpenHands 各组件职责分工', headers: ['组件', '输入', '职责', '不做什么'],
    rows: [
      { chip: 'Agent Canvas', tone: 'blue', input: '浏览器请求', role: 'React 控制面：会话、文件、设置、后端切换、自动化管理。', boundary: '不执行 Agent，不持有对话状态，不是沙箱。' },
      { chip: 'Agent Server', tone: 'green', input: 'REST / WebSocket', role: '运行会话与工具；管理 profiles、secrets、MCP；流式回传事件。', boundary: '不做调度，不决定何时触发。' },
      { chip: 'Automation Server', tone: 'yellow', input: 'cron / webhook', role: '自动化定义、调度、事件源、运行历史与 dispatch。', boundary: '不执行 Agent 工具调用。' },
      { chip: 'Agent SDK', tone: 'pink', input: 'Python API', role: '组合式构建 Agent：工具、condenser、确认策略、子 Agent、观测。', boundary: '不提供浏览器 UI。' },
      { chip: 'Sandbox Server', tone: 'blue', input: 'V1 REST API', role: '社区维护的独立沙箱控制面，创建托管 Agent Server 的环境。', boundary: '非核心路径，生产支持弱于前四者。' },
    ], sources: ['组件与仓库地图', 'Software Agent SDK', 'Automation 仓库'],
  },
  data: {
    kicker: '04 · DATA & STATE', title: '状态在哪，备份就做到哪', intro: '对话、密钥与自动化定义都属于后端服务，不属于浏览器。升级镜像不会动数据，但删掉状态卷会——这两件事必须同时记住。', codeTitle: '升级、备份与会话密钥', noteTitle: '三个容易踩的状态坑',
    notes: ['Linux 上绑定 `~/.openhands` 会因 UID 10001 权限报 `unable to open database file`，官方建议改用命名卷。', '`AUTOMATION_KV_SECRET` 未设置时，启动器会把首个会话密钥钉到 `automation-kv-secret.txt`，轮换会话密钥不会让旧数据不可读。', 'Docker 入口在 Agent Server 约 30 秒不应答后以退出码 1 停止容器；自动恢复要靠 `--restart unless-stopped`。'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: '官方把“软件工厂”写成了四个自动化', intro: '这是本次重新核验最重要的发现：官方文档直接给出 Software Factory 配方——四个独立 automation 把 GitHub Issue 一路送到合并，且每段持有不同权限的 token。',
    yesTitle: '特别适合', noTitle: '不适合直接承担',
    yes: ['想要自托管、可审计的 Agent 控制面，而非纯 SaaS。', 'Issue 到 PR 到评审再到合并的无人值守流水线（官方模板现成）。', '一个入口管理多个后端：笔记本、VM、Cloud 来回切换。', '需要混用多家 Agent（OpenHands / Claude Code / Codex / Gemini）。', '通过 SDK 把 Agent 能力嵌入自己的 Python 系统。'],
    no: ['不想维护 Node 24、uv、Docker 与密钥治理的零运维诉求。', '强合规多租户、SSO、组织预算——那是 Enterprise 的边界。', '只需要单任务内核做 benchmark 的场景（mini-SWE-agent 更轻）。', '把 npm 无沙箱模式直接暴露给不可信仓库或网络。', '要求模型输出确定正确的验收场景——仍需 CI 与人审兜底。'], sources: ['官方软件工厂指南', 'ACP Agents', 'Agent Profiles'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: '先选信任边界，再选安装方式', intro: '官方安装页的第一句话不是命令，而是信任边界选择表。以下命令均来自官方 README、安装与自托管文档；实际执行范围见下方验证章。', verificationTitle: '本次实际执行验证',
    verification: '已在 npm registry 查证 `@openhands/agent-canvas` 最新版为 `1.43.0`（发布于 2026-11-20）。本评测环境 Node 为 v20（低于官方要求的 24）且没有 Docker，**因此未实际启动服务、未调用模型、未运行软件工厂流水线**；下文命令为官方资料整理。',
    prereqTitle: '依赖与版本清单', prereqs: [
      { label: 'Node.js', value: '≥ 24', note: 'npm / npx 路线硬性要求' }, { label: 'uv', value: '必需', note: '本地 Agent Server 经 uvx 运行' },
      { label: 'npm 包', value: '@openhands/agent-canvas 1.43.0', note: 'registry 已实测' }, { label: 'Docker 镜像', value: 'ghcr.io/openhands/agent-canvas:1.43.0', note: '固定 tag，勿用 latest' },
      { label: '组件 pin', value: 'agent-server 1.63.1', note: 'automation 1.34.1 · extensions 0.43.0' }, { label: '桌面安装包', value: 'dmg / exe / AppImage / deb', note: 'macOS 未签名，需清 quarantine' },
      { label: '端口', value: '8000 ingress', note: '内部 :3001 static · :18000 agent · :18001 automation' },
    ],
    directoryTitle: '目录、密钥与归属', directoryTree: `npm / npx 安装：\n~/.openhands/                # 设置、密钥、会话\n~/projects/                  # 你决定暴露给 Agent 的项目根\n\nDocker 单容器：\nopenhands-data 卷（容器内 /home/openhands/.openhands）\n  └── agent-canvas/api-key.txt   # 自动生成的会话密钥\n~/projects（容器内 /projects）      # 唯一可见工作区\n\nVM --public：\nLOCAL_BACKEND_API_KEY 经环境变量注入，不进页面、不进 ps`,
    secretLead: '密钥原则：', secretBeforeArrow: '会话密钥（LOCAL_BACKEND_API_KEY / api-key.txt）与模型密钥（Settings ', secretAfterArrow: ' LLM）是两套凭证，互不能替代；两者都不进 Git、不进镜像层。',
    tabsAria: '部署配置路线',
    tabs: [
      { id: 'npm', label: 'A · npm 本地全栈', title: '最快的体验路径，但没有隔离', envCode: 'NPM_INSTALL', runCode: '', runText: '# 启动后：Settings → LLM 配置模型；Open Workspace 指定项目目录\n# 停止：Ctrl+C；升级：npm install -g @openhands/agent-canvas@latest', note: '官方明确警告：此模式下 agent-server 直接运行在你的机器上，Agent 以你的账户权限读写文件系统、执行 shell。只用于可信个人机器上的体验与调试，不要在此模式跑不可信仓库的自动化任务。' },
      { id: 'docker', label: 'B · Docker 单容器', title: '本机隔离的推荐起点', envCode: 'DOCKER_RUN', runCode: 'VERIFY_ISOLATION', runText: '', note: '整个 Canvas 栈进入一个容器，Agent 只能看到挂载进 /projects 的目录。会话密钥默认不注入页面；上面的 AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 是官方为纯 localhost 场景开的例外，发布到局域网时必须去掉。' },
      { id: 'perconvo', label: 'C · 每会话一容器', title: '官方软件工厂的推荐形态', envCode: 'PER_CONVO_DOCKER', runCode: 'VERIFY_ISOLATION', runText: '', note: 'Canvas 与外层 Agent Server 留在宿主，每个会话再进入独立加固容器：非 root、丢弃全部 capabilities、独立密钥与持久化目录。官方软件工厂走查要求 1.24.0+ 正是为了这个能力。' },
      { id: 'vm', label: 'D · VM 常驻服务', title: '面向团队与公网的自托管', envCode: 'VM_SYSTEMD', runCode: '', runText: '# 防火墙：仅放行 SSH(你的 IP) 与 443\n# nginx 终结 TLS 后转发 127.0.0.1:8000（含 WebSocket 头）\nsystemctl enable --now agent-canvas', note: 'VM 路线的安全来自三层叠加：网络防火墙、--public 模式的 API key 闸、nginx TLS。官方明确提醒：Agent Server 直接运行在宿主，防火墙与 API key 就是阻止陌生人获得同等权限的全部屏障。' },
    ],
    warningLead: '桌面预览版注意：', warningBody: 'macOS 应用尚未用 Apple Developer ID 签名，首次打开报“已损坏”时执行 `xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"`；这是 Gatekeeper 隔离属性，官方在 issue #16774 跟踪签名进度。',
    commandSourceLabel: '命令依据', commandSources: ['官方安装文档', '自托管加固指南', '每会话 Docker'],
  },
  skill: { kicker: '07 · AGENT SKILL', title: '把这份部署手册直接交给 AI Agent', intro: 'SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。先预览核对结构，再复制或下载，交给任何编码 Agent 即可按图施工。' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: '软件工厂接入：三个 token，三个身份，四段流水线', intro: '以下配置链来自官方 Software Factory 指南。核心思想是最小权限：每个角色只拿自己那段流水线需要的 GitHub 权限，reviewer 甚至没有 push 权。', caption: '软件工厂三个 GitHub token 的权限设计', headers: ['Token / Profile', '仓库权限', '在流水线里做什么', '刻意不给什么'],
    rows: [
      { chip: 'factory-triage', tone: 'yellow', input: 'Contents 读；Issues 读写', role: '排序、查依赖、写验收标准，打 ready-for-dev。', boundary: '不给写代码权限。' },
      { chip: 'factory-developer', tone: 'green', input: 'Contents / Issues / PR 读写；Actions 与状态读', role: '按标签开工，factory/issue 前缀分支，提交 PR。', boundary: '不给合并决定权；Workflows 写默认不加。' },
      { chip: 'factory-reviewer', tone: 'pink', input: 'Contents / Actions 读；Issues / PR / 状态读写', role: '检出精确 PR head，跑仓库测试，发原生 review。', boundary: '不能 push 代码。' },
      { chip: 'watchdog', tone: 'blue', input: '复用 developer token', role: '确定性检查：验收状态与 Actions 全绿才 merge。', boundary: '不启动任何 Agent。' },
    ], codeTitle: '工厂搭建顺序（UI 操作转述）',
    setupCode: `1. Settings → LLM：配好模型（provider key / OpenHands key / ACP 登录 / 本地端点）\n2. Settings → Secrets：保存三个 token\n   FACTORY_GITHUB_TRIAGE_TOKEN / DEVELOPER_TOKEN / REVIEWER_TOKEN\n3. Settings → Agent：建三个 Agent Profile，各自只勾选自己的 secret，\n   关掉 MCP 服务器、模型切换与子 Agent\n4. Automate → Templates：依次装四个模板，Check frequency */5 * * * *\n   Triage → Issue to PR(触发标签 ready-for-dev，分支前缀 factory/issue)\n   → Code Review(标签 openhands-review) → Delivery Watchdog\n5. 全部创建后再统一启用；先用一个小 Issue 走通全流程`,
    notesTitle: '接入前必须回答', notes: [
      { title: '触发源可信吗？', body: '公开仓库的 Issue 文本是不可信输入，triage 是第一道人工可介入的闸。' }, { title: '凭证隔离了吗？', body: '三段流水线三种 token；任何一个 Agent 被提示注入都无法单独完成合并。' },
      { title: '合并条件谁定？', body: 'watchdog 是确定性检查器，不依赖模型判断；分支保护规则在 GitHub 侧再加一层。' }, { title: '版本够新吗？', body: '该走查要求 Agent Canvas ≥ 1.24.0 与每会话 Docker 容器。' },
    ],
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: '验收清单：先证明边界，再证明能力', intro: '第一次部署不必直接跑工厂。按八道闸门顺序验证，任何一道不过都先停下定位。',
    items: [
      { title: '版本可重复', body: '`agent-canvas --version` 输出 1.43.0；Docker 用固定 tag 而非 latest。' }, { title: '栈全部上线', body: 'UI 可开，默认后端显示已连接；Docker 容器不处于重启循环。' },
      { title: '会话密钥受控', body: 'localhost 以外部署必须走 --public 或手动输入 key；页面不内嵌密钥。' }, { title: '工作区即预期', body: 'Agent 只能看到 /projects 或显式打开的目录；PWD/HOME 检查通过。' },
      { title: '容器加固在位', body: 'docker inspect 确认 CapDrop=ALL、no-new-privileges、端口仅 127.0.0.1。' }, { title: '模型链路可用', body: '一次简单会话完整走完事件流；区分 401（key）与 LLM Provider 配置错误。' },
      { title: '自动化可暂停', body: '每个 automation 可单独停用；出问题时先停调度再排查。' }, { title: '合并不在 Agent 手里', body: 'watchdog 确定性校验 + GitHub 分支保护 + 人工最终审批，三者都在。' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: '常见故障：官方排障页的七个高频坑', intro: '以下全部整理自官方 Troubleshooting 与安装文档，按从安装到运行的顺序排列。', causeLabel: '原因', actionLabel: '处理',
    items: [
      { title: 'agent-canvas 命令找不到', cause: 'npm 全局 bin 目录不在 PATH。', action: '`npm prefix -g` 找到前缀，把 `$(npm prefix -g)/bin` 加进 PATH；或直接用 `npx @openhands/agent-canvas` 绕过全局安装。' },
      { title: '启动报缺少 uv / uvx', cause: '本地 Agent Server 栈通过 uvx 运行，uv 是硬性前置。', action: '按 uv 官方指南安装后重开终端，再 `uv --version` 验证。' },
      { title: 'Linux 上 unable to open database file', cause: '容器默认用户是 UID 10001，而绑定的 ~/.openhands 通常属于 UID 1000。', action: '改用命名卷 openhands-data；或用官方的一次性 root 容器命令把旧状态拷入卷并 chown 到 10001。不要把状态目录设成全用户可写。' },
      { title: 'Docker 镜像启动即崩溃循环', cause: '官方记录过发布镜像缺文件（ERR_MODULE_NOT_FOUND）的事故；latest 会第一时间踩中。', action: '固定到已知可用 tag（本页固定 1.43.0），或按 digest 固定；补丁发布后重新 pull。这也是本页不用 latest 的原因。' },
      { title: '浏览器要求输入 API key', cause: 'Docker 或 --public 模式下会话密钥不注入页面；要的是会话密钥，不是模型 key。', action: '`docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt` 取回自动生成的 key；或部署时显式设置 LOCAL_BACKEND_API_KEY。' },
      { title: 'LLM Provider NOT provided / 模型无响应', cause: '模型名缺少 provider 前缀、base URL 不对或 key 失效；本地模型（Ollama / LM Studio）还要确认端点可达。', action: 'Settings [[arrow]] LLM 中逐项核对 provider、model、base URL、key；可恢复错误会以警告横幅区分于内部错误。' },
      { title: 'ACP Agent 凭证不生效', cause: 'Claude Code / Codex 等的登录态在后端所在机器；后端在 Docker、VM 或云端时看不到你笔记本的 CLI 登录。', action: '在后端所在环境重新登录，或给该后端配置对应 API key；改完重启会话。' },
    ], sources: ['官方排障文档', '本地模型接入'],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: '控制面越方便，凭证治理越不能省', intro: '官方自己的警告写得很直白：任何能连上 Agent Server 的人，就拥有了 Agent 能碰的一切。风险设计围绕这句话展开。',
    cards: [
      { level: '高', tone: 'high', title: '无沙箱模式 = 你的全部权限', body: 'npm 直跑时 Agent 以你的账户读写文件系统、执行任意命令。官方原话：把 Agent 与 ACP 进程当作不可信。' },
      { level: '高', tone: 'high', title: '会话密钥注入', body: 'AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 会把会话密钥嵌进页面，任何能打开页面的人即获得后端控制权。只允许配合 127.0.0.1 绑定使用。' },
      { level: '高', tone: 'high', title: 'Issue 提示注入', body: '工厂流水线的触发文本来自 GitHub Issue。三段 token 隔离与确定性 watchdog 就是为这一刻准备的，不要图省事合并凭证。' },
      { level: '中', tone: 'medium', title: '内置编辑器共享同源', body: 'OpenVSCode 以路径前缀挂在同一 origin 下，该 origin 的 localStorage 存有全部已注册后端的会话密钥。官方在 issue #16492 跟踪。', source: { href: 'https://github.com/OpenHands/OpenHands/issues/16492', label: 'Issue #16492' } },
      { level: '中', tone: 'medium', title: '资源上限可被客户端顶开', body: '会话启动请求里的 container.memory / cpus 会覆盖而非受制于服务端环境变量。多人可达的服务器不要把这两个变量当作上限。' },
      { level: '治理', tone: 'low', title: '许可与版本漂移', body: '主仓库 MIT，但 enterprise/ 目录与商业组件另有许可；发布节奏以周计，生产环境固定 tag 并跟上安全更新。' },
    ], upgradeTitle: '升级流程', backupTitle: '备份与成本控制',
    upgrade: ['记录当前版本与镜像 digest；备份 openhands-data 卷或 ~/.openhands。', '读目标版本 Release notes；本项目近乎每周发版，跳跃式升级前先读跨版本变更。', '固定新 tag 在测试环境跑通现有自动化，确认行为无回归。', '切换生产；保留旧镜像与状态备份直到新版本稳定运行。'],
    backup: ['备份状态卷、项目目录与自动化定义；密钥值只存在密钥管理器，不进归档。', '用 Agent Profile 限制每个自动化可用的 secrets 与模型，预算告警在 provider 侧设置。', '会话成本与 token 统计在事件流与会话状态里，可按会话追踪。', '卸载只删包或镜像；数据要删需显式移除 ~/.openhands 或 docker volume rm openhands-data。'],
  },
  sources: {
    kicker: '12 · SOURCES', title: '主要来源与核验范围', introBefore: '官方事实核验日期：', introMiddle: '。本页取代 ', introAfter: ' 的元数据快照；旧收录的版本号与结论以本次核验为准。',
    items: [
      { title: '官方 GitHub 仓库（README）', body: '定位、Quickstart、仓库边界与架构图' }, { title: 'Release v1.43.0', body: '2026-11-20；自动化向导、性能修复与组件 pin' },
      { title: '官方文档：产品线介绍', body: 'Canvas / SDK / Cloud / Enterprise / Legacy 边界' }, { title: 'Agent Canvas 架构', body: '服务关系、执行隔离与状态归属' },
      { title: '官方软件工厂指南', body: '四段自动化、token 权限与 Agent Profile 设计' }, { title: '安装 / 升级 / 卸载', body: 'npm、Docker、桌面版与环境变量全表' },
      { title: '每会话 Docker 容器', body: '加固默认值、bind mount 与验证命令' }, { title: 'VM 自托管加固', body: '防火墙、--public、systemd 与 nginx 拓扑' },
      { title: '官方排障文档', body: 'PATH、uv、UID 10001、崩溃循环与密钥提示' },
    ], boundaryLead: '没有写成结论的内容：', boundaryBody: '未实际启动 Agent Canvas（本环境 Node v20 低于要求的 24 且无 Docker），未调用任何模型，未复现官方软件工厂走查；airbnb-clone 六 Issue 自动合并为官方案例记录而非本站实测。SWE-bench 等分数均为官方或第三方在其语境下的结果，本页不做迁移性承诺。',
  },
  nav: { aria: '继续浏览', back: '返回可搜索方案库', compare: '对比阅读', next: 'mini-SWE-agent v2.4.6 · 最小内核路线' },
}

type ContentShape<T> = { [K in keyof T]: T[K] extends readonly (infer U)[] ? ContentShape<U>[] : T[K] extends object ? ContentShape<T[K]> : unknown }

const en = {
  hero: {
    kicker: 'AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 01 · REVERIFIED', breadcrumb: 'Library', titleA: 'Put coding Agents inside', titleB: 'a ', highlight: 'self-hosted control center',
    lead: 'This is no longer merely an open-source Devin: the v1 monolith has split into the Canvas control plane, Agent Server, Automation Server, and replaceable execution backends. The official documentation even provides a four-stage software factory: triage, development, review, and watchdog merge.',
    primary: 'Open the reproduction guide', repository: 'Official repository', noteKicker: 'BOTTOM LINE', verdictA: 'A strong self-hosted Agent control plane,', verdictB: 'not a zero-maintenance toy.',
    bullets: ['Official built-in software-factory automation templates', 'Switchable backends and ACP-compatible Agents', 'Hardened Docker container per conversation', 'Requires ongoing operations and secret governance'], copy: 'Copy page link', copied: 'Link copied',
  },
  facts: { labels: ['Version checked', 'Maintenance signal', 'Runtime baseline', 'License', 'Facts verified'], maintenanceValue: 'Releases on consecutive days', licenseValue: 'MIT (main repository)', notes: ['Released 2026-11-20', 'release-please automation', 'Or Docker / desktop packages', 'enterprise/ has separate licensing', 'Time-sensitive facts use this date'] },
  evidence: { title: 'Why was this page rewritten?', bodyBefore: 'The ', bodyAfter: ' entry could preserve only a metadata snapshot because its source was unrecoverable. This re-verification found that the official product has been reorganized as Agent Canvas: OpenHands CLI is no longer actively maintained, the old Local GUI is deprecated, the GitHub organization moved from All-Hands-AI to OpenHands, and yesterday’s v1.42.0 has already been superseded by v1.43.0. This page uses the latest verification throughout.', link: 'Official product-line overview' },
  architecture: { kicker: '01 · SYSTEM MAP', title: 'The official architecture separates control from execution', intro: 'Canvas is only the browser console: it presents state and forwards requests. Agent Server runs Agents, tools, and secrets; Automation Server decides when work runs; the execution environment you choose determines what it can access.', sources: ['Official architecture guide', 'README and repository boundaries', 'Agent Server / SDK'] },
  workflow: {
    kicker: '02 · CLOSED LOOP', title: 'One event stream spans the entire conversation', intro: 'Actions and observations are appended chronologically, while the browser subscribes over WebSocket. This continues the v0 paper’s Agent / Event Stream / Runtime model, with Agent Server now carrying the implementation.',
    explanations: [
      { title: 'Multi-Agent does not mean uncontrolled processes', body: 'Canvas can connect to any ACP-compatible Agent, including Claude Code, Codex, Gemini CLI, Pi, and OpenCode; the SDK also provides sub-Agent delegation. Remember the credential boundary: ACP Agents use CLI sign-ins on the backend host, not the browser machine’s login state.' },
      { title: 'Conversation completion is not acceptance', body: 'FinishAction only means the Agent claims completion. In the software factory, real acceptance combines the reviewer Agent’s tests against the exact head, GitHub status checks, and the watchdog’s deterministic merge conditions.' },
    ],
  },
  components: {
    kicker: '03 · COMPONENT ROLES', title: 'Five repositories, each owning one layer', intro: 'The official README makes the multi-repository boundary explicit: changes belong in the repository that owns the behavior. That boundary also tells you where to inspect logs during troubleshooting.', caption: 'OpenHands component responsibilities', headers: ['Component', 'Input', 'Responsibility', 'What it does not do'],
    rows: [
      { chip: 'Agent Canvas', tone: 'blue', input: 'Browser requests', role: 'React control plane for conversations, files, settings, backend switching, and automation management.', boundary: 'Does not execute Agents, hold conversation state, or provide a sandbox.' },
      { chip: 'Agent Server', tone: 'green', input: 'REST / WebSocket', role: 'Runs conversations and tools; manages profiles, secrets, and MCP; streams events back to clients.', boundary: 'Does not schedule work or decide when to trigger it.' },
      { chip: 'Automation Server', tone: 'yellow', input: 'cron / webhook', role: 'Owns automation definitions, schedules, event sources, run history, and dispatch.', boundary: 'Does not execute Agent tool calls.' },
      { chip: 'Agent SDK', tone: 'pink', input: 'Python API', role: 'Composable Agent construction with tools, condensers, confirmation policies, sub-Agents, and observations.', boundary: 'Does not provide a browser UI.' },
      { chip: 'Sandbox Server', tone: 'blue', input: 'V1 REST API', role: 'Community-maintained standalone sandbox control plane for environments hosting Agent Server.', boundary: 'Not the core path; production support is weaker than the first four components.' },
    ], sources: ['Component and repository map', 'Software Agent SDK', 'Automation repository'],
  },
  data: {
    kicker: '04 · DATA & STATE', title: 'Backup wherever the state lives', intro: 'Conversations, secrets, and automation definitions belong to backend services, not the browser. Image upgrades do not move data, but deleting the state volume does; both facts matter.', codeTitle: 'Upgrades, backups, and session keys', noteTitle: 'Three common state traps',
    notes: ['Binding `~/.openhands` on Linux can fail with `unable to open database file` because of UID 10001 permissions; the official recommendation is a named volume.', 'Without `AUTOMATION_KV_SECRET`, the launcher pins the first session key to `automation-kv-secret.txt`; rotating the session key does not make old data unreadable.', 'The Docker entrypoint stops the container with exit code 1 after Agent Server fails to respond for about 30 seconds; automatic recovery needs `--restart unless-stopped`.'],
  },
  factory: {
    kicker: '05 · FACTORY FIT', title: 'The official software factory has four automations', intro: 'This is the most important finding of the re-verification: the official guide provides a Software Factory recipe in which four independent automations carry a GitHub Issue through merge, each with a differently scoped token.',
    yesTitle: 'Especially suitable for', noTitle: 'Not a direct fit for',
    yes: ['Teams wanting a self-hosted, auditable Agent control plane rather than pure SaaS.', 'Unattended Issue-to-PR-to-review-to-merge pipelines using official templates.', 'One entry point for multiple backends across laptops, VMs, and Cloud.', 'Mixed Agent providers such as OpenHands, Claude Code, Codex, and Gemini.', 'Embedding Agent capabilities into a Python system through the SDK.'],
    no: ['Zero-maintenance expectations without operating Node 24, uv, Docker, and secret governance.', 'Strong-compliance multi-tenancy, SSO, and organization budgets; those belong to Enterprise.', 'Benchmark-only single-task kernels; mini-SWE-agent is lighter.', 'Exposing unsandboxed npm execution to untrusted repositories or networks.', 'Acceptance scenarios requiring provably correct model output; CI and human review remain necessary.'], sources: ['Official software-factory guide', 'ACP Agents', 'Agent Profiles'],
  },
  deploy: {
    kicker: '06 · REPRODUCTION', title: 'Choose a trust boundary before an installation method', intro: 'The official installation guide starts with trust-boundary choices, not commands. The commands below come from the official README, installation guide, and self-hosting documentation; the verification scope is stated separately.', verificationTitle: 'Checks actually executed for this analysis',
    verification: 'The npm registry showed `@openhands/agent-canvas` latest as `1.43.0`, released on 2026-11-20. This environment has Node v20, below the official requirement of 24, and no Docker. **The service was not started, no model was called, and the software-factory pipeline was not run**; the commands below are official-source material.',
    prereqTitle: 'Dependencies and versions', prereqs: [
      { label: 'Node.js', value: '≥ 24', note: 'Hard requirement for npm / npx routes' }, { label: 'uv', value: 'Required', note: 'Local Agent Server runs through uvx' },
      { label: 'npm package', value: '@openhands/agent-canvas 1.43.0', note: 'Verified in the registry' }, { label: 'Docker image', value: 'ghcr.io/openhands/agent-canvas:1.43.0', note: 'Pin the tag; do not use latest' },
      { label: 'Component pins', value: 'agent-server 1.63.1', note: 'automation 1.34.1 · extensions 0.43.0' }, { label: 'Desktop packages', value: 'dmg / exe / AppImage / deb', note: 'macOS is unsigned; quarantine must be cleared' },
      { label: 'Ports', value: '8000 ingress', note: 'Internal :3001 static · :18000 agent · :18001 automation' },
    ],
    directoryTitle: 'Directories, secrets, and ownership', directoryTree: `npm / npx installation:\n~/.openhands/                # Settings, secrets, and conversations\n~/projects/                  # Project root you choose to expose to the Agent\n\nSingle Docker container:\nopenhands-data volume (/home/openhands/.openhands inside the container)\n  └── agent-canvas/api-key.txt   # Automatically generated session key\n~/projects (/projects in the container)  # Only visible workspace\n\nVM --public:\nLOCAL_BACKEND_API_KEY is injected through the environment, never into the page or ps`,
    secretLead: 'Secret principle:', secretBeforeArrow: ' session keys (LOCAL_BACKEND_API_KEY / api-key.txt) and model keys (Settings ', secretAfterArrow: ' LLM) are separate credentials and cannot replace each other. Neither belongs in Git or image layers.',
    tabsAria: 'Deployment configuration routes',
    tabs: [
      { id: 'npm', label: 'A · Local npm full stack', title: 'The fastest experience, without isolation', envCode: 'NPM_INSTALL', runCode: '', runText: '# After startup: configure the model in Settings → LLM and choose a project with Open Workspace\n# Stop: Ctrl+C; upgrade: npm install -g @openhands/agent-canvas@latest', note: 'The official warning is explicit: agent-server runs directly on your machine, so the Agent reads and writes the filesystem and executes shell commands with your account privileges. Use this only for trusted local experimentation, never for automation on untrusted repositories.' },
      { id: 'docker', label: 'B · Single Docker container', title: 'Recommended starting point for local isolation', envCode: 'DOCKER_RUN', runCode: 'VERIFY_ISOLATION', runText: '', note: 'The entire Canvas stack enters one container, and the Agent sees only directories mounted into /projects. Session keys are not injected into the page by default; AGENT_CANVAS_ALLOW_LAN_SESSION_KEY above is an official localhost-only exception and must be removed for LAN exposure.' },
      { id: 'perconvo', label: 'C · Container per conversation', title: 'Official software-factory deployment shape', envCode: 'PER_CONVO_DOCKER', runCode: 'VERIFY_ISOLATION', runText: '', note: 'Canvas and the outer Agent Server remain on the host, while each conversation enters an independent hardened container with non-root execution, all capabilities dropped, and separate secrets and persistence. The official factory walkthrough requires 1.24.0+ for this capability.' },
      { id: 'vm', label: 'D · Persistent VM service', title: 'Self-hosting for teams and public access', envCode: 'VM_SYSTEMD', runCode: '', runText: '# Firewall: allow only SSH (your IP) and 443\n# nginx terminates TLS and forwards to 127.0.0.1:8000, including WebSocket headers\nsystemctl enable --now agent-canvas', note: 'VM security combines three layers: network firewall, the --public API-key gate, and nginx TLS. The official warning is clear: Agent Server runs directly on the host, so the firewall and API key are the barriers preventing strangers from gaining equivalent privileges.' },
    ],
    warningLead: 'Desktop preview caution:', warningBody: ' the macOS app is not yet signed with an Apple Developer ID. If the first launch reports that it is damaged, run `xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"`. This is Gatekeeper behavior; signature progress is tracked in official issue #16774.',
    commandSourceLabel: 'Command sources', commandSources: ['Official installation guide', 'Self-hosting hardening guide', 'Per-conversation Docker'],
  },
  skill: { kicker: '07 · AGENT SKILL', title: 'Hand this deployment manual directly to an AI Agent', intro: 'A complete SKILL.md instruction set: frontmatter defines the use case, while the body includes four route choices, exact commands, secret boundaries, eight acceptance gates, and troubleshooting. Preview the structure, then copy or download it for any coding Agent.' },
  automation: {
    kicker: '08 · AUTOMATION GATE', title: 'Software-factory integration: three tokens, three identities, four stages', intro: 'This configuration chain comes from the official Software Factory guide. The principle is least privilege: each role receives only the GitHub permissions required for its stage, and the reviewer cannot even push.', caption: 'Least-privilege design for the software factory’s three GitHub tokens', headers: ['Token / Profile', 'Repository permissions', 'Role in the pipeline', 'Deliberately withheld'],
    rows: [
      { chip: 'factory-triage', tone: 'yellow', input: 'Contents: read; Issues: read/write', role: 'Prioritizes work, checks dependencies, writes acceptance criteria, and applies ready-for-dev.', boundary: 'No code-write permission.' },
      { chip: 'factory-developer', tone: 'green', input: 'Contents / Issues / PRs: read/write; Actions and statuses: read', role: 'Starts from labels, creates factory/issue-prefixed branches, and opens PRs.', boundary: 'No merge decision; workflow write is not granted by default.' },
      { chip: 'factory-reviewer', tone: 'pink', input: 'Contents / Actions: read; Issues / PRs / statuses: read/write', role: 'Checks out the exact PR head, runs repository tests, and submits a native review.', boundary: 'Cannot push code.' },
      { chip: 'watchdog', tone: 'blue', input: 'Reuses the developer token', role: 'Deterministic checks: merges only when acceptance status and Actions are green.', boundary: 'Does not start any Agent.' },
    ], codeTitle: 'Factory setup order (UI walkthrough)',
    setupCode: `1. Settings → LLM: configure the model (provider key / OpenHands key / ACP sign-in / local endpoint)\n2. Settings → Secrets: save three tokens\n   FACTORY_GITHUB_TRIAGE_TOKEN / DEVELOPER_TOKEN / REVIEWER_TOKEN\n3. Settings → Agent: create three Agent Profiles, each with only its own secret,\n   and disable MCP servers, model switching, and sub-Agents\n4. Automate → Templates: install four templates in order; Check frequency */5 * * * *\n   Triage → Issue to PR (trigger label ready-for-dev; branch prefix factory/issue)\n   → Code Review (label openhands-review) → Delivery Watchdog\n5. Enable only after all are created; walk through the full flow with one small Issue first`,
    notesTitle: 'Answer these before integration', notes: [
      { title: 'Is the trigger trustworthy?', body: 'Issue text in a public repository is untrusted input; triage is the first gate where a human can intervene.' }, { title: 'Are credentials isolated?', body: 'Three stages use three tokens; prompt injection against any one Agent cannot complete a merge by itself.' },
      { title: 'Who defines merge conditions?', body: 'The watchdog is a deterministic checker, not a model judgment; GitHub branch protection adds another layer.' }, { title: 'Is the version recent enough?', body: 'This walkthrough requires Agent Canvas ≥ 1.24.0 and per-conversation Docker containers.' },
    ],
  },
  acceptance: {
    kicker: '09 · ACCEPTANCE', title: 'Acceptance: prove the boundary before the capability', intro: 'A first deployment does not need to run the factory. Verify the eight gates in order and stop at the first failure.',
    items: [
      { title: 'Repeatable version', body: '`agent-canvas --version` reports 1.43.0; Docker uses a fixed tag rather than latest.' }, { title: 'Full stack is healthy', body: 'The UI opens, the default backend shows connected, and Docker containers are not crash-looping.' },
      { title: 'Session keys are controlled', body: 'Deployments beyond localhost use --public or manual key entry; pages never embed secrets.' }, { title: 'Workspace matches expectations', body: 'The Agent sees only /projects or an explicitly opened directory; PWD/HOME checks pass.' },
      { title: 'Container hardening is active', body: 'docker inspect confirms CapDrop=ALL, no-new-privileges, and loopback-only ports.' }, { title: 'Model path works', body: 'A simple conversation traverses the event stream; 401 key errors are distinguished from provider configuration errors.' },
      { title: 'Automation can be paused', body: 'Every automation can be disabled independently; stop scheduling before investigating failures.' }, { title: 'Merge is outside the Agent', body: 'Deterministic watchdog checks, GitHub branch protection, and final human approval are all present.' },
    ],
  },
  troubleshooting: {
    kicker: '10 · FAILURE MANUAL', title: 'Common failures: seven frequent issues from the official guide', intro: 'These items are organized from the official Troubleshooting and installation documentation in installation-to-runtime order.', causeLabel: 'Cause', actionLabel: 'Action',
    items: [
      { title: 'agent-canvas command is not found', cause: 'The npm global bin directory is not in PATH.', action: 'Find the prefix with `npm prefix -g`, add `$(npm prefix -g)/bin` to PATH, or bypass global installation with `npx @openhands/agent-canvas`.' },
      { title: 'Startup reports missing uv / uvx', cause: 'The local Agent Server stack runs through uvx, so uv is a hard prerequisite.', action: 'Install uv using its official guide, open a new terminal, and verify with `uv --version`.' },
      { title: 'unable to open database file on Linux', cause: 'The container defaults to UID 10001, while a bound ~/.openhands usually belongs to UID 1000.', action: 'Use the named openhands-data volume, or copy old state into a volume and chown it to 10001 with the official one-off root container command. Never make the state directory world-writable.' },
      { title: 'Docker image crash-loops on startup', cause: 'The official guide records a published image missing files with ERR_MODULE_NOT_FOUND; latest reaches such regressions first.', action: 'Pin a known-good tag (1.43.0 here) or an immutable digest, and pull again after a fix is released. This is why the page does not use latest.' },
      { title: 'The browser asks for an API key', cause: 'Docker or --public mode does not inject the session key into the page; it needs the session key, not a model key.', action: 'Retrieve the generated key with `docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`, or set LOCAL_BACKEND_API_KEY explicitly during deployment.' },
      { title: 'LLM Provider NOT provided / no model response', cause: 'The model name lacks a provider prefix, the base URL is wrong, or the key is invalid; local models such as Ollama / LM Studio also need reachable endpoints.', action: 'Check provider, model, base URL, and key in Settings [[arrow]] LLM. Recoverable errors are shown as warning banners rather than internal failures.' },
      { title: 'ACP Agent credentials do not work', cause: 'Claude Code / Codex and similar CLI sign-ins live on the backend host; Docker, VM, or cloud backends cannot see your laptop’s CLI login.', action: 'Sign in again on the backend host or configure an API key for that backend, then restart the conversation.' },
    ], sources: ['Official troubleshooting guide', 'Local model integration'],
  },
  risk: {
    kicker: '11 · RISK & LIFECYCLE', title: 'A convenient control plane makes credential governance more important', intro: 'The official warning is direct: anyone who can connect to Agent Server gains everything the Agent can access. The risk model starts from that boundary.',
    cards: [
      { level: 'High', tone: 'high', title: 'No sandbox means your full privileges', body: 'With direct npm execution, the Agent reads and writes the filesystem and runs arbitrary commands as your account. The official guidance treats Agent and ACP processes as untrusted.' },
      { level: 'High', tone: 'high', title: 'Session-key injection', body: 'AGENT_CANVAS_ALLOW_LAN_SESSION_KEY embeds the session key in the page, giving anyone who opens it backend control. Use it only with a 127.0.0.1 binding.' },
      { level: 'High', tone: 'high', title: 'Issue prompt injection', body: 'Factory triggers come from GitHub Issues. Three-token isolation and the deterministic watchdog exist for this threat; never consolidate credentials for convenience.' },
      { level: 'Medium', tone: 'medium', title: 'Built-in editor shares an origin', body: 'OpenVSCode is mounted under the same origin, whose localStorage contains session keys for registered backends. Official issue #16492 tracks this.', source: { href: 'https://github.com/OpenHands/OpenHands/issues/16492', label: 'Issue #16492' } },
      { level: 'Medium', tone: 'medium', title: 'Clients can override resource limits', body: 'container.memory / cpus in conversation-start requests override rather than defer to server environment variables. Do not treat them as limits on a multi-user server.' },
      { level: 'Governance', tone: 'low', title: 'License and version drift', body: 'The main repository is MIT, but enterprise/ and commercial components have separate terms. Releases are frequent; pin production tags and track security updates.' },
    ], upgradeTitle: 'Upgrade procedure', backupTitle: 'Backup and cost control',
    upgrade: ['Record the current version and image digest; back up the openhands-data volume or ~/.openhands.', 'Read target release notes; with near-weekly releases, review cross-version changes before jumps.', 'Pin the new tag in a test environment and run existing automations to check for regressions.', 'Move to production while retaining the old image and state backup until the new version is stable.'],
    backup: ['Back up state volumes, project directories, and automation definitions; secret values belong only in a secret manager, never in archives.', 'Use Agent Profiles to restrict secrets and models per automation; configure budget alerts with the provider.', 'Track conversation cost and tokens through the event stream and conversation state.', 'Uninstall removes only the package or image; data deletion requires explicit removal of ~/.openhands or docker volume rm openhands-data.'],
  },
  sources: {
    kicker: '12 · SOURCES', title: 'Primary sources and verification scope', introBefore: 'Official facts were checked on ', introMiddle: '. This page replaces the metadata snapshot from ', introAfter: '; version numbers and conclusions from the old entry are superseded by this verification.',
    items: [
      { title: 'Official GitHub repository (README)', body: 'Positioning, Quickstart, repository boundaries, and architecture map' }, { title: 'Release v1.43.0', body: '2026-11-20; automation wizard, performance fixes, and component pins' },
      { title: 'Official product-line overview', body: 'Canvas / SDK / Cloud / Enterprise / Legacy boundaries' }, { title: 'Agent Canvas architecture', body: 'Service relationships, execution isolation, and state ownership' },
      { title: 'Official software-factory guide', body: 'Four automations, token permissions, and Agent Profile design' }, { title: 'Installation / upgrades / uninstall', body: 'npm, Docker, desktop, and environment-variable tables' },
      { title: 'Per-conversation Docker', body: 'Hardened defaults, bind mounts, and verification commands' }, { title: 'VM self-hosting hardening', body: 'Firewall, --public, systemd, and nginx topology' },
      { title: 'Official troubleshooting guide', body: 'PATH, uv, UID 10001, crash loops, and key prompts' },
    ], boundaryLead: 'Not claimed as verified:', boundaryBody: ' Agent Canvas was not started because this environment has Node v20 and no Docker; no model was called, and the official factory walkthrough was not reproduced. The airbnb-clone six-Issue automatic merge is an official case record, not a measurement from this site. SWE-bench and similar scores remain official or third-party results in their own contexts; no transferability promise is made.',
  },
  nav: { aria: 'Continue browsing', back: 'Back to the searchable library', compare: 'Compare with', next: 'mini-SWE-agent v2.4.6 · Minimal-kernel route' },
} satisfies ContentShape<typeof zh>

export const openHandsContent = { zh, en }
