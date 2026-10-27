import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

// Organic shapes (Mochi, the bean bag, the bone) are described as signed distance functions:
// a few spheres and tapered capsules blended smoothly together. At load time they are baked
// into an ordinary mesh with marching cubes, so they cost nothing extra to render.

export type Sdf = (x: number, y: number, z: number) => number
type V = [number, number, number]

export const sphere =
  (c: V, r: number): Sdf =>
  (x, y, z) =>
    Math.hypot(x - c[0], y - c[1], z - c[2]) - r

/** Approximate ellipsoid distance (good enough for blending). */
export const ellipsoid =
  (c: V, r: V): Sdf =>
  (x, y, z) => {
    const px = (x - c[0]) / r[0]
    const py = (y - c[1]) / r[1]
    const pz = (z - c[2]) / r[2]
    const k0 = Math.hypot(px, py, pz)
    const k1 = Math.hypot(px / r[0], py / r[1], pz / r[2])
    return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1
  }

/** A capsule whose radius goes from ra at a to rb at b. */
export const cone =
  (a: V, b: V, ra: number, rb: number): Sdf =>
  (x, y, z) => {
    const bax = b[0] - a[0]
    const bay = b[1] - a[1]
    const baz = b[2] - a[2]
    const pax = x - a[0]
    const pay = y - a[1]
    const paz = z - a[2]
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)))
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h)
  }

/** A smooth tube through several points, tapering from r0 to r1. */
export function chain(points: V[], r0: number, r1: number, k = 0.01): Sdf {
  const parts = points.slice(1).map((p, i) => cone(points[i], p, r0 + ((r1 - r0) * i) / (points.length - 1), r0 + ((r1 - r0) * (i + 1)) / (points.length - 1)))
  return union(k, ...parts)
}

function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

/** Smoothly blends shapes together; k is how far (meters) the blend reaches. */
export function union(k: number, ...parts: Sdf[]): Sdf {
  return (x, y, z) => {
    let d = parts[0](x, y, z)
    for (let i = 1; i < parts.length; i++) d = k > 0 ? smin(d, parts[i](x, y, z), k) : Math.min(d, parts[i](x, y, z))
    return d
  }
}

/** Squashes space along one axis before measuring, to flatten a shape (e.g. ears). */
export function scaled(s: V, f: Sdf): Sdf {
  const m = Math.min(...s)
  return (x, y, z) => f(x / s[0], y / s[1], z / s[2]) * m
}

export interface BakeOptions {
  center: V
  /** Half the size of the cube that contains the shape. */
  half: number
  resolution?: number
  /** Per-vertex color, from the vertex position. */
  color?: (p: THREE.Vector3) => THREE.Color
}

/** Bakes an SDF into a smooth, indexed mesh with normals from the field's gradient. */
export function bake(sdf: Sdf, { center, half, resolution = 56, color }: BakeOptions): THREE.BufferGeometry {
  const mc = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 60000)
  mc.isolation = 0
  const n = mc.size
  const hs = mc.halfsize
  // MarchingCubes walks its grid in [-1, 1]; map that onto our cube and fill in -distance.
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = center[0] + ((i - hs) / hs) * half
        const y = center[1] + ((j - hs) / hs) * half
        const z = center[2] + ((k - hs) / hs) * half
        mc.field[i + j * n + k * n * n] = -sdf(x, y, z) / half
      }
    }
  }
  mc.update()

  const count = mc.count
  const raw = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + mc.positionArray[i * 3] * half
    pos[i * 3 + 1] = center[1] + mc.positionArray[i * 3 + 1] * half
    pos[i * 3 + 2] = center[2] + mc.positionArray[i * 3 + 2] * half
  }
  raw.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  mc.geometry.dispose()

  // Normals from the SDF gradient are smoother than per-triangle ones.
  const normals = new Float32Array(count * 3)
  const colors = color ? new Float32Array(count * 3) : null
  const e = half / resolution / 2
  const p = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    p.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    const nx = sdf(p.x + e, p.y, p.z) - sdf(p.x - e, p.y, p.z)
    const ny = sdf(p.x, p.y + e, p.z) - sdf(p.x, p.y - e, p.z)
    const nz = sdf(p.x, p.y, p.z + e) - sdf(p.x, p.y, p.z - e)
    const len = Math.hypot(nx, ny, nz) || 1
    normals[i * 3] = nx / len
    normals[i * 3 + 1] = ny / len
    normals[i * 3 + 2] = nz / len
    if (colors && color) {
      const c = color(p)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
  }
  raw.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  if (colors) raw.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Simple planar UVs so normal maps (fur, fabric) have something to follow.
  const uv = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    uv[i * 2] = (pos[i * 3] + pos[i * 3 + 2]) * 6
    uv[i * 2 + 1] = pos[i * 3 + 1] * 6
  }
  raw.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  raw.computeBoundingSphere()
  return raw
}

/** Blends between two colors with a soft edge: 0 below edge0, 1 above edge1. */
export function mixColor(a: THREE.Color, b: THREE.Color, t: number) {
  const s = Math.max(0, Math.min(1, t))
  return a.clone().lerp(b, s * s * (3 - 2 * s))
}
