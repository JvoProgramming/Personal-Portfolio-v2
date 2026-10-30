import * as THREE from 'three'
import { step, type Body } from './physics'

// Every throwable thing in the room (tennis balls, bone, rope, duck, rubber chicken, croc) lives here as plain
// mutable data, updated each frame. React never re-renders for it; the toy meshes and Mochi
// read it inside useFrame.

export type ToyKind = 'ball' | 'bone' | 'rope' | 'duck' | 'chicken' | 'croc'

export type ToyState =
  /** Lying still, or rolling. */
  | 'free'
  /** In your hand, following the pointer. */
  | 'held'
  /** In Mochi's mouth. */
  | 'carried'

export interface Toy extends Body {
  id: number
  kind: ToyKind
  state: ToyState
  /** Moving through the air or rolling (needs simulating). */
  moving: boolean
  /** Visual spin while it rolls or flies. */
  spin: THREE.Quaternion
  /** When it was last thrown, so Mochi always goes for the newest throw. */
  thrownAt: number
}

const RADIUS: Record<ToyKind, number> = { ball: 0.033, bone: 0.021, rope: 0.022, duck: 0.036, chicken: 0.02, croc: 0.022 }

const START: [ToyKind, number, number][] = [
  ['bone', -0.75, 0.1],
  ['rope', -1.15, -0.35],
  ['duck', 0.95, -0.25],
  ['chicken', -0.15, -0.35],
  ['croc', 1.55, 0.0],
  ['ball', -1.75, -1.35],
  ['ball', -0.9, -1.7],
  ['ball', 1.6, -0.5],
  ['ball', -1.95, -1.55],
]

export const toys: Toy[] = START.map(([kind, x, z], id) => ({
  id,
  kind,
  state: 'free',
  moving: false,
  pos: new THREE.Vector3(x, RADIUS[kind], z),
  vel: new THREE.Vector3(),
  radius: RADIUS[kind],
  grounded: true,
  spin: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, id * 1.3, 0)),
  thrownAt: 0,
}))

/** Bumped on each throw; Mochi watches it to know when to chase. */
export const play = { throws: 0, lastThrown: -1 as number, held: -1 as number }

const axis = new THREE.Vector3()
const turn = new THREE.Quaternion()
const euler = new THREE.Euler()
const flat = new THREE.Quaternion()

/** Simulates every free, moving toy. */
export function updateToys(dt: number) {
  for (const t of toys) {
    if (t.state !== 'free' || !t.moving) continue
    // Slow frames are split into small steps, so throws play out at real speed on slow devices too.
    let left = Math.min(dt, 0.25)
    while (left > 0 && t.moving) {
      const h = Math.min(left, 1 / 30)
      t.moving = step(t, h)
      left -= h
    }
    // Roll: spin around the axis at right angles to the direction of travel.
    const speed = Math.hypot(t.vel.x, t.vel.z)
    if (t.kind !== 'ball' && (t.grounded || !t.moving)) {
      // Only balls roll. Everything else slides and settles flat (and the duck upright).
      euler.setFromQuaternion(t.spin, 'YXZ')
      flat.setFromEuler(euler.set(0, euler.y, 0, 'YXZ'))
      t.spin.slerp(flat, t.moving ? Math.min(1, dt * 12) : 1)
    } else if (!t.grounded && t.kind !== 'ball') {
      // Tumble a little in the air.
      axis.set(t.vel.z, 0.3, -t.vel.x).normalize()
      t.spin.premultiply(turn.setFromAxisAngle(axis, dt * 6))
    } else if (speed > 0.01) {
      axis.set(t.vel.z, 0, -t.vel.x).normalize()
      turn.setFromAxisAngle(axis, (speed * dt) / t.radius)
      t.spin.premultiply(turn)
    }
  }
}

export function grab(t: Toy) {
  t.state = 'held'
  t.moving = false
  t.vel.set(0, 0, 0)
  play.held = t.id
}

export function release(t: Toy, velocity: THREE.Vector3, now: number) {
  t.state = 'free'
  t.moving = true
  t.vel.copy(velocity)
  t.thrownAt = now
  play.held = -1
  play.lastThrown = t.id
  play.throws++
}

/** Mochi lets go of a toy at her mouth; it drops and bounces a little. */
export function drop(t: Toy, at: THREE.Vector3) {
  t.state = 'free'
  t.moving = true
  t.pos.copy(at)
  t.vel.set(0, 0.3, 0)
}
