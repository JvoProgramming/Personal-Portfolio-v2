import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { appsForUser, type AppDefinition } from '../apps/registry'
import { isCoarsePointer } from '../lib/env'
import { useAppTitle, useT } from '../lib/i18n'
import { Balloon } from './Balloon'
import { ContextMenu, type MenuEntry } from './ContextMenu'
import { StartMenu } from './StartMenu'
import { activeWindowId, useOs } from './store'
import { Taskbar } from './Taskbar'
import { getUser } from './users'
import { Window } from './Window'

export function Desktop() {
  const user = useOs((s) => s.user)
  const windows = useOs((s) => s.windows)
  const startOpen = useOs((s) => s.startOpen)
  const wallpaperOverride = useOs((s) => s.wallpaperOverride)
  const openApp = useOs((s) => s.openApp)
  const setStartOpen = useOs((s) => s.setStartOpen)
  const [selected, setSelected] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const appTitle = useAppTitle()
  const t = useT()
  const closeMenu = useCallback(() => setMenu(null), [])

  // Open an app someone picked in the 3D room, if this account has it.
  useEffect(() => {
    const { pendingApp, setPendingApp } = useOs.getState()
    if (!pendingApp || !user) return
    setPendingApp(null)
    const app = appsForUser(user).find((a) => a.id === pendingApp.appId)
    if (app) openApp(app.id, app.title, { ...app.size, ...pendingApp.options })
  }, [user, openApp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStartOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setStartOpen])

  if (!user) return null
  const account = getUser(user)
  const apps = appsForUser(user)
  const active = activeWindowId(windows)
  const open = (app: AppDefinition) => openApp(app.id, app.title, app.size)
  const byId = (id: string) => apps.find((a) => a.id === id)

  const menuItems: MenuEntry[] = [
    {
      label: t('ctx.refresh'),
      icon: '🔄',
      onSelect: () => {
        setRefreshing(true)
        window.setTimeout(() => setRefreshing(false), 150)
      },
    },
    'separator',
    { label: t('ctx.openResume'), icon: '📄', onSelect: () => byId('resume') && open(byId('resume')!) },
    ...(byId('wallpapers') ? [{ label: t('ctx.wallpaper'), icon: '🖼️', onSelect: () => open(byId('wallpapers')!) }] : []),
    { label: t('start.printable'), icon: '🖨️', href: '/resume' },
    'separator',
    { label: t('start.logOff'), icon: '🔑', onSelect: () => useOs.getState().logOff() },
  ]

  // Arrow keys move between desktop icons, like XP.
  const onIconKey = (e: ReactKeyboardEvent<HTMLButtonElement>, app: AppDefinition) => {
    if (e.key === 'Enter') return open(app)
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const buttons = Array.from(e.currentTarget.closest('ul')?.querySelectorAll<HTMLButtonElement>('.desktop-icon') ?? [])
    const next = buttons[buttons.indexOf(e.currentTarget) + step]
    if (next) {
      next.focus()
      setSelected(apps[buttons.indexOf(next)]?.id ?? null)
    }
  }

  return (
    <div className="desktop" style={{ backgroundImage: `url(${wallpaperOverride ?? account.wallpaper})` }}>
      <div
        className="desktop__surface"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelected(null)
            setStartOpen(false)
          }
        }}
        onContextMenu={(e) => {
          if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.desktop__icons')) return
          e.preventDefault()
          setStartOpen(false)
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <ul className="desktop__icons" aria-label="Desktop" style={{ visibility: refreshing ? 'hidden' : undefined }}>
          {apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                className={`desktop-icon${selected === app.id ? ' is-selected' : ''}`}
                onClick={() => (isCoarsePointer() ? open(app) : setSelected(app.id))}
                onDoubleClick={() => open(app)}
                onFocus={() => setSelected(app.id)}
                onKeyDown={(e) => onIconKey(e, app)}
              >
                <span className="desktop-icon__img" aria-hidden="true">
                  {app.icon}
                </span>
                <span className="desktop-icon__label">{appTitle(app.id, app.title)}</span>
              </button>
            </li>
          ))}
        </ul>
        {windows.map((w) => (
          <Window key={w.id} win={w} active={w.id === active} />
        ))}
      </div>
      {startOpen && <StartMenu account={account} apps={apps} onOpen={open} />}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}
      <Taskbar activeId={active} />
      <Balloon key={user} user={user} />
    </div>
  )
}
