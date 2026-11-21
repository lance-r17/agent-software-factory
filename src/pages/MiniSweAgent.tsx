import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { ArchitectureDiagram, DataEventDiagram, DeploymentDiagram, WorkflowDiagram } from '../components/MiniDiagrams'
import { miniSweAgentDeploySkill } from '../data/deploySkills'

const VERIFY_DATE = '2026-11-21'

const INSTALL_CODE = `# Linux / macOS；本页示例选用 Python 3.12
mkdir -p /srv/agent-factory/{workspace/project,runs}
cd /srv/agent-factory
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'mini-swe-agent==2.4.6'

# 只验证包和入口，不会调用模型
python -c 'import minisweagent; print(minisweagent.__version__)'
python -m minisweagent --help`

const ENV_CODE = `# 模型名必须带 provider 前缀；这里沿用官方文档示例
export MSWEA_MODEL_NAME='anthropic/claude-sonnet-4-5-20250929'
export ANTHROPIC_API_KEY='由密钥管理器注入，不要写进 YAML 或 Git'
export MSWEA_CONFIGURED=true

# 进程级总闸门；单任务闸门在 YAML 中继续收紧
export MSWEA_GLOBAL_CALL_LIMIT=100
export MSWEA_GLOBAL_COST_LIMIT=10.00`

const LOCAL_YAML = `# /srv/agent-factory/factory.local.yaml
# 必须与内置 mini.yaml 一起加载：-c mini.yaml -c factory.local.yaml
agent:
  step_limit: 80
  cost_limit: 3.0
  wall_time_limit_seconds: 1800
  max_consecutive_format_errors: 3
  mode: confirm
environment:
  cwd: /srv/agent-factory/workspace/project
  timeout: 120
  env:
    PAGER: cat
    MANPAGER: cat
    PIP_PROGRESS_BAR: 'off'
    TQDM_DISABLE: '1'`

const LOCAL_RUN = `cd /srv/agent-factory
source .venv/bin/activate
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.local.yaml \
  -t '先复现问题，再做最小修改；运行相关测试，不要提交或推送。' \
  -o /srv/agent-factory/runs/local-demo.traj.json`

const DOCKER_YAML = `# /srv/agent-factory/factory.docker.yaml
agent:
  step_limit: 80
  cost_limit: 3.0
  wall_time_limit_seconds: 1800
  max_consecutive_format_errors: 3
  mode: yolo
  confirm_exit: false
environment:
  environment_class: docker
  image: python:3.12-bookworm
  cwd: /workspace
  timeout: 120
  container_timeout: 2h
  pull_timeout: 300
  run_args:
    - --rm
    - --network
    - none
    - --cap-drop
    - ALL
    - --security-opt
    - no-new-privileges
    - --pids-limit
    - '256'
    - --memory
    - 2g
    - --cpus
    - '2'
    - -v
    - /srv/agent-factory/workspace/project:/workspace:rw`

const DOCKER_RUN = `cd /srv/agent-factory
source .venv/bin/activate
docker info >/dev/null
docker pull python:3.12-bookworm

# 先用无依赖的小型仓库演示；真实项目应换成已装依赖、固定 digest 的镜像
mini \
  -c mini.yaml \
  -c /srv/agent-factory/factory.docker.yaml \
  -t '检查当前仓库，修复任务描述的问题，运行测试；不要联网、提交或推送。' \
  -o /srv/agent-factory/runs/docker-demo.traj.json \
  --yolo --exit-immediately`

const AUTOMATION_CODE = `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
ISSUE_NUMBER=123
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT"
source .venv/bin/activate

# gh / jq 是外层流水线依赖，不是 mini 的内建组件
gh issue view "$ISSUE_NUMBER" --repo "$GITHUB_REPOSITORY" > "runs/$RUN_ID.issue.txt"
mini -c mini.yaml -c factory.docker.yaml \
  -t "$(cat "runs/$RUN_ID.issue.txt")" \
  -o "runs/$RUN_ID.traj.json" \
  --yolo --exit-immediately

# 进程退出不等于任务成功；先检查显式退出状态
jq -e '.info.exit_status == "Submitted"' "runs/$RUN_ID.traj.json"
git -C workspace/project diff --check
git -C workspace/project diff > "runs/$RUN_ID.patch"
# 下一步：在隔离环境运行完整 CI，再交人工审阅；不要自动 merge。`

const TRAJECTORY_CODE = `jq '{
  version: .info.mini_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission: .info.submission
}' runs/docker-demo.traj.json`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? '链接已复制' : '复制本页链接'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'local', label: 'A · 本地确认模式', title: '读懂 Agent 的最短路径', yaml: LOCAL_YAML, run: LOCAL_RUN, note: 'local 会直接继承宿主环境并执行 subprocess，没有文件系统隔离。请只在一次性项目副本中运行，保持 confirm，不要对生产目录使用。' },
    { id: 'docker', label: 'B · Docker 沙箱', title: '无人值守前的最小限权模板', yaml: DOCKER_YAML, run: DOCKER_RUN, note: '该模板主动断网，因此不能在线安装依赖或推送代码。真实项目要预构建依赖镜像并固定 digest；若确需联网，改为域名级出口代理，而不是简单放开全部网络。' },
  ]
  return <RouteTabs tabs={tabs} initialId="local" ariaLabel="部署配置路线">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id}.yaml`} code={current.yaml} language="yaml" />
      <CodeBlock title={`运行 ${current.id} 路线`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function MiniSweAgent() {
  return <PageShell>
    <article className="detail-page mini-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/"><ArrowLeft size={16} /> 方案库</Link><ChevronRight size={14} /><span>mini-SWE-agent</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 02</div>
            <h1><span>mini-SWE-agent</span><br />把软件工厂压缩成<br />一个<span className="highlight-green">可审计的循环</span></h1>
            <p className="hero-lead">它不是功能齐全的研发平台，而是一枚足够小、足够透明的“工作单元”：模型提出 bash 动作，执行环境返回观察，线性轨迹保存每一轮决策，直到提交或撞到限制。</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/solutions/mini-swe-agent', hash: '#deploy' }}>进入复现手册 <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer">官方仓库 <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">一句话判断</p><h2>适合当作工厂内核，<br />不适合直接当治理平台。</h2><ul><li><Check size={17} />源码与控制流容易读懂</li><li><Check size={17} />本地、Docker、HPC 后端可换</li><li><Check size={17} />成本与轨迹是一等公民</li><li><XCircle size={17} />Issue 调度、PR 审批需外层补齐</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>核验版本</dt><dd>v2.4.6 <small>2026-07-23 Release</small></dd></div>
          <div><dt>维护信号</dt><dd>main 最近提交 <small>2026-09-03；未见弃用声明</small></dd></div>
          <div><dt>运行基线</dt><dd>Python ≥ 3.10 <small>bash；容器运行时可选</small></dd></div>
          <div><dt>许可证 / 成熟度</dt><dd>MIT <small>包元数据仍标 Alpha</small></dd></div>
          <div><dt>事实核验日</dt><dd>{VERIFY_DATE} <small>时效信息以此为准</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>为什么不是旧版 SWE-agent？</strong><p>旧仓库 README 明确写道，当前开发精力主要放在 mini-SWE-agent，且一般建议后续使用 mini。本页因此研究 mini，而不是把已被官方替代的主干包装成新部署首选。</p></div><SourceLink href="https://github.com/SWE-agent/SWE-agent">旧版官方说明</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="三类协议，一条消息流水线" intro="mini 的价值不在“功能少”，而在每一步都能映射到源码：谁生成动作、谁执行、谁保存状态，没有隐藏的工作流引擎。" />
        <ArchitectureDiagram />
        <SourceStrip><SourceLink href="https://mini-swe-agent.com/latest/advanced/control_flow/">官方控制流</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/agents/default.py">DefaultAgent 源码</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/environments/">执行环境</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="完整工作流：查询、执行、观察，再循环" intro="一个动作对应一次独立执行。这样牺牲了 shell 会话的连续性，却换来更明确的超时边界、更容易替换的沙箱和可重放的消息序列。" />
          <WorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>为什么没有常驻 shell 反而是特性？</h3><p>常驻会话需要猜测命令何时结束，还可能被一条异常命令破坏。mini 让每次执行独立结束；如果下一条命令依赖目录或环境变量，就在同一动作里写 <code>cd … &amp;&amp; …</code> 或显式传入环境。</p></div>
            <div className="text-block"><h3>提交不是测试通过</h3><p>环境只识别输出首行是否是指定的完成信号。它不会替你判断测试是否足够、补丁是否符合需求。外层流水线必须继续检查 diff、运行 CI，并保留人工合并闸门。</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="组件不多，但职责必须分清" intro="v2 的关键变化是 Model 负责解析与观察格式，Agent 负责协调和限制，Environment 只负责执行与识别提交信号。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">mini-SWE-agent 核心组件分工</caption><thead><tr><th>组件</th><th>输入</th><th>职责</th><th>不做什么</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">Model</span></th><td>线性 messages</td><td>调用 LiteLLM / OpenRouter；v2 默认原生工具调用；也可文本解析；格式化 observation。</td><td>不直接操作仓库，不决定沙箱权限。</td></tr>
            <tr><th><span className="component-chip green">DefaultAgent</span></th><td>task + Model + Environment</td><td>渲染模板；循环 query / execute_actions；统计成本与调用数；处理控制流异常。</td><td>不提供 Issue 队列、任务 DAG 或多 Agent 协商。</td></tr>
            <tr><th><span className="component-chip yellow">InteractiveAgent</span></th><td>模型动作 + 用户输入</td><td>confirm / yolo / human 三模式；支持动作白名单与退出确认。</td><td>confirm 不是安全沙箱，人按 Enter 仍可能批准危险命令。</td></tr>
            <tr><th><span className="component-chip pink">Environment</span></th><td>{'{ command }'}</td><td>local 用 subprocess；Docker 用 docker exec；返回 output / returncode / exception。</td><td>不自动保证补丁正确，也不天然防提示注入。</td></tr>
            <tr><th><span className="component-chip blue">Run scripts</span></th><td>CLI 或 benchmark 实例</td><td>装配配置；mini 保存最近运行；SWE-bench runner 可并发批处理。</td><td>v2 已移除专用 github_issue.py，不再内建完整 Issue 到 PR 的机器人。</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://mini-swe-agent.com/latest/advanced/v2_migration/">v2 迁移指南</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/usage/mini/">mini CLI</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/run/mini.py">CLI 源码</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="轨迹既是调试器，也是自动化验收接口" intro="线性历史让“发给模型的上下文”和“保存下来的执行轨迹”高度一致；自动化系统可以读取 exit_status，而不是只看进程是否退出。" />
          <DataEventDiagram />
          <div className="code-with-note"><CodeBlock title="读取验收字段" code={TRAJECTORY_CODE} language="bash" /><div className="sticky-explanation"><strong>建议保留的四种结果</strong><ul><li><code>Submitted</code>：Agent 自称完成，继续跑验收。</li><li><code>LimitsExceeded</code>：预算或步数耗尽，不是成功。</li><li><code>TimeExceeded</code>：墙钟时间耗尽，需缩小任务。</li><li><code>RepeatedFormatError</code>：模型输出连续不符合工具契约。</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="为什么它能成为“软件工厂”的工作单元？" intro="因为它把需求文本转换成可审查的仓库变更，并让加工过程、执行结果和退出原因都可序列化。但完整工厂仍要由你补上接单、质检和交付。" />
        <div className="factory-conveyor" aria-label="完整软件工厂流水线">
          <div className="conveyor-step external"><span>外层补齐</span><GitPullRequest /><strong>接单</strong><p>Issue / cron / 人工任务</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>mini 内建</span><Layers3 /><strong>加工</strong><p>理解 <ArrowRight className="inline-arrow" aria-hidden="true" /> 修改 <ArrowRight className="inline-arrow" aria-hidden="true" /> 自测</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>mini 内建</span><FileCheck2 /><strong>留证</strong><p>trajectory + submission</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>外层补齐</span><Shield /><strong>质检与交付</strong><p>CI <ArrowRight className="inline-arrow" aria-hidden="true" /> 人审 <ArrowRight className="inline-arrow" aria-hidden="true" /> PR / merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />特别适合</h3><ul><li>研究 Agent scaffold、模型能力和 bash-only 基线。</li><li>在一次性仓库副本上处理边界清晰的修复任务。</li><li>需要批量 SWE-bench / ProgramBench 实验和可比较轨迹。</li><li>团队希望自定义 Model / Environment，而不维护重型平台。</li><li>作为外层调度器中的单任务执行器，由 CI 与人审兜底。</li></ul></div>
          <div className="fit-column no"><h3><XCircle />不适合直接承担</h3><ul><li>跨仓库、多角色、长周期项目规划与任务 DAG。</li><li>生产主机上的无隔离自动修复或直接自动合并。</li><li>强合规所需的身份、细粒度授权、审批和租户治理。</li><li>必须保证执行确定性与补丁正确性的无人值守场景。</li><li>不愿维护模型 API、容器镜像、测试和密钥系统的团队。</li></ul></div>
        </div>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="从固定版本开始，逐步扩大权限" intro="以下命令以 Linux 和 /srv/agent-factory 为例。除特别标注外均属于“官方资料整理 + 本页部署设计”，不是已执行的生产验证。" />
          <div className="verification-stamp"><PackageCheck /><div><strong>本次实际执行验证</strong><p>已在隔离临时目录安装 <code>mini-swe-agent==2.4.6</code>，成功导入并读取版本，成功运行 <code>python -m minisweagent --help</code>。<b>未调用模型、未运行 Docker 路线、未执行真实仓库修复。</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>依赖与版本清单</h3><dl>
              <div><dt>Python</dt><dd><strong>≥ 3.10</strong><span>项目强制；示例选 3.12</span></dd></div>
              <div><dt>Shell</dt><dd><strong>bash</strong><span>local 或容器内需要</span></dd></div>
              <div><dt>核心包</dt><dd><strong>mini-swe-agent 2.4.6</strong><span>本页固定版本</span></dd></div>
              <div><dt>关键依赖</dt><dd><strong>pydantic ≥ 2.0</strong><span>litellm ≥ 1.75.5，排除 1.82.7 / 1.82.8</span></dd></div>
              <div><dt>可选运行时</dt><dd><strong>Docker / Podman</strong><span>SWE-bench 还可用 Singularity / Apptainer</span></dd></div>
              <div><dt>外层自动化</dt><dd><strong>Git / gh / jq</strong><span>仅示例流水线需要，非 mini 内建</span></dd></div>
              <div><dt>端口</dt><dd><strong>无</strong><span>CLI 不启动 HTTP 服务，无需开放端口</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>建议目录与归属</h3><pre>{`/srv/agent-factory/\n├── .venv/                 # 宿主 Python 环境\n├── factory.local.yaml     # 无隔离，仅演示\n├── factory.docker.yaml    # 沙箱与资源限制\n├── workspace/project/     # 唯一可写仓库副本\n└── runs/                  # issue / patch / traj / logs\n\n模型 API key：宿主进程环境或密钥管理器\n容器内：默认不放模型 key，不挂 Docker socket`}</pre><p><strong>工作区原则：</strong>先建目录再挂载，避免 Docker 自动创建 root 拥有目录。真实项目应使用已安装依赖且固定 digest 的镜像。</p></div>
          </div>
          <CodeBlock title="01 · 安装与入口自检" code={INSTALL_CODE} />
          <CodeBlock title="02 · 模型、密钥与总预算" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="命令依据"><SourceLink href="https://mini-swe-agent.com/latest/quickstart/">Quick start</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/global_configuration/">全局配置</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/advanced/yaml_configuration/">YAML 配置</SourceLink><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/blob/main/pyproject.toml">依赖声明</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="把这份部署手册直接交给 AI Agent" intro="SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置两条路线选择表、YAML 模板、八道验收闸门与故障速查。先预览核对结构，再复制或下载，交给任何编码 Agent 即可按图施工。" />
          <DeploySkillCard skill={miniSweAgentDeploySkill} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="自动化接入：让外层系统接单，让 CI 决定是否交付" intro="v2 已移除旧的专用 github_issue 脚本。不要把 v1 教程里的入口照搬到新项目；用外层调度器取 Issue，再调用 mini CLI。" />
        <div className="automation-layout"><CodeBlock title="03 · 接单到补丁的外层流水线示例" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>接入前必须回答</h3><ol><li><span>1</span><p><strong>谁能触发？</strong> Issue 文本是不可信输入，公开仓库触发器应先经过维护者批准。</p></li><li><span>2</span><p><strong>谁能写？</strong> 只挂工作区副本；GitHub Token 不进入容器，推送由外层独立步骤完成。</p></li><li><span>3</span><p><strong>什么叫成功？</strong> Submitted + diff 检查 + 完整 CI + 人工审阅，缺一项都不合并。</p></li><li><span>4</span><p><strong>如何重试？</strong> 新 run_id、新容器、新工作区；不要在失败现场盲目重放危险命令。</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>最常见的 v2 配置坑：</strong>一旦使用 <code>-c</code>，内置默认配置不会自动作为基底加载。覆盖某个字段时也要写 <code>-c mini.yaml -c your.yaml</code>，否则可能连模板都缺失。</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="验收清单：把“运行结束”拆成八道闸门" intro="第一次复现不必追求自动 PR。先证明权限边界、轨迹和补丁都可检查，再逐步自动化。" />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>版本可重复</strong><p>导入版本为 2.4.6；保存 <code>pip freeze</code>，不直接跟随 latest。</p></div></li>
            <li><span>02</span><div><strong>配置可解释</strong><p>启动日志同时包含 mini.yaml 与自定义 YAML；模型名带 provider。</p></div></li>
            <li><span>03</span><div><strong>工作区可丢弃</strong><p>只挂副本，宿主其他目录与 Docker socket 不可写。</p></div></li>
            <li><span>04</span><div><strong>密钥不进补丁</strong><p>轨迹、patch、日志扫描无 API key；容器内默认无模型密钥。</p></div></li>
            <li><span>05</span><div><strong>限制确实生效</strong><p>分别演练命令超时、单任务成本 / 步数限制和墙钟限制。</p></div></li>
            <li><span>06</span><div><strong>轨迹可读取</strong><p>JSON 含版本、配置、消息、模型统计与明确的 exit_status。</p></div></li>
            <li><span>07</span><div><strong>变更可审查</strong><p><code>git diff --check</code> 通过，补丁仅含预期文件，无二进制与临时脚本。</p></div></li>
            <li><span>08</span><div><strong>测试与合并分离</strong><p>干净环境重跑 CI；Agent 不掌握合并权限，由人工最终批准。</p></div></li>
          </ol>
          <DeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="常见故障：先辨认是哪一层出了问题" intro="模型、配置、宿主、容器和外层流水线的故障表现可能相似。按下面顺序定位，避免一味调大超时或预算。" />
        <div className="trouble-list">
          <details open><summary><span>01</span>使用 -c 后提示模板或配置缺失<ChevronRight /></summary><div><strong>原因</strong><p>v2 的多个配置会递归合并，但一旦指定 -c，默认 mini.yaml 不再自动加入。</p><strong>处理</strong><p>改为 <code>mini -c mini.yaml -c factory.local.yaml …</code>。若使用文本解析模型，还要保证 action_regex 与所有模板格式一致。</p></div></details>
          <details><summary><span>02</span>API key 已设置，仍出现 AuthenticationError<ChevronRight /></summary><div><strong>原因</strong><p>模型 provider 前缀、密钥变量名、环境加载顺序或 provider 侧鉴权都可能出错。官方 Issues 中有相关报告，其中 #558 在本次核验时仍为 open。</p><strong>处理</strong><p>在宿主检查变量是否存在而非打印密钥；确认模型名如 <code>anthropic/…</code>；临时用官方 <code>mini-extra config edit</code> 查看配置路径。不要把“容器里也有 key”当作修复手段。</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/issues/558">Issue #558</SourceLink></div></details>
          <details><summary><span>03</span>上一轮 cd 或 export 下一轮消失<ChevronRight /></summary><div><strong>原因</strong><p>默认每个动作都是新的 subshell，这是明确设计，不是状态丢失 bug。</p><strong>处理</strong><p>在同一个动作中写 <code>cd /workspace &amp;&amp; pytest</code>，或配置 environment.cwd；需要持久环境时写入工作区文件并显式加载。</p></div></details>
          <details><summary><span>04</span>Docker 拉镜像超时或容器无法执行<ChevronRight /></summary><div><strong>原因</strong><p>网络、架构、Docker daemon 权限或镜像内缺少 bash。SWE-bench 官方 Linux 镜像还假定 x86 架构。</p><strong>处理</strong><p>先手动 <code>docker info</code>、<code>docker pull</code>、<code>docker exec … ls</code>；将 pull_timeout 从默认 120 秒调高。普通命令超时由 environment.timeout 控制，默认 30 秒。</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/issues/499">pull timeout Issue #499</SourceLink></div></details>
          <details><summary><span>05</span>CI 中一直等待输入，或任务结束不退出<ChevronRight /></summary><div><strong>原因</strong><p>mini 默认 confirm，提交时也默认询问。无人值守模式需要显式关闭两类确认。</p><strong>处理</strong><p>只在限权沙箱中使用 <code>--yolo --exit-immediately</code>；保留成本、步数和墙钟上限。不要为了无人值守而在宿主机开 yolo。</p></div></details>
          <details><summary><span>06</span>exit_status 是 LimitsExceeded / TimeExceeded<ChevronRight /></summary><div><strong>原因</strong><p>任务太大、模型循环、测试太慢或预算过小。进程正常结束不代表修复完成。</p><strong>处理</strong><p>先缩小任务和测试范围，查看轨迹定位循环；再有依据地调整上限。不要将 cost_limit=0 当作常规修复，因为 0 表示不限。</p></div></details>
          <details><summary><span>07</span>旧教程里的 mini -v / github_issue.py 不存在<ChevronRight /></summary><div><strong>原因</strong><p>v2 删除了 Visual UI、专用 github_issue 运行脚本、轮换 key 和旧模型类；解析相关字段也从 agent 移到了 model。</p><strong>处理</strong><p>按官方 v2 指南迁移；确需留在 v1 时固定 <code>mini-swe-agent~=1.0</code>，但不要把 v1 配置直接用于本页 v2 命令。</p><SourceLink href="https://mini-swe-agent.com/latest/advanced/v2_migration/">官方迁移清单</SourceLink></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="安全边界、升级与备份要一起设计" intro="小内核减少了代码复杂度，却不会自动解决模型不可信输出、依赖供应链和仓库提示注入。" />
          <div className="risk-grid">
            <div className="risk-card high"><span>高</span><h3>local 无隔离</h3><p>子进程继承宿主环境并能执行任意 shell。只用一次性副本；生产任务采用更强沙箱，confirm 不能替代隔离。</p></div>
            <div className="risk-card high"><span>高</span><h3>Issue / 代码提示注入</h3><p>仓库文档和 Issue 都是不可信内容。分离触发与写权限，限制网络，禁止 Agent 自动合并。</p></div>
            <div className="risk-card medium"><span>中</span><h3>容器默认并非最小权限</h3><p>官方默认 run_args 只有 --rm；本页的断网、cap-drop、资源限制是额外加固。高对抗任务仍需微 VM 等更强边界。</p></div>
            <div className="risk-card medium"><span>中</span><h3>依赖供应链</h3><p>项目明确排除遭 compromised 的 litellm 1.82.7 / 1.82.8。升级时锁依赖、审 Release、保留 SBOM，不要只更新 Agent 包。</p><SourceLink href="https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.2.8">官方安全 Release</SourceLink></div>
            <div className="risk-card medium"><span>中</span><h3>轨迹泄漏</h3><p>消息与输出可能含私有源码、路径和误打印的密钥。限制 runs/ 权限，设定保留期，公开分享前脱敏。</p></div>
            <div className="risk-card low"><span>治理</span><h3>Alpha 与维护节奏</h3><p>包元数据仍为 Development Status :: 3 - Alpha；最近提交与最新 Release 存在时间间隔。采用前固定版本并自行跑回归。</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />升级流程</h3><ol><li>备份自定义 YAML、runs/ 和依赖锁；阅读目标 Release 与迁移指南。</li><li>在新虚拟环境安装目标版本，保留当前 2.4.6 环境可回滚。</li><li>用无敏感数据的小型仓库跑同一任务，比较轨迹结构、成本和测试结果。</li><li>核对 Model / Environment 协议、配置键、完成信号与退出状态。</li><li>通过完整 CI 后分批切换；异常时重装固定旧版并恢复配置。</li></ol></div>
            <div><h3><CircleDollarSign />备份与成本控制</h3><ul><li>备份 runs/、自定义 YAML、依赖锁、测试脚本和镜像 digest；不要提交 .env。</li><li>密钥文件若确需备份，单独加密并限制访问，不与普通轨迹放在同一归档。</li><li>同时设置单任务与全局成本 / 调用限制；提供商侧再设预算和告警。</li><li>升级前记录容器镜像 digest 与基准任务结果，避免“代码没变但环境漂了”。</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="主要来源与核验范围" intro={`官方事实核验日期：${VERIFY_DATE}。社区与 Issue 仅用于发现故障，不替代当前官方文档。`} />
        <div className="source-list">
          <a href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer"><span>01</span><div><strong>官方 GitHub 仓库</strong><p>定位、README、默认选择与源码入口</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.4.6" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v2.4.6</strong><p>2026-07-23；解析失败调用计入成本限制的修复</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/commits/main/" target="_blank" rel="noreferrer"><span>03</span><div><strong>main 提交记录</strong><p>本次读取最近提交为 2026-09-03</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/control_flow/" target="_blank" rel="noreferrer"><span>04</span><div><strong>官方控制流与 DefaultAgent</strong><p>循环、异常、提交信号与序列化</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/environments/" target="_blank" rel="noreferrer"><span>05</span><div><strong>Environments</strong><p>local / Docker / Singularity / Bubblewrap 等边界</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/yaml_configuration/" target="_blank" rel="noreferrer"><span>06</span><div><strong>YAML 与 v2 迁移指南</strong><p>配置合并、模板、工具调用和破坏性变更</p></div><ArrowUpRight /></a>
          <a href="https://mini-swe-agent.com/latest/advanced/global_configuration/" target="_blank" rel="noreferrer"><span>07</span><div><strong>全局配置与 mini CLI</strong><p>模型、密钥、总预算、输出路径和交互模式</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/mini-swe-agent/blob/main/pyproject.toml" target="_blank" rel="noreferrer"><span>08</span><div><strong>pyproject.toml</strong><p>Python、依赖约束、MIT 与 Alpha 元数据</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>没有写成结论的内容：</strong>未实测真实模型修复质量，未验证所有模型供应商，未验证 SWE-bench 分数在你的仓库上的可迁移性，也未声称 Docker 示例能抵御恶意内核级攻击。官方 “&gt;74%” 是其 benchmark 语境下的项目声明，不是本页独立复测结果。</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="继续浏览"><Link to="/"><ArrowLeft />返回可搜索方案库</Link><Link to="/solutions/openhands-agent-canvas"><span>上一个收录<small>OpenHands Agent Canvas</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
