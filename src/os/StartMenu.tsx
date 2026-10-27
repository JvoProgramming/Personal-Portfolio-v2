import { useEffect, useRef } from 'react'
import type { AppDefinition } from '../apps/registry'
import { useAppTitle, useT, type TKey } from '../lib/i18n'
import { moveFocus } from './menuFocus'
import { useOs } from './store'
import type { UserAccount } from './users'

const PLACES = new Set(['my-documents', 'recycle-bin', 'contact', 'credits'])

export function StartMenu({ account, apps, onOpen }: { account: UserAccount; apps: AppDefinition[]; onOpen: (app: AppDefinition) => void }) {
  const { logOff, setStage } = useOs.getState()
  const t = useT()
  const appTitle = useAppTitle()
  const programs = apps.filter((a) => !PLACES.has(a.id))
  const places = apps.filter((a) => PLACES.has(a.id))
  const ref = useRef<HTMLDivElement>(null)

  // Focus the first item, close on a click outside, and hand focus back to Start when closed.
  useEffect(() => {
    const start = document.querySelector<HTMLElement>('.taskbar__start')
    const menu = ref.current
    menu?.querySelector<HTMLElement>('[role=menuitem]')?.focus({ preventScroll: true })
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!menu?.contains(target) && !start?.contains(target)) useOs.getState().setStartOpen(false)
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      if (menu?.contains(document.activeElement) || document.activeElement === document.body) start?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div ref={ref} className="start-menu" role="menu" aria-label="Start menu" onKeyDown={(e) => moveFocus(e, ref.current)}>
      <header className="start-menu__header">
        <span className="start-menu__avatar" aria-hidden="true">
          {account.avatar}
        </span>
        <span>{t(`user.${account.id}` as TKey)}</span>
      </header>
      <div className="start-menu__columns">
        <ul className="start-menu__programs">
          {programs.map((a) => (
            <li key={a.id}>
              <button type="button" role="menuitem" onClick={() => onOpen(a)}>
                <span aria-hidden="true">{a.icon}</span> {appTitle(a.id, a.title)}
              </button>
            </li>
          ))}
        </ul>
        <ul className="start-menu__places">
          {places.map((a) => (
            <li key={a.id}>
              <button type="button" role="menuitem" onClick={() => onOpen(a)}>
                <span aria-hidden="true">{a.icon}</span> {appTitle(a.id, a.title)}
              </button>
            </li>
          ))}
          <li>
            <a role="menuitem" href="/resume">
              <span aria-hidden="true">🖨️</span> {t('start.printable')}
            </a>
          </li>
        </ul>
      </div>
      <footer className="start-menu__footer">
        <button type="button" role="menuitem" onClick={logOff}>
          <span aria-hidden="true">🔑</span> {t('start.logOff')}
        </button>
        <button type="button" role="menuitem" onClick={() => setStage('off')}>
          <span aria-hidden="true">⏻</span> {t('start.turnOff')}
        </button>
      </footer>
    </div>
  )
}
