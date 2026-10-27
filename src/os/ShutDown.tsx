import { canShowRoom } from '../lib/env'
import { useOs } from './store'

export function ShutDown() {
  const setStage = useOs((s) => s.setStage)
  return (
    <div className="shutdown">
      <p>It's now safe to turn off your computer.</p>
      <button type="button" onClick={() => setStage(canShowRoom() ? 'room' : 'boot')}>
        Turn it back on
      </button>
    </div>
  )
}
