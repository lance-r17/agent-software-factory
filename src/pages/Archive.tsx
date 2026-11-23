import { Archive, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'
import { solutions, solutionsEn } from '../data/solutions'
import type { Locale } from '../locale'

const content = {
  zh: {
    kicker: 'ARCHIVE',
    title: '归档方案',
    intro: '这些方案的上游已停止维护或进入维护模式。每次归档都保留最后一次调研的完整内容，仅供历史参考；归档不代表删除，详情页与部署手册仍可查阅。',
    emptyTitle: '暂无归档方案',
    emptyBody: '当前收录的方案都在活跃维护中。',
    columns: ['方案', '冻结版本', '调研日期', '归档日期', '归档原因'],
    detail: '查看完整调研',
    successor: '继任方案',
    evidence: '归档证据',
    home: '返回方案库',
  },
  en: {
    kicker: 'ARCHIVE',
    title: 'Archived solutions',
    intro: 'These upstream projects are unmaintained or in maintenance mode. Every archive preserves the full research from its last verification for historical reference; archiving never deletes detail pages or deployment manuals.',
    emptyTitle: 'No archived solutions',
    emptyBody: 'Every indexed solution is actively maintained.',
    columns: ['Solution', 'Pinned version', 'Researched', 'Archived', 'Reason'],
    detail: 'Read the full research',
    successor: 'Successor',
    evidence: 'Archive evidence',
    home: 'Back to the library',
  },
}

export default function ArchivePage({ locale = 'zh' }: { locale?: Locale }) {
  const isEnglish = locale === 'en'
  const c = content[locale]
  const data = (isEnglish ? solutionsEn : solutions).filter((item) => item.lifecycle === 'archived')
  const homePath = isEnglish ? '/en' : '/'

  return <PageShell>
    <section className="archive-page page-width">
      <span className="hand-label">{c.kicker}</span>
      <h1>{c.title}</h1>
      <p className="archive-intro">{c.intro}</p>
      {data.length === 0 && <div className="empty-state"><h3>{c.emptyTitle}</h3><p>{c.emptyBody}</p></div>}
      <div className="archive-list">
        {data.map((solution) => {
          const path = `${isEnglish ? '/en' : ''}/solutions/${solution.slug}`
          return <article className="archive-row" key={solution.slug}>
            <div className="archive-row-main">
              <h2><Link to={path}>{solution.title}</Link></h2>
              <dl className="archive-facts">
                <div><dt>{c.columns[1]}</dt><dd>{solution.version}</dd></div>
                <div><dt>{c.columns[2]}</dt><dd>{solution.verifiedAt}</dd></div>
                <div><dt>{c.columns[3]}</dt><dd>{solution.archivedAt}</dd></div>
              </dl>
              <p className="archive-reason"><Archive size={15} aria-hidden="true" />{solution.archiveReason}</p>
              <div className="archive-links">
                <Link className="text-link" to={path}>{c.detail} <ArrowUpRight size={15} /></Link>
                {solution.archiveEvidenceUrl && <a className="text-link" href={solution.archiveEvidenceUrl} target="_blank" rel="noreferrer">
                  {c.evidence} <ArrowUpRight size={15} />
                </a>}
                {solution.successorSlug && <Link className="text-link" to={`${isEnglish ? '/en' : ''}/solutions/${solution.successorSlug}`}>
                  {c.successor}: {solution.successorSlug} <ArrowUpRight size={15} />
                </Link>}
              </div>
            </div>
          </article>
        })}
      </div>
      <Link className="text-link archive-home" to={homePath}>{c.home}</Link>
    </section>
  </PageShell>
}
