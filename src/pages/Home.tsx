import { useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, Search, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'
import { solutions, solutionsEn, type Solution } from '../data/solutions'
import type { Locale } from '../locale'

function SolutionCard({ solution, index, locale }: { solution: Solution; index: number; locale: Locale }) {
  const isEnglish = locale === 'en'
  const basePath = `/solutions/${solution.slug}`
  const path = isEnglish ? `/en${basePath}` : basePath
  return <article className={`solution-card ${solution.tone}`}>
    <div className="solution-index">{String(index + 1).padStart(2, '0')}</div>
    <div className="solution-main">
      <div className="solution-meta"><span><ShieldCheck size={14} />{isEnglish ? 'Verified' : '核验'} {solution.verifiedAt}</span><span>{solution.license} License</span></div>
      <h3><Link to={path}>{solution.title}</Link></h3>
      <h4>{solution.subtitle}</h4>
      <p>{solution.description}</p>
      <div className="tag-row">{solution.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </div>
    <div className="solution-side">
      <span className="version-sticker">{solution.version}</span>
      <p>{solution.stars}</p>
      <Link className="round-link" to={path} aria-label={isEnglish ? `Read the ${solution.title} analysis` : `查看 ${solution.title} 完整分析`}><ArrowUpRight /></Link>
    </div>
  </article>
}

export default function Home({ locale = 'zh' }: { locale?: Locale }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const isEnglish = locale === 'en'
  const homePath = isEnglish ? '/en' : '/'
  const data = isEnglish ? solutionsEn : solutions
  const filters = [
    { id: 'all', label: isEnglish ? 'All' : '全部' },
    { id: '仓库自治', label: isEnglish ? 'Repository automation' : '仓库自治' },
    { id: '编程 Agent', label: isEnglish ? 'Coding agents' : '编程 Agent' },
  ]
  const filtered = useMemo(() => data.filter((solution) => {
    const matchesFilter = filter === 'all' || solution.category === filter
    const haystack = `${solution.title} ${solution.subtitle} ${solution.description} ${solution.tags.join(' ')}`.toLowerCase()
    return matchesFilter && haystack.includes(query.trim().toLowerCase())
  }), [data, filter, query])

  return <PageShell>
    <section className="home-hero page-width">
      <div className="hero-copy">
        <span className="hand-label">DAILY OPEN-SOURCE FIELD NOTES · 2026</span>
        <h1>{isEnglish ? <>Make “factories that<br />write software with Agents”<br /><span className="circled">reproducible.</span></> : <>把“用 Agent<br />写软件的工厂”<span className="whitespace-nowrap">拆成</span><br /><span className="circled">可复现的图纸</span></>}</h1>
        <p>{isEnglish ? 'Every day, we select one open-source solution and use official sources to map its architecture, runtime workflow, local deployment, and security boundaries. Less feature-listing, more evidence you can run.' : '每天只选一个开源方案，从官方资料拆解它的架构、运行链路、本地部署与安全边界。少一点功能罗列，多一点真正跑得通的证据。'}</p>
        <div className="hero-actions">
          <Link className="primary-link" to={{ pathname: homePath, hash: '#library' }}>{isEnglish ? 'Browse the library' : '浏览方案库'} <ArrowDown size={18} /></Link>
          <Link className="text-link" to={isEnglish ? '/en/solutions/swe-agent' : '/solutions/swe-agent'}>{isEnglish ? 'Latest: SWE-agent v1.1.0' : '最新：SWE-agent v1.1.0'} <ArrowRight size={17} /></Link>
        </div>
      </div>
      <div className="hero-sketch" role="img" aria-label={isEnglish ? 'An Agent software factory pipeline from a requirement through planning, coding, and testing to a human-reviewed delivery' : '从需求、规划、编码、测试到人工验收交付的 Agent 软件工厂流程示意图'}>
        <span className="tape" aria-hidden="true" />
        <div className="sketch-title">{isEnglish ? 'An Agent factory, on paper' : '一座 Agent 工厂的纸面模型'}</div>
        <div className="sketch-flow">
          <div className="sketch-node yellow"><span><small>01 / INPUT</small><br /><strong>{isEnglish ? 'Requirement & repository context' : '需求与仓库上下文'}</strong></span><BookOpen size={23} /></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node pink"><span><small>02 / ORCHESTRATE</small><br /><strong>{isEnglish ? 'Task planning & role orchestration' : '任务规划与角色编排'}</strong></span><span>⌘</span></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node green"><span><small>03 / EXECUTE</small><br /><strong>{isEnglish ? 'Sandboxed implementation & self-review' : '沙箱执行与自主修正'}</strong></span><Check size={24} /></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node blue"><span><small>04 / VERIFY</small><br /><strong>{isEnglish ? 'Tests, review & human acceptance' : '测试、评审与人工验收'}</strong></span><ShieldCheck size={23} /></div>
        </div>
        <div className="sketch-output"><span>OUTPUT</span><strong>patch + evidence + decision</strong></div>
        <p>{isEnglish ? 'Working software, not a chat log.' : '交付的是可运行代码，不是一段聊天记录。'}</p>
      </div>
    </section>

    <section className="library-section page-width" id="library">
      <div className="library-heading"><div><span className="hand-label">01 · SOLUTION LIBRARY</span><h2>{isEnglish ? 'Choose the right engine first' : '先选适合你的工厂引擎'}</h2></div><p><strong>{String(data.length).padStart(2, '0')}</strong> {isEnglish ? 'solutions indexed' : '个方案已收录'}</p></div>
      <div className="library-tools">
        <label className="search-box"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEnglish ? 'Search by solution, technology, or scenario' : '搜索方案、技术或场景'} aria-label={isEnglish ? 'Search the solution library' : '搜索方案库'} />{query && <button type="button" onClick={() => setQuery('')} aria-label={isEnglish ? 'Clear search' : '清空搜索'}><X size={17} /></button>}</label>
        <div className="filter-group" aria-label={isEnglish ? 'Filter by category' : '按类型筛选'}>{filters.map((item) => <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id}>{item.label}</button>)}</div>
      </div>
      <div className="solution-list">
        {filtered.map((solution) => <SolutionCard key={solution.slug} solution={solution} index={data.indexOf(solution)} locale={locale} />)}
        {filtered.length === 0 && <div className="empty-state"><h3>{isEnglish ? 'No matching notes yet' : '暂时没有匹配的研究便签'}</h3><p>{isEnglish ? 'Try a shorter keyword or clear the category filter.' : '试试更短的关键词，或清除类型筛选。'}</p><button type="button" onClick={() => { setQuery(''); setFilter('all') }}>{isEnglish ? 'Reset filters' : '重置筛选'}</button></div>}
      </div>
    </section>

    <section className="method-section" id="method">
      <div className="method-grid page-width">
        <div><span className="hand-label">02 · OUR METHOD</span><h2>{isEnglish ? <>One solution a day.<br />Four evidence layers.</> : <>每天一个方案，<br />四层证据拆解。</>}</h2><p>{isEnglish ? 'We evaluate each open-source project as a production candidate, not a promotional page. Official facts and local checks are labeled separately.' : '不把开源项目写成宣传页，而是当成一次生产候选评估。官方事实与本地实测分开标注。'}</p></div>
        <ol className="method-list">
          <li><span>1</span><div><strong>{isEnglish ? 'Architecture map' : '架构地图'}</strong><p>{isEnglish ? 'Core components, data flow, model and tool boundaries, and extension interfaces.' : '核心组件、数据流、模型与工具边界、扩展接口。'}</p></div></li>
          <li><span>2</span><div><strong>{isEnglish ? 'Reproduction manual' : '复现手册'}</strong><p>{isEnglish ? 'Dependencies, exact commands, configuration templates, directory layout, and verification.' : '依赖版本、精确命令、配置模板、目录结构与验证结果。'}</p></div></li>
          <li><span>3</span><div><strong>{isEnglish ? 'Engineering acceptance' : '工程验收'}</strong><p>{isEnglish ? 'Permissions, secrets, testing, failure recovery, cost, and maintenance signals.' : '权限、密钥、测试、失败恢复、成本与维护信号。'}</p></div></li>
          <li><span>4</span><div><strong>{isEnglish ? 'Fit assessment' : '适配判断'}</strong><p>{isEnglish ? 'What it suits, what it does not, and which gaps still require other systems.' : '适合什么、不适合什么，以及还需要补齐哪些系统。'}</p></div></li>
        </ol>
      </div>
    </section>

    <section className="changelog-section page-width" id="changelog">
      <span className="hand-label">03 · CHANGELOG</span><h2>{isEnglish ? 'Research log' : '调研更新记录'}</h2>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot yellow" /><div><strong>{isEnglish ? 'SWE-agent v1.1.0 · Legacy line indexed' : '收录 SWE-agent v1.1.0 · 遗产研究线'}</strong><p>{isEnglish ? 'ACI and component responsibilities, source installation, hardened Docker / Modal routes, batch pipelines, migration boundaries, and the official maintenance notice.' : 'ACI 与组件分工、源码安装、加固 Docker / Modal 路线、批处理、迁移边界与官方维护状态说明。'}</p></div></div>
      <div className="changelog-row"><time>2026-11-21</time><span className="changelog-dot green" /><div><strong>{isEnglish ? 'mini-SWE-agent v2.4.6 added' : '收录 mini-SWE-agent v2.4.6'}</strong><p>{isEnglish ? 'Minimal closed loop, trajectory contracts, local / Docker routes, cost and security controls, and acceptance gates. Package import and CLI help were checked in an isolated environment.' : '最小闭环、轨迹契约、本地 / Docker 路线、成本与安全闸门、八道验收清单；隔离环境已实测包导入与 CLI 入口。'}</p></div></div>
      <div className="changelog-row"><time>2026-11-20</time><span className="changelog-dot pink" /><div><strong>{isEnglish ? 'First note: OpenHands Agent Canvas v1.43.0' : '首期上线：OpenHands Agent Canvas v1.43.0'}</strong><p>{isEnglish ? 'Conversation / Plan architecture, Electron + FastAPI startup chain, local Docker reproduction, GitHub PR automation, and real environment checks.' : 'Conversation / Plan 双界面架构、Electron + FastAPI 启动链、本地 Docker 复现、GitHub PR 自动化与真实环境验证。'}</p></div></div>
      <div className="changelog-row"><time>{isEnglish ? 'Every day' : '每天'}</time><span className="changelog-dot blue" /><div><strong>{isEnglish ? 'One new reproducible open-source solution' : '新增一个可复现的开源方案'}</strong><p>{isEnglish ? 'Selection favors active projects with clear differentiation, complete documentation, and local reproduction potential.' : '优先选择仍在维护、定位有差异、文档完整且具备本地复现条件的项目。'}</p></div></div>
    </section>
  </PageShell>
}
