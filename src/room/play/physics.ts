import * as THREE from 'three'
import { DESK, ROOM } from '../layout'

// Thrown toys don't need a physics engine: each one is a small ball, and the room is a handful
// of boxes. Every frame a toy falls, moves, and is pushed back out of anything it ends up inside,
// with its speed reflected and damped. That's enough for arcs, bounces off walls and furniture,
// landing on the desk or bed, and rolling to a stop.

export interface Box {
  min: [number, number, number]
  max: [number, number, number]
}

const box = (min: [number, number, number], max: [number, number, number]): Box => ({ min, max })
const top = DESK.y
const dz = DESK.z

/** Furniture as boxes. Things toys can land on have a real top; the rest are just walls. */
export const OBSTACLES: Box[] = [
  box([-1, top - 0.05, dz - 0.375], [1, top, dz + 0.375]), // desk top
  box([0.38, 0, dz - 0.36], [0.98, top - 0.05, dz + 0.36]), // drawer unit (right)
  box([-1, 0, dz - 0.36], [-0.94, top - 0.05, dz + 0.36]), // left side panel
  box([-0.25, top, dz - 0.36], [0.25, top + 0.44, dz + 0.06]), // monitor
  box([0.5, top, dz - 0.3], [0.74, top + 0.42, dz + 0.18]), // tower
  box([0.14, 0, -1.3], [0.7, 0.98, -0.74]), // office chair
  box([-2.82, 0, -0.36], [-2.02, 0.5, 0.46]), // bean bag
  box([-2.7, 0, -2.4], [-1.9, 0.28, -1.96]), // tennis bag
  box([2.46, 0, -2.3], [2.8, 0.42, -1.94]), // plant pot
  box([2.07, 0.54, -1.08], [2.73, 0.58, -0.42]), // side table top
  box([2.3, 0, -0.85], [2.5, 0.54, -0.65]), // side table base
  box([1.15, 0, -2.5], [1.55, 0.95, -2.18]), // guitar
  box([1.12, 0, 0.22], [3, 0.5, 1.16]), // bed
]

/** Inside the walls; the open front of the room has an invisible wall in front of the camera. */
export const BOUNDS = box([-ROOM.halfW, 0, -ROOM.halfD], [ROOM.halfW, ROOM.height, 1.9])

const GRAVITY = 9.8
const BOUNCE = 0.42
const FRICTION = 0.86
/** Speed below which a toy that's touching something stops for good. */
const SETTLE = 0.06

export interface Body {
  pos: THREE.Vector3
  vel: THREE.Vector3
  radius: number
  /** Whether the toy is lying on something (floor, desk, bed). */
  grounded: boolean
}

function pushOut(b: Body, o: Box) {
  const { pos, vel, radius: r } = b
  // Closest point on the box to the toy's center.
  const cx = Math.max(o.min[0], Math.min(pos.x, o.max[0]))
  const cy = Math.max(o.min[1], Math.min(pos.y, o.max[1]))
  const cz = Math.max(o.min[2], Math.min(pos.z, o.max[2]))
  let nx = pos.x - cx
  let ny = pos.y - cy
  let nz = pos.z - cz
  let d = Math.hypot(nx, ny, nz)
  if (d >= r) return
  if (d < 1e-6) {
    // Center is inside the box: leave by the nearest face.
    const faces = [pos.x - o.min[0], o.max[0] - pos.x, pos.y - o.min[1], o.max[1] - pos.y, pos.z - o.min[2], o.max[2] - pos.z]
    const i = faces.indexOf(Math.min(...faces))
    nx = i === 0 ? -1 : i === 1 ? 1 : 0
    ny = i === 2 ? -1 : i === 3 ? 1 : 0
    nz = i === 4 ? -1 : i === 5 ? 1 : 0
    d = -faces[i]
  } else {
    nx /= d
    ny /= d
    nz /= d
  }
  pos.x += nx * (r - d)
  pos.y += ny * (r - d)
  pos.z += nz * (r - d)
  const vn = vel.x * nx + vel.y * ny + vel.z * nz
  if (vn < 0) {
    vel.x -= (1 + BOUNCE) * vn * nx
    vel.y -= (1 + BOUNCE) * vn * ny
    vel.z -= (1 + BOUNCE) * vn * nz
  }
  if (ny > 0.7) b.grounded = true
}

/** Advances one toy by dt seconds. Returns false once it has come to rest. */
export function step(b: Body, dt: number): boolean {
  // Small sub-steps so fast throws can't pass through thin things like the desk top.
  const n = Math.max(1, Math.ceil((b.vel.length() * dt) / (b.radius * 0.8)))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    b.grounded = false
    b.vel.y -= GRAVITY * h
    b.pos.addScaledVector(b.vel, h)
    const { pos, vel, radius: r } = b
    if (pos.y < r) {
      pos.y = r
      if (vel.y < 0) vel.y = -vel.y * BOUNCE
      b.grounded = true
    }
    if (pos.y > BOUNDS.max[1] - r) {
      pos.y = BOUNDS.max[1] - r
      vel.y = -Math.abs(vel.y) * BOUNCE
    }
    for (const axis of [0, 2] as const) {
      const key = axis === 0 ? 'x' : 'z'
      if (pos[key] < BOUNDS.min[axis] + r) {
        pos[key] = BOUNDS.min[axis] + r
        vel[key] = Math.abs(vel[key]) * BOUNCE
      } else if (pos[key] > BOUNDS.max[axis] - r) {
        pos[key] = BOUNDS.max[axis] - r
        vel[key] = -Math.abs(vel[key]) * BOUNCE
      }
    }
    for (const o of OBSTACLES) pushOut(b, o)
    if (b.grounded) {
      // Rolling friction, and no tiny hops once it's basically on the ground.
      const f = Math.pow(FRICTION, h * 60 * 0.25)
      vel.x *= f
      vel.z *= f
      if (Math.abs(vel.y) < 0.4) vel.y = 0
    }
  }
  return !(b.grounded && b.vel.length() < SETTLE)
}

/** Moves a point on the floor out of the furniture footprints, so Mochi walks around things. */
export function keepOut(p: THREE.Vector3, radius: number) {
  for (const o of OBSTACLES) {
    if (o.min[1] > 0.3) continue
    const cx = Math.max(o.min[0], Math.min(p.x, o.max[0]))
    const cz = Math.max(o.min[2], Math.min(p.z, o.max[2]))
    const dx = p.x - cx
    const dz2 = p.z - cz
    const d = Math.hypot(dx, dz2)
    if (d >= radius) continue
    if (d < 1e-6) {
      // Inside: step out of the nearest side.
      const faces = [p.x - o.min[0], o.max[0] - p.x, p.z - o.min[2], o.max[2] - p.z]
      const i = faces.indexOf(Math.min(...faces))
      if (i === 0) p.x = o.min[0] - radius
      else if (i === 1) p.x = o.max[0] + radius
      else if (i === 2) p.z = o.min[2] - radius
      else p.z = o.max[2] + radius
    } else {
      p.x = cx + (dx / d) * radius
      p.z = cz + (dz2 / d) * radius
    }
  }
  p.x = Math.max(BOUNDS.min[0] + radius, Math.min(BOUNDS.max[0] - radius, p.x))
  p.z = Math.max(BOUNDS.min[2] + radius, Math.min(BOUNDS.max[2] - radius, p.z))
}
