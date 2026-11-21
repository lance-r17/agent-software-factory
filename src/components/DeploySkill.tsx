import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, Eye, FileTerminal, X } from 'lucide-react'
import { copyText } from './CodeBlock'
import type { DeploySkill } from '../data/deploySkills'

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

function CopyLabel({ state, idle }: { state: CopyState; idle: string }) {
  if (state === 'copied') return <><Check size={16} /> 已复制</>
  if (state === 'error') return <><Copy size={16} /> 复制失败</>
  return <><Copy size={16} /> {idle}</>
}

function SkillModal({ skill, onClose }: { skill: DeploySkill; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const copy = useCopyButton(skill.content)

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
    <div className="skill-modal" role="dialog" aria-modal="true" aria-label={`${skill.title}全文预览`}>
      <div className="skill-modal-head">
        <div className="skill-modal-title"><strong>{skill.fileName}</strong><span>{skill.version} · 事实核验 {skill.verifyDate} · {skill.content.length.toLocaleString()} 字符</span></div>
        <div className="skill-modal-actions">
          <button type="button" onClick={copy.trigger}><CopyLabel state={copy.state} idle="复制" /></button>
          <button type="button" onClick={() => downloadSkill(skill)}><Download size={16} /> 下载</button>
          <button type="button" ref={closeRef} onClick={onClose} aria-label="关闭预览"><X size={16} /> 关闭</button>
        </div>
      </div>
      <pre className="skill-modal-body" tabIndex={0}><code>{skill.content}</code></pre>
    </div>
  </div>
}

export function DeploySkillCard({ skill }: { skill: DeploySkill }) {
  const [open, setOpen] = useState(false)
  const copy = useCopyButton(skill.content)

  return <div className={`skill-card ${skill.accent}`}>
    <div className="skill-card-head">
      <span className="skill-icon" aria-hidden="true"><FileTerminal size={26} /></span>
      <div>
        <p className="skill-kicker">DEPLOY SKILL · SKILL.MD 格式</p>
        <h3>{skill.title}</h3>
        <p className="skill-desc">{skill.description}</p>
      </div>
    </div>
    <dl className="skill-meta">
      <div><dt>对应版本</dt><dd>{skill.version}</dd></div>
      <div><dt>事实核验</dt><dd>{skill.verifyDate}</dd></div>
      <div><dt>部署路线</dt><dd>{skill.routes.length} 条内置可选</dd></div>
      <div><dt>下载文件</dt><dd>{skill.fileName}</dd></div>
    </dl>
    <div className="skill-routes" aria-label="Skill 内置的部署路线">
      {skill.routes.map((route) => <span key={route.id}><b>{route.id}</b>{route.label}</span>)}
    </div>
    <div className="skill-outline-wrap">
      <strong>结构预览 · {skill.outline.length} 节</strong>
      <ol className="skill-outline">{skill.outline.map((item) => <li key={item}>{item}</li>)}</ol>
    </div>
    <div className="skill-actions">
      <button type="button" className="skill-btn primary" onClick={() => setOpen(true)}><Eye size={17} /> 预览全文</button>
      <button type="button" className="skill-btn" onClick={copy.trigger}><CopyLabel state={copy.state} idle="复制 Markdown" /></button>
      <button type="button" className="skill-btn" onClick={() => downloadSkill(skill)}><Download size={17} /> 下载 .md</button>
    </div>
    <span className="sr-only" aria-live="polite">{copy.state === 'copied' ? 'Skill 全文已复制到剪贴板' : copy.state === 'error' ? '复制失败，请打开预览手动选择' : ''}</span>
    {open && <SkillModal skill={skill} onClose={() => setOpen(false)} />}
  </div>
}
