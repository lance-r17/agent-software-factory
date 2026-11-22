import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { SweArchitectureDiagram, SweDataEventDiagram, SweDeploymentDiagram, SweWorkflowDiagram } from '../components/SweAgentDiagrams'
import { sweAgentDeploySkill } from '../data/deploySkills'

const VERIFY_DATE = '2026-11-21'

const INSTALL_CODE = `# 官方推荐路线：从源码做 editable 安装
mkdir -p /srv/agent-factory/{workspace/project,runs,vendor}
cd /srv/agent-factory
python3.11 -m venv .venv
source .venv/bin/activate

git clone --depth 1 --branch v1.1.0 https://github.com/SWE-agent/SWE-agent.git vendor/SWE-agent
cd vendor/SWE-agent
git rev-parse HEAD   # 本次核验：0f3acafacabc0def8cc76b4e48acb4b6cf302cb9
python -m pip install --upgrade pip
python -m pip install --editable .

# 只验证包与 CLI 入口，不会启动 Docker 或调用模型
sweagent --help
python -m sweagent run --help`

const ENV_CODE = `# 推荐由宿主进程环境或密钥管理器注入；不要写进 YAML 或 Git
export ANTHROPIC_API_KEY='由密钥管理器注入'
export OPENAI_API_KEY='由密钥管理器注入'

# 公共仓库通常不需要 GITHUB_TOKEN。
# 若必须访问私有仓库，先在宿主侧预取代码，再按 local repo 传入；
# 不要让长期 Token 随 clone URL 进入不可信容器。

# 可选：.env 也能被读取，但必须 chmod 600、加入 .gitignore
# 本手册优先使用进程环境，不创建 .env。`

const DOCKER_YAML = `# /srv/agent-factory/factory.docker.yaml
# 与默认 config/default.yaml 一起加载；这里只覆盖安全边界与任务输入
env:
  deployment:
    type: docker
    image: python:3.11
    pull: missing
    remove_container: true
    docker_args:
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
  repo:
    type: local
    path: /srv/agent-factory/workspace/project
    base_commit: HEAD
problem_statement:
  type: text
  text: '先复现问题，再做最小修改；运行相关测试；不要提交、推送或联网。'
agent:
  model:
    name: claude-3-7-sonnet-latest
    per_instance_cost_limit: 2.00
    total_cost_limit: 5.00
  tools:
    execution_timeout: 30
    install_timeout: 300
    total_execution_timeout: 1800
    max_consecutive_execution_timeouts: 3`

const DOCKER_RUN = `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate
docker info >/dev/null
docker pull python:3.11

# 仓库由 SWE-ReX 从宿主上传到容器，因此可以在 docker_args 中断网
sweagent run \\
  --config config/default.yaml \\
  --config /srv/agent-factory/factory.docker.yaml \\
  --output_dir /srv/agent-factory/runs/docker-single`

const MODAL_RUN = `# 适合本机没有 Docker、但允许代码进入云端沙箱的场景
cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# 先完成 Modal 自身的认证与环境检查；这不是 SWE-agent 的内建组件
modal token new
cat > /srv/agent-factory/runs/task.md <<'EOF'
先复现问题，再做最小修改；运行相关测试；不要提交或推送。
EOF

sweagent run \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --env.deployment.type=modal \\
  --env.repo.path=/srv/agent-factory/workspace/project \\
  --problem_statement.path=/srv/agent-factory/runs/task.md \\
  --output_dir=/srv/agent-factory/runs/modal-single`

const BATCH_RUN = `cd /srv/agent-factory/vendor/SWE-agent
source /srv/agent-factory/.venv/bin/activate

# 先跑 3 个实例的烟测；确认成本、轨迹与容器负载后再扩大 slice / workers
sweagent run-batch \\
  --config config/default.yaml \\
  --agent.model.name=claude-3-7-sonnet-latest \\
  --agent.model.per_instance_cost_limit=2.00 \\
  --instances.type=swe_bench \\
  --instances.subset=lite \\
  --instances.split=dev \\
  --instances.slice=:3 \\
  --num_workers=3 \\
  --output_dir=/srv/agent-factory/runs/swebench-smoke

# 若 preds.json 过期或缺失，可在实验目录重建
sweagent merge-preds /srv/agent-factory/runs/swebench-smoke`

const INSPECT_CODE = `# 终端查看单个轨迹
sweagent inspect /srv/agent-factory/runs/docker-single/**/*.traj

# 浏览器查看整个实验目录；默认只绑定本机时用 127.0.0.1 访问
sweagent inspector --directory /srv/agent-factory/runs/docker-single --port 8001

# 快速汇总退出状态、成本与 API 调用
sweagent quick-stats /srv/agent-factory/runs/docker-single`

const AUTOMATION_CODE = `#!/usr/bin/env bash
set -euo pipefail
ROOT=/srv/agent-factory
RUN_ID="$(date +%Y%m%d-%H%M%S)"
cd "$ROOT/vendor/SWE-agent"
source "$ROOT/.venv/bin/activate"

# 外层系统取 Issue，先保存为文本；Issue 内容一律视为不可信输入
gh issue view 123 --repo "$GITHUB_REPOSITORY" > "$ROOT/runs/$RUN_ID.md"
git -C "$ROOT/workspace/project" status --porcelain | grep -q . && exit 2

# 复用加固 Docker 配置；模型 key 留在宿主，GitHub Token 不进容器
sweagent run \\
  --config config/default.yaml \\
  --config "$ROOT/factory.docker.yaml" \\
  --problem_statement.path="$ROOT/runs/$RUN_ID.md" \\
  --output_dir="$ROOT/runs/$RUN_ID"

# 进程退出不等于修复成功：先查轨迹，再检查补丁，最后由 CI 与人审决定
python - <<'PY' "$ROOT/runs/$RUN_ID"
import json, pathlib, sys
run = pathlib.Path(sys.argv[1])
trajs = list(run.rglob('*.traj'))
assert trajs, '没有轨迹文件'
info = json.loads(trajs[0].read_text())['info']
assert info.get('exit_status') == 'submitted', info.get('exit_status')
assert info.get('submission'), '没有 submission 补丁'
PY
# 下一步：把 submission 应用到干净副本，运行完整 CI，再交人工审阅。`

const TRAJECTORY_CODE = `jq '{
  version: .info.swe_agent_version,
  rex: .info.swe_rex_version,
  exit: .info.exit_status,
  calls: .info.model_stats.api_calls,
  cost: .info.model_stats.instance_cost,
  submission_present: (.info.submission != null),
  steps: (.trajectory | length)
}' runs/docker-single/**/*.traj`

function CopyPageLink() {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>
    {copied ? <Check size={16} /> : <ExternalLink size={16} />}{copied ? '链接已复制' : '复制本页链接'}
  </button>
}

function DeploymentTabs() {
  const tabs = [
    { id: 'docker', label: 'A · 加固 Docker', title: '单仓库复现的推荐遗产路线', yaml: DOCKER_YAML, run: DOCKER_RUN, note: '仓库走 local repo 上传而不是容器内 git clone，因此可以断网。该路线能隔离命令执行，但 SWE-agent 1.x 已进入维护期，适合复现历史 pipeline 与研究 ACI，不建议作为新平台底座。' },
    { id: 'modal', label: 'B · Modal 云端', title: '没有本机 Docker 时的替代执行面', yaml: '# 该路线不需要额外 YAML；用 CLI 覆盖 deployment 与 repo。\n# 代码会上传到 Modal sandbox，先确认组织的数据边界。', run: MODAL_RUN, note: 'Modal 能解决“本机没有 Docker”的问题，却不能解决密钥与数据治理。模型 key 仍在宿主侧用于 API 调用；仓库、命令输出与轨迹会进入云端运行环境。' },
    { id: 'batch', label: 'C · 批量基准', title: 'SWE-bench / 历史 Issue 批处理', yaml: '# 批处理通过 CLI 参数指定 instances。\n# 支持 swe_bench、file、huggingface、expert_file 等来源。', run: BATCH_RUN, note: 'run-batch 的价值是标准化批量实验与 preds.json 汇总；它不是验收器。先用 slice=:3 和 num_workers=3 烟测，再扩大规模。' },
    { id: 'inspect', label: 'D · 轨迹审查', title: '把研究输出变成可调试证据', yaml: '# 不需要启动 Agent；只读取已有 .traj / preds.json / logs。', run: INSPECT_CODE, note: '轨迹查看器是 SWE-agent 仍有价值的重要原因。迁移到 mini 或其他框架前，可以用它比较同一任务的历史决策、成本与失败路径。' },
  ]
  return <RouteTabs tabs={tabs} initialId="docker" ariaLabel="SWE-agent 部署配置路线">
    {(current) => <>
      <h3>{current.title}</h3><p>{current.note}</p>
      <CodeBlock title={`${current.id} 路线配置`} code={current.yaml} language="yaml" />
      <CodeBlock title={`运行 ${current.id} 路线`} code={current.run} />
    </>}
  </RouteTabs>
}

export default function SweAgent() {
  return <PageShell>
    <article className="detail-page swe-agent-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to="/"><ArrowLeft size={16} /> 方案库</Link><ChevronRight size={14} /><span>SWE-agent</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">AGENTIC SOFTWARE ENGINEERING · FIELD NOTE 03 · LEGACY LINE</div>
            <h1><span>SWE-agent</span><br />把 ACI 研究做成<br />一套<span className="highlight-blue">完整但已交棒的框架</span></h1>
            <p className="hero-lead">这是 SWE-bench 生态里最有历史影响力的开源 Agent 框架：YAML 驱动、工具束可替换、轨迹面向研究。它的官方现状也必须写在最前面：mini-SWE-agent 已经取代它，主线进入维护模式。</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: '/solutions/swe-agent', hash: '#deploy' }}>进入复现手册 <ArrowRight size={18} /></Link><a className="text-link" href="https://github.com/SWE-agent/SWE-agent" target="_blank" rel="noreferrer">官方仓库 <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">一句话判断</p><h2>适合研究历史框架与批量实验，<br />不适合作为新工厂首选底座。</h2><ul><li><Check size={17} />ACI 与工具束设计完整</li><li><Check size={17} />轨迹、批处理、检视工具成熟</li><li><Check size={17} />Docker / Modal / Fargate 后端可换</li><li><XCircle size={17} />官方已被 mini 取代，维护模式</li></ul><CopyPageLink /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>核验版本</dt><dd>v1.1.0 <small>2025-05-22 Release</small></dd></div>
          <div><dt>维护信号</dt><dd>官方 README <small>推荐改用 mini-SWE-agent</small></dd></div>
          <div><dt>运行基线</dt><dd>Python ≥ 3.11 <small>默认 Docker python:3.11</small></dd></div>
          <div><dt>许可证 / 定位</dt><dd>MIT <small>研究型 ACI 框架</small></dd></div>
          <div><dt>事实核验日</dt><dd>{VERIFY_DATE} <small>时效信息以此为准</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>为什么还要收录一个“已被取代”的方案？</strong><p>因为大量历史教程、SWE-bench pipeline 和 ACI 研究仍指向 SWE-agent 1.x。正确收录方式不是把它包装成新部署首选，而是标明维护状态、保留可复现路径，并说明何时应该改用 mini-SWE-agent。</p></div><SourceLink href="https://github.com/SWE-agent/SWE-agent/blob/main/README.md">官方替代声明</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker="01 · SYSTEM MAP" title="CLI、Agent、环境三层分工" intro="SWE-agent 1.x 的结构比 mini 更完整，也更重：sweagent CLI 负责装配，Agent 负责模型与工具决策，SWEEnv 通过 SWE-ReX 管理部署和 shell session。" />
        <SweArchitectureDiagram />
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/background/architecture/">官方架构文档</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-agent/blob/v1.1.0/sweagent/environment/swe_env.py">SWEEnv 源码</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-ReX">SWE-ReX 执行后端</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section blue-tint">
        <div className="page-width detail-section">
          <SectionHeading kicker="02 · CLOSED LOOP" title="从 YAML 到 submit：一条研究型工作流" intro="每一步都被设计成可配置、可记录、可重放。它牺牲了一点简洁性，换来对 prompt、工具、历史和批处理实验的细粒度控制。" />
          <SweWorkflowDiagram />
          <div className="explanation-grid">
            <div className="text-block"><h3>ACI 是 SWE-agent 的核心遗产</h3><p>它不是简单把 bash 暴露给模型，而是提供窗口化文件查看、搜索、编辑、提交等工具束；编辑前还会做语法检查。后来的很多编码 Agent 都沿用了这套“模型需要好的计算机接口”的思想。</p></div>
            <div className="text-block"><h3>完整框架也意味着更多迁移面</h3><p>模板、工具束、解析器、HistoryProcessor、部署后端、批处理实例源都可配置。对研究是优点；对新团队的长期维护则是负担，尤其官方已经建议改用 mini。</p></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker="03 · COMPONENT ROLES" title="组件分工：谁思考，谁执行，谁留证" intro="读源码时抓住这条线：Agent.forward() 生成动作，ToolHandler 解析与执行，SWEEnv 只负责环境与部署，输出文件由 run hooks 和 runner 汇总。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">SWE-agent 核心组件分工</caption><thead><tr><th>组件</th><th>输入</th><th>职责</th><th>不做什么</th></tr></thead><tbody>
            <tr><th><span className="component-chip blue">sweagent CLI</span></th><td>run / run-batch / inspect</td><td>解析层级参数，合并 YAML，创建 runner；提供轨迹查看、合并预测与统计工具。</td><td>不内建完整 Issue 调度平台。</td></tr>
            <tr><th><span className="component-chip green">Agent</span></th><td>history + model + tools</td><td>forward() 查询模型，处理重试、成本限制、提交与异常退出。</td><td>不直接管理 Docker 或云资源。</td></tr>
            <tr><th><span className="component-chip yellow">HistoryProcessor</span></th><td>完整消息历史</td><td>按配置压缩、缓存或改写历史，控制进入模型的上下文。</td><td>不保证压缩后仍保留全部事实。</td></tr>
            <tr><th><span className="component-chip pink">ToolHandler / ACI</span></th><td>工具束与动作文本</td><td>安装 registry / editor / review 工具，解析 function calling，执行 submit 检查。</td><td>不天然阻止危险 shell；边界取决于部署层。</td></tr>
            <tr><th><span className="component-chip blue">SWEEnv + SWE-ReX</span></th><td>deployment + repo</td><td>启动 Docker / Modal / Fargate / local runtime，复制仓库，执行 shell 命令。</td><td>不评价补丁语义，不替 CI 验收。</td></tr>
            <tr><th><span className="component-chip green">Inspector / preds</span></th><td>.traj / 实验目录</td><td>终端或网页查看轨迹；quick-stats 汇总；preds.json 交给外部评测。</td><td>不把“生成预测”包装成“修复成功”。</td></tr>
          </tbody></table>
        </div>
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/background/aci/">ACI 设计说明</SourceLink><SourceLink href="https://github.com/SWE-agent/SWE-agent/tree/v1.1.0/tools">工具束源码</SourceLink><SourceLink href="https://swe-agent.com/latest/reference/agent/">Agent 参考</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="04 · DATA & EVENTS" title="轨迹格式在 v1.1.0 有一次关键变化" intro="旧字段 messages 被 query 取代：现在每一步保存的是当前模型看到的精确输入。做跨版本分析时，这一点最容易误判。" />
          <SweDataEventDiagram />
          <div className="code-with-note"><CodeBlock title="读取轨迹验收字段" code={TRAJECTORY_CODE} language="bash" /><div className="sticky-explanation"><strong>v1.1.0 迁移要点</strong><ul><li><code>messages</code> 改为 <code>query</code>，不要混用旧解析脚本。</li><li>多个 windowed 工具束改名；旧配置里的 <code>review_on_submit</code> 已移除，改用 <code>review_on_submit_m</code>。</li><li>新增 SWE-bench multilingual / multimodal 与 SWE-smith 支持。</li></ul></div></div>
        </div>
      </section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker="05 · FACTORY FIT" title="它在工厂里的正确位置：研究线与历史兼容层" intro="SWE-agent 不是过时的“坏方案”，而是被更小后继者承接的完整框架。把它用于合适场景，同时把新平台默认指向 mini。" />
        <div className="factory-conveyor" aria-label="完整软件工厂流水线">
          <div className="conveyor-step external"><span>外层补齐</span><GitPullRequest /><strong>接单</strong><p>Issue / 数据集 / 人工任务</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>SWE-agent</span><Layers3 /><strong>加工</strong><p>ACI 工具 <ArrowRight className="inline-arrow" aria-hidden="true" /> 修改 <ArrowRight className="inline-arrow" aria-hidden="true" /> 自测</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step internal"><span>SWE-agent</span><FileCheck2 /><strong>留证</strong><p>traj + preds + logs</p></div><ArrowRight className="conveyor-arrow" />
          <div className="conveyor-step external"><span>外层补齐</span><Shield /><strong>质检与交付</strong><p>SWE-bench / CI <ArrowRight className="inline-arrow" aria-hidden="true" /> 人审 <ArrowRight className="inline-arrow" aria-hidden="true" /> merge</p></div>
        </div>
        <div className="fit-grid">
          <div className="fit-column yes"><h3><CheckCircle2 />特别适合</h3><ul><li>复现 2024–2025 年 SWE-agent / SWE-bench 研究与历史 pipeline。</li><li>研究 Agent-Computer Interface、工具束、prompt 与历史压缩策略。</li><li>需要 run-batch、inspector、merge-preds、quick-stats 这套实验工具。</li><li>维护仍在使用 v1.x YAML 配置或 SWE-smith / 多语评测的团队。</li><li>作为 mini-SWE-agent 的对照组，比较“完整框架”与“最小内核”。</li></ul></div>
          <div className="fit-column no"><h3><XCircle />不适合直接承担</h3><ul><li>新团队的默认生产 Agent 底座——官方推荐改用 mini-SWE-agent。</li><li>需要活跃功能演进、现代平台治理和长期升级承诺的场景。</li><li>把 GitHub Issue 直接接入自动修复并自动合并的无人值守流水线。</li><li>强合规所需的身份、审批、审计、租户隔离与凭证轮换。</li><li>不愿维护 Docker / 云沙箱 / 模型密钥 / 依赖锁的团队。</li></ul></div>
        </div>
        <SourceStrip><SourceLink href="https://swe-agent.com/latest/installation/changelog/">v1.1.0 变更与维护状态</SourceLink><SourceLink href="https://mini-swe-agent.com/latest/">后继者 mini-SWE-agent</SourceLink><SourceLink href="https://arxiv.org/abs/2405.15793">ACI 论文</SourceLink></SourceStrip>
      </section>

      <section className="tinted-section deploy-section" id="deploy">
        <div className="page-width detail-section">
          <SectionHeading kicker="06 · REPRODUCTION" title="先固定 v1.1.0，再选择执行后端" intro="官方安装首选是源码 editable 安装；PyPI 不是本方案当前的可靠分发路径。以下命令除“安装与 CLI 自检”外均属于官方资料整理与本页部署设计。" />
          <div className="verification-stamp"><PackageCheck /><div><strong>本次实际执行验证</strong><p>已克隆并核对 <code>v1.1.0</code>（commit <code>0f3acaf</code>），在隔离临时目录完成源码安装，成功运行 <code>sweagent --help</code>、<code>run --help</code>、<code>run-batch --help</code> 与轨迹查看器帮助。<b>当前沙箱没有 Docker，也没有模型密钥，因此未执行真实 Issue 修复、未调用模型、未运行 SWE-bench。</b></p></div><time>{VERIFY_DATE}</time></div>

          <div className="prereq-layout">
            <div className="prereq-list"><h3>依赖与版本清单</h3><dl>
              <div><dt>Python</dt><dd><strong>≥ 3.11</strong><span>pyproject 强制；示例用 3.11</span></dd></div>
              <div><dt>核心包</dt><dd><strong>sweagent 1.1.0</strong><span>源码 editable 安装</span></dd></div>
              <div><dt>执行后端</dt><dd><strong>SWE-ReX ≥ 1.2.0</strong><span>本次解析到 1.4.0</span></dd></div>
              <div><dt>默认镜像</dt><dd><strong>python:3.11</strong><span>Docker 路线；固定 tag / digest</span></dd></div>
              <div><dt>可选后端</dt><dd><strong>Modal / Fargate / local</strong><span>云端或无沙箱本地</span></dd></div>
              <div><dt>模型接入</dt><dd><strong>litellm</strong><span>OpenAI / Anthropic / Together 等</span></dd></div>
              <div><dt>端口</dt><dd><strong>inspector 默认网页端口</strong><span>CLI 修复任务本身无需常驻端口</span></dd></div>
            </dl></div>
            <div className="directory-board"><h3>建议目录与归属</h3><pre>{`/srv/agent-factory/\n├── .venv/                 # 宿主 Python 环境\n├── vendor/SWE-agent/      # v1.1.0 editable 源码\n├── factory.docker.yaml    # 断网与资源限制\n├── workspace/project/     # 唯一可写仓库副本\n└── runs/                  # task / traj / preds / logs\n\n模型 API key：宿主进程环境或密钥管理器\nGitHub Token：不进容器；私有仓库先由宿主预取`}</pre><p><strong>非 editable 安装注意：</strong>若不是源码 editable 安装，必须额外设置 <code>SWE_AGENT_CONFIG_DIR</code>、<code>SWE_AGENT_TOOLS_DIR</code>、<code>SWE_AGENT_TRAJECTORY_DIR</code>；这也是本页坚持官方源码路线的原因。</p></div>
          </div>
          <CodeBlock title="01 · 安装与入口自检" code={INSTALL_CODE} />
          <CodeBlock title="02 · 密钥边界" code={ENV_CODE} />
          <DeploymentTabs />
          <SourceStrip label="命令依据"><SourceLink href="https://swe-agent.com/latest/installation/source/">源码安装</SourceLink><SourceLink href="https://swe-agent.com/latest/usage/hello_world/">单 Issue 示例</SourceLink><SourceLink href="https://swe-agent.com/latest/usage/batch_mode/">批处理模式</SourceLink><SourceLink href="https://swe-agent.com/latest/config/env/">环境变量</SourceLink></SourceStrip>
        </div>
      </section>

      <section className="tinted-section blue-tint" id="deploy-skill">
        <div className="page-width detail-section">
          <SectionHeading kicker="07 · AGENT SKILL" title="把这份遗产部署手册直接交给 AI Agent" intro="SKILL.md 格式的完整部署指令：frontmatter 声明适用场景，正文内置四条路线选择表、精确命令、密钥边界、八道验收闸门与故障速查。先预览核对结构，再复制或下载。" />
          <DeploySkillCard skill={sweAgentDeploySkill} />
        </div>
      </section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker="08 · AUTOMATION GATE" title="自动化接入：SWE-agent 负责加工，外层系统负责闸门" intro="完整框架依然没有内建现代工厂所需的审批与权限系统。正确接法是让外层调度器取 Issue、预取仓库、调用 CLI，再把轨迹与补丁交给 CI 和人工审阅。" />
        <div className="component-table-wrap">
          <table className="component-table"><caption className="sr-only">SWE-agent 批处理与外层交付各阶段的职责边界</caption><thead><tr><th>阶段</th><th>输入与控制</th><th>产出或职责</th><th>明确边界</th></tr></thead><tbody>
            <tr><th><span className="component-chip yellow">instances</span></th><td>swe_bench / file / huggingface / expert_file</td><td>提供可追踪的批量实验实例。</td><td>实例来源不证明补丁正确，也不授予仓库写权限。</td></tr>
            <tr><th><span className="component-chip green">run-batch</span></th><td>num_workers、独立工作区、退出状态</td><td>并发执行实例并记录失败状态。</td><td>worker 完成不等于全部实例成功。</td></tr>
            <tr><th><span className="component-chip blue">merge-preds</span></th><td>各实例预测与退出状态</td><td>汇总或修复 preds.json。</td><td>只合并预测文件，不执行最终评测或交付。</td></tr>
            <tr><th><span className="component-chip pink">human-review</span></th><td>inspect / inspector / quick-stats</td><td>检查轨迹、成本、补丁和异常实例。</td><td>人工审查不能由 Agent 自评替代。</td></tr>
            <tr><th><span className="component-chip blue">external-eval</span></th><td>SWE-bench harness 或项目 CI</td><td>在 Agent 之外独立验证补丁。</td><td>Agent 不掌握最终评测、推送或合并权限。</td></tr>
          </tbody></table>
        </div>
        <div className="automation-layout"><CodeBlock title="03 · 接单到补丁的外层流水线示例" code={AUTOMATION_CODE} /><div className="automation-notes"><h3>接入前必须回答</h3><ol><li><span>1</span><p><strong>谁能触发？</strong> Issue 文本是不可信输入；公开仓库先由维护者批准，再进入 run。</p></li><li><span>2</span><p><strong>仓库如何进入？</strong> 用 local repo 从宿主上传，避免长期 GITHUB_TOKEN 随 clone URL 进入容器。</p></li><li><span>3</span><p><strong>什么叫成功？</strong> <code>exit_status == "submitted"</code> + 有 submission + 干净环境 CI + 人工审阅。</p></li><li><span>4</span><p><strong>为什么不用它当新底座？</strong> 官方主线维护模式；新自动化应优先 mini 或仍在演进的平台。</p></li></ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>私有仓库红线：</strong><code>GithubRepoConfig</code> 会把 <code>GITHUB_TOKEN</code> 拼进容器内执行的 git remote URL。处理私有或不可信仓库时，改由宿主预取代码并配置 <code>env.repo.type=local</code>。</p></div>
      </section>

      <section className="tinted-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="09 · ACCEPTANCE" title="验收清单：先证明边界，再证明能力" intro="第一次复现不必追求 SWE-bench 分数。先证明版本、密钥、沙箱、轨迹和补丁都可检查，再谈批量。" />
          <ol className="acceptance-grid">
            <li><span>01</span><div><strong>版本可重复</strong><p>git tag 为 v1.1.0；<code>sweagent --help</code> 显示 1.1.0；保存依赖锁。</p></div></li>
            <li><span>02</span><div><strong>配置可解释</strong><p>启动日志包含默认 YAML 与自定义 YAML；模型名、解析器与工具束符合预期。</p></div></li>
            <li><span>03</span><div><strong>执行面隔离</strong><p>Docker 参数含断网、cap-drop、no-new-privileges 与资源上限；不使用 local 处理不可信仓库。</p></div></li>
            <li><span>04</span><div><strong>密钥不越界</strong><p>YAML、Git、容器环境与轨迹扫描均无模型 key；GitHub Token 不进容器。</p></div></li>
            <li><span>05</span><div><strong>限制确实生效</strong><p>演练 execution_timeout、install_timeout、total_execution_timeout 与成本上限。</p></div></li>
            <li><span>06</span><div><strong>轨迹可读取</strong><p><code>.traj</code> 含 query、thought、action、observation、model_stats 与 exit_status。</p></div></li>
            <li><span>07</span><div><strong>补丁可审查</strong><p>submission 非空；应用到干净副本后 <code>git apply --check</code> 与测试通过。</p></div></li>
            <li><span>08</span><div><strong>评测与合并分离</strong><p>run-batch 只产出 preds.json；SWE-bench / CI 与人工最终批准在 Agent 之外。</p></div></li>
          </ol>
          <SweDeploymentDiagram />
        </div>
      </section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker="10 · FAILURE MANUAL" title="常见故障：先分清安装、执行面、模型和解析器" intro="SWE-agent 的报错可能来自 Python 环境、Docker、Modal、模型 provider、function calling 或旧配置迁移。按下面顺序定位。" />
        <div className="trouble-list">
          <details open><summary><span>01</span>sweagent 命令找不到或版本不对<ChevronRight /></summary><div><strong>原因</strong><p>安装到了另一个 Python 环境，或 PyPI 上旧包 / 非预期包干扰。</p><strong>处理</strong><p>确认 <code>which python</code> 与 <code>which sweagent</code> 同属一个 venv；按官方路线从 v1.1.0 源码 <code>pip install --editable .</code>，再运行 <code>python -m sweagent --help</code>。</p></div></details>
          <details><summary><span>02</span>导入时报 config / tools / trajectories 目录不存在<ChevronRight /></summary><div><strong>原因</strong><p>非 editable 安装不会把仓库顶层 config、tools、trajectories 放到包旁。</p><strong>处理</strong><p>优先改走源码 editable；若必须非 editable，设置 <code>SWE_AGENT_CONFIG_DIR</code>、<code>SWE_AGENT_TOOLS_DIR</code>、<code>SWE_AGENT_TRAJECTORY_DIR</code> 指向源码树。</p></div></details>
          <details><summary><span>03</span>启动报 Docker socket 权限或 docker: not found<ChevronRight /></summary><div><strong>原因</strong><p>默认执行后端是 Docker；本机没有 Docker 或当前用户不能访问 daemon。</p><strong>处理</strong><p>先 <code>docker run hello-world</code> 验证；按官方排障页处理 socket / 用户组。没有 Docker 时改用 Modal 路线，而不是退到无沙箱 local。</p><SourceLink href="https://swe-agent.com/latest/installation/tips/">官方 Docker 排障</SourceLink></div></details>
          <details><summary><span>04</span>模型 401 / 404 / 成本统计报错<ChevronRight /></summary><div><strong>原因</strong><p>provider key、模型名、base URL 或 litellm 成本表任一环节出错。本地模型还可能缺 provider 前缀。</p><strong>处理</strong><p>只检查变量是否存在，不打印密钥；模型名使用 <code>provider/model</code> 或官方示例名。本地模型把成本限制设为 0，并设置 <code>max_input_tokens</code>。</p><SourceLink href="https://swe-agent.com/latest/installation/keys/">模型与密钥配置</SourceLink></div></details>
          <details><summary><span>05</span>模型不返回合法动作<ChevronRight /></summary><div><strong>原因</strong><p>默认解析器是 function_calling；模型不支持工具调用或模板没写清工具格式。</p><strong>处理</strong><p>换支持 function calling 的模型，或把 <code>agent.tools.parse_function.type</code> 改为 <code>thought_action</code>，同时确保模板向模型展示工具文档。</p></div></details>
          <details><summary><span>06</span>旧配置提示 review_on_submit 或工具束不存在<ChevronRight /></summary><div><strong>原因</strong><p>v1.1.0 重命名了多个 windowed 工具束，并移除了 <code>review_on_submit</code>。</p><strong>处理</strong><p>按 v1.1.0 changelog 迁移到 <code>review_on_submit_m</code> 与新 bundle 名；不要把 v0.7 / v1.0 YAML 原样套用到本页。</p><SourceLink href="https://swe-agent.com/latest/installation/changelog/">v1.1.0 破坏性变更</SourceLink></div></details>
          <details><summary><span>07</span>批处理只有部分实例，preds.json 缺失或过期<ChevronRight /></summary><div><strong>原因</strong><p>worker 异常、实例未完成或目录中有历史结果。run-batch 不会自动证明所有预测最新。</p><strong>处理</strong><p>看 <code>run_batch_exit_statuses.yaml</code> 与实例日志；用 <code>sweagent remove-unfinished</code> 清理后在实验目录运行 <code>sweagent merge-preds</code>。</p></div></details>
        </div>
      </section>

      <section className="risk-section">
        <div className="page-width detail-section">
          <SectionHeading kicker="11 · RISK & LIFECYCLE" title="最大风险不是技术旧，而是把维护期项目当新底座" intro="SWE-agent 的 ACI 思想仍然重要，但生命周期、密钥边界和执行隔离必须一起写进采用决策。" />
          <div className="risk-grid">
            <div className="risk-card high"><span>高</span><h3>官方已进入维护模式</h3><p>README 与文档明确推荐 mini-SWE-agent。新平台默认选 mini；SWE-agent 只用于历史兼容、研究对照或必须复现的 pipeline。</p></div>
            <div className="risk-card high"><span>高</span><h3>Token 可能进入容器命令</h3><p>GitHubRepoConfig 会把 GITHUB_TOKEN 拼进容器内 git URL。私有仓库应由宿主预取并 local 上传，或使用短期、最小权限凭证。</p></div>
            <div className="risk-card high"><span>高</span><h3>Issue 与仓库提示注入</h3><p>模型会执行来自任务文本诱导的 shell。断网、资源限制、干净副本、CI 与人工合并缺一不可。</p></div>
            <div className="risk-card medium"><span>中</span><h3>本地模型 / function calling 错配</h3><p>默认解析器假设模型支持工具调用；本地模型还要关闭成本追踪并处理 prompt cache 配置，否则会在第一步失败。</p></div>
            <div className="risk-card medium"><span>中</span><h3>轨迹泄漏</h3><p>轨迹保存 query、源码、命令输出与路径；可能包含误打印的密钥。runs/ 需限权、保留期与脱敏。</p></div>
            <div className="risk-card low"><span>治理</span><h3>Benchmark 语境不可迁移</h3><p>官方 SWE-bench 成绩依赖特定模型、预算与数据集；不能直接承诺在你的私有仓库上达到同样修复率。</p></div>
          </div>

          <div className="lifecycle-grid">
            <div><h3><Clock3 />升级 / 迁移流程</h3><ol><li>固定 v1.1.0 与依赖锁；备份 YAML、runs/、镜像 digest 与实验说明。</li><li>新需求先评估 mini-SWE-agent；确需留在 SWE-agent 时，只跟踪安全与必要修复。</li><li>跨版本前核对 trajectory 字段、工具束名、解析器与 SWE-ReX 接口。</li><li>用同一小任务比较新旧框架的成本、轨迹结构与补丁质量。</li><li>保留旧源码环境与实验输出，直到新路线通过完整验收。</li></ol></div>
            <div><h3><CircleDollarSign />备份与成本控制</h3><ul><li>备份自定义 YAML、runs/、任务清单、依赖锁与镜像 digest；不备份明文密钥。</li><li>单实例与总成本限制同时设置；provider 侧再设预算与告警。</li><li>批处理先用 slice=:3、num_workers=3 烟测，再按日志扩大。</li><li>轨迹与 preds 是研究资产，但也可能含敏感代码；按内部日志等级保护。</li></ul></div>
          </div>
        </div>
      </section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker="12 · SOURCES" title="主要来源与核验范围" intro={`官方事实核验日期：${VERIFY_DATE}。社区内容仅用于发现故障线索，不作为版本与维护状态依据。`} />
        <div className="source-list">
          <a href="https://github.com/SWE-agent/SWE-agent" target="_blank" rel="noreferrer"><span>01</span><div><strong>官方 GitHub 仓库</strong><p>README、MIT、维护状态与源码入口</p></div><ArrowUpRight /></a>
          <a href="https://github.com/SWE-agent/SWE-agent/releases/tag/v1.1.0" target="_blank" rel="noreferrer"><span>02</span><div><strong>Release v1.1.0</strong><p>2025-05-22；SWE-smith 与多语 / 多模态支持</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/installation/changelog/" target="_blank" rel="noreferrer"><span>03</span><div><strong>官方 Changelog</strong><p>维护模式、v1.1.0 破坏性变更与修复清单</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/background/architecture/" target="_blank" rel="noreferrer"><span>04</span><div><strong>官方架构文档</strong><p>CLI、Agent、SWEEnv、SWE-ReX 与 ACI 关系</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/background/aci/" target="_blank" rel="noreferrer"><span>05</span><div><strong>ACI 设计说明</strong><p>文件查看、搜索、编辑与 linter 的设计动机</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/installation/source/" target="_blank" rel="noreferrer"><span>06</span><div><strong>源码安装文档</strong><p>editable install、Docker 前置与 GUI 依赖</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/hello_world/" target="_blank" rel="noreferrer"><span>07</span><div><strong>Hello world / 单 Issue</strong><p>run 命令、模型 key 与执行阶段</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/batch_mode/" target="_blank" rel="noreferrer"><span>08</span><div><strong>Batch mode</strong><p>run-batch、实例来源、workers 与 preds.json</p></div><ArrowUpRight /></a>
          <a href="https://swe-agent.com/latest/usage/trajectories/" target="_blank" rel="noreferrer"><span>09</span><div><strong>Trajectory 输出</strong><p>query 字段、日志结构与实验目录布局</p></div><ArrowUpRight /></a>
        </div>
        <div className="research-boundary"><AlertTriangle /><p><strong>没有写成结论的内容：</strong>未调用模型、未运行 Docker、未执行真实 Issue 修复、未复测 SWE-bench 分数，也未验证所有 SWE-ReX 云后端。官方 “state of the art” 表述保留在其历史 benchmark 语境中；本页的采用建议是“遗产兼容与研究”，不是“新生产默认”。</p></div>
      </section>

      <nav className="next-solution page-width" aria-label="继续浏览"><Link to="/"><ArrowLeft />返回可搜索方案库</Link><Link to="/solutions/mini-swe-agent"><span>对比阅读<small>mini-SWE-agent v2.4.6 · 官方后继者</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
