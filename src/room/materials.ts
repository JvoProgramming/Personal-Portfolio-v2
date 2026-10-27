import * as THREE from 'three'
import { seeded } from './layout'

// Procedural surface detail. Everything is painted on small canvases at load time, so the room
// gets fabric weave, fur, felt and wood grain without downloading any image files.

const cache = new Map<string, THREE.Texture>()

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return { c, ctx: c.getContext('2d')! }
}

/** Turns a grayscale height canvas into a tangent-space normal map. */
function heightToNormal(src: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const w = src.width
  const h = src.height
  const data = src.getContext('2d')!.getImageData(0, 0, w, h).data
  const { c, ctx } = canvas(w)
  const out = ctx.createImageData(w, h)
  const height = (x: number, y: number) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (height(x + 1, y) - height(x - 1, y)) * strength
      const dy = (height(x, y + 1) - height(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      out.data[i + 2] = (1 / len) * 0.5 * 255 + 127
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return c
}

function texture(key: string, make: () => HTMLCanvasElement, repeat: number, color = false): THREE.Texture {
  const hit = cache.get(key)
  if (hit) return hit
  const t = new THREE.CanvasTexture(make())
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = 4
  if (color) t.colorSpace = THREE.SRGBColorSpace
  cache.set(key, t)
  return t
}

/** Woven mesh, like an office chair's seat fabric. */
export function weaveNormal(repeat = 6) {
  return texture(
    `weave-${repeat}`,
    () => {
      const { c, ctx } = canvas(128)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 128, 128)
      for (let y = 0; y < 128; y += 8) {
        for (let x = 0; x < 128; x += 8) {
          const over = ((x + y) / 8) % 2 === 0
          const g = ctx.createLinearGradient(x, y, over ? x + 8 : x, over ? y : y + 8)
          g.addColorStop(0, '#333')
          g.addColorStop(0.5, '#fff')
          g.addColorStop(1, '#333')
          ctx.fillStyle = g
          ctx.fillRect(x + 0.5, y + 0.5, 7, 7)
        }
      }
      return heightToNormal(c, 2.5)
    },
    repeat,
  )
}

/** Fine directional strands, for fur and felt. */
export function strandNormal(repeat = 3, density = 2600) {
  return texture(
    `strand-${repeat}-${density}`,
    () => {
      const { c, ctx } = canvas(256)
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, 256, 256)
      const random = seeded(11)
      ctx.lineCap = 'round'
      for (let i = 0; i < density; i++) {
        const x = random() * 256
        const y = random() * 256
        const len = 4 + random() * 9
        const a = Math.PI / 2 + (random() - 0.5) * 0.7
        ctx.strokeStyle = random() > 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
        ctx.lineWidth = 0.6 + random() * 1.1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
        ctx.stroke()
      }
      return heightToNormal(c, 1.6)
    },
    repeat,
  )
}

/** Soft blotchy noise, for plastic, leather and painted surfaces. */
export function grainNormal(repeat = 4) {
  return texture(
    `grain-${repeat}`,
    () => {
      const { c, ctx } = canvas(128)
      const img = ctx.createImageData(128, 128)
      const random = seeded(5)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + random() * 40
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      ctx.filter = 'blur(1px)'
      ctx.drawImage(c, 0, 0)
      return heightToNormal(c, 1.2)
    },
    repeat,
  )
}

/** A tennis ball: optic-yellow felt with the curvy white seam, laid out for a sphere's UVs. */
export function tennisBallMap() {
  return texture(
    'tennis-ball',
    () => {
      const w = 512
      const { c, ctx } = canvas(w)
      ctx.fillStyle = '#d7ef3b'
      ctx.fillRect(0, 0, w, w)
      const random = seeded(3)
      for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,200,0.18)' : 'rgba(120,140,0,0.16)'
        ctx.fillRect(random() * w, random() * w, 1.5, 1.5)
      }
      // The seam is a sine wave around the equator in equirectangular space.
      ctx.strokeStyle = '#f7f9ec'
      ctx.lineWidth = 9
      ctx.beginPath()
      for (let x = 0; x <= w; x += 2) {
        const y = w / 2 + Math.sin((x / w) * Math.PI * 4) * w * 0.22
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      return c
    },
    1,
    true,
  )
}

/** Moves every vertex of a geometry, then recomputes normals. */
export function deform(geometry: THREE.BufferGeometry, fn: (v: THREE.Vector3) => void): THREE.BufferGeometry {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    fn(v)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** A rounded 2D rectangle path, for extrusions. */
export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}
