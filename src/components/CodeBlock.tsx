import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { useLocale } from '../locale'

export async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('copy failed')
}

export function CodeBlock({ title, code, language = 'bash' }: { title: string; code: string; language?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locale = useLocale()
  const isEnglish = locale === 'en'
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function handleCopy() {
    try {
      await copyText(code)
      setState('copied')
    } catch {
      setState('error')
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  return <div className="code-block">
    <div className="code-toolbar"><span>{title}<small>{language}</small></span>
      <button type="button" onClick={handleCopy} aria-label={isEnglish ? `Copy ${title}` : `复制${title}`}>
        {state === 'copied' ? <Check size={16} /> : <Copy size={16} />}
        {state === 'copied' ? (isEnglish ? 'Copied' : '已复制') : state === 'error' ? (isEnglish ? 'Copy failed' : '复制失败') : (isEnglish ? 'Copy' : '复制')}
      </button>
    </div>
    <pre tabIndex={0}><code>{code}</code></pre>
    <span className="sr-only" aria-live="polite">{state === 'copied' ? (isEnglish ? 'Commands copied to clipboard' : '命令已复制到剪贴板') : state === 'error' ? (isEnglish ? 'Copy failed; select the code manually' : '复制失败，请手动选择代码') : ''}</span>
  </div>
}

export function SectionHeading({ kicker, title, intro, id }: { kicker: string; title: string; intro?: string; id?: string }) {
  return <div className="section-heading" id={id}>
    <span className="hand-label">{kicker}</span>
    <h2>{title}</h2>
    {intro && <p>{intro}</p>}
  </div>
}

export function SourceStrip({ children, label }: { children: ReactNode; label?: string }) {
  const locale = useLocale()
  return <div className="source-strip"><strong>{label ?? (locale === 'en' ? 'Sources for this section' : '本节依据')}</strong><div>{children}</div></div>
}

export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={13} aria-hidden="true" /></a>
}
