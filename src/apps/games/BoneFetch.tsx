import { useEffect, useRef, useState } from 'react'
import { loadHighScore, saveHighScore, useCanvasLoop } from './useCanvasLoop'
import './games.css'

// "Mochi's Bone Fetch": an endless runner. Jump over obstacles, grab bones.

const GRAVITY = 1800
const JUMP = 640

interface Thing {
  x: number
  y: number
  kind: 'hydrant' | 'ball' | 'cat' | 'bone'
  taken?: boolean
}

type Phase = 'ready' | 'playing' | 'done'

export default function BoneFetch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState({ score: 0, bones: 0, meters: 0, best: loadHighScore('bone-fetch') })
  const game = useRef({
    y: 0,
    vy: 0,
    jumps: 0,
    speed: 260,
    distance: 0,
    bones: 0,
    things: [] as Thing[],
    nextIn: 1,
    legs: 0,
    clouds: [80, 260, 470],
  })

  const start = () => {
    Object.assign(game.current, { y: 0, vy: 0, jumps: 0, speed: 260, distance: 0, bones: 0, things: [], nextIn: 1 })
    setPhase('playing')
    canvasRef.current?.focus()
  }

  const jump = () => {
    const g = game.current
    if (phase !== 'playing') return
    if (g.jumps < 2) {
      g.vy = g.jumps === 0 ? JUMP : JUMP * 0.85
      g.jumps += 1
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'ArrowUp' && e.key !== 'w') return
      if (!canvasRef.current?.closest('.os-window')?.contains(document.activeElement)) return
      e.preventDefault()
      jump()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useCanvasLoop(canvasRef, (ctx, w, h, dt) => {
    const g = game.current
    const ground = h * 0.8
    const dogX = Math.min(120, w * 0.2)

    if (phase === 'playing') {
      g.speed += dt * 6
      g.distance += g.speed * dt
      g.vy -= GRAVITY * dt
      g.y = Math.max(0, g.y + g.vy * dt)
      if (g.y === 0) {
        g.vy = 0
        g.jumps = 0
      }
      g.legs += dt * g.speed * 0.06
      g.nextIn -= dt
      if (g.nextIn <= 0) {
        const r = Math.random()
        const kind: Thing['kind'] = r < 0.35 ? 'bone' : r < 0.6 ? 'hydrant' : r < 0.85 ? 'ball' : 'cat'
        g.things.push({ x: w + 30, y: kind === 'bone' ? 40 + Math.random() * 90 : 0, kind })
        g.nextIn = 0.7 + Math.random() * 0.9 - Math.min(0.3, g.speed / 3000)
      }
      for (const t of g.things) {
        t.x -= g.speed * dt
        const near = Math.abs(t.x - dogX) < (t.kind === 'cat' ? 26 : 20)
        if (t.kind === 'bone') {
          if (!t.taken && near && Math.abs(g.y + 20 - t.y) < 30) {
            t.taken = true
            g.bones += 1
          }
        } else if (near && g.y < (t.kind === 'hydrant' ? 34 : t.kind === 'cat' ? 26 : 18)) {
          const score = Math.floor(g.distance / 10) + g.bones * 25
          const best = saveHighScore('bone-fetch', score)
          setResult({ score, bones: g.bones, meters: Math.floor(g.distance / 10), best })
          setPhase('done')
        }
      }
      g.things = g.things.filter((t) => t.x > -40 && !t.taken)
    }

    // Park background
    ctx.fillStyle = '#9fd8f7'
    ctx.fillRect(0, 0, w, ground)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    g.clouds = g.clouds.map((c) => {
      const x = c - dt * (phase === 'playing' ? 20 : 5)
      return x < -80 ? w + 40 : x
    })
    g.clouds.forEach((c, i) => {
      ctx.beginPath()
      ctx.ellipse(c, 40 + i * 25, 40, 14, 0, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = '#7cc56a'
    ctx.fillRect(0, ground, w, h - ground)
    ctx.fillStyle = '#5fa84f'
    const offset = -(g.distance % 40)
    for (let x = offset; x < w; x += 40) ctx.fillRect(x, ground, 20, 4)

    // Obstacles and bones
    for (const t of g.things) {
      if (t.kind === 'bone') {
        const y = ground - t.y
        ctx.fillStyle = '#f3ecdc'
        ctx.fillRect(t.x - 12, y - 3, 24, 6)
        for (const dx of [-12, 12]) for (const dy of [-4, 4]) {
          ctx.beginPath()
          ctx.arc(t.x + dx, y + dy, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (t.kind === 'hydrant') {
        ctx.fillStyle = '#d63031'
        ctx.fillRect(t.x - 10, ground - 34, 20, 34)
        ctx.fillRect(t.x - 14, ground - 26, 28, 8)
        ctx.beginPath()
        ctx.arc(t.x, ground - 34, 10, Math.PI, 0)
        ctx.fill()
      } else if (t.kind === 'ball') {
        ctx.fillStyle = '#d4ec3a'
        ctx.beginPath()
        ctx.arc(t.x, ground - 10, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(t.x - 8, ground - 10, 8, -0.9, 0.9)
        ctx.stroke()
      } else {
        // A sitting cat
        ctx.fillStyle = '#555'
        ctx.beginPath()
        ctx.ellipse(t.x, ground - 12, 14, 12, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(t.x - 8, ground - 26, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(t.x - 14, ground - 30)
        ctx.lineTo(t.x - 12, ground - 40)
        ctx.lineTo(t.x - 8, ground - 32)
        ctx.moveTo(t.x - 6, ground - 32)
        ctx.lineTo(t.x - 2, ground - 40)
        ctx.lineTo(t.x, ground - 30)
        ctx.fill()
      }
    }

    // Mochi
    const y = ground - g.y
    ctx.save()
    ctx.translate(dogX, y)
    ctx.fillStyle = '#e2b47a'
    const swing = g.y > 0 ? 0.6 : Math.sin(g.legs)
    for (const [lx, phaseShift] of [
      [-14, 0],
      [-6, Math.PI],
      [8, Math.PI],
      [16, 0],
    ]) {
      ctx.save()
      ctx.translate(lx, -14)
      ctx.rotate(Math.sin(g.legs + phaseShift) * 0.5 * (g.y > 0 ? 0 : 1) + (g.y > 0 ? swing * 0.4 : 0))
      ctx.fillRect(-2.5, 0, 5, 14)
      ctx.restore()
    }
    ctx.beginPath()
    ctx.ellipse(0, -22, 24, 13, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(24, -34, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(18, -42)
    ctx.lineTo(20, -54)
    ctx.lineTo(26, -44)
    ctx.moveTo(26, -44)
    ctx.lineTo(31, -54)
    ctx.lineTo(33, -42)
    ctx.fill()
    ctx.fillStyle = '#f6e7cf'
    ctx.beginPath()
    ctx.ellipse(32, -31, 7, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(38, -32, 2.5, 0, Math.PI * 2)
    ctx.arc(27, -37, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#e2b47a'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-22, -26)
    ctx.quadraticCurveTo(-34, -40 + Math.sin(g.legs * 2) * 4, -26, -46)
    ctx.stroke()
    ctx.restore()

    // HUD
    ctx.fillStyle = '#1b4332'
    ctx.font = 'bold 16px Tahoma'
    ctx.textAlign = 'left'
    ctx.fillText(`🦴 ${g.bones}`, 12, 24)
    ctx.fillText(`${Math.floor(g.distance / 10)} m`, 12, 44)
  })

  return (
    <div
      className="game"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).tagName === 'CANVAS') jump()
      }}
    >
      <canvas ref={canvasRef} tabIndex={0} aria-label="Mochi's Bone Fetch game" />
      {phase !== 'playing' && (
        <div className="game__overlay">
          <h3>🐶 MOCHI'S BONE FETCH</h3>
          {phase === 'done' ? (
            <p>
              Mochi ran {result.meters} m and grabbed {result.bones} bones. Score {result.score} · Best {result.best}
            </p>
          ) : (
            <p>Press Space (or click / tap) to jump. Jump twice for a double jump. Grab bones, dodge hydrants, tennis balls and cats.</p>
          )}
          <button type="button" onClick={start}>
            {phase === 'done' ? 'Run again' : 'Start'}
          </button>
        </div>
      )}
    </div>
  )
}
