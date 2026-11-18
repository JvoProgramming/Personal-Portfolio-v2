import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { rugTexture } from '../textures'
import { ROOM, WINDOW } from '../layout'
import { Model } from '../Model'

// The shell of the room: herringbone oak floor, plaster walls (a deep green accent wall behind the desk,
// warm putty everywhere else), white crown molding and baseboards, and a fourth wall with the door, so
// the room is closed in when you turn around in the chair.

/** Wall colors. */
const PALETTE = {
  wall: '#c9b9a2',
  accent: '#2f4a41',
  ceiling: '#ebe5d8',
  trim: '#f1ece2',
}
const T = 0.1
const BASE_H = 0.12
const CROWN = 0.09

/** Plaster: the color comes from the paint, the texture only from a subtle normal map. */
function usePlaster() {
  const normal = useTexture('/textures/painted_plaster_wall_nor_gl.webp')
  return useMemo(() => {
    const make = (color: string) => (w: number, h: number) => {
      const n = normal.clone()
      n.wrapS = n.wrapT = THREE.RepeatWrapping
      n.repeat.set(w / 1.6, h / 1.6)
      n.needsUpdate = true
      return new THREE.MeshStandardMaterial({ color, roughness: 0.93, normalMap: n, normalScale: new THREE.Vector2(0.45, 0.45) })
    }
    return { wall: make(PALETTE.wall), accent: make(PALETTE.accent), ceiling: make(PALETTE.ceiling) }
  }, [normal])
}

function useFloor() {
  // A single, fairly matte roughness: the scanned roughness map made lamps reflect in the floor like puddles.
  const [map, normal] = useTexture(['/textures/herringbone_parquet_diff.webp', '/textures/herringbone_parquet_nor_gl.webp'])
  return useMemo(() => {
    const [m, n] = [map.clone(), normal.clone()]
    for (const t of [m, n]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      // One tile of the texture covers about 1.5 m, so the herringbone reads at a real scale.
      t.repeat.set(ROOM.halfW * 2 / 1.5, (ROOM.halfD * 2 + 1) / 1.5)
      t.anisotropy = 8
      t.needsUpdate = true
    }
    m.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.74, normalScale: new THREE.Vector2(0.6, 0.6), color: '#e8d6c4' })
  }, [map, normal])
}

type Make = (w: number, h: number) => THREE.Material

/** A wall slab. `face` is the size of the side facing the room, so the plaster repeats at a constant scale. */
function Slab({ pos, size, face, make }: { pos: [number, number, number]; size: [number, number, number]; face: [number, number]; make: Make }) {
  const material = useMemo(() => make(face[0], face[1]), [make, face])
  return (
    <mesh position={pos} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

/** A cross-section swept along a straight wall: baseboards and crown molding. */
function profileGeometry(points: [number, number][], length: number) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 6 })
  g.translate(0, 0, -length / 2)
  g.rotateY(Math.PI / 2)
  return g
}

// Profiles in (out from the wall, up) coordinates.
const BASEBOARD: [number, number][] = [
  [0, 0],
  [0.018, 0],
  [0.018, BASE_H - 0.03],
  [0.012, BASE_H - 0.018],
  [0.012, BASE_H - 0.008],
  [0.006, BASE_H],
  [0, BASE_H],
]
const CROWN_PROFILE: [number, number][] = (() => {
  const pts: [number, number][] = [[0, 0]]
  // A cove curve from the wall up to the ceiling, with a small step at each end.
  pts.push([0.008, 0], [0.008, 0.012])
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2)
    pts.push([0.008 + Math.sin(a) * 0.06, 0.012 + (1 - Math.cos(a)) * 0.06])
  }
  pts.push([0.08, CROWN], [0, CROWN])
  return pts
})()

/** Trim along one wall: `turn` points the profile into the room; `y` is its bottom edge. */
function Trim({ geometry, x, y, z, turn, material }: { geometry: THREE.BufferGeometry; x: number; y: number; z: number; turn: number; material: THREE.Material }) {
  return <mesh geometry={geometry} material={material} position={[x, y, z]} rotation={[0, turn, 0]} receiveShadow />
}

/** A four-panel interior door in its casing, with a brass knob, on the wall behind the chair. */
function Door({ trim }: { trim: THREE.Material }) {
  const W = 0.86
  const H = 2.04
  const z = ROOM.halfD
  const parts = useMemo(() => {
    const panelTall = new RoundedBoxGeometry(0.3, 0.92, 0.02, 3, 0.008)
    const panelShort = new RoundedBoxGeometry(0.3, 0.52, 0.02, 3, 0.008)
    const knob = new THREE.SphereGeometry(0.028, 20, 14)
    return { panelTall, panelShort, knob }
  }, [])
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9a35a', metalness: 0.9, roughness: 0.28 }), [])
  const slab = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 0.55 }), [])
  return (
    <group position={[-1.95, 0, z]} rotation={[0, Math.PI, 0]}>
      {/* Slab, set just proud of the wall */}
      <mesh position={[0, H / 2, 0.025]} material={slab} castShadow receiveShadow>
        <boxGeometry args={[W, H, 0.04]} />
      </mesh>
      {/* Raised panels: two tall over two short */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={parts.panelTall} material={slab} position={[s * 0.19, 1.38, 0.05]} castShadow receiveShadow />
          <mesh geometry={parts.panelShort} material={slab} position={[s * 0.19, 0.42, 0.05]} castShadow receiveShadow />
        </group>
      ))}
      {/* Casing */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.04), (H + 0.05) / 2, 0.02]} material={trim} castShadow receiveShadow>
          <boxGeometry args={[0.08, H + 0.05, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, H + 0.06, 0.02]} material={trim} castShadow receiveShadow>
        <boxGeometry args={[W + 0.2, 0.1, 0.035]} />
      </mesh>
      {/* Knob and rosette */}
      <mesh geometry={parts.knob} material={brass} position={[W / 2 - 0.08, 0.98, 0.09]} castShadow />
      <mesh material={brass} position={[W / 2 - 0.08, 0.98, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 20]} />
      </mesh>
      {/* Hinges */}
      {[0.25, 1.0, 1.75].map((y) => (
        <mesh key={y} material={brass} position={[-W / 2 + 0.006, y, 0.046]}>
          <boxGeometry args={[0.014, 0.09, 0.012]} />
        </mesh>
      ))}
      {/* Light switch by the door */}
      <mesh position={[W / 2 + 0.24, 1.2, 0.006]} material={trim}>
        <boxGeometry args={[0.075, 0.12, 0.01]} />
      </mesh>
      <mesh position={[W / 2 + 0.24, 1.2, 0.014]} material={slab}>
        <boxGeometry args={[0.02, 0.035, 0.012]} />
      </mesh>
    </group>
  )
}

export function Structure() {
  const floor = useFloor()
  const plaster = usePlaster()
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: PALETTE.trim, roughness: 0.5 }), [])
  const rug = rugTexture()
  const { halfW, halfD, height } = ROOM
  const { z0, z1, y0, y1 } = WINDOW
  const wz = (z0 + z1) / 2
  const wy = (y0 + y1) / 2
  const D = halfD * 2

  const geo = useMemo(
    () => ({
      baseX: profileGeometry(BASEBOARD, halfW * 2),
      baseZ: profileGeometry(BASEBOARD, D),
      crownX: profileGeometry(CROWN_PROFILE, halfW * 2),
      crownZ: profileGeometry(CROWN_PROFILE, D),
    }),
    [halfW, D],
  )

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
        <planeGeometry args={[halfW * 2, D + 0.2]} />
      </mesh>
      {/* Rug */}
      <Model
        url="/models/rug_woven_qashqai.glb"
        fit={{ box: [2.4, 0.012, 1.8] }}
        position={[-0.3, 0.002, 0.1]}
        shadows={false}
        fallback={
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.005, 0.1]} receiveShadow>
            <planeGeometry args={[2.4, 1.8]} />
            <meshStandardMaterial map={rug} roughness={1} />
          </mesh>
        }
      />
      {/* Ceiling */}
      <Slab pos={[0, height + T / 2, 0]} size={[halfW * 2 + 0.2, T, D + 0.2]} face={[halfW * 2, D]} make={plaster.ceiling} />
      {/* Back wall (the accent wall behind the desk), left wall, and the front wall with the door */}
      <Slab pos={[0, height / 2, -halfD - T / 2]} size={[halfW * 2 + 0.2, height, T]} face={[halfW * 2, height]} make={plaster.accent} />
      <Slab pos={[-halfW - T / 2, height / 2, 0]} size={[T, height, D + 0.2]} face={[D, height]} make={plaster.wall} />
      <Slab pos={[0, height / 2, halfD + T / 2]} size={[halfW * 2 + 0.2, height, T]} face={[halfW * 2, height]} make={plaster.wall} />
      {/* Right wall, built around the window hole so sunlight comes through it */}
      <Slab pos={[halfW + T / 2, y0 / 2, 0]} size={[T, y0, D + 0.2]} face={[D, y0]} make={plaster.wall} />
      <Slab pos={[halfW + T / 2, (y1 + height) / 2, 0]} size={[T, height - y1, D + 0.2]} face={[D, height - y1]} make={plaster.wall} />
      <Slab pos={[halfW + T / 2, wy, (-halfD - 0.1 + z0) / 2]} size={[T, y1 - y0, z0 + halfD + 0.1]} face={[z0 + halfD, y1 - y0]} make={plaster.wall} />
      <Slab pos={[halfW + T / 2, wy, (z1 + halfD + 0.1) / 2]} size={[T, y1 - y0, halfD + 0.1 - z1]} face={[halfD - z1, y1 - y0]} make={plaster.wall} />
      {/* Window casing, a deep sill, and the muntins */}
      <mesh position={[halfW - 0.04, y0 - 0.02, wz]} material={trim} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.04, z1 - z0 + 0.22]} />
      </mesh>
      <mesh position={[halfW - 0.01, y0 - 0.07, wz]} material={trim} receiveShadow>
        <boxGeometry args={[0.04, 0.06, z1 - z0 + 0.16]} />
      </mesh>
      <mesh position={[halfW - 0.005, y1 + 0.04, wz]} material={trim} castShadow receiveShadow>
        <boxGeometry args={[0.03, 0.08, z1 - z0 + 0.16]} />
      </mesh>
      {[z0 - 0.04, z1 + 0.04].map((z) => (
        <mesh key={z} position={[halfW - 0.005, wy, z]} material={trim} castShadow receiveShadow>
          <boxGeometry args={[0.03, y1 - y0, 0.08]} />
        </mesh>
      ))}
      <mesh position={[halfW + 0.02, wy, wz]} material={trim} castShadow>
        <boxGeometry args={[0.04, y1 - y0, 0.035]} />
      </mesh>
      <mesh position={[halfW + 0.02, wy, wz]} material={trim} castShadow>
        <boxGeometry args={[0.04, 0.035, z1 - z0]} />
      </mesh>
      {/* Baseboards and crown molding on all four walls */}
      <Trim geometry={geo.baseX} material={trim} x={0} y={0} z={-halfD} turn={Math.PI} />
      <Trim geometry={geo.baseX} material={trim} x={0} y={0} z={halfD} turn={0} />
      <Trim geometry={geo.baseZ} material={trim} x={-halfW} y={0} z={0} turn={-Math.PI / 2} />
      <Trim geometry={geo.baseZ} material={trim} x={halfW} y={0} z={0} turn={Math.PI / 2} />
      <Trim geometry={geo.crownX} material={trim} x={0} y={height - CROWN} z={-halfD} turn={Math.PI} />
      <Trim geometry={geo.crownX} material={trim} x={0} y={height - CROWN} z={halfD} turn={0} />
      <Trim geometry={geo.crownZ} material={trim} x={-halfW} y={height - CROWN} z={0} turn={-Math.PI / 2} />
      <Trim geometry={geo.crownZ} material={trim} x={halfW} y={height - CROWN} z={0} turn={Math.PI / 2} />
      <Door trim={trim} />
    </group>
  )
}
