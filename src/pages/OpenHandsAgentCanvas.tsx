import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, History, PackageCheck, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { CanvasArchitectureDiagram, DeployRoutesDiagram, EventLoopDiagram, FactoryPipelineDiagram, FactoryRolesDiagram, StateOwnershipDiagram } from '../components/OpenHandsDiagrams'
import { openHandsDeploySkill } from '../data/deploySkills'

const VERIFY_DATE = '2026-11-21'
const PREVIOUS_DATE = '2026-11-20'

const NPM_INSTALL = `# 先核对两个硬性前置：Node.js ≥ 24 与 uv
node --version    # 必须 >= v24；本评测沙箱为 v20，无法实测启动
uv --version      # 本地 Agent Server 运行时依赖 uv/uvx

npm install -g @openhands/agent-canvas
agent-canvas --version   # 期望输出 1.43.0
agent-canvas --info      # 查看版本与栈配置
agent-canvas             # 启动全栈，浏览器打开 http://localhost:8000`

const DOCKER_RUN = `# 固定 tag，不跟 latest；官方故障页记录过 latest 镜像缺文件导致崩溃循环
mkdir -p ~/projects

docker run -it \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \
  -v openhands-data:/home/openhands/.openhands \
  -v "$HOME/projects:/projects" \
  ghcr.io/openhands/agent-canvas:1.43.0

# 浏览器打开 http://localhost:8000/canvas
# AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 只允许配合 127.0.0.1 绑定使用`

const PER_CONVO_DOCKER = `# 在宿主机跑 Canvas，但让每个会话进入独立加固容器
# 容器默认：非 root、cap-drop ALL、no-new-privileges、仅监听 127.0.0.1
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas

# 可选：允许每个会话自行选择 Local / Docker 运行时
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
# 资源默认值：内存 4g、CPU 2.0、PID 512、空闲 1200 秒后回收容器`

const VM_SYSTEMD = `# 在一台防火墙只放行 SSH/443 的 VM 上：
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"  # 立即保存到密钥管理器
npx @openhands/agent-canvas --public

# /etc/systemd/system/agent-canvas.service
# [Service]
# Environment=LOCAL_BACKEND_API_KEY=<your-key>
# ExecStart=npx @openhands/agent-canvas --public
# Restart=on-failure
# RestartSec=5
# 公网访问再叠加 nginx + Let's Encrypt；--public 模式不会把 key 注入页面`

const UPDATE_BACKUP = `# 升级（状态在包 / 镜像之外，升级不动数据）
docker pull ghcr.io/openhands/agent-canvas:1.43.0   # 固定 tag
docker stop <container> && docker run …            # 复用 openhands-data 卷

# 备份：状态卷 + 项目目录；先记录版本号再动
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'

# 找回 Docker 自动生成的会话密钥（UI 要求输入 key 时）
docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`

const VERIFY_ISOLATION = `# 在“每会话 Docker”模式下，让 Agent 执行：
id
printf 'PWD=%s\\nHOME=%s\\n' "$PWD" "$HOME"
# 期望：PWD=/workspace，HOME=/var/openhands/.openhands（不是宿主 home）

# 宿主侧复核容器加固：
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# 期望：CapDrop=[ALL]、no-new-privileges、端口只绑 127.0.0.1`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? '链接已复制' : '复制本页链接'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'npm', label: 'A · npm 本地全栈', title: '最快的体验路径，但没有隔离', env: NPM_INSTALL, run: '# 启动后：Settings → LLM 配置模型；Open Workspace 指定项目目录\n# 停止：Ctrl+C；升级：npm install -g @openhands/agent-canvas@latest', note: '官方明确警告：此模式下 agent-server 直接运行在你的机器上，Agent 以你的账户权限读写文件系统、执行 shell。只用于可信个人机器上的体验与调试，不要在此模式跑不可信仓库的自动化任务。' },
    { id: 'docker', label: 'B · Docker 单容器', title: '本机隔离的推荐起点', env: DOCKER_RUN, run: VERIFY_ISOLATION, note: '整个 Canvas 栈进入一个容器，Agent 只能看到挂载进 /projects 的目录。会话密钥默认不注入页面；上面的 AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 是官方为纯 localhost 场景开的例外，发布到局域网时必须去掉。' },
    { id: 'perconvo', label: 'C · 每会话一容器', title: '官方软件工厂的推荐形态', env: PER_CONVO_DOCKER, run: VERIFY_ISOLATION, note: 'Canvas 与外层 Agent Server 留在宿主，每个会话再进入独立加固容器：非 root、丢弃全部 capabilities、独立密钥与持久化目录。官方软件工厂走查要求 1.24.0+ 正是为了这个能力。' },
    { id: 'vm', label: 'D · VM 常驻服务', title: '面向团队与公网的自托管', env: VM_SYSTEMD, run: '# 防火墙：仅放行 SSH(你的 IP) 与 443\n# nginx 终结 TLS 后转发 127.0.0.1:8000（含 WebSocket 头）\nsystemctl enable --now agent-canvas', note: 'VM 路线的安全来自三层叠加：网络防火墙、--public 模式的 API key 闸、nginx TLS。官方明确提醒：Agent Server 直接运行在宿主，防火墙与 API key 就是阻止陌生人获得同等权限的全部屏障。' },
  ]
  return <RouteTabs tabs={tabs} initialId="npm" ariaLabel="部署配置路线">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id} 路线命令`} code={current.env} />
      <CodeBlock title="验证与后续操作" code={current.run} />
    </>}
  </RouteTabs>
}

export default function OpenHandsAgentCanvas() {
  return <PageShell>
    <article className="detail-page openhands-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/"><ArrowLeft size={16} /> 方案库</Link><ChevronRight size={14} /><span>OpenHands Agent Canvas</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 01 · 重新核验</div>
            <h1><span>OpenHands</span><br />把编码 Agent 放进<br />一个<span className="highlight-pink">自托管的控制中心</span></h1>
            <p className="hero-lead">它不再只是“开源版 Devin”：v1 时代的单体应用已经拆成 Canvas 控制面、Agent Server、Automation Server 与可替换的执行后端。官方甚至给出了一条四段式软件工厂流水线：分诊、开发、评审、看门狗合并。</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/solutions/openhands-agent-canvas', hash: '#deploy' }}>进入复现手册 <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/OpenHands/OpenHands" target="_blank" rel="noreferrer">官方仓库 <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">一句话判断</p><h2>适合当自托管 Agent 控制面，<br />不适合当零运维玩具。</h2><ul><li><Check size={17} />官方内建软件工厂自动化模板</li><li><Check size={17} />多后端、多 Agent（ACP）可切换</li><li><Check size={17} />每会话 Docker 加固容器</li><li><XCircle size={17} />需要持续运维与密钥治理</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>核验版本</dt><dd>v1.43.0 <small>2026-11-20 Release</small></dd></div>
          <div><dt>维护信号</dt><dd>近两日连续发版 <small>release-please 自动化</small></dd></div>
          <div><dt>运行基线</dt><dd>Node ≥ 24 + uv <small>或 Docker / 桌面安装包</small></dd></div>
          <div><dt>许可证</dt><dd>MIT（主仓库） <small>enterprise/ 目录另有许可</small></dd></div>
          <div><dt>事实核验日</dt><dd>{VERIFY_DATE} <small>时效信息以此为准</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><History size={21} /><div><strong>为什么这页被重写？</strong><p>{PREVIOUS_DATE} 的收录因源码不可恢复只能保留元数据快照。本次重新核验发现官方已把产品重组为 Agent Canvas：OpenHands CLI 不再积极维护，旧 Local GUI 已弃用，GitHub 组织从 All-Hands-AI 更名为 OpenHands，昨日收录的 v1.42.0 也已被 v1.43.0 取代。本页全部结论以本次核验为准。</p></div><SourceLink href="https://docs.openhands.dev/overview/introduction">官方产品线说明</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="控制面与执行面，官方亲手拆开" intro="Canvas 只是浏览器里的控制台：呈现状态、转发请求。真正跑 Agent、工具与密钥的是 Agent Server；决定“何时跑”的是 Automation Server；决定“能碰什么”的是你选的执行环境。" />
        <CanvasArchitectureDiagram />
        <SourceStrip><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/architecture">官方架构文档</SourceLink><SourceLink href="https://github.com/OpenHands/OpenHands">README 与仓库边界</SourceLink><SourceLink href="https://github.com/OpenHands/software-agent-sdk">Agent Server / SDK</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="一条事件流贯穿会话始终" intro="动作与观察按时间顺序写入事件流，浏览器通过 WebSocket 实时订阅。这与 v0 时代论文里的 Agent / Event Stream / Runtime 三件套一脉相承，只是承载者换成了 Agent Server。" />
          <EventLoopDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>多 Agent 不是多进程混战</h3><p>Canvas 可以接入 Claude Code、Codex、Gemini CLI、Pi、OpenCode 等任何 ACP 兼容 Agent；SDK 侧也有子 Agent 委托工具。但凭证边界要记牢：ACP Agent 用的是后端所在机器上的 CLI 登录，浏览器那台机器的登录态不算数。</p></div>
            <div className="text-block"><h3>会话结束 ≠ 验收通过</h3><p>FinishAction 只表示 Agent 自称完成。在软件工厂流水线里，真正的验收由 reviewer Agent 的精确 head 测试、GitHub 状态检查和 watchdog 的确定性合并条件共同构成。</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="五个仓库，各管一段" intro="官方把多仓库边界写进了 README：改动应该进到拥有该行为的仓库。理解这条边界，排障时就知道日志该去哪儿看。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">OpenHands 各组件职责分工</caption><thead><tr><th>组件</th><th>输入</th><th>职责</th><th>不做什么</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">Agent Canvas</span></th><td>浏览器请求</td><td>React 控制面：会话、文件、设置、后端切换、自动化管理。</td><td>不执行 Agent，不持有对话状态，不是沙箱。</td></tr>
            <tr><th><span className="component-chip green">Agent Server</span></th><td>REST / WebSocket</td><td>运行会话与工具；管理 profiles、secrets、MCP；流式回传事件。</td><td>不做调度，不决定何时触发。</td></tr>
            <tr><th><span className="component-chip yellow">Automation Server</span></th><td>cron / webhook</td><td>自动化定义、调度、事件源、运行历史与 dispatch。</td><td>不执行 Agent 工具调用。</td></tr>
            <tr><th><span className="component-chip pink">Agent SDK</span></th><td>Python API</td><td>组合式构建 Agent：工具、condenser、确认策略、子 Agent、观测。</td><td>不提供浏览器 UI。</td></tr>
            <tr><th><span className="component-chip blue">Sandbox Server</span></th><td>V1 REST API</td><td>社区维护的独立沙箱控制面，创建托管 Agent Server 的环境。</td><td>非核心路径，生产支持弱于前四者。</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://docs.openhands.dev/overview/introduction">组件与仓库地图</SourceLink><SourceLink href="https://docs.openhands.dev/sdk/index">Software Agent SDK</SourceLink><SourceLink href="https://github.com/OpenHands/automation">Automation 仓库</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & STATE" title="状态在哪，备份就做到哪" intro="对话、密钥与自动化定义都属于后端服务，不属于浏览器。升级镜像不会动数据，但删掉状态卷会——这两件事必须同时记住。" />
          <StateOwnershipDiagram />
          <div className="code-with-note"><CodeBlock title="升级、备份与会话密钥" code={UPDATE_BACKUP} /><div className="sticky-explanation"><strong>三个容易踩的状态坑</strong><ul><li>Linux 上绑定 <code>~/.openhands</code> 会因 UID 10001 权限报 <code>unable to open database file</code>，官方建议改用命名卷。</li><li><code>AUTOMATION_KV_SECRET</code> 未设置时，启动器会把首个会话密钥钉到 <code>automation-kv-secret.txt</code>，轮换会话密钥不会让旧数据不可读。</li><li>Docker 入口在 Agent Server 约 30 秒不应答后以退出码 1 停止容器；自动恢复要靠 <code>--restart unless-stopped</code>。</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="官方把“软件工厂”写成了四个自动化" intro="这是本次重新核验最重要的发现：官方文档直接给出 Software Factory 配方——四个独立 automation 把 GitHub Issue 一路送到合并，且每段持有不同权限的 token。" />
        <FactoryPipelineDiagram />
        <FactoryRolesDiagram />
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />特别适合</h3><ul><li>想要自托管、可审计的 Agent 控制面，而非纯 SaaS。</li><li>Issue 到 PR 到评审再到合并的无人值守流水线（官方模板现成）。</li><li>一个入口管理多个后端：笔记本、VM、Cloud 来回切换。</li><li>需要混用多家 Agent（OpenHands / Claude Code / Codex / Gemini）。</li><li>通过 SDK 把 Agent 能力嵌入自己的 Python 系统。</li></ul></div>
          <div className="fit-column no"><h3><XCircle />不适合直接承担</h3><ul><li>不想维护 Node 24、uv、Docker 与密钥治理的零运维诉求。</li><li>强合规多租户、SSO、组织预算——那是 Enterprise 的边界。</li><li>只需要单任务内核做 benchmark 的场景（mini-SWE-agent 更轻）。</li><li>把 npm 无沙箱模式直接暴露给不可信仓库或网络。</li><li>要求模型输出确定正确的验收场景——仍需 CI 与人审兜底。</li></ul></div>
        </div>
        <SourceStrip><SourceLink href="https://docs.openhands.dev/openhands/usage/use-cases/software-factory">官方软件工厂指南</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/acp-agents">ACP Agents</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/agent-profiles">Agent Profiles</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="先选信任边界，再选安装方式" intro="官方安装页的第一句话不是命令，而是信任边界选择表。以下命令均来自官方 README、安装与自托管文档；实际执行范围见下方验证章。" />
          <div className="verification-stamp"><PackageCheck /><div><strong>本次实际执行验证</strong><p>已在 npm registry 查证 <code>@openhands/agent-canvas</code> 最新版为 <code>1.43.0</code>（发布于 2026-11-20）。本评测环境 Node 为 v20（低于官方要求的 24）且没有 Docker，<b>因此未实际启动服务、未调用模型、未运行软件工厂流水线</b>；下文命令为官方资料整理。</p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>依赖与版本清单</h3><dl>
              <div><dt>Node.js</dt><dd><strong>≥ 24</strong><span>npm / npx 路线硬性要求</span></dd></div>
              <div><dt>uv</dt><dd><strong>必需</strong><span>本地 Agent Server 经 uvx 运行</span></dd></div>
              <div><dt>npm 包</dt><dd><strong>@openhands/agent-canvas 1.43.0</strong><span>registry 已实测</span></dd></div>
              <div><dt>Docker 镜像</dt><dd><strong>ghcr.io/openhands/agent-canvas:1.43.0</strong><span>固定 tag，勿用 latest</span></dd></div>
              <div><dt>组件 pin</dt><dd><strong>agent-server 1.63.1</strong><span>automation 1.34.1 · extensions 0.43.0</span></dd></div>
              <div><dt>桌面安装包</dt><dd><strong>dmg / exe / AppImage / deb</strong><span>macOS 未签名，需清 quarantine</span></dd></div>
              <div><dt>端口</dt><dd><strong>8000 ingress</strong><span>内部 :3001 static · :18000 agent · :18001 automation</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>目录、密钥与归属</h3><pre>{`npm / npx 安装：
~/.openhands/                # 设置、密钥、会话
~/projects/                  # 你决定暴露给 Agent 的项目根

Docker 单容器：
openhands-data 卷（容器内 /home/openhands/.openhands）
  └── agent-canvas/api-key.txt   # 自动生成的会话密钥
~/projects（容器内 /projects）      # 唯一可见工作区

VM --public：
LOCAL_BACKEND_API_KEY 经环境变量注入，不进页面、不进 ps`}</pre><p><strong>密钥原则：</strong>会话密钥（LOCAL_BACKEND_API_KEY / api-key.txt）与模型密钥（Settings <ArrowRight className="inline-arrow" aria-hidden="true" /> LLM）是两套凭证，互不能替代；两者都不进 Git、不进镜像层。</p></div>
          </div>
          <DeploymentTabs />
          <div className="config-warning"><AlertTriangle /><p><strong>桌面预览版注意：</strong>macOS 应用尚未用 Apple Developer ID 签名，首次打开报“已损坏”时执行 <code>xattr -dr com.apple.quarantine "/Applications/OpenHands Agent Canvas.app"</code>；这是 Gatekeeper 隔离属性，官方在 issue #16774 跟踪签名进度。</p></div>
          <SourceStrip label="命令依据"><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/setup">官方安装文档</SourceLink><SourceLink href="https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md">自托管加固指南</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/backend-setup/docker-execution">每会话 Docker</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="把这份部署手册直接交给 AI Agent" intro="SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。先预览核对结构，再复制或下载，交给任何编码 Agent 即可按图施工。" />
          <DeploySkillCard skill={openHandsDeploySkill} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="软件工厂接入：三个 token，三个身份，四段流水线" intro="以下配置链来自官方 Software Factory 指南。核心思想是最小权限：每个角色只拿自己那段流水线需要的 GitHub 权限，reviewer 甚至没有 push 权。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">软件工厂三个 GitHub token 的权限设计</caption><thead><tr><th>Token / Profile</th><th>仓库权限</th><th>在流水线里做什么</th><th>刻意不给什么</th></tr></thead><tbody>
            <tr><th><span className="component-chip yellow">factory-triage</span></th><td>Contents 读；Issues 读写</td><td>排序、查依赖、写验收标准，打 ready-for-dev。</td><td>不给写代码权限。</td></tr>
            <tr><th><span className="component-chip green">factory-developer</span></th><td>Contents / Issues / PR 读写；Actions 与状态读</td><td>按标签开工，factory/issue 前缀分支，提交 PR。</td><td>不给合并决定权；Workflows 写默认不加。</td></tr>
            <tr><th><span className="component-chip pink">factory-reviewer</span></th><td>Contents / Actions 读；Issues / PR / 状态读写</td><td>检出精确 PR head，跑仓库测试，发原生 review。</td><td>不能 push 代码。</td></tr>
            <tr><th><span className="component-chip blue">watchdog</span></th><td>复用 developer token</td><td>确定性检查：验收状态与 Actions 全绿才 merge。</td><td>不启动任何 Agent。</td></tr>
          </tbody></table>
        </div>
        <div className="automation-layout"><CodeBlock title="工厂搭建顺序（UI 操作转述）" language="text" code={`1. Settings → LLM：配好模型（provider key / OpenHands key / ACP 登录 / 本地端点）
2. Settings → Secrets：保存三个 token
   FACTORY_GITHUB_TRIAGE_TOKEN / DEVELOPER_TOKEN / REVIEWER_TOKEN
3. Settings → Agent：建三个 Agent Profile，各自只勾选自己的 secret，
   关掉 MCP 服务器、模型切换与子 Agent
4. Automate → Templates：依次装四个模板，Check frequency */5 * * * *
   Triage → Issue to PR(触发标签 ready-for-dev，分支前缀 factory/issue)
   → Code Review(标签 openhands-review) → Delivery Watchdog
5. 全部创建后再统一启用；先用一个小 Issue 走通全流程`} /><div className="automation-notes"><h3>接入前必须回答</h3><ol><li><span>1</span><p><strong>触发源可信吗？</strong>公开仓库的 Issue 文本是不可信输入，triage 是第一道人工可介入的闸。</p></li><li><span>2</span><p><strong>凭证隔离了吗？</strong>三段流水线三种 token；任何一个 Agent 被提示注入都无法单独完成合并。</p></li><li><span>3</span><p><strong>合并条件谁定？</strong>watchdog 是确定性检查器，不依赖模型判断；分支保护规则在 GitHub 侧再加一层。</p></li><li><span>4</span><p><strong>版本够新吗？</strong>该走查要求 Agent Canvas ≥ 1.24.0 与每会话 Docker 容器。</p></li></ol></div></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="验收清单：先证明边界，再证明能力" intro="第一次部署不必直接跑工厂。按八道闸门顺序验证，任何一道不过都先停下定位。" />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>版本可重复</strong><p><code>agent-canvas --version</code> 输出 1.43.0；Docker 用固定 tag 而非 latest。</p></div></li>
            <li><span>02</span><div><strong>栈全部上线</strong><p>UI 可开，默认后端显示已连接；Docker 容器不处于重启循环。</p></div></li>
            <li><span>03</span><div><strong>会话密钥受控</strong><p>localhost 以外部署必须走 --public 或手动输入 key；页面不内嵌密钥。</p></div></li>
            <li><span>04</span><div><strong>工作区即预期</strong><p>Agent 只能看到 /projects 或显式打开的目录；PWD/HOME 检查通过。</p></div></li>
            <li><span>05</span><div><strong>容器加固在位</strong><p>docker inspect 确认 CapDrop=ALL、no-new-privileges、端口仅 127.0.0.1。</p></div></li>
            <li><span>06</span><div><strong>模型链路可用</strong><p>一次简单会话完整走完事件流；区分 401（key）与 LLM Provider 配置错误。</p></div></li>
            <li><span>07</span><div><strong>自动化可暂停</strong><p>每个 automation 可单独停用；出问题时先停调度再排查。</p></div></li>
            <li><span>08</span><div><strong>合并不在 Agent 手里</strong><p>watchdog 确定性校验 + GitHub 分支保护 + 人工最终审批，三者都在。</p></div></li>
          </ol>
          <DeployRoutesDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="常见故障：官方排障页的七个高频坑" intro="以下全部整理自官方 Troubleshooting 与安装文档，按从安装到运行的顺序排列。" />
        <div className="trouble-list">
          <details open><summary><span>01</span>agent-canvas 命令找不到<ChevronRight /></summary><div><strong>原因</strong><p>npm 全局 bin 目录不在 PATH。</p><strong>处理</strong><p><code>npm prefix -g</code> 找到前缀，把 <code>$(npm prefix -g)/bin</code> 加进 PATH；或直接用 <code>npx @openhands/agent-canvas</code> 绕过全局安装。</p></div></details>
          <details><summary><span>02</span>启动报缺少 uv / uvx<ChevronRight /></summary><div><strong>原因</strong><p>本地 Agent Server 栈通过 uvx 运行，uv 是硬性前置。</p><strong>处理</strong><p>按 uv 官方指南安装后重开终端，再 <code>uv --version</code> 验证。</p></div></details>
          <details><summary><span>03</span>Linux 上 unable to open database file<ChevronRight /></summary><div><strong>原因</strong><p>容器默认用户是 UID 10001，而绑定的 ~/.openhands 通常属于 UID 1000。</p><strong>处理</strong><p>改用命名卷 openhands-data；或用官方的一次性 root 容器命令把旧状态拷入卷并 chown 到 10001。不要把状态目录设成全用户可写。</p></div></details>
          <details><summary><span>04</span>Docker 镜像启动即崩溃循环<ChevronRight /></summary><div><strong>原因</strong><p>官方记录过发布镜像缺文件（ERR_MODULE_NOT_FOUND）的事故；latest 会第一时间踩中。</p><strong>处理</strong><p>固定到已知可用 tag（本页固定 1.43.0），或按 digest 固定；补丁发布后重新 pull。这也是本页不用 latest 的原因。</p></div></details>
          <details><summary><span>05</span>浏览器要求输入 API key<ChevronRight /></summary><div><strong>原因</strong><p>Docker 或 --public 模式下会话密钥不注入页面；要的是会话密钥，不是模型 key。</p><strong>处理</strong><p><code>docker exec &lt;container&gt; cat /home/openhands/.openhands/agent-canvas/api-key.txt</code> 取回自动生成的 key；或部署时显式设置 LOCAL_BACKEND_API_KEY。</p></div></details>
          <details><summary><span>06</span>LLM Provider NOT provided / 模型无响应<ChevronRight /></summary><div><strong>原因</strong><p>模型名缺少 provider 前缀、base URL 不对或 key 失效；本地模型（Ollama / LM Studio）还要确认端点可达。</p><strong>处理</strong><p>Settings <ArrowRight className="inline-arrow" aria-hidden="true" /> LLM 中逐项核对 provider、model、base URL、key；可恢复错误会以警告横幅区分于内部错误。</p></div></details>
          <details><summary><span>07</span>ACP Agent 凭证不生效<ChevronRight /></summary><div><strong>原因</strong><p>Claude Code / Codex 等的登录态在后端所在机器；后端在 Docker、VM 或云端时看不到你笔记本的 CLI 登录。</p><strong>处理</strong><p>在后端所在环境重新登录，或给该后端配置对应 API key；改完重启会话。</p></div></details>
        </div>
        <SourceStrip><SourceLink href="https://docs.openhands.dev/openhands/usage/agent-canvas/troubleshooting">官方排障文档</SourceLink><SourceLink href="https://docs.openhands.dev/openhands/usage/llms/local-llms">本地模型接入</SourceLink></SourceStrip>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="控制面越方便，凭证治理越不能省" intro="官方自己的警告写得很直白：任何能连上 Agent Server 的人，就拥有了 Agent 能碰的一切。风险设计围绕这句话展开。" />
          <div className="risk-grid">
            <div className="risk-card high"><span>高</span><h3>无沙箱模式 = 你的全部权限</h3><p>npm 直跑时 Agent 以你的账户读写文件系统、执行任意命令。官方原话：把 Agent 与 ACP 进程当作不可信。</p></div>
            <div className="risk-card high"><span>高</span><h3>会话密钥注入</h3><p>AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 会把会话密钥嵌进页面，任何能打开页面的人即获得后端控制权。只允许配合 127.0.0.1 绑定使用。</p></div>
            <div className="risk-card high"><span>高</span><h3>Issue 提示注入</h3><p>工厂流水线的触发文本来自 GitHub Issue。三段 token 隔离与确定性 watchdog 就是为这一刻准备的，不要图省事合并凭证。</p></div>
            <div className="risk-card medium"><span>中</span><h3>内置编辑器共享同源</h3><p>OpenVSCode 以路径前缀挂在同一 origin 下，该 origin 的 localStorage 存有全部已注册后端的会话密钥。官方在 issue #16492 跟踪。</p><SourceLink href="https://github.com/OpenHands/OpenHands/issues/16492">Issue #16492</SourceLink></div>
            <div className="risk-card medium"><span>中</span><h3>资源上限可被客户端顶开</h3><p>会话启动请求里的 container.memory / cpus 会覆盖而非受制于服务端环境变量。多人可达的服务器不要把这两个变量当作上限。</p></div>
            <div className="risk-card low"><span>治理</span><h3>许可与版本漂移</h3><p>主仓库 MIT，但 enterprise/ 目录与商业组件另有许可；发布节奏以周计，生产环境固定 tag 并跟上安全更新。</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />升级流程</h3><ol><li>记录当前版本与镜像 digest；备份 openhands-data 卷或 ~/.openhands。</li><li>读目标版本 Release notes；本项目近乎每周发版，跳跃式升级前先读跨版本变更。</li><li>固定新 tag 在测试环境跑通现有自动化，确认行为无回归。</li><li>切换生产；保留旧镜像与状态备份直到新版本稳定运行。</li></ol></div>
            <div><h3><CircleDollarSign />备份与成本控制</h3><ul><li>备份状态卷、项目目录与自动化定义；密钥值只存在密钥管理器，不进归档。</li><li>用 Agent Profile 限制每个自动化可用的 secrets 与模型，预算告警在 provider 侧设置。</li><li>会话成本与 token 统计在事件流与会话状态里，可按会话追踪。</li><li>卸载只删包或镜像；数据要删需显式移除 ~/.openhands 或 docker volume rm openhands-data。</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="主要来源与核验范围" intro={`官方事实核验日期：${VERIFY_DATE}。本页取代 ${PREVIOUS_DATE} 的元数据快照；旧收录的版本号与结论以本次核验为准。`} />
        <div className="source-list">
          <a href="https://github.com/OpenHands/OpenHands" target="_blank" rel="noreferrer"><span>01</span><div><strong>官方 GitHub 仓库（README）</strong><p>定位、Quickstart、仓库边界与架构图</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenHands/OpenHands/releases/tag/v1.43.0" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v1.43.0</strong><p>2026-11-20；自动化向导、性能修复与组件 pin</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/overview/introduction" target="_blank" rel="noreferrer"><span>03</span><div><strong>官方文档：产品线介绍</strong><p>Canvas / SDK / Cloud / Enterprise / Legacy 边界</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/agent-canvas/architecture" target="_blank" rel="noreferrer"><span>04</span><div><strong>Agent Canvas 架构</strong><p>服务关系、执行隔离与状态归属</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/use-cases/software-factory" target="_blank" rel="noreferrer"><span>05</span><div><strong>官方软件工厂指南</strong><p>四段自动化、token 权限与 Agent Profile 设计</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/agent-canvas/setup" target="_blank" rel="noreferrer"><span>06</span><div><strong>安装 / 升级 / 卸载</strong><p>npm、Docker、桌面版与环境变量全表</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/agent-canvas/backend-setup/docker-execution" target="_blank" rel="noreferrer"><span>07</span><div><strong>每会话 Docker 容器</strong><p>加固默认值、bind mount 与验证命令</p></div><ArrowUpRight /></a>
          <a href="https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md" target="_blank" rel="noreferrer"><span>08</span><div><strong>VM 自托管加固</strong><p>防火墙、--public、systemd 与 nginx 拓扑</p></div><ArrowUpRight /></a>
          <a href="https://docs.openhands.dev/openhands/usage/agent-canvas/troubleshooting" target="_blank" rel="noreferrer"><span>09</span><div><strong>官方排障文档</strong><p>PATH、uv、UID 10001、崩溃循环与密钥提示</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>没有写成结论的内容：</strong>未实际启动 Agent Canvas（本环境 Node v20 低于要求的 24 且无 Docker），未调用任何模型，未复现官方软件工厂走查；airbnb-clone 六 Issue 自动合并为官方案例记录而非本站实测。SWE-bench 等分数均为官方或第三方在其语境下的结果，本页不做迁移性承诺。</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="继续浏览"><Link to="/"><ArrowLeft />返回可搜索方案库</Link><Link to="/solutions/mini-swe-agent"><span>对比阅读<small>mini-SWE-agent v2.4.6 · 最小内核路线</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
