import { Suspense, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { getApp } from '../apps/registry'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAppTitle } from '../lib/i18n'
import { useOs, type WindowState } from './store'

const TASKBAR_HEIGHT = 40
const MIN_W = 260
const MIN_H = 160
const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
type Edge = (typeof EDGES)[number]

export function Window({ win, active }: { win: WindowState; active: boolean }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow } = useOs.getState()
  const ref = useRef<HTMLDivElement>(null)
  const app = getApp(win.appId)
  const AppComponent = app?.component
  const title = useAppTitle()(win.appId, win.title)

  // Move keyboard focus into a window when it opens.
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (win.maximized || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    const bar = e.currentTarget
    bar.setPointerCapture(e.pointerId)
    const dx = e.clientX - win.x
    const dy = e.clientY - win.y
    const onMove = (ev: PointerEvent) => {
      const maxX = window.innerWidth - 80
      const maxY = window.innerHeight - TASKBAR_HEIGHT - 28
      moveWindow(win.id, Math.min(maxX, Math.max(80 - win.width, ev.clientX - dx)), Math.min(maxY, Math.max(0, ev.clientY - dy)))
    }
    const onUp = () => {
      bar.removeEventListener('pointermove', onMove)
      bar.removeEventListener('pointerup', onUp)
      bar.removeEventListener('pointercancel', onUp)
    }
    bar.addEventListener('pointermove', onMove)
    bar.addEventListener('pointerup', onUp)
    bar.addEventListener('pointercancel', onUp)
  }

  // Drag any edge or corner to resize, like XP.
  const startResize = (edge: Edge) => (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (win.maximized || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const grip = e.currentTarget
    grip.setPointerCapture(e.pointerId)
    const start = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, w: win.width, h: win.height }
    const maxBottom = window.innerHeight - TASKBAR_HEIGHT
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px
      const dy = ev.clientY - start.py
      let { x, y, w, h } = start
      if (edge.includes('e')) w = Math.min(window.innerWidth - x, Math.max(MIN_W, start.w + dx))
      if (edge.includes('s')) h = Math.min(maxBottom - y, Math.max(MIN_H, start.h + dy))
      if (edge.includes('w')) {
        w = Math.max(MIN_W, start.w - dx)
        x = Math.max(0, start.x + start.w - w)
        w = start.x + start.w - x
      }
      if (edge.includes('n')) {
        h = Math.max(MIN_H, start.h - dy)
        y = Math.max(0, start.y + start.h - h)
        h = start.y + start.h - y
      }
      resizeWindow(win.id, { x, y, width: w, height: h })
    }
    const onUp = () => {
      grip.removeEventListener('pointermove', onMove)
      grip.removeEventListener('pointerup', onUp)
      grip.removeEventListener('pointercancel', onUp)
    }
    grip.addEventListener('pointermove', onMove)
    grip.addEventListener('pointerup', onUp)
    grip.addEventListener('pointercancel', onUp)
  }

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: '100%', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.z }

  return (
    <div
      ref={ref}
      className={`window os-window${active ? '' : ' is-inactive'}${win.maximized ? ' is-maximized' : ''}`}
      style={{ ...style, display: win.minimized ? 'none' : undefined }}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      onPointerDownCapture={() => focusWindow(win.id)}
      onFocus={() => focusWindow(win.id)}
    >
      <div className="title-bar" onPointerDown={startDrag} onDoubleClick={() => toggleMaximize(win.id)}>
        <div className="title-bar-text">
          <span aria-hidden="true">{app?.icon}</span> {title}
        </div>
        <div className="title-bar-controls">
          <button type="button" aria-label="Minimize" onClick={() => minimizeWindow(win.id)} />
          <button type="button" aria-label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)} />
          <button type="button" aria-label="Close" onClick={() => closeWindow(win.id)} />
        </div>
      </div>
      <div className="window-body os-window__body">
        <ErrorBoundary
          fallback={
            <div className="app-pad">
              <h2 className="app-heading">⚠️ {win.title} has stopped working</h2>
              <p>Close this window and try again.</p>
            </div>
          }
        >
          <Suspense fallback={<p className="app-pad muted">Loading…</p>}>
            {AppComponent ? <AppComponent win={win} /> : <p className="app-pad">This program is missing.</p>}
          </Suspense>
        </ErrorBoundary>
      </div>
      {!win.maximized &&
        EDGES.map((edge) => <span key={edge} className={`os-window__grip os-window__grip--${edge}`} aria-hidden="true" onPointerDown={startResize(edge)} />)}
    </div>
  )
}
