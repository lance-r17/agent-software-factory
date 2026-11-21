import { useLocation } from 'react-router'

export type Locale = 'zh' | 'en'

export function localeFromPathname(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh'
}

export function useLocale(): Locale {
  return localeFromPathname(useLocation().pathname)
}

export function localizedPath(pathname: string, locale: Locale): string {
  const chinesePath = pathname === '/en' ? '/' : pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  if (locale === 'zh') return chinesePath
  return chinesePath === '/' ? '/en' : `/en${chinesePath}`
}
