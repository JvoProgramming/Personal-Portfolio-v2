import * as THREE from 'three'

// Everything in the room is drawn in code (no image files), so these helpers paint
// posters, photos and screens onto canvases and turn them into textures.

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

const cache = new Map<string, THREE.CanvasTexture>()

export function canvasTexture(key: string, width: number, height: number, draw: Draw): THREE.CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

function emoji(ctx: CanvasRenderingContext2D, char: string, x: number, y: number, size: number) {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, x, y)
}

function title(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, stroke?: string) {
  ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (stroke) {
    ctx.lineWidth = size / 8
    ctx.strokeStyle = stroke
    ctx.strokeText(text, x, y)
  }
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

export const posters = {
  spidey: () =>
    canvasTexture('poster-spidey', 512, 768, (ctx, w, h) => {
      ctx.fillStyle = '#b3121e'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#1a3a8f'
      ctx.fillRect(0, h * 0.62, w, h)
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'
      ctx.lineWidth = 4
      const cx = w / 2
      const cy = h * 0.4
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900)
        ctx.stroke()
      }
      for (let r = 60; r < 700; r += 70) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      // A spider emblem.
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 26, 44, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 7
      ctx.strokeStyle = '#111'
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          ctx.moveTo(cx, cy - 20 + i * 14)
          ctx.lineTo(cx + s * 70, cy - 60 + i * 40)
          ctx.lineTo(cx + s * 95, cy - 30 + i * 50)
          ctx.stroke()
        }
      }
      title(ctx, 'SPIDER', w / 2, h * 0.76, 96, '#fff', '#111')
      title(ctx, 'FAN CLUB', w / 2, h * 0.88, 60, '#ffd400', '#111')
    }),
  titan: () =>
    canvasTexture('poster-titan', 512, 768, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#f0a35e')
      g.addColorStop(1, '#5b2a1f')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // Huge face peeking over a wall.
      ctx.fillStyle = '#7a3b2a'
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.42, 150, 180, 0, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = '#ffdd88'
      ctx.fillRect(w / 2 - 70, h * 0.36, 40, 14)
      ctx.fillRect(w / 2 + 30, h * 0.36, 40, 14)
      ctx.fillStyle = '#8a7d6b'
      ctx.fillRect(0, h * 0.42, w, h * 0.4)
      ctx.strokeStyle = '#6b604f'
      ctx.lineWidth = 3
      for (let y = h * 0.47; y < h * 0.82; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      // Two crossed wings.
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.9
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(w / 2, h * 0.64)
        ctx.quadraticCurveTo(w / 2 + s * 120, h * 0.5, w / 2 + s * 150, h * 0.7)
        ctx.quadraticCurveTo(w / 2 + s * 60, h * 0.66, w / 2, h * 0.7)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      title(ctx, 'ATTACK', w / 2, h * 0.88, 70, '#fff', '#3a1a10')
      title(ctx, 'ON THE WALL', w / 2, h * 0.95, 40, '#ffd9a0', '#3a1a10')
    }),
  invincible: () =>
    canvasTexture('poster-invincible', 512, 768, (ctx, w, h) => {
      ctx.fillStyle = '#f5c800'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#1f6fd1'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w, 0)
      ctx.lineTo(w, h * 0.45)
      ctx.lineTo(0, h * 0.6)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.roundRect(w * 0.18, h * 0.5, w * 0.28, h * 0.08, 30)
      ctx.roundRect(w * 0.54, h * 0.5, w * 0.28, h * 0.08, 30)
      ctx.fill()
      ctx.fillStyle = '#c00'
      ctx.fillRect(0, h * 0.63, w, 10)
      title(ctx, 'UNBEATABLE', w / 2, h * 0.8, 72, '#1f6fd1', '#111')
      title(ctx, 'THINK, MARK!', w / 2, h * 0.9, 44, '#111')
    }),
  rock: () =>
    canvasTexture('poster-rock', 512, 768, (ctx, w, h) => {
      ctx.fillStyle = '#120818'
      ctx.fillRect(0, 0, w, h)
      // Flames.
      for (let i = 0; i < 40; i++) {
        const x = (i / 40) * w
        const g = ctx.createLinearGradient(0, h, 0, h * 0.45)
        g.addColorStop(0, '#ff3d00')
        g.addColorStop(0.6, '#ffb300')
        g.addColorStop(1, 'rgba(255,200,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(x - 20, h)
        ctx.quadraticCurveTo(x + 10, h * (0.55 + Math.sin(i * 1.7) * 0.08), x + 30, h)
        ctx.fill()
      }
      // Guitar silhouette.
      ctx.save()
      ctx.translate(w / 2, h * 0.42)
      ctx.rotate(-0.5)
      ctx.fillStyle = '#e2e2e2'
      ctx.fillRect(-10, -260, 20, 230)
      ctx.fillStyle = '#d7263d'
      ctx.beginPath()
      ctx.ellipse(0, 20, 80, 95, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(0, 0, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      title(ctx, 'ROCK', w / 2, h * 0.12, 110, '#ffcc00', '#5a0000')
      title(ctx, 'LEGEND', w / 2, h * 0.24, 80, '#fff', '#5a0000')
      // Five fret buttons.
      const colors = ['#2ecc40', '#ff4136', '#ffdc00', '#0074d9', '#ff851b']
      colors.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(w * 0.2 + i * w * 0.15, h * 0.92, 22, 0, Math.PI * 2)
        ctx.fill()
      })
    }),
}

export interface FramePhoto {
  id: string
  caption: string
  emoji: string
  color: string
}

export const FRAME_PHOTOS: FramePhoto[] = [
  { id: 'mochi', caption: 'Mochi', emoji: '🐶', color: '#f4c27a' },
  { id: 'tammy', caption: 'Johnny & Tammy', emoji: '💑', color: '#f2a7b8' },
  { id: 'tennis', caption: 'First tournament', emoji: '🎾', color: '#9fd8a4' },
  { id: 'family', caption: 'Family trip to Vietnam', emoji: '🏝️', color: '#8fd3e8' },
]

export function photoTexture(p: FramePhoto) {
  return canvasTexture(`photo-${p.id}`, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = p.color
    ctx.fillRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w)
    g.addColorStop(0, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(0,0,0,0.25)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    emoji(ctx, p.emoji, w / 2, h / 2, 140)
  })
}

export function screenTexture(on: boolean) {
  return canvasTexture(`screen-${on}`, 512, 384, (ctx, w, h) => {
    if (!on) {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#20242c')
      g.addColorStop(1, '#0b0d12')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      ctx.ellipse(w * 0.3, h * 0.25, w * 0.35, h * 0.12, -0.3, 0, Math.PI * 2)
      ctx.fill()
      return
    }
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    const colors = ['#f25022', '#7fba00', '#00a4ef', '#ffb900']
    colors.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(w / 2 - 60 + (i % 2) * 34, h / 2 - 70 + Math.floor(i / 2) * 32, 30, 28)
    })
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 40px Tahoma, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Johnny XP', w / 2, h / 2 + 40)
    ctx.fillStyle = '#2838c7'
    ctx.fillRect(w / 2 - 40, h / 2 + 80, 80, 10)
  })
}

export function gameBoyScreen() {
  return canvasTexture('gameboy-screen', 160, 144, (ctx, w, h) => {
    // A tiny pixel-art city with a web-slinger, in Game Boy greens.
    const palette = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
    ctx.fillStyle = palette[3]
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = palette[2]
    for (let i = 0; i < 8; i++) ctx.fillRect(i * 22, 60 - (i % 3) * 14, 18, 90)
    ctx.fillStyle = palette[1]
    for (let i = 0; i < 8; i++) for (let y = 70; y < 140; y += 12) ctx.fillRect(i * 22 + 4, y - (i % 3) * 14, 4, 4)
    ctx.strokeStyle = palette[0]
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(110, 0)
    ctx.lineTo(80, 50)
    ctx.stroke()
    ctx.fillStyle = palette[0]
    ctx.fillRect(76, 50, 8, 8)
    ctx.fillRect(74, 58, 12, 10)
    ctx.fillRect(72, 68, 4, 8)
    ctx.fillRect(84, 68, 4, 8)
    ctx.fillRect(0, 130, w, 14)
    ctx.fillStyle = palette[3]
    ctx.font = 'bold 9px monospace'
    ctx.fillText('SCORE 004200', 4, 140)
  })
}

export function rugTexture() {
  return canvasTexture('rug', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d4f7a'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#d9c7a1'
    ctx.lineWidth = 14
    ctx.strokeRect(30, 30, w - 60, h - 60)
    ctx.lineWidth = 4
    ctx.strokeRect(60, 60, w - 120, h - 120)
    ctx.fillStyle = '#b4504a'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(w / 2, 120 + i * 60)
      ctx.lineTo(w / 2 + 40, 150 + i * 60)
      ctx.lineTo(w / 2, 180 + i * 60)
      ctx.lineTo(w / 2 - 40, 150 + i * 60)
      ctx.fill()
    }
  })
}

export function woodTexture() {
  return canvasTexture('floor', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#7a5538'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#80593b' : '#704e33'
      ctx.fillRect(0, i * 64, w, 62)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, i * 64 + 62, w, 2)
      ctx.fillRect(((i * 197) % w) + 40, i * 64, 2, 62)
    }
  })
}
