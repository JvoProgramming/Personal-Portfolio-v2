import { useEffect, useRef, useState } from 'react'
import { loadHighScore, saveHighScore, useCanvasLoop } from './useCanvasLoop'
import './games.css'

// "Match Point": top-down tennis against the computer, with real tennis scoring.
// Move your racquet with the mouse, a finger, or the arrow keys; the swing is automatic.

const GAMES_TO_WIN = 3
const POINT_NAMES = ['0', '15', '30', '40']

type Phase = 'ready' | 'playing' | 'done'

function pointLabel(me: number, them: number): string {
  if (me >= 3 && them >= 3) {
    if (me === them) return 'Deuce'
    return me > them ? 'Advantage you' : 'Advantage CPU'
  }
  return `${POINT_NAMES[Math.min(me, 3)]} – ${POINT_NAMES[Math.min(them, 3)]}`
}

export default function TennisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState({ won: false, games: '0–0', best: loadHighScore('tennis') })
  const game = useRef({
    // Court coordinates run 0..1 in both directions; the player is at the bottom (y = 1).
    ball: { x: 0.5, y: 0.8, vx: 0, vy: 0, h: 0, vh: 0 },
    me: 0.5,
    target: 0.5,
    cpu: 0.5,
    points: [0, 0],
    games: [0, 0],
    rally: 0,
    longest: 0,
    serving: true,
    pause: 0.8,
    message: '',
    keys: { left: false, right: false },
  })

  const serve = () => {
    const g = game.current
    g.ball = { x: g.me, y: 0.88, vx: (Math.random() - 0.5) * 0.25, vy: -0.75, h: 0.3, vh: 0.6 }
    g.rally = 0
    g.serving = false
  }

  const start = () => {
    const g = game.current
    Object.assign(g, { points: [0, 0], games: [0, 0], rally: 0, longest: 0, serving: true, pause: 0.8, message: 'Your serve', me: 0.5, target: 0.5, cpu: 0.5 })
    setPhase('playing')
    canvasRef.current?.focus()
  }

  const winPoint = (who: 0 | 1) => {
    const g = game.current
    g.points[who] += 1
    g.longest = Math.max(g.longest, g.rally)
    const [a, b] = g.points
    if ((a >= 4 || b >= 4) && Math.abs(a - b) >= 2) {
      const winner = a > b ? 0 : 1
      g.games[winner] += 1
      g.points = [0, 0]
      g.message = winner === 0 ? 'Game, you!' : 'Game, CPU'
      if (g.games[winner] >= GAMES_TO_WIN) {
        const won = winner === 0
        const best = saveHighScore('tennis', g.longest)
        setResult({ won, games: `${g.games[0]}–${g.games[1]}`, best })
        setPhase('done')
        return
      }
    } else {
      g.message = pointLabel(g.points[0], g.points[1])
    }
    g.serving = true
    g.pause = 1.2
  }

  const aim = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const courtW = Math.min(rect.width * 0.8, rect.height * 0.55)
    const left = (rect.width - courtW) / 2
    game.current.target = Math.max(-0.1, Math.min(1.1, (clientX - rect.left - left) / courtW))
  }

  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      if (!canvasRef.current?.closest('.os-window')?.contains(document.activeElement)) return
      if (e.key === 'ArrowLeft' || e.key === 'a') game.current.keys.left = down
      else if (e.key === 'ArrowRight' || e.key === 'd') game.current.keys.right = down
      else return
      e.preventDefault()
    }
    const down = (e: KeyboardEvent) => set(e, true)
    const up = (e: KeyboardEvent) => set(e, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useCanvasLoop(canvasRef, (ctx, w, h, dt) => {
    const g = game.current
    const courtH = h * 0.86
    const courtW = Math.min(w * 0.8, courtH * 0.55)
    const left = (w - courtW) / 2
    const top = (h - courtH) / 2
    const X = (x: number) => left + x * courtW
    const Y = (y: number) => top + y * courtH
    const reach = 0.12

    if (phase === 'playing') {
      // Player movement
      if (g.keys.left) g.target -= dt * 1.4
      if (g.keys.right) g.target += dt * 1.4
      g.target = Math.max(-0.1, Math.min(1.1, g.target))
      g.me += (g.target - g.me) * Math.min(1, dt * 12)

      if (g.serving) {
        g.ball = { ...g.ball, x: g.me, y: 0.9, h: 0.25 }
        g.pause -= dt
        if (g.pause <= 0) serve()
      } else {
        const b = g.ball
        const speedUp = 1 + Math.min(0.8, g.rally * 0.05)
        b.x += b.vx * dt * speedUp
        b.y += b.vy * dt * speedUp
        // Fake height: the ball bounces once per side.
        b.vh -= 2.4 * dt
        b.h += b.vh * dt
        if (b.h < 0) {
          b.h = 0
          b.vh = Math.abs(b.vh) * 0.7
        }
        // CPU tracks the ball, a bit slower than the ball can move when the rally gets long.
        const cpuSpeed = 0.75 + Math.min(0.5, g.rally * 0.02)
        const want = b.vy < 0 ? b.x : 0.5
        g.cpu += Math.max(-cpuSpeed * dt, Math.min(cpuSpeed * dt, want - g.cpu))

        // Player's swing
        if (b.vy > 0 && b.y >= 0.9 && b.y <= 1.0 && Math.abs(b.x - g.me) < reach) {
          const offset = (b.x - g.me) / reach
          b.vy = -(0.75 + Math.random() * 0.1)
          b.vx = offset * 0.55
          b.vh = 0.7
          g.rally += 1
        }
        // CPU's swing (it sometimes mishits wide shots)
        if (b.vy < 0 && b.y <= 0.1 && b.y >= 0 && Math.abs(b.x - g.cpu) < reach) {
          b.vy = 0.75 + Math.random() * 0.1
          b.vx = (Math.random() - 0.5) * 0.9 + (0.5 - b.x) * 0.3
          b.vh = 0.7
          g.rally += 1
        }
        // Out of play
        if (b.y > 1.06) winPoint(1)
        else if (b.y < -0.06) winPoint(0)
        else if (b.x < -0.08 || b.x > 1.08) winPoint(b.vy > 0 ? 0 : 1)
      }
    }

    // Court
    ctx.fillStyle = '#2d6a4f'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#3a7bd5'
    ctx.fillRect(left, top, courtW, courtH)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(left, top, courtW, courtH)
    ctx.beginPath()
    ctx.moveTo(X(0.125), top)
    ctx.lineTo(X(0.125), Y(1))
    ctx.moveTo(X(0.875), top)
    ctx.lineTo(X(0.875), Y(1))
    ctx.moveTo(X(0.125), Y(0.25))
    ctx.lineTo(X(0.875), Y(0.25))
    ctx.moveTo(X(0.125), Y(0.75))
    ctx.lineTo(X(0.875), Y(0.75))
    ctx.moveTo(X(0.5), Y(0.25))
    ctx.lineTo(X(0.5), Y(0.75))
    ctx.stroke()
    // Net
    ctx.fillStyle = '#eee'
    ctx.fillRect(left - 8, Y(0.5) - 2, courtW + 16, 4)

    // Racquets
    const racquet = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(X(x), Y(y), courtW * reach * 0.6, 9, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fill()
    }
    racquet(g.cpu, 0.04, '#ffb703')
    racquet(g.me, 0.96, '#e63946')

    // Ball with shadow
    const b = g.ball
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(X(b.x), Y(b.y), 5, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#d4ec3a'
    ctx.beginPath()
    ctx.arc(X(b.x), Y(b.y) - b.h * 60, 6, 0, Math.PI * 2)
    ctx.fill()

    // Scoreboard
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(8, 8, 150, 52)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Tahoma'
    ctx.textAlign = 'left'
    ctx.fillText(`You  ${g.games[0]}   CPU  ${g.games[1]}`, 16, 28)
    ctx.fillStyle = '#d4ec3a'
    ctx.fillText(pointLabel(g.points[0], g.points[1]), 16, 48)
    if (phase === 'playing' && g.serving && g.message) {
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px Impact, sans-serif'
      ctx.fillStyle = '#fff'
      ctx.fillText(g.message, w / 2, Y(0.62))
    }
  })

  return (
    <div className="game" onPointerMove={(e) => aim(e.clientX)} onPointerDown={(e) => aim(e.clientX)}>
      <canvas ref={canvasRef} tabIndex={0} aria-label="Match Point tennis game" />
      {phase !== 'playing' && (
        <div className="game__overlay">
          <h3>🎾 MATCH POINT</h3>
          {phase === 'done' ? (
            <p>
              {result.won ? 'Game, set and match! You win' : 'The CPU takes it'} {result.games}. Longest rally record: {result.best} shots.
            </p>
          ) : (
            <p>Move with your mouse, finger or the arrow keys. Your racquet swings on its own; hit the ball off-center to angle it. First to {GAMES_TO_WIN} games wins.</p>
          )}
          <button type="button" onClick={start}>
            {phase === 'done' ? 'Rematch' : 'Start'}
          </button>
        </div>
      )}
    </div>
  )
}
