import { useOs } from './store'
import { USERS } from './users'

export function Welcome() {
  const logIn = useOs((s) => s.logIn)
  const setStage = useOs((s) => s.setStage)

  return (
    <div className="welcome">
      <div className="welcome__band welcome__band--top" />
      <main className="welcome__main">
        <div className="welcome__intro">
          <div className="welcome__logo">
            Johnny <strong>XP</strong>
          </div>
          <p>To begin, click your user name</p>
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
                  <span className="welcome__user-name">{u.name}</span>
                  <span className="welcome__user-sub">{u.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <div className="welcome__band welcome__band--bottom">
        <button type="button" className="welcome__power" onClick={() => setStage('off')}>
          <span aria-hidden="true">⏻</span> Turn off computer
        </button>
        <a className="skip-link" href="/resume">
          Skip to resume →
        </a>
      </div>
    </div>
  )
}
