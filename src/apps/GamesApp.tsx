import { useState } from 'react'
import { useOs } from '../os/store'
import { ExplorerBar, GridItem, IconGrid, StatusBar } from './shared'
import './games-folder.css'

interface Shortcut {
  id: string
  name: string
  icon: string
  years: string
  blurb: string
  error: string
}

// Mock memories for now. Johnny can rewrite these in Phase 4.
const SHORTCUTS: Shortcut[] = [
  {
    id: 'runescape',
    name: 'RuneScape',
    icon: '⚔️',
    years: '2005 – 2009',
    blurb: 'Chopped willows for hours, got scammed out of a rune scimitar once, and learned how to trade before I learned algebra.',
    error: 'RuneScape.exe cannot connect: your mom needs the phone line.',
  },
  {
    id: 'club-penguin',
    name: 'Club Penguin',
    icon: '🐧',
    years: '2006 – 2008',
    blurb: 'Saved up coins for a puffle, threw snowballs at strangers and went to every party in the Night Club.',
    error: 'Club Penguin has migrated. Your puffle misses you.',
  },
  {
    id: 'counter-strike',
    name: 'Counter-Strike 1.6',
    icon: '💣',
    years: '2007 – 2011',
    blurb: 'de_dust2 all day. Bought an AWP every round whether we could afford it or not.',
    error: 'Counter-Terrorists win. Your 56k modem does not.',
  },
  {
    id: 'combat-arms',
    name: 'Combat Arms',
    icon: '🪖',
    years: '2008 – 2010',
    blurb: 'Spent every NX on a gun that expired in 30 days. Worth it.',
    error: 'Your rental M4 has expired. Purchase 3,000 NX to continue.',
  },
  {
    id: 'soldier-front',
    name: 'Soldier Front',
    icon: '🎯',
    years: '2008 – 2010',
    blurb: 'The PC bang favorite. Big lobbies, bigger lag, and the first clan I ever joined.',
    error: 'Server is full (128/128). Please try again in 2008.',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    icon: '⛏️',
    years: '2010 – forever',
    blurb: 'Started in Alpha. My first "real" project was a redstone door that worked about half the time.',
    error: 'Creeper detected near C:\\. Your files went boom.',
  },
  {
    id: 'cod',
    name: 'Call of Duty 4',
    icon: '🔫',
    years: '2007 – 2012',
    blurb: 'Where the montages came from. Every trickshot, every killcam, every "did you see that??"',
    error: 'Prestige limit reached. Please go outside.',
  },
]

export default function GamesApp() {
  const [open, setOpen] = useState<Shortcut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const openApp = useOs((s) => s.openApp)

  if (open) {
    return (
      <div className="app-explorer games-folder">
        <ExplorerBar path={`C:\\Games\\${open.name}`} onBack={() => setOpen(null)} />
        <div className="games-folder__detail app-pad">
          <div className="games-folder__icon" aria-hidden="true">
            {open.icon}
          </div>
          <div>
            <h2>{open.name}</h2>
            <p className="muted">{open.years}</p>
            <p>{open.blurb}</p>
            <button type="button" onClick={() => setError(open.error)}>
              ▶ Play
            </button>
          </div>
        </div>
        {error && (
          <div className="games-folder__error window" role="alertdialog" aria-label="Error">
            <div className="title-bar">
              <div className="title-bar-text">{open.name}.exe</div>
            </div>
            <div className="window-body">
              <p>
                <span aria-hidden="true">❌ </span>
                {error}
              </p>
              <div className="games-folder__error-actions">
                <button type="button" autoFocus onClick={() => setError(null)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        <StatusBar>Shortcut to a memory</StatusBar>
      </div>
    )
  }

  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\Games" />
      <IconGrid>
        {SHORTCUTS.map((s) => (
          <GridItem key={s.id} icon={s.icon} label={s.name} onOpen={() => setOpen(s)} />
        ))}
        <GridItem icon="🕹️" label="Arcade (actually works)" onOpen={() => openApp('arcade', 'Arcade', { width: 760, height: 560 })} />
      </IconGrid>
      <StatusBar>{SHORTCUTS.length + 1} objects</StatusBar>
    </div>
  )
}
