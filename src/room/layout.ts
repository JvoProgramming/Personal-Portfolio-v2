import * as THREE from 'three'

// Shared room measurements (meters). The room spans x -3..3 and z -2.5..2.5.
export const ROOM = { halfW: 3, halfD: 2.5, height: 2.8 }
/** The window hole in the right wall (x = +3). */
export const WINDOW = { z0: -1.5, z1: -0.1, y0: 1.0, y1: 2.15 }
export const DESK = { y: 0.76, z: -2.1 }
/** Center of the monitor's glass; the camera flies here when the PC turns on. */
export const SCREEN_POS = new THREE.Vector3(0, 1.06, -2.048)

/** Small deterministic random generator, so the scene looks the same on every render. */
export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
