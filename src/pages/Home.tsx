import { useMemo, useState } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowRight, CalendarDays, Search, X } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'
import { solutions } from '../data/solutions'

const filters = ['全部', '单 Agent', '多 Agent']

export default function Home() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('全部')
  const results = useMemo(() => solutions.filter((solution) => {
    const inFilter = filter === '全部' || solution.paradigm === filter
    const haystack = [solution.name, solution.chineseName, solution.summary, ...solution.tags].join(' ').toLowerCase()
    return inFilter && haystack.includes(query.trim().toLowerCase())
  }), [query, filter])

  return <PageShell>
    <section className="home-hero page-width">
      <div className="hero-copy">
        <div className="hand-label">DAILY FIELD NOTES · 2026.11.21</div>
        <h1>把“会写代码的 Agent”<br />拆成一座<span className="circled">看得懂的工厂</span></h1>
        <p>不按 Star 排名，不复述营销话术。每天只研究一个开源方案：核对维护状态，画清控制流，把本地复现、安全边界和验收闸门写到可执行。</p>
        <div className="hero-actions">
          <Link className="primary-link" to={{ pathname: '/', hash: '#library' }}>浏览 {solutions.length} 个方案 <ArrowRight size={18} /></Link>
          <Link className="text-link" to="/solutions/swe-agent">阅读今日深挖</Link>
        </div>
      </div>
      <div className="hero-sketch" aria-label="从任务到可审查补丁的软件工厂示意图">
        <span className="tape" aria-hidden="true" />
        <div className="sketch-title">一座最小工厂，要有闭环</div>
        <div className="sketch-flow">
          <div className="sketch-node yellow"><small>01 / 接单</small><strong>Issue + 仓库</strong></div>
          <ArrowDown className="sketch-arrow" aria-hidden="true" />
          <div className="sketch-node green"><small>02 / 加工</small><strong>模型 <ArrowLeftRight className="inline-arrow" aria-hidden="true" /> bash</strong></div>
          <ArrowDown className="sketch-arrow" aria-hidden="true" />
          <div className="sketch-node blue"><small>03 / 质检</small><strong>测试 + 审查</strong></div>
        </div>
        <div className="sketch-output"><span>交付物</span><strong>patch · tests · trajectory.json</strong></div>
        <p>注意：模型提交不等于工厂验收。</p>
      </div>
    </section>

    <section className="library-section page-width" id="library">
      <div className="library-heading">
        <div><span className="hand-label">OPEN-SOURCE LIBRARY</span><h2>可搜索的方案库</h2></div>
        <p><strong>{results.length}</strong> / {solutions.length} 个方案</p>
      </div>
      <div className="library-tools">
        <label className="search-box"><Search size={20} aria-hidden="true" /><span className="sr-only">搜索方案</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、部署方式、组件…" type="search" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><X size={18} /></button>}
        </label>
        <div className="filter-group" aria-label="按 Agent 类型筛选">
          {filters.map((item) => <button key={item} type="button" className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </div>
      <div className="solution-list" aria-live="polite">
        {results.map((solution, index) => <article className={`solution-card ${solution.accent}`} key={solution.slug}>
          <div className="solution-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
          <div className="solution-main">
            <div className="solution-meta"><span>{solution.paradigm}</span><span><CalendarDays size={14} /> 核验 {solution.date}</span></div>
            <h3><Link to={solution.route}>{solution.name}</Link></h3>
            <h4>{solution.chineseName}</h4>
            <p>{solution.summary}</p>
            <div className="tag-row">{solution.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
          <div className="solution-side"><span className="version-sticker">{solution.version}</span><p>{solution.status}</p><Link className="round-link" to={solution.route} aria-label={`查看 ${solution.name} 详情`}><ArrowRight /></Link></div>
        </article>)}
        {results.length === 0 && <div className="empty-state"><h3>没有找到匹配方案</h3><p>试试“Docker”“单 Agent”或清空关键词。</p><button type="button" onClick={() => { setQuery(''); setFilter('全部') }}>重置筛选</button></div>}
      </div>
    </section>

    <section className="method-section" id="method">
      <div className="page-width method-grid">
        <div><span className="hand-label">HOW WE READ</span><h2>先看系统边界，<br />再看 benchmark。</h2><p>高分只说明特定模型、任务和预算下的结果。能否进入工程团队，要看它如何接任务、执行命令、保存证据以及阻止危险变更。</p></div>
        <ol className="method-list">
          <li><span>1</span><div><strong>官方事实</strong><p>Release、源码、默认配置、迁移指南；记录核验日期。</p></div></li>
          <li><span>2</span><div><strong>完整闭环</strong><p>任务输入 <ArrowRight className="inline-arrow" aria-hidden="true" /> 模型决策 <ArrowRight className="inline-arrow" aria-hidden="true" /> 工具执行 <ArrowRight className="inline-arrow" aria-hidden="true" /> 观察反馈 <ArrowRight className="inline-arrow" aria-hidden="true" /> 测试与交付。</p></div></li>
          <li><span>3</span><div><strong>失败路径</strong><p>超时、超预算、格式错误、权限越界、密钥泄漏都要有出口。</p></div></li>
          <li><span>4</span><div><strong>复现与验收</strong><p>命令可复制，但未实际执行的步骤绝不写成“已跑通”。</p></div></li>
        </ol>
      </div>
    </section>

    <section className="changelog-section page-width" id="changelog">
      <span className="hand-label">CHANGELOG</span><h2>更新记录</h2>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot blue" /><div><strong>额外新增 SWE-agent v1.1.0</strong><p>收录完整 ACI 框架的遗产版分析：维护状态、SWE-ReX 架构、轨迹格式变化、四条复现路线与密钥红线；定位为历史兼容与研究对照。</p></div></div>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot blue" /><div><strong>方案页新增部署 Skill</strong><p>每个方案附一份 SKILL.md 格式的部署指令：内置路线选择表、验收闸门与故障速查，支持全文预览、一键复制与 .md 下载，可直接交给 AI Agent 执行部署。</p></div></div>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot green" /><div><strong>新增 mini-SWE-agent v2.4.6</strong><p>补充 v2 控制流、Docker 部署模板、自动化闸门、常见故障与 LiteLLM 供应链提醒。</p></div></div>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot pink" /><div><strong>重新核验 OpenHands Agent Canvas v1.43.0</strong><p>历史快照升级为完整调研：服务架构、事件流、官方软件工厂流水线、四条部署路线与凭证治理。</p></div></div>
      <div className="changelog-row"><time>2026-11-20</time><span className="changelog-dot pink" /><div><strong>收录 OpenHands Agent Canvas v1.42.0</strong><p>初版收录（历史快照，已被 11-21 的完整调研取代）。</p></div></div>
    </section>
  </PageShell>
}
