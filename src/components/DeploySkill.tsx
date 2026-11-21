import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, Eye, FileTerminal, X } from 'lucide-react'
import { copyText } from './CodeBlock'
import type { DeploySkill } from '../data/deploySkills'
import { useLocale, type Locale } from '../locale'

type CopyState = 'idle' | 'copied' | 'error'

function downloadSkill(skill: DeploySkill) {
  const blob = new Blob([skill.content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = skill.fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function useCopyButton(text: string) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  async function trigger() {
    try {
      await copyText(text)
      setState('copied')
    } catch {
      setState('error')
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }
  return { state, trigger }
}

function CopyLabel({ state, idle, locale }: { state: CopyState; idle: string; locale: Locale }) {
  if (state === 'copied') return <><Check size={16} /> {locale === 'en' ? 'Copied' : '已复制'}</>
  if (state === 'error') return <><Copy size={16} /> {locale === 'en' ? 'Copy failed' : '复制失败'}</>
  return <><Copy size={16} /> {idle}</>
}

function SkillModal({ skill, onClose, locale }: { skill: DeploySkill; onClose: () => void; locale: Locale }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const copy = useCopyButton(skill.content)
  const isEnglish = locale === 'en'

  useEffect(() => {
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return <div className="skill-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="skill-modal" role="dialog" aria-modal="true" aria-label={isEnglish ? `${skill.title} full preview` : `${skill.title}全文预览`}>
      <div className="skill-modal-head">
        <div className="skill-modal-title"><strong>{skill.fileName}</strong><span>{skill.version} · {isEnglish ? 'Facts verified' : '事实核验'} {skill.verifyDate} · {skill.content.length.toLocaleString()} {isEnglish ? 'characters' : '字符'}</span></div>
        <div className="skill-modal-actions">
          <button type="button" onClick={copy.trigger}><CopyLabel state={copy.state} idle={isEnglish ? 'Copy' : '复制'} locale={locale} /></button>
          <button type="button" onClick={() => downloadSkill(skill)}><Download size={16} /> {isEnglish ? 'Download' : '下载'}</button>
          <button type="button" ref={closeRef} onClick={onClose} aria-label={isEnglish ? 'Close preview' : '关闭预览'}><X size={16} /> {isEnglish ? 'Close' : '关闭'}</button>
        </div>
      </div>
      <pre className="skill-modal-body" tabIndex={0}><code>{skill.content}</code></pre>
    </div>
  </div>
}

export function DeploySkillCard({ skill }: { skill: DeploySkill }) {
  const [open, setOpen] = useState(false)
  const copy = useCopyButton(skill.content)
  const locale = useLocale()
  const isEnglish = locale === 'en'

  return <div className={`skill-card ${skill.accent}`}>
    <div className="skill-card-head">
      <span className="skill-icon" aria-hidden="true"><FileTerminal size={26} /></span>
      <div>
        <p className="skill-kicker">{isEnglish ? 'DEPLOY SKILL · SKILL.MD FORMAT' : 'DEPLOY SKILL · SKILL.MD 格式'}</p>
        <h3>{skill.title}</h3>
        <p className="skill-desc">{skill.description}</p>
      </div>
    </div>
    <dl className="skill-meta">
      <div><dt>{isEnglish ? 'Target version' : '对应版本'}</dt><dd>{skill.version}</dd></div>
      <div><dt>{isEnglish ? 'Facts verified' : '事实核验'}</dt><dd>{skill.verifyDate}</dd></div>
      <div><dt>{isEnglish ? 'Deployment routes' : '部署路线'}</dt><dd>{isEnglish ? `${skill.routes.length} built-in options` : `${skill.routes.length} 条内置可选`}</dd></div>
      <div><dt>{isEnglish ? 'Download file' : '下载文件'}</dt><dd>{skill.fileName}</dd></div>
    </dl>
    <div className="skill-routes" aria-label={isEnglish ? 'Deployment routes included in the Skill' : 'Skill 内置的部署路线'}>
      {skill.routes.map((route) => <span key={route.id}><b>{route.id}</b>{route.label}</span>)}
    </div>
    <div className="skill-outline-wrap">
      <strong>{isEnglish ? `Structure preview · ${skill.outline.length} sections` : `结构预览 · ${skill.outline.length} 节`}</strong>
      <ol className="skill-outline">{skill.outline.map((item) => <li key={item}>{item}</li>)}</ol>
    </div>
    <div className="skill-actions">
      <button type="button" className="skill-btn primary" onClick={() => setOpen(true)}><Eye size={17} /> {isEnglish ? 'Preview full text' : '预览全文'}</button>
      <button type="button" className="skill-btn" onClick={copy.trigger}><CopyLabel state={copy.state} idle={isEnglish ? 'Copy Markdown' : '复制 Markdown'} locale={locale} /></button>
      <button type="button" className="skill-btn" onClick={() => downloadSkill(skill)}><Download size={17} /> {isEnglish ? 'Download .md' : '下载 .md'}</button>
    </div>
    <span className="sr-only" aria-live="polite">{copy.state === 'copied' ? (isEnglish ? 'Full Skill copied to clipboard' : 'Skill 全文已复制到剪贴板') : copy.state === 'error' ? (isEnglish ? 'Copy failed; open the preview and select manually' : '复制失败，请打开预览手动选择') : ''}</span>
    {open && <SkillModal skill={skill} onClose={() => setOpen(false)} locale={locale} />}
  </div>
}
