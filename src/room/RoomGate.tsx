import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useOs } from '../os/store'
import './room.css'

// The 3D code is its own chunk. If it fails to load or crashes, we fall through to the OS.
const Room = lazy(() => import('./Room'))

export function RoomGate() {
  const setStage = useOs((s) => s.setStage)
  const enterOs = () => setStage('boot')

  return (
    <div className="room">
      <ErrorBoundary fallback={null} onError={enterOs}>
        <Suspense fallback={<div className="room__loading">Loading Johnny's room…</div>}>
          <Room onEnter={enterOs} />
        </Suspense>
      </ErrorBoundary>
      <div className="room__overlay">
        <p className="room__hint">Click the computer to turn it on</p>
        <div className="room__actions">
          <button type="button" onClick={enterOs}>
            Skip to desktop
          </button>
          <a href="/resume">Skip to resume →</a>
        </div>
      </div>
    </div>
  )
}
