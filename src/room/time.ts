import * as THREE from 'three'

// Sky and sunlight follow the real time in Los Angeles.

const LAT = 34.05
const LON = -118.24
const DEG = Math.PI / 180

export type DayPhase = 'night' | 'dawn' | 'day' | 'sunset'

export interface Lighting {
  phase: DayPhase
  /** Sun height above the horizon, in degrees. */
  elevation: number
  morning: boolean
  skyTop: THREE.Color
  skyBottom: THREE.Color
  sunColor: THREE.Color
  sunIntensity: number
  ambient: number
  /** Formatted LA time, for display. */
  label: string
}

/** Current time as a UTC Date. `?time=18.5` in the URL pretends it's 6:30pm in LA (for testing). */
function now(): Date {
  const param = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('time') : null
  const d = new Date()
  if (param !== null && !Number.isNaN(Number(param))) {
    const laHour = Number(param)
    // LA is UTC-8 (or -7 in summer); close enough for a preview override.
    d.setUTCHours(Math.floor((laHour + 8) % 24), Math.round((laHour % 1) * 60), 0, 0)
  }
  return d
}

function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000)
}

/** Approximate solar elevation in LA, good to a degree or two. */
export function sunElevation(d: Date): { elevation: number; morning: boolean } {
  const n = dayOfYear(d)
  const declination = 23.44 * Math.sin((360 / 365) * (284 + n) * DEG)
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60
  const solarTime = (utcHours + LON / 15 + 24) % 24
  const hourAngle = (solarTime - 12) * 15
  const sinEl = Math.sin(LAT * DEG) * Math.sin(declination * DEG) + Math.cos(LAT * DEG) * Math.cos(declination * DEG) * Math.cos(hourAngle * DEG)
  return { elevation: Math.asin(sinEl) / DEG, morning: solarTime < 12 }
}

const c = (hex: string) => new THREE.Color(hex)

const PALETTE = {
  night: { top: c('#060a1f'), bottom: c('#1b2350'), sun: c('#7f9cff'), intensity: 0.35, ambient: 0.12 },
  dawn: { top: c('#3a5ba8'), bottom: c('#f6b47b'), sun: c('#ffb27a'), intensity: 1.4, ambient: 0.35 },
  sunset: { top: c('#3b3a8f'), bottom: c('#ff7a45'), sun: c('#ff8a4c'), intensity: 1.6, ambient: 0.35 },
  day: { top: c('#3f8fe8'), bottom: c('#bfe3ff'), sun: c('#fff2d6'), intensity: 3.2, ambient: 0.9 },
}

export function getLighting(): Lighting {
  const d = now()
  const { elevation, morning } = sunElevation(d)
  const golden = morning ? PALETTE.dawn : PALETTE.sunset
  let phase: DayPhase
  let from = PALETTE.night
  let to = PALETTE.night
  let t = 0
  if (elevation < -8) {
    phase = 'night'
  } else if (elevation < 4) {
    phase = morning ? 'dawn' : 'sunset'
    from = PALETTE.night
    to = golden
    t = (elevation + 8) / 12
  } else if (elevation < 18) {
    phase = 'day'
    from = golden
    to = PALETTE.day
    t = (elevation - 4) / 14
  } else {
    phase = 'day'
    from = PALETTE.day
    to = PALETTE.day
  }
  const label = d.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' })
  return {
    phase,
    elevation,
    morning,
    skyTop: from.top.clone().lerp(to.top, t),
    skyBottom: from.bottom.clone().lerp(to.bottom, t),
    sunColor: from.sun.clone().lerp(to.sun, t),
    sunIntensity: from.intensity + (to.intensity - from.intensity) * t,
    ambient: from.ambient + (to.ambient - from.ambient) * t,
    label,
  }
}
