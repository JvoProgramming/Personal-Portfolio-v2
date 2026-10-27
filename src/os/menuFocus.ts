import type { KeyboardEvent } from 'react'

/** Up/Down (and Home/End) between the menu items inside `root`. Shared with the Start menu. */
export function moveFocus(e: KeyboardEvent, root: HTMLElement | null) {
  if (!root || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
  const items = Array.from(root.querySelectorAll<HTMLElement>('[role=menuitem]'))
  if (!items.length) return
  e.preventDefault()
  const i = items.indexOf(document.activeElement as HTMLElement)
  const next =
    e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
  items[next].focus()
}
