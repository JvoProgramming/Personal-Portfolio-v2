import { useFrame } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { DESK, ROOM } from '../layout'
import { deform, grainNormal, strandNormal, weaveNormal } from '../materials'
import type { Lighting } from '../time'
import { Model } from '../Model'

// Johnny's bed in the front right corner, headphones on a stand on the desk,
// and a color-shifting LED strip around the ceiling.

/** Bed footprint (matches the toy-physics box in play/physics.ts). */
const BED = { x0: 1.12, x1: 3, z0: 0.22, z1: 1.16 }
const FRAME_TOP = 0.3
const MATTRESS = 0.17

/** A soft cushion shape (a rounded "superellipsoid"): boxy, with plump rounded edges. */
function puffy(w: number, h: number, d: number) {
  const e = 0.35
  const f = (x: number) => Math.sign(x) * Math.pow(Math.abs(x), e)
  return deform(new THREE.SphereGeometry(1, 40, 24), (v) => {
    v.set((f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2)
  })
}

/** A blanket laid over the bed: flat on top with soft folds, hanging down over both long sides and the foot. */
function drape(w: number, d: number, drop: number, folds: number) {
  const overhang = drop + 0.04
  const g = new THREE.PlaneGeometry(w + overhang, d + overhang * 2, 48, 40)
  g.rotateX(-Math.PI / 2)
  // Shift so the extra length hangs off the foot end (-x), not the head end.
  g.translate(-overhang / 2, 0, 0)
  return deform(g, (v) => {
    const sideOut = Math.max(0, Math.abs(v.z) - d / 2)
    const footOut = Math.max(0, -v.x - w / 2)
    // Past the mattress edge the cloth turns down and hangs.
    if (sideOut > 0) {
      v.y -= sideOut
      v.z = Math.sign(v.z) * (d / 2 + 0.012 + sideOut * 0.08)
    }
    if (footOut > 0) {
      v.y -= footOut
      v.x = -w / 2 - 0.012 - footOut * 0.08
    }
    // Soft folds and creases, gentler on the hanging parts.
    const flat = sideOut + footOut > 0 ? 0.5 : 1
    v.y += (Math.sin(v.x * 9 * folds + 1) * 0.006 + Math.sin(v.z * 13 + v.x * 4) * 0.005) * flat
    // A rounded edge where it goes over the mattress corner.
    v.y -= Math.min(0.01, sideOut * 0.4 + footOut * 0.4)
  })
}

export function Bed() {
  const w = BED.x1 - BED.x0
  const d = BED.z1 - BED.z0
  const cx = (BED.x0 + BED.x1) / 2
  const cz = (BED.z0 + BED.z1) / 2
  const parts = useMemo(() => {
    const frame = new RoundedBoxGeometry(w, FRAME_TOP - 0.08, d, 4, 0.02)
    const mattress = new RoundedBoxGeometry(w - 0.1, MATTRESS, d - 0.06, 5, 0.05)
    const head = new RoundedBoxGeometry(0.08, 0.62, d + 0.04, 6, 0.035)
    // The duvet covers the foot two-thirds of the bed and hangs down over the sides.
    const dw = w * 0.68
    const duvet = drape(dw, d - 0.04, 0.15, 1)
    const pillow = puffy(0.3, 0.12, 0.46)
    const throwBlanket = drape(0.4, d - 0.02, 0.2, 2.2)
    return { frame, mattress, head, duvet, dw, pillow, throwBlanket }
  }, [w, d])

  const mats = useMemo(
    () => ({
      wood: new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.6, normalMap: grainNormal(3), normalScale: new THREE.Vector2(0.4, 0.4) }),
      sheet: new THREE.MeshPhysicalMaterial({ color: '#eef0f4', roughness: 0.95, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), normalMap: weaveNormal(14), normalScale: new THREE.Vector2(0.25, 0.25) }),
      duvet: new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, color: '#35577c', roughness: 0.9, sheen: 0.2, sheenColor: new THREE.Color('#5d7fa6'), normalMap: weaveNormal(10), normalScale: new THREE.Vector2(0.5, 0.5) }),
      head: new THREE.MeshPhysicalMaterial({ color: '#8b8f98', roughness: 1, sheen: 0.5, sheenColor: new THREE.Color('#c8ccd6'), normalMap: weaveNormal(6), normalScale: new THREE.Vector2(0.7, 0.7) }),
      pillow: new THREE.MeshPhysicalMaterial({ color: '#f5f2ea', roughness: 0.95, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), normalMap: weaveNormal(10), normalScale: new THREE.Vector2(0.2, 0.2) }),
      knit: new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, color: '#c97a42', roughness: 1, sheen: 0.3, sheenColor: new THREE.Color('#e8a878'), normalMap: strandNormal(5, 2600), normalScale: new THREE.Vector2(0.8, 0.8) }),
    }),
    [],
  )

  const mattressTop = FRAME_TOP + MATTRESS - 0.02
  return (
    <group>
      <mesh geometry={parts.frame} material={mats.wood} position={[cx, 0.08 + (FRAME_TOP - 0.08) / 2, cz]} castShadow receiveShadow />
      {[
        [BED.x0 + 0.05, BED.z0 + 0.05],
        [BED.x0 + 0.05, BED.z1 - 0.05],
        [BED.x1 - 0.05, BED.z0 + 0.05],
        [BED.x1 - 0.05, BED.z1 - 0.05],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={mats.wood} position={[x, 0.04, z]} castShadow>
          <boxGeometry args={[0.07, 0.08, 0.07]} />
        </mesh>
      ))}
      {/* Upholstered headboard against the wall */}
      <mesh geometry={parts.head} material={mats.head} position={[BED.x1 - 0.05, 0.62, cz]} castShadow receiveShadow />
      <mesh geometry={parts.mattress} material={mats.sheet} position={[cx + 0.02, FRAME_TOP + MATTRESS / 2 - 0.02, cz]} castShadow receiveShadow />
      <mesh geometry={parts.duvet} material={mats.duvet} position={[BED.x0 + parts.dw / 2 + 0.06, mattressTop + 0.012, cz]} castShadow receiveShadow />
      {/* Knit throw folded across the foot */}
      <mesh geometry={parts.throwBlanket} material={mats.knit} position={[BED.x0 + 0.24, mattressTop + 0.048, cz]} castShadow />
      {/* Two pillows propped against the headboard */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={parts.pillow} material={mats.pillow} position={[BED.x1 - 0.26, mattressTop + 0.07, cz + s * 0.22]} rotation={[0, s * 0.05, 0.35]} castShadow />
      ))}
    </group>
  )
}

/** Over-ear headphones hanging on a little stand at the right end of the desk. */
export function Headphones() {
  const parts = useMemo(() => {
    const arc = Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI
      return new THREE.Vector3(Math.cos(a) * 0.082, Math.sin(a) * 0.09, 0)
    })
    const band = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 48, 0.008, 10)
    return { band }
  }, [])
  const black = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#17171b', roughness: 0.35, clearcoat: 0.6 }), [])
  const leather = useMemo(() => new THREE.MeshStandardMaterial({ color: '#232328', roughness: 0.7, normalMap: strandNormal(3, 800), normalScale: new THREE.Vector2(0.3, 0.3) }), [])
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9bec6', metalness: 1, roughness: 0.25 }), [])
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d0303a', roughness: 0.4 }), [])
  const top = DESK.y
  return (
    <group position={[0.88, top, DESK.z + 0.17]} rotation={[0, -0.4, 0]}>
      <Model
        url="/models/headphones_on_stand.glb"
        fit={{ height: 0.3 }}
        fallback={
          <>
          {/* Stand */}
          <mesh material={metal} position={[0, 0.006, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.012, 32]} />
          </mesh>
          <mesh material={metal} position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.27, 12]} />
          </mesh>
          <mesh material={leather} position={[0, 0.278, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]}>
            <cylinderGeometry args={[0.03, 0.03, 0.035, 20]} />
          </mesh>
          {/* Headband over the hanger, cups hanging either side */}
          <group position={[0, 0.2, 0]}>
            <mesh geometry={parts.band} material={black} castShadow />
            <mesh material={leather} position={[0, 0.085, 0]} scale={[1, 0.5, 1]}>
              <capsuleGeometry args={[0.012, 0.07, 4, 10]} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.088, -0.02, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
                <mesh material={black} castShadow>
                  <cylinderGeometry args={[0.044, 0.044, 0.03, 32]} />
                </mesh>
                <mesh material={leather} position={[0, s * -0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.032, 0.011, 10, 28]} />
                </mesh>
                <mesh material={red} position={[0, s * 0.0155, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.002, 20]} />
                </mesh>
              </group>
            ))}
          </group>
          </>
        }
      />
    </group>
  )
}

/** A thin LED strip around the top of the walls, slowly drifting between purple, pink and blue. */
export function LedStrip({ lighting }: { lighting: Lighting }) {
  const [mat] = useState(() => new THREE.MeshBasicMaterial({ toneMapped: false }))
  const level = lighting.phase === 'day' ? 0.7 : 1.4
  useFrame(({ clock }) => {
    const hue = 0.72 + Math.sin(clock.elapsedTime * 0.15) * 0.14
    mat.color.setHSL(hue, 0.9, 0.55).multiplyScalar(level)
  })
  const { halfW, halfD, height } = ROOM
  const y = height - 0.035
  const strips: { pos: [number, number, number]; size: [number, number, number] }[] = [
    { pos: [0, y, -halfD + 0.012], size: [halfW * 2, 0.012, 0.006] },
    { pos: [-halfW + 0.012, y, 0], size: [0.006, 0.012, halfD * 2] },
    { pos: [halfW - 0.012, y, 0], size: [0.006, 0.012, halfD * 2] },
  ]
  return (
    <group>
      {strips.map(({ pos, size }) => (
        <mesh key={pos.join()} position={pos} material={mat}>
          <boxGeometry args={size} />
        </mesh>
      ))}
    </group>
  )
}
