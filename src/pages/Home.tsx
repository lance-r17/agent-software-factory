import { useMemo, useState } from 'react'
import { Archive, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, Search, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'
import CandidateSubmission from '../components/CandidateSubmission'
import { solutions, solutionsEn, type Solution } from '../data/solutions'
import { homeContent } from '../data/solutionContent/homeContent'
import type { Locale } from '../locale'

const archiveStrings = {
  zh: { show: '显示已归档', hide: '隐藏已归档', badge: '已归档', count: '个已归档', toggleAria: '切换显示已归档方案' },
  en: { show: 'Show archived', hide: 'Hide archived', badge: 'Archived', count: 'archived', toggleAria: 'Toggle archived solutions' },
}

function SolutionCard({ solution, index, locale }: { solution: Solution; index: number; locale: Locale }) {
  const isEnglish = locale === 'en'
  const c = homeContent[locale]
  const a = archiveStrings[locale]
  const archived = solution.lifecycle === 'archived'
  const basePath = `/solutions/${solution.slug}`
  const path = isEnglish ? `/en${basePath}` : basePath
  return <article className={`solution-card ${solution.tone}${archived ? ' is-archived' : ''}`}>
    <div className="solution-index">{String(index + 1).padStart(2, '0')}</div>
    <div className="solution-main">
      <div className="solution-meta"><span><ShieldCheck size={14} />{c.card.verified} {solution.verifiedAt}</span><span>{solution.license} License</span>{archived && <span className="archive-badge"><Archive size={13} />{a.badge} {solution.archivedAt}</span>}</div>
      <h3><Link to={path}>{solution.title}</Link></h3>
      <h4>{solution.subtitle}</h4>
      <p>{solution.description}</p>
      {archived && solution.archiveReason && <p className="archive-card-reason">{solution.archiveReason}</p>}
      <div className="tag-row">{solution.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </div>
    <div className="solution-side">
      <span className="version-sticker">{solution.version}</span>
      <p>{solution.stars}</p>
      <Link className="round-link" to={path} aria-label={`${c.card.readPrefix}${solution.title}${c.card.readSuffix}`}><ArrowUpRight /></Link>
    </div>
  </article>
}

export default function Home({ locale = 'zh' }: { locale?: Locale }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const isEnglish = locale === 'en'
  const c = homeContent[locale]
  const a = archiveStrings[locale]
  const homePath = isEnglish ? '/en' : '/'
  const data = isEnglish ? solutionsEn : solutions
  const archivedCount = useMemo(() => data.filter((solution) => solution.lifecycle === 'archived').length, [data])
  const activeCount = data.length - archivedCount
  const filters = [
    { id: 'all', label: c.library.filterLabels[0] },
    { id: '仓库自治', label: c.library.filterLabels[1] },
    { id: '编程 Agent', label: c.library.filterLabels[2] },
  ]
  const filtered = useMemo(() => data.filter((solution) => {
    if (!showArchived && solution.lifecycle === 'archived') return false
    const matchesFilter = filter === 'all' || solution.category === filter
    const haystack = `${solution.title} ${solution.subtitle} ${solution.description} ${solution.tags.join(' ')}`.toLowerCase()
    return matchesFilter && haystack.includes(query.trim().toLowerCase())
  }), [data, filter, query, showArchived])

  return <PageShell>
    <section className="home-hero page-width">
      <div className="hero-copy">
        <span className="hand-label">{c.hero.kicker}</span>
        <h1>{c.hero.title}</h1>
        <p>{c.hero.body}</p>
        <div className="hero-actions">
          <Link className="primary-link" to={{ pathname: homePath, hash: '#library' }}>{c.hero.browse} <ArrowDown size={18} /></Link>
          <Link className="text-link" to={isEnglish ? '/en/solutions/scion' : '/solutions/scion'}>{c.hero.latest} <ArrowRight size={17} /></Link>
          <Link className="text-link" to={{ pathname: homePath, hash: '#submit' }}>{isEnglish ? 'Submit a candidate' : '推荐开源项目'} <ArrowUpRight size={16} /></Link>
        </div>
      </div>
      <div className="hero-sketch" role="img" aria-label={c.hero.sketchAria}>
        <span className="tape" aria-hidden="true" />
        <div className="sketch-title">{c.hero.sketchTitle}</div>
        <div className="sketch-flow">
          <div className="sketch-node yellow"><span><small>01 / INPUT</small><br /><strong>{c.hero.nodes[0]}</strong></span><BookOpen size={23} /></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node pink"><span><small>02 / ORCHESTRATE</small><br /><strong>{c.hero.nodes[1]}</strong></span><span>⌘</span></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node green"><span><small>03 / EXECUTE</small><br /><strong>{c.hero.nodes[2]}</strong></span><Check size={24} /></div>
          <ArrowDown className="sketch-arrow" />
          <div className="sketch-node blue"><span><small>04 / VERIFY</small><br /><strong>{c.hero.nodes[3]}</strong></span><ShieldCheck size={23} /></div>
        </div>
        <div className="sketch-output"><span>OUTPUT</span><strong>patch + evidence + decision</strong></div>
        <p>{c.hero.sketchFooter}</p>
      </div>
    </section>

    <section className="library-section page-width" id="library">
      <div className="library-heading"><div><span className="hand-label">{c.library.kicker}</span><h2>{c.library.title}</h2></div><p><strong>{String(activeCount).padStart(2, '0')}</strong> {c.library.countLabel}{archivedCount > 0 && <span className="archived-count"> · {archivedCount} {a.count}</span>}</p></div>
      <div className="library-tools">
        <label className="search-box"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.library.searchPlaceholder} aria-label={c.library.searchAria} />{query && <button type="button" onClick={() => setQuery('')} aria-label={c.library.clearAria}><X size={17} /></button>}</label>
        <div className="filter-group" aria-label={c.library.filterAria}>{filters.map((item) => <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} aria-pressed={item.id === filter}>{item.label}</button>)}</div>
      </div>
      {archivedCount > 0 && <div className="archive-toggle-row">
        <button type="button" className={`archive-toggle${showArchived ? ' active' : ''}`} onClick={() => setShowArchived(!showArchived)} aria-pressed={showArchived} aria-label={a.toggleAria}>
          <Archive size={16} />{showArchived ? a.hide : a.show}（{archivedCount}）
        </button>
        <Link className="text-link" to={isEnglish ? '/en/archive' : '/archive'}>{isEnglish ? 'Archive page' : '归档页'} <ArrowUpRight size={14} /></Link>
      </div>}
      <div className="solution-list">
        {filtered.map((solution) => <SolutionCard key={solution.slug} solution={solution} index={data.indexOf(solution)} locale={locale} />)}
        {filtered.length === 0 && <div className="empty-state"><h3>{c.library.emptyTitle}</h3><p>{c.library.emptyBody}</p><button type="button" onClick={() => { setQuery(''); setFilter('all') }}>{c.library.reset}</button></div>}
      </div>
    </section>

    <CandidateSubmission locale={locale} />

    <section className="method-section" id="method">
      <div className="method-grid page-width">
        <div><span className="hand-label">{c.method.kicker}</span><h2>{c.method.title}</h2><p>{c.method.intro}</p></div>
        <ol className="method-list">{c.method.steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.body}</p></div></li>)}</ol>
      </div>
    </section>

    <section className="changelog-section page-width" id="changelog">
      <span className="hand-label">{c.changelog.kicker}</span><h2>{c.changelog.title}</h2>
      {c.changelog.entries.map(entry => <div className="changelog-row" key={`${entry.date}-${entry.title}`}><time>{entry.date}</time><span className={`changelog-dot ${entry.tone}`} /><div><strong>{entry.title}</strong><p>{entry.body}</p></div></div>)}
    </section>
  </PageShell>
}
