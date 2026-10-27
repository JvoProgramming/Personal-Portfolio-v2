import { Suspense, lazy, useState } from 'react'
import type { WindowState } from '../os/store'
import './arcade.css'

// A Miniclip / Y8 style game portal. Each game loads only when you pick it.

const GAMES = [
  {
    id: 'rhythm',
    title: 'Rock Legend',
    blurb: 'Five-button rhythm game. Shred to a synthesized rock anthem.',
    thumb: '🎸',
    color: '#d7263d',
    component: lazy(() => import('./games/RhythmGame')),
  },
  {
    id: 'bone-fetch',
    title: "Mochi's Bone Fetch",
    blurb: 'Help Mochi grab bones in the park. Dodge hydrants, tennis balls and cats.',
    thumb: '🦴',
    color: '#e2b47a',
    component: lazy(() => import('./games/BoneFetch')),
  },
  {
    id: 'tennis',
    title: 'Match Point',
    blurb: 'Top-down tennis against the computer. First to 3 games.',
    thumb: '🎾',
    color: '#3a7bd5',
    component: lazy(() => import('./games/TennisGame')),
  },
]

export default function ArcadeApp({ win }: { win: WindowState }) {
  const [gameId, setGameId] = useState<string | null>(win.props?.game ?? null)
  const game = GAMES.find((g) => g.id === gameId)

  if (game) {
    const Game = game.component
    return (
      <div className="arcade arcade--playing">
        <div className="arcade__bar">
          <button type="button" onClick={() => setGameId(null)}>
            ◀ All games
          </button>
          <strong>{game.title}</strong>
        </div>
        <Suspense fallback={<p className="arcade__loading">Loading {game.title}…</p>}>
          <Game />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="arcade">
      <header className="arcade__header">
        <span className="arcade__logo">
          johnny<span>clip</span>
        </span>
        <span className="arcade__tagline">Free online games! No downloads!</span>
      </header>
      <nav className="arcade__tabs" aria-label="Categories">
        <span className="is-active">All Games</span>
        <span>Music</span>
        <span>Sports</span>
        <span>Dogs</span>
      </nav>
      <h2 className="arcade__section">🔥 Hot games</h2>
      <ul className="arcade__grid">
        {GAMES.map((g) => (
          <li key={g.id}>
            <button type="button" className="arcade__tile" onClick={() => setGameId(g.id)}>
              <span className="arcade__thumb" style={{ background: g.color }} aria-hidden="true">
                {g.thumb}
              </span>
              <span className="arcade__title">{g.title}</span>
              <span className="arcade__blurb">{g.blurb}</span>
              <span className="arcade__play">PLAY ▶</span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="arcade__footer">© 2006 johnnyclip · Best viewed in 1024×768</footer>
    </div>
  )
}
