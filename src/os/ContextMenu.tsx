import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { moveFocus } from './menuFocus'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect?: () => void
  href?: string
}

export type MenuEntry = MenuItem | 'separator'

/** A right-click menu in the XP style. Arrow keys move, Enter picks, Escape or a click elsewhere closes it. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLUListElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Keep the whole menu on screen.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({ left: Math.min(x, window.innerWidth - width - 4), top: Math.min(y, window.innerHeight - height - 44) })
    el.querySelector<HTMLElement>('[role=menuitem]')?.focus()
  }, [x, y])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', onClose)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onClose)
    }
  }, [onClose])

  return (
    <ul ref={ref} className="context-menu" role="menu" style={pos} onKeyDown={(e) => moveFocus(e, ref.current)} onContextMenu={(e) => e.preventDefault()}>
      {items.map((item, i) =>
        item === 'separator' ? (
          <li key={i} role="separator" className="context-menu__sep" />
        ) : (
          <li key={i} role="none">
            {item.href ? (
              <a role="menuitem" href={item.href} onClick={onClose}>
                <span className="context-menu__icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </a>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose()
                  item.onSelect?.()
                }}
              >
                <span className="context-menu__icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            )}
          </li>
        ),
      )}
    </ul>
  )
}
