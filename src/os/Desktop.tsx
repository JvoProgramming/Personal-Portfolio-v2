import { useEffect, useState } from 'react'
import { appsForUser, type AppDefinition } from '../apps/registry'
import { isCoarsePointer } from '../lib/env'
import { useAppTitle } from '../lib/i18n'
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
  const appTitle = useAppTitle()

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
      >
        <ul className="desktop__icons" aria-label="Desktop">
          {apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                className={`desktop-icon${selected === app.id ? ' is-selected' : ''}`}
                onClick={() => (isCoarsePointer() ? open(app) : setSelected(app.id))}
                onDoubleClick={() => open(app)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') open(app)
                }}
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
      <Taskbar activeId={active} />
    </div>
  )
}
