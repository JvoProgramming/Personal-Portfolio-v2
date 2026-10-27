import { useT } from '../lib/i18n'
import { useOs } from '../os/store'
import './room-loading.css'

/** Shown while the 3D room downloads. The skip buttons work right away, so a slow connection never traps anyone. */
export function RoomLoading() {
  const t = useT()
  const setStage = useOs((s) => s.setStage)
  return (
    <div className="room-loading" role="status">
      <div className="room-loading__lamp" aria-hidden="true" />
      <p>{t('room.loading')}</p>
      <div className="room-loading__actions">
        <button type="button" onClick={() => setStage('boot')}>
          {t('room.skipDesktop')}
        </button>
        <a href="/resume">{t('room.skipResume')}</a>
      </div>
    </div>
  )
}
