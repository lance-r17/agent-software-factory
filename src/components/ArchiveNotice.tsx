import { Archive, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { solutions, solutionsEn, type Solution } from '../data/solutions'
import type { Locale } from '../locale'

export function getArchivedSolution(slug: string, locale: Locale): Solution | undefined {
  const data = locale === 'en' ? solutionsEn : solutions
  const solution = data.find((item) => item.slug === slug)
  return solution?.lifecycle === 'archived' ? solution : undefined
}

export function ArchiveNotice({ solution, locale }: { solution: Solution; locale: Locale }) {
  const isEnglish = locale === 'en'
  if (solution.lifecycle !== 'archived' || !solution.archivedAt) return null
  const successor = solution.successorSlug
  return <section className="archive-notice page-width" role="note">
    <Archive size={20} aria-hidden="true" />
    <div>
      <strong>{isEnglish ? `Archived on ${solution.archivedAt}` : `本方案已于 ${solution.archivedAt} 归档`}</strong>
      <p>{solution.archiveReason}</p>
      <p>{isEnglish
        ? `This page preserves the research verified on ${solution.verifiedAt} and is kept for historical reference only.`
        : `本页保留 ${solution.verifiedAt} 的调研内容，仅供历史参考。`}</p>
      {successor && <Link className="archive-successor" to={`${isEnglish ? '/en' : ''}/solutions/${successor}`}>
        {isEnglish ? 'See the successor solution' : '查看继任方案'} <ArrowUpRight size={15} />
      </Link>}
    </div>
  </section>
}
