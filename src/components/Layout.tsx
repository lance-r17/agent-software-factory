import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Languages, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { localeFromPathname, localizedPath, useLocale, type Locale } from '../locale'

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

type NavItem = { label: string; hash?: string; path?: string }

const navItems: Record<'zh' | 'en', NavItem[]> = {
  zh: [
    { label: '方案库', hash: '#library' },
    { label: '选型方法', hash: '#method' },
    { label: '更新记录', hash: '#changelog' },
    { label: '归档', path: '/archive' },
  ],
  en: [
    { label: 'Library', hash: '#library' },
    { label: 'Selection method', hash: '#method' },
    { label: 'Changelog', hash: '#changelog' },
    { label: 'Archive', path: '/archive' },
  ],
}

const pageTitles: Record<string, { zh: string; en: string }> = {
  '/': { zh: 'Agent 软件工厂方案库', en: 'Agent Software Factory · Open-source field notes' },
  '/solutions/openhands-agent-canvas': { zh: 'OpenHands Agent Canvas · Agent 软件工厂', en: 'OpenHands Agent Canvas · Agent Software Factory' },
  '/solutions/mini-swe-agent': { zh: 'mini-SWE-agent · Agent 软件工厂', en: 'mini-SWE-agent · Agent Software Factory' },
  '/solutions/swe-agent': { zh: 'SWE-agent · Agent 软件工厂', en: 'SWE-agent · Agent Software Factory' },
  '/solutions/agentless': { zh: 'Agentless · Agent 软件工厂', en: 'Agentless · Agent Software Factory' },
  '/solutions/metagpt': { zh: 'MetaGPT · Agent 软件工厂', en: 'MetaGPT · Agent Software Factory' },
  '/solutions/swe-af': { zh: 'SWE-AF · Agent 软件工厂', en: 'SWE-AF · Agent Software Factory' },
  '/solutions/omnigent': { zh: 'Omnigent · Agent 软件工厂', en: 'Omnigent · Agent Software Factory' },
  '/solutions/loom': { zh: 'Loom · Agent 软件工厂', en: 'Loom · Agent Software Factory' },
  '/solutions/ase': { zh: 'ASE · Agent 软件工厂', en: 'ASE · Agent Software Factory' },
  '/solutions/scion': { zh: 'Scion · Agent 软件工厂', en: 'Scion · Agent Software Factory' },
  '/archive': { zh: '归档方案 · Agent 软件工厂', en: 'Archived solutions · Agent Software Factory' },
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const locale = localeFromPathname(location.pathname)
  const isEnglish = locale === 'en'
  const homePath = isEnglish ? '/en' : '/'
  const items = navItems[locale]
  const targetLocale: Locale = isEnglish ? 'zh' : 'en'
  const languageTarget = localizedPath(location.pathname, targetLocale)
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  const languageSwitch = <Link
    className="language-switch"
    to={{ pathname: languageTarget, hash: location.hash }}
    aria-label={isEnglish ? 'Switch to Chinese' : '切换到英文'}
    title={isEnglish ? 'Switch to Chinese' : 'Switch to English'}
  >
    <Languages size={15} aria-hidden="true" />
    <span>{isEnglish ? 'ZH' : 'EN'}</span>
  </Link>

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to={homePath} aria-label={isEnglish ? 'Agent Software Factory home' : 'Agent 软件工厂方案库首页'}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{isEnglish ? 'Agent Software Factory' : 'Agent 软件工厂'}</strong><small>{isEnglish ? 'OPEN-SOURCE FIELD NOTES' : '开源方案调研室'}</small></span>
        </Link>
        <div className="header-actions">
          <nav className="desktop-nav" aria-label={isEnglish ? 'Main navigation' : '主导航'}>
            {items.map((item) => <Link key={item.label} to={item.path ? { pathname: `${isEnglish ? '/en' : ''}${item.path}` } : { pathname: homePath, hash: item.hash }}>{item.label}</Link>)}
            <a href="https://github.com/GoogleCloudPlatform/scion" target="_blank" rel="noreferrer">{isEnglish ? 'Latest repository' : '本期仓库'} <ArrowUpRight size={15} /></a>
          </nav>
          {languageSwitch}
          <button className="menu-button" type="button" aria-label={isEnglish ? (open ? 'Close navigation menu' : 'Open navigation menu') : (open ? '关闭导航菜单' : '打开导航菜单')} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && <nav id="mobile-nav" className="mobile-nav" aria-label={isEnglish ? 'Mobile navigation' : '移动端导航'}>
        {items.map((item) => <Link key={item.label} to={item.path ? { pathname: `${isEnglish ? '/en' : ''}${item.path}` } : { pathname: homePath, hash: item.hash }}>{item.label}</Link>)}
        <a href="https://github.com/GoogleCloudPlatform/scion" target="_blank" rel="noreferrer">{isEnglish ? 'Latest GitHub repository' : '本期 GitHub 仓库'} <ArrowUpRight size={16} /></a>
      </nav>}
    </header>
  )
}

export function SiteFooter() {
  const locale = useLocale()
  const isEnglish = locale === 'en'
  return <footer className="site-footer">
    <div>
      <Link to={isEnglish ? '/en' : '/'} className="footer-brand">{isEnglish ? 'Agent Software Factory' : 'Agent 软件工厂方案库'}</Link>
      <p>{isEnglish ? 'One reproducible open-source solution, examined in depth every day. Official facts, community experience, and hands-on checks are recorded separately.' : '每天只深挖一个可复现方案。官方事实、社区经验与实测结果分开记录。'}</p>
    </div>
    <div className="footer-note"><span className="status-dot" />{isEnglish ? 'Static editorial site · No backend · No tracking scripts' : '内容型静态网站 · 无后端 · 无追踪脚本'}</div>
  </footer>
}

export function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const locale = localeFromPathname(location.pathname)
  useEffect(() => {
    const chinesePath = location.pathname === '/en' ? '/' : location.pathname.replace(/^\/en(?=\/|$)/, '') || '/'
    const title = pageTitles[chinesePath]?.[locale] ?? (locale === 'en' ? 'Page not found · Agent Software Factory' : '页面不存在 · Agent 软件工厂方案库')
    document.title = title
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN'
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    description?.setAttribute('content', locale === 'en'
      ? 'A daily deep dive into one open-source Agent Software Factory solution: architecture, workflows, local reproduction, security boundaries, and acceptance checks.'
      : '每天深挖一个 Agent Software Factory 开源方案：架构、工作流、本地复现、安全边界与验收清单。')
  }, [location.pathname, locale])

  return <>
    <a className="skip-link" href="#main-content">{locale === 'en' ? 'Skip to content' : '跳到正文'}</a>
    <ScrollManager />
    <SiteHeader />
    <main id="main-content">{children}</main>
    <SiteFooter />
  </>
}
