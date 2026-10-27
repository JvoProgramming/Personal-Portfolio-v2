import { useEffect, useState } from 'react'
import { getApp } from '../apps/registry'
import { LangSwitch } from '../components/LangSwitch'
import { useAppTitle, useT } from '../lib/i18n'
import { useOs } from './store'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(t)
  }, [])
  return { time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), date: now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
}

export function Taskbar({ activeId }: { activeId: string | null }) {
  const windows = useOs((s) => s.windows)
  const startOpen = useOs((s) => s.startOpen)
  const { setStartOpen, focusWindow, minimizeWindow } = useOs.getState()
  const { time, date } = useClock()
  const appTitle = useAppTitle()
  const t = useT()

  return (
    <footer className="taskbar">
      <button
        type="button"
        className={`taskbar__start${startOpen ? ' is-pressed' : ''}`}
        aria-expanded={startOpen}
        aria-haspopup="menu"
        onClick={() => setStartOpen(!startOpen)}
      >
        <span className="taskbar__start-flag" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        start
      </button>
      <ul className="taskbar__windows" aria-label="Open windows">
        {windows.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              className={`taskbar__window${w.id === activeId ? ' is-active' : ''}`}
              onClick={() => (w.id === activeId ? minimizeWindow(w.id) : focusWindow(w.id))}
            >
              <span aria-hidden="true">{getApp(w.appId)?.icon}</span>
              <span className="taskbar__window-title">{appTitle(w.appId, w.title)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="taskbar__tray">
        <LangSwitch className="taskbar__lang" />
        <a href="/resume" className="taskbar__tray-link" title="Plain resume page">
          📄<span className="visually-hidden">Resume</span>
        </a>
        <span className="taskbar__tray-icon" title={t('tray.volume')} aria-hidden="true">
          🔊
        </span>
        <time title={date}>{time}</time>
      </div>
    </footer>
  )
}
