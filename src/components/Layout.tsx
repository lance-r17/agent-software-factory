import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'

export function ScrollManager() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname, location.hash])
  return null
}

const navItems = [
  { label: '方案库', hash: '#library' },
  { label: '选型方法', hash: '#method' },
  { label: '更新记录', hash: '#changelog' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Agent 软件工厂方案库首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Agent 软件工厂</strong><small>开源方案调研室</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => <Link key={item.hash} to={{ pathname: '/', hash: item.hash }}>{item.label}</Link>)}
          <a href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer">本期仓库 <ArrowUpRight size={15} /></a>
        </nav>
        <button className="menu-button" type="button" aria-label={open ? '关闭导航菜单' : '打开导航菜单'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && <nav id="mobile-nav" className="mobile-nav" aria-label="移动端导航">
        {navItems.map((item) => <Link key={item.hash} to={{ pathname: '/', hash: item.hash }}>{item.label}</Link>)}
        <a href="https://github.com/SWE-agent/mini-swe-agent" target="_blank" rel="noreferrer">本期 GitHub 仓库 <ArrowUpRight size={16} /></a>
      </nav>}
    </header>
  )
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div>
      <Link to="/" className="footer-brand">Agent 软件工厂方案库</Link>
      <p>每天只深挖一个可复现方案。官方事实、社区经验与实测结果分开记录。</p>
    </div>
    <div className="footer-note"><span className="status-dot" />内容型静态网站 · 无后端 · 无追踪脚本</div>
  </footer>
}

export function PageShell({ children }: { children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main-content">跳到正文</a>
    <ScrollManager />
    <SiteHeader />
    <main id="main-content">{children}</main>
    <SiteFooter />
  </>
}
