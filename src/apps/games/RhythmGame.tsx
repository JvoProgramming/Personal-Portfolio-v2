import { useEffect, useRef, useState } from 'react'
import { seededRandom } from './random'
import { loadHighScore, saveHighScore, useCanvasLoop } from './useCanvasLoop'
import './games.css'

// "Rock Legend": a five-button rhythm game in the style of Guitar Hero.
// The song is synthesized with Web Audio, so there are no audio files to license.

const LANES = [
  { color: '#2ecc40', key: 'a', label: 'A' },
  { color: '#ff4136', key: 's', label: 'S' },
  { color: '#ffdc00', key: 'd', label: 'D' },
  { color: '#0074d9', key: 'f', label: 'F' },
  { color: '#ff851b', key: 'g', label: 'G' },
]
const BPM = 132
const BEAT = 60 / BPM
const SONG_BEATS = 72
const LEAD_IN = 2 // seconds before the first note
const TRAVEL = 1.7 // seconds a note takes to fall to the line
const HIT_WINDOW = 0.13
const PERFECT = 0.05
// E minor pentatonic, one note per lane.
const LANE_FREQ = [329.63, 392.0, 440.0, 493.88, 587.33]

interface Note {
  time: number
  lane: number
  state: 'pending' | 'hit' | 'missed'
}

function makeChart(): Note[] {
  const random = seededRandom(619)
  const notes: Note[] = []
  let lane = 2
  for (let i = 0; i < SONG_BEATS * 2; i++) {
    const beat = i / 2
    const onBeat = i % 2 === 0
    // Busier in the chorus (second half), sparse in the intro.
    const density = beat < 8 ? 0.35 : beat < 40 ? 0.55 : 0.75
    if (random() > (onBeat ? density + 0.2 : density - 0.25)) continue
    lane = Math.max(0, Math.min(4, lane + Math.round((random() - 0.5) * 3)))
    notes.push({ time: LEAD_IN + beat * BEAT, lane, state: 'pending' })
  }
  return notes
}

type Phase = 'ready' | 'playing' | 'done'

class Synth {
  ctx: AudioContext
  master: GainNode
  constructor() {
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.25
    this.master.connect(this.ctx.destination)
  }
  tone(freq: number, at: number, length: number, type: OscillatorType, volume: number) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + length)
    osc.connect(gain).connect(this.master)
    osc.start(at)
    osc.stop(at + length + 0.02)
  }
  /** Schedules a simple rock beat: kick, snare and a power-chord bass line. */
  backing(start: number) {
    const bass = [82.41, 82.41, 98.0, 110.0]
    for (let b = 0; b < SONG_BEATS; b++) {
      const at = start + LEAD_IN + b * BEAT
      this.tone(60, at, 0.18, 'sine', 0.9)
      if (b % 2 === 1) this.tone(180, at, 0.1, 'triangle', 0.35)
      this.tone(bass[Math.floor(b / 4) % 4], at, BEAT * 0.9, 'sawtooth', 0.12)
    }
  }
  close() {
    void this.ctx.close()
  }
}

export default function RhythmGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState({ score: 0, accuracy: 0, best: loadHighScore('rhythm') })
  const game = useRef({
    notes: [] as Note[],
    start: 0,
    score: 0,
    combo: 0,
    hits: 0,
    flash: [0, 0, 0, 0, 0],
    pressed: [false, false, false, false, false],
    feedback: { text: '', t: 0 },
    synth: null as Synth | null,
  })

  const now = () => {
    const g = game.current
    return g.synth ? g.synth.ctx.currentTime - g.start : 0
  }

  const start = () => {
    const g = game.current
    g.synth?.close()
    g.synth = new Synth()
    g.start = g.synth.ctx.currentTime + 0.1
    g.synth.backing(g.start)
    g.notes = makeChart()
    g.score = 0
    g.combo = 0
    g.hits = 0
    g.feedback = { text: '', t: 0 }
    setPhase('playing')
    canvasRef.current?.focus()
  }

  const strum = (lane: number) => {
    const g = game.current
    if (phase !== 'playing') return
    g.flash[lane] = 0.15
    const t = now()
    let best: Note | null = null
    for (const n of g.notes) {
      if (n.state !== 'pending' || n.lane !== lane) continue
      const d = Math.abs(n.time - t)
      if (d <= HIT_WINDOW && (!best || d < Math.abs(best.time - t))) best = n
    }
    if (best) {
      const perfect = Math.abs(best.time - t) <= PERFECT
      best.state = 'hit'
      g.combo += 1
      g.hits += 1
      const multiplier = Math.min(4, 1 + Math.floor(g.combo / 10))
      g.score += (perfect ? 100 : 60) * multiplier
      g.feedback = { text: perfect ? 'PERFECT!' : 'GOOD', t: 0.5 }
      g.synth?.tone(LANE_FREQ[lane], g.synth.ctx.currentTime, 0.35, 'square', 0.35)
    } else {
      g.combo = 0
      g.feedback = { text: 'MISS', t: 0.4 }
    }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const lane = LANES.findIndex((l, i) => l.key === e.key.toLowerCase() || e.key === String(i + 1))
      if (lane < 0 || e.repeat) return
      if (!canvasRef.current?.closest('.os-window')?.contains(document.activeElement)) return
      e.preventDefault()
      game.current.pressed[lane] = true
      strum(lane)
    }
    const up = (e: KeyboardEvent) => {
      const lane = LANES.findIndex((l, i) => l.key === e.key.toLowerCase() || e.key === String(i + 1))
      if (lane >= 0) game.current.pressed[lane] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })

  useEffect(() => () => game.current.synth?.close(), [])

  useCanvasLoop(canvasRef, (ctx, w, h, dt) => {
    const g = game.current
    const t = now()
    const laneW = Math.min(90, w / 6)
    const left = (w - laneW * 5) / 2
    const lineY = h * 0.86

    // Background stage
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#1a0626')
    bg.addColorStop(1, '#3a0d16')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#111'
    ctx.fillRect(left - 6, 0, laneW * 5 + 12, h)
    for (let i = 0; i <= 5; i++) {
      ctx.fillStyle = '#555'
      ctx.fillRect(left + i * laneW - 1, 0, 2, h)
    }
    // Moving fret lines on the beat
    if (phase === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      for (let b = Math.floor((t - LEAD_IN) / BEAT); b < (t - LEAD_IN + TRAVEL) / BEAT + 1; b++) {
        const y = lineY - ((LEAD_IN + b * BEAT - t) / TRAVEL) * lineY
        if (y > 0 && y < h) ctx.fillRect(left, y, laneW * 5, 2)
      }
    }
    // Hit targets
    LANES.forEach((lane, i) => {
      const cx = left + laneW * (i + 0.5)
      g.flash[i] = Math.max(0, g.flash[i] - dt)
      ctx.beginPath()
      ctx.arc(cx, lineY, laneW * 0.32, 0, Math.PI * 2)
      ctx.fillStyle = g.pressed[i] || g.flash[i] > 0 ? lane.color : '#222'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = lane.color
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px Tahoma'
      ctx.textAlign = 'center'
      ctx.fillText(lane.label, cx, lineY + laneW * 0.32 + 16)
    })
    // Notes
    if (phase === 'playing') {
      for (const n of g.notes) {
        if (n.state === 'pending' && t - n.time > HIT_WINDOW) {
          n.state = 'missed'
          g.combo = 0
        }
        if (n.state !== 'pending') continue
        const y = lineY - ((n.time - t) / TRAVEL) * lineY
        if (y < -20 || y > h + 20) continue
        const cx = left + laneW * (n.lane + 0.5)
        ctx.beginPath()
        ctx.ellipse(cx, y, laneW * 0.3, laneW * 0.18, 0, 0, Math.PI * 2)
        ctx.fillStyle = LANES[n.lane].color
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(cx, y - 2, laneW * 0.16, laneW * 0.08, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fill()
      }
      const last = g.notes[g.notes.length - 1]
      if (last && t > last.time + 1.2) {
        const accuracy = Math.round((g.hits / g.notes.length) * 100)
        const best = saveHighScore('rhythm', g.score)
        setResult({ score: g.score, accuracy, best })
        setPhase('done')
      }
    }
    // HUD
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffcc00'
    ctx.font = 'bold 18px Impact, sans-serif'
    ctx.fillText(`SCORE ${g.score}`, 12, 26)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Tahoma'
    ctx.fillText(`Combo ${g.combo}  ×${Math.min(4, 1 + Math.floor(g.combo / 10))}`, 12, 46)
    if (g.feedback.t > 0) {
      g.feedback.t -= dt
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px Impact, sans-serif'
      ctx.fillStyle = g.feedback.text === 'MISS' ? '#ff5050' : '#7dff7a'
      ctx.fillText(g.feedback.text, w / 2, lineY - 70)
    }
  })

  return (
    <div className="game">
      <canvas ref={canvasRef} tabIndex={0} aria-label="Rock Legend rhythm game" />
      <div className="game__lanes">
        {LANES.map((l, i) => (
          <button
            key={l.key}
            type="button"
            style={{ background: l.color }}
            onPointerDown={(e) => {
              e.preventDefault()
              strum(i)
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      {phase !== 'playing' && (
        <div className="game__overlay">
          <h3>🎸 ROCK LEGEND</h3>
          {phase === 'done' ? (
            <p>
              Score {result.score} · {result.accuracy}% notes hit · Best {result.best}
              <br />
              {result.accuracy > 85 ? '⭐⭐⭐⭐⭐ You rock!' : result.accuracy > 60 ? '⭐⭐⭐ Not bad!' : '⭐ The crowd wants an encore… of practice.'}
            </p>
          ) : (
            <p>Hit A S D F G (or tap the colored buttons) when the notes reach the circles. Sound on!</p>
          )}
          <button type="button" onClick={start}>
            {phase === 'done' ? 'Play again' : 'Start'}
          </button>
        </div>
      )}
    </div>
  )
}
