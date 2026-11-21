import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type RouteTab = { id: string; label: string }

/**
 * 部署路线 Tabs：桌面端为完整 tab 行；移动端（≤600px）折叠为单个激活 tab，
 * 其余路线通过下拉菜单切换。Esc / 点击外部可关闭下拉。
 */
export function RouteTabs<T extends RouteTab>({ tabs, initialId, ariaLabel, children }: {
  tabs: T[]
  initialId: string
  ariaLabel: string
  children: (current: T) => ReactNode
}) {
  const [active, setActive] = useState(initialId)
  const [open, setOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!selectRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function pick(id: string) {
    setActive(id)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return <div className="deployment-tabs">
    <div className="tab-list" role="tablist" aria-label={ariaLabel} onKeyDown={(event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const ids = tabs.map((tab) => tab.id)
      const next = ids[(ids.indexOf(active) + (event.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]
      setActive(next)
      document.getElementById(`tab-${next}`)?.focus()
    }}>
      {tabs.map((tab) => <button id={`tab-${tab.id}`} key={tab.id} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)}>{tab.label}</button>)}
    </div>
    <div className="tab-select" ref={selectRef}>
      <button ref={triggerRef} type="button" className="tab-select-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls="tab-select-menu" onClick={() => setOpen((value) => !value)}>
        <span>{current.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="tab-select-menu" id="tab-select-menu" role="menu" aria-label={ariaLabel}>
        {tabs.map((tab) => <button key={tab.id} type="button" role="menuitemradio" aria-checked={active === tab.id} onClick={() => pick(tab.id)}>
          <span>{tab.label}</span>
          {active === tab.id && <Check size={15} aria-hidden="true" />}
        </button>)}
      </div>}
    </div>
    <div className="tab-panel" id={`panel-${current.id}`} role="tabpanel" aria-labelledby={`tab-${current.id}`}>
      {children(current)}
    </div>
  </div>
}
