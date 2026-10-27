import { useRef, useState } from 'react'
import { useCanvasLoop } from './games/useCanvasLoop'
import './montage.css'

// A Sony Vegas style editor playing a (drawn-in-code) 2006 gaming montage.

const LENGTH = 20

const CLIPS = [
  { name: 'intro_FINAL.avi', start: 0, end: 3, color: '#7b5ea7' },
  { name: 'frag_movie_1.avi', start: 3, end: 8, color: '#3d7ab8' },
  { name: '360_noscope.avi', start: 8, end: 12, color: '#c0563b' },
  { name: 'clutch_1v4.avi', start: 12, end: 16, color: '#3d9a5b' },
  { name: 'outro.avi', start: 16, end: 20, color: '#7b5ea7' },
]

const TEXTS = [
  { name: 'xX JOHNNY Xx', start: 0.3, end: 3 },
  { name: '360 NO SCOPE', start: 8.5, end: 11.5 },
  { name: '1v4 CLUTCH', start: 12.3, end: 15.5 },
  { name: 'THANKS 4 WATCHING', start: 16.5, end: 20 },
]

function timecode(t: number) {
  const s = Math.floor(t)
  const frames = Math.floor((t - s) * 30)
  return `00:00:${String(s).padStart(2, '0')};${String(frames).padStart(2, '0')}`
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const flash = Math.floor(t * 8) % 2 === 0

  if (t < 3) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    const scale = 0.6 + Math.min(1, t / 1.2) * 0.4
    ctx.translate(w / 2, h / 2)
    ctx.scale(scale, scale)
    ctx.font = `900 ${Math.round(h * 0.13)}px Impact, sans-serif`
    ctx.fillStyle = flash ? '#7ef9ff' : '#ff4fd8'
    ctx.fillText('xX JOHNNY Xx', 0, -h * 0.05)
    ctx.font = `bold ${Math.round(h * 0.06)}px Tahoma`
    ctx.fillStyle = '#fff'
    ctx.fillText('PRESENTS: MY FRAG MOVIE', 0, h * 0.1)
  } else if (t < 16) {
    // First-person game view: sky, buildings, a gun, crosshair.
    const sway = Math.sin(t * 2) * 6
    const spin = t >= 8 && t < 12 ? ((t - 8) / 1.2) * Math.PI * 2 : 0
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, t >= 12 ? '#3b2a1e' : '#87a8c8')
    sky.addColorStop(1, '#c8b48a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    const shift = (spin * w) % w
    ctx.fillStyle = '#6b5a45'
    for (let i = -1; i < 6; i++) {
      const bx = ((i * w) / 4 - shift + w) % (w * 1.5) - w * 0.25
      ctx.fillRect(bx, h * 0.35 + (i % 2) * h * 0.08, w / 6, h * 0.4)
      ctx.fillStyle = i % 2 ? '#6b5a45' : '#7d6a52'
    }
    ctx.fillStyle = '#5c4a36'
    ctx.fillRect(0, h * 0.72, w, h * 0.28)
    // Enemies that drop with a hitmarker
    const enemies = [3.6, 4.6, 5.8, 6.9, 12.6, 13.4, 14.2, 15.0]
    enemies.forEach((at, i) => {
      if (t < at - 0.7 || t > at + 0.5) return
      const ex = w * (0.3 + ((i * 37) % 40) / 100)
      const ey = h * 0.62
      const down = t > at
      ctx.fillStyle = down ? 'rgba(120,0,0,0.6)' : '#2b2b2b'
      ctx.fillRect(ex - 8, down ? ey + 10 : ey - 22, 16, down ? 8 : 30)
      if (down && t < at + 0.25) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (const [dx, dy] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ]) {
          ctx.moveTo(w / 2 + dx * 6, h / 2 + dy * 6)
          ctx.lineTo(w / 2 + dx * 12, h / 2 + dy * 12)
        }
        ctx.stroke()
      }
    })
    // Kill feed
    const kills = enemies.filter((at) => t > at && t - at < 3).length
    for (let i = 0; i < kills; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(w - 170, 10 + i * 18, 160, 16)
      ctx.fillStyle = '#7dff7a'
      ctx.font = 'bold 11px Tahoma'
      ctx.textAlign = 'right'
      ctx.fillText('xX_Johnny_Xx  ⌖  noob' + (i + 1), w - 16, 18 + i * 18)
    }
    ctx.textAlign = 'center'
    // Crosshair
    ctx.strokeStyle = '#3f3'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2 - 14, h / 2)
    ctx.lineTo(w / 2 - 4, h / 2)
    ctx.moveTo(w / 2 + 4, h / 2)
    ctx.lineTo(w / 2 + 14, h / 2)
    ctx.moveTo(w / 2, h / 2 - 14)
    ctx.lineTo(w / 2, h / 2 - 4)
    ctx.moveTo(w / 2, h / 2 + 4)
    ctx.lineTo(w / 2, h / 2 + 14)
    ctx.stroke()
    // Gun
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.moveTo(w * 0.62 + sway, h)
    ctx.lineTo(w * 0.7 + sway, h * 0.7)
    ctx.lineTo(w * 0.78 + sway, h * 0.72)
    ctx.lineTo(w * 0.8 + sway, h)
    ctx.fill()
    // Titles over gameplay
    if (t >= 8.5 && t < 11.5) {
      ctx.save()
      ctx.translate(w / 2, h * 0.3)
      ctx.rotate(Math.sin(t * 6) * 0.08)
      ctx.font = `900 ${Math.round(h * 0.14)}px Impact, sans-serif`
      ctx.lineWidth = 6
      ctx.strokeStyle = '#000'
      ctx.strokeText('360 NO SCOPE!!', 0, 0)
      ctx.fillStyle = flash ? '#fff27a' : '#ff4f4f'
      ctx.fillText('360 NO SCOPE!!', 0, 0)
      ctx.restore()
    }
    if (t >= 12.3 && t < 15.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, h * 0.08, w, h * 0.16)
      ctx.font = `900 ${Math.round(h * 0.1)}px Impact, sans-serif`
      ctx.fillStyle = '#7ef9ff'
      ctx.fillText('1v4 CLUTCH', w / 2, h * 0.16)
    }
    if (t >= 8 && t < 12) {
      ctx.fillStyle = 'rgba(255,200,120,0.12)'
      ctx.fillRect(0, 0, w, h)
    }
  } else {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.font = `900 ${Math.round(h * 0.1)}px Impact, sans-serif`
    ctx.fillStyle = '#fff'
    ctx.fillText('THANKS 4 WATCHING', w / 2, h * 0.4)
    ctx.font = `bold ${Math.round(h * 0.05)}px Tahoma`
    ctx.fillStyle = '#ffcc66'
    ctx.fillText('rate 5 stars + subscribe!!', w / 2, h * 0.55)
    ctx.fillStyle = '#aaa'
    ctx.fillText('song: Linkin Park (just imagine it playing)', w / 2, h * 0.66)
  }
  ctx.restore()
}

export default function MontageApp() {
  const previewRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const clock = useRef(0)

  useCanvasLoop(previewRef, (ctx, w, h, dt) => {
    if (playing) {
      clock.current += dt
      if (clock.current >= LENGTH) {
        clock.current = LENGTH
        setPlaying(false)
      }
      setTime(clock.current)
    }
    drawScene(ctx, w, h, clock.current)
  })

  const seek = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return
    clock.current = Math.max(0, Math.min(LENGTH, ((clientX - rect.left) / rect.width) * LENGTH))
    setTime(clock.current)
  }

  const toggle = () => {
    if (!playing && clock.current >= LENGTH) clock.current = 0
    setPlaying(!playing)
  }

  const pct = (t: number) => `${(t / LENGTH) * 100}%`

  return (
    <div className="vegas">
      <div className="vegas__menu" aria-hidden="true">
        File Edit View Insert Tools Options Help
      </div>
      <div className="vegas__top">
        <div className="vegas__media">
          <div className="vegas__panel-title">Project Media</div>
          <ul>
            {CLIPS.map((c) => (
              <li key={c.name}>
                <span className="vegas__thumb" style={{ background: c.color }} />
                {c.name}
              </li>
            ))}
            <li>
              <span className="vegas__thumb vegas__thumb--audio" />
              numb_(real)_(HQ).mp3
            </li>
          </ul>
        </div>
        <div className="vegas__preview">
          <div className="vegas__panel-title">Video Preview</div>
          <canvas ref={previewRef} aria-label="Montage preview" />
          <div className="vegas__transport">
            <button type="button" aria-label="Go to start" onClick={() => ((clock.current = 0), setTime(0))}>
              ⏮
            </button>
            <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
              {playing ? '⏸' : '▶'}
            </button>
            <button type="button" aria-label="Stop" onClick={() => ((clock.current = 0), setTime(0), setPlaying(false))}>
              ⏹
            </button>
            <span className="vegas__timecode">{timecode(time)}</span>
          </div>
        </div>
      </div>
      <div className="vegas__timeline">
        <div className="vegas__headers">
          <div className="vegas__ruler-spacer" />
          <div className="vegas__track-name">1 · Video</div>
          <div className="vegas__track-name">2 · Text</div>
          <div className="vegas__track-name">3 · Music</div>
        </div>
        <div
          className="vegas__lanes"
          ref={timelineRef}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            seek(e.clientX)
          }}
          onPointerMove={(e) => e.buttons === 1 && seek(e.clientX)}
        >
          <div className="vegas__ruler">
            {Array.from({ length: LENGTH / 2 + 1 }, (_, i) => (
              <span key={i} style={{ left: pct(i * 2) }}>
                {i * 2}s
              </span>
            ))}
          </div>
          <div className="vegas__track">
            {CLIPS.map((c) => (
              <div key={c.name} className="vegas__clip" style={{ left: pct(c.start), width: pct(c.end - c.start), background: c.color }}>
                {c.name}
              </div>
            ))}
          </div>
          <div className="vegas__track">
            {TEXTS.map((c) => (
              <div key={c.name} className="vegas__clip vegas__clip--text" style={{ left: pct(c.start), width: pct(c.end - c.start) }}>
                {c.name}
              </div>
            ))}
          </div>
          <div className="vegas__track">
            <div className="vegas__clip vegas__clip--audio" style={{ left: 0, width: '100%' }}>
              numb_(real)_(HQ).mp3
            </div>
          </div>
          <div className="vegas__playhead" style={{ left: pct(time) }} />
        </div>
      </div>
    </div>
  )
}
