import { LangSwitch } from '../components/LangSwitch'
import { canVisitRoom } from '../lib/env'
import { useT, type TKey } from '../lib/i18n'
import { useOs } from './store'
import { USERS } from './users'

export function Welcome() {
  const logIn = useOs((s) => s.logIn)
  const setStage = useOs((s) => s.setStage)
  const t = useT()

  return (
    <div className="welcome">
      <div className="welcome__band welcome__band--top" />
      <main className="welcome__main">
        <div className="welcome__intro">
          <div className="welcome__logo">
            Johnny <strong>XP</strong>
          </div>
          <p>{t('welcome.begin')}</p>
        </div>
        <div className="welcome__divider" aria-hidden="true" />
        <ul className="welcome__users" aria-label="User accounts">
          {USERS.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => logIn(u.id)}>
                <span className="welcome__avatar" aria-hidden="true">
                  {u.avatar}
                </span>
                <span className="welcome__user-text">
                  <span className="welcome__user-name">{t(`user.${u.id}` as TKey)}</span>
                  <span className="welcome__user-sub">{t(`user.${u.id}.sub` as TKey)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <div className="welcome__band welcome__band--bottom">
        <button type="button" className="welcome__power" onClick={() => setStage('off')}>
          <span aria-hidden="true">⏻</span> {t('welcome.turnOff')}
        </button>
        <div className="welcome__links">
          {canVisitRoom() && (
            <button type="button" className="welcome__room" onClick={() => setStage('room')}>
              <span aria-hidden="true">🛏️</span> {t('welcome.visitRoom')}
            </button>
          )}
          <LangSwitch className="welcome__lang" />
          <a className="skip-link" href="/resume">
            {t('welcome.skipResume')}
          </a>
        </div>
      </div>
    </div>
  )
}
