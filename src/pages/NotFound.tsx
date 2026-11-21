import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'
import { useLocale } from '../locale'

export default function NotFound() {
  const isEnglish = useLocale() === 'en'
  return <PageShell><section className="not-found page-width"><span className="hand-label">404 · LOST NOTE</span><h1>{isEnglish ? 'This field note does not exist' : '这张研究便签不存在'}</h1><p>{isEnglish ? 'The route may be incorrect, or the solution has not been indexed yet. Return to the library to search the available analyses.' : '路由可能写错了，也可能尚未收录。回到方案库搜索已有方案。'}</p><Link className="primary-link" to={isEnglish ? '/en' : '/'}><ArrowLeft size={18} />{isEnglish ? 'Back to the library' : '返回方案库'}</Link></section></PageShell>
}
