import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { PageShell } from '../components/Layout'

export default function NotFound() {
  return <PageShell><section className="not-found page-width"><span className="hand-label">404 · LOST NOTE</span><h1>这张研究便签不存在</h1><p>路由可能写错了，也可能尚未收录。回到方案库搜索已有方案。</p><Link className="primary-link" to="/"><ArrowLeft size={18} />返回方案库</Link></section></PageShell>
}
