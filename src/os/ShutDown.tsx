import { canShowRoom } from '../lib/env'
import { useT } from '../lib/i18n'
import { useOs } from './store'

export function ShutDown() {
  const setStage = useOs((s) => s.setStage)
  const t = useT()
  return (
    <div className="shutdown">
      <p>{t('shutdown.safe')}</p>
      <button type="button" onClick={() => setStage(canShowRoom() ? 'room' : 'boot')}>
        {t('shutdown.on')}
      </button>
    </div>
  )
}
