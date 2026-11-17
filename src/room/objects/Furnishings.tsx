import { useFrame } from '@react-three/fiber'
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useOs } from '../../os/store'
import { useInteractive } from '../interactive'
import { DESK, ROOM, seeded } from '../layout'
import { Model } from '../Model'
import { useRoom } from '../roomStore'
import { canvasTexture } from '../textures'
import type { Lighting } from '../time'

// The furniture that makes the room feel lived in from the chair: a cube shelf of books and keepsakes on
// the left wall, a walnut media console with an old TV across from the desk, a nightstand by the bed,
// a pendant light, plants, and soft glows where lights wash over the walls.
// Models are CC0 from Poly Haven (see /credits).

type V3 = [number, number, number]

/** A soft round glow, for light washing over a wall or ceiling. Additive, so it only ever brightens. */
function glowTexture() {
  return canvasTexture('glow', 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

export function Glow({ position, rotation = [0, 0, 0], size, color, strength, material }: { position: V3; rotation?: V3; size: [number, number]; color?: string; strength?: number; material?: THREE.MeshBasicMaterial }) {
  const own = useMemo(
    () =>
      material ??
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: new THREE.Color(color).multiplyScalar(strength ?? 1),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [material, color, strength],
  )
  return (
    <mesh position={position} rotation={rotation} material={own} renderOrder={2}>
      <planeGeometry args={size} />
    </mesh>
  )
}

/** Books for the shelf cubbies: one instanced mesh, spines in a muted, warm palette. */
function BookRow({ position, rotation = [0, 0, 0], width, height, depth, seed, lean = false }: { position: V3; rotation?: V3; width: number; height: number; depth: number; seed: number; lean?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const books = useMemo(() => {
    const random = seeded(seed)
    const colors = ['#7a2e2a', '#2c4a63', '#c9a66b', '#3e5c46', '#d9cfb8', '#5a3d5c', '#a8552f', '#1f2a36', '#8c8f6a', '#b8473b']
    const list: { x: number; w: number; h: number; c: string; tilt: number }[] = []
    let x = 0
    while (x < width - 0.03) {
      const w = 0.018 + random() * 0.03
      if (x + w > width) break
      list.push({ x: x + w / 2, w, h: height * (0.68 + random() * 0.3), c: colors[Math.floor(random() * colors.length)], tilt: 0 })
      x += w + 0.002
    }
    if (lean && list.length > 2) {
      // The last book leans on its neighbour.
      const last = list[list.length - 1]
      last.tilt = -0.32
      last.x += 0.03
    }
    return list
  }, [width, height, seed, lean])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    books.forEach((b, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), b.tilt)
      m.compose(new THREE.Vector3(b.x - width / 2, b.h / 2, 0), q, new THREE.Vector3(b.w, b.h, depth * (0.85 + (i % 3) * 0.05)))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, c.set(b.c))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [books, width, depth])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, books.length]} position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.75} />
    </instancedMesh>
  )
}

/** A cube shelf on the left wall: books, a cassette player, a little plant and a photo. */
export function CubeShelf() {
  // The model is 1.08 m wide, 1.56 m tall and 0.37 m deep; its open front faces +x, toward the room.
  const W = 1.08
  const H = 1.56
  const x = -ROOM.halfW + 0.2
  const z = -1.25
  // Cubby centers along the wall (z) and shelf heights (y), from the model.
  const cols = [-0.345, 0, 0.345]
  const floors = [0.53, 0.885, 1.24]
  return (
    <group position={[x, 0, z]}>
      <Model url="/models/ph_wooden_display_shelves_01.glb" fit={{ height: H }} fallback={<mesh position={[0, H / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.37, H, W]} /><meshStandardMaterial color="#b88a5a" /></mesh>} />
      {/* Books standing in the cubbies, spines facing the room */}
      <BookRow position={[0.02, floors[2], cols[0]]} rotation={[0, Math.PI / 2, 0]} width={0.3} height={0.27} depth={0.2} seed={3} lean />
      <BookRow position={[0.02, floors[1], cols[1]]} rotation={[0, Math.PI / 2, 0]} width={0.3} height={0.26} depth={0.2} seed={9} />
      <BookRow position={[0.02, floors[0], cols[2]]} rotation={[0, Math.PI / 2, 0]} width={0.22} height={0.27} depth={0.2} seed={17} lean />
      <BookRow position={[0.02, floors[2], cols[2]]} rotation={[0, Math.PI / 2, 0]} width={0.16} height={0.25} depth={0.2} seed={21} />
      {/* The Walkman with a tape */}
      <group position={[0.04, floors[1] + 0.06, cols[2]]} rotation={[0, Math.PI / 2 + 0.3, 0]}>
        <Model url="/models/ph_portable_cassette_player.glb" fit={{ width: 0.17 }} shadows={false} centered fallback={null} />
      </group>
      {/* A small succulent in the middle cubby, and one on top */}
      <group position={[0.02, floors[0], cols[1]]}>
        <Model url="/models/ph_potted_plant_04.glb" fit={{ height: 0.24 }} fallback={null} />
      </group>
      <group position={[0, H, 0.3]}>
        <Model url="/models/snake_plant.glb" fit={{ height: 0.42 }} fallback={null} />
      </group>
      <group position={[0, H, -0.25]}>
        <Model url="/models/books_encyclopedia_set.glb" fit={{ longest: 0.34 }} rotation={[0, Math.PI / 2, 0]} fallback={null} />
      </group>
    </group>
  )
}

/** The idle TV shows a dim blue "press start" screen, and its light washes the wall behind it. */
function tvScreen() {
  return canvasTexture('tv-screen', 256, 192, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7)
    g.addColorStop(0, '#1d3f9a')
    g.addColorStop(1, '#070d2a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffd43b'
    ctx.font = '900 30px Impact, "Arial Black", sans-serif'
    ctx.fillText('ROCK LEGEND', w / 2, h * 0.42)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px monospace'
    ctx.fillText('PRESS START', w / 2, h * 0.68)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
  })
}

/** A low walnut media console across from the desk, with the old TV and a vase. Clicking the TV plays Rock Legend. */
export function MediaConsole() {
  const powerOn = useRoom((s) => s.powerOn)
  const { hovered, props } = useInteractive('obj.tv', () => {
    useOs.getState().setPendingApp({ appId: 'arcade', options: { props: { game: 'rhythm' } } })
    powerOn()
  })
  const screen = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    // A faint CRT flicker.
    if (screen.current) screen.current.color.setScalar((hovered ? 1.15 : 0.85) + Math.sin(clock.elapsedTime * 9) * 0.02)
  })
  const W = 1.6
  const h = (0.68 * W) / 2.44
  const z = ROOM.halfD - 0.19
  const tvW = 0.52
  const tvScale = tvW / 0.4
  return (
    <group position={[0.15, 0, z]} rotation={[0, Math.PI, 0]}>
      <Model url="/models/ph_modern_wooden_cabinet.glb" fit={{ width: W }} fallback={<mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[W, h, 0.34]} /><meshStandardMaterial color="#5b3a26" /></mesh>} />
      <group position={[-0.32, h, 0.02]} {...props}>
        <Model url="/models/ph_television_02.glb" fit={{ width: tvW }} fallback={<mesh position={[0, 0.27, 0]}><boxGeometry args={[tvW, 0.53, 0.42]} /><meshStandardMaterial color="#2a2a2a" /></mesh>} />
        {/* The glowing picture sits just in front of the model's glass */}
        <mesh position={[-0.035 * tvScale, 0.235 * tvScale, 0.14 * tvScale]}>
          <planeGeometry args={[0.25 * tvScale, 0.19 * tvScale]} />
          <meshBasicMaterial ref={screen} map={tvScreen()} toneMapped={false} />
        </mesh>
      </group>
      <group position={[0.42, h, 0]}>
        <Model url="/models/ph_ceramic_vase_01.glb" fit={{ height: 0.34 }} fallback={null} />
      </group>
      <group position={[0.15, h, 0.03]} rotation={[0, -0.2, 0]}>
        <Model url="/models/ph_alarm_clock_01.glb" fit={{ height: 0.13 }} shadows={false} fallback={null} />
      </group>
      {/* Blue TV light on the wall behind */}
      <Glow position={[-0.32, h + 0.32, -0.17]} size={[1.3, 1.0]} color="#3d6bff" strength={0.22} />
    </group>
  )
}

/** A nightstand by the head of the bed. */
export function Nightstand() {
  return (
    <group position={[ROOM.halfW - 0.3, 0, 1.47]} rotation={[0, -Math.PI / 2, 0]}>
      <Model url="/models/ph_side_table_01.glb" fit={{ height: 0.55 }} fallback={<mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.55, 0.55, 0.45]} /><meshStandardMaterial color="#a8763f" /></mesh>} />
      <group position={[0.12, 0.55, 0.02]}>
        <Model url="/models/books_encyclopedia_set.glb" fit={{ longest: 0.22 }} rotation={[0, 0, Math.PI / 2]} fallback={null} />
      </group>
    </group>
  )
}

/** Throw pillows propped against the bed's headboard. */
export function BedPillows() {
  return (
    <group position={[ROOM.halfW - 0.3, 0.47, 0.69]} rotation={[0, -Math.PI / 2, 0]}>
      <Model url="/models/ph_throw_pillows_01.glb" fit={{ width: 0.72 }} fallback={null} />
    </group>
  )
}

/** Plants: a big-leafed one by the console, and Mochi's toy tray by her bed. */
export function Greenery() {
  return (
    <group>
      <group position={[1.35, 0, ROOM.halfD - 0.35]}>
        <Model url="/models/ph_potted_plant_02.glb" fit={{ height: 0.95 }} rotation={[0, 2.2, 0]} fallback={null} />
      </group>
      <group position={[-2.68, 0, -0.62]} rotation={[0, 1.3, 0]}>
        <Model url="/models/ph_wicker_basket_01.glb" fit={{ width: 0.44 }} fallback={null} />
      </group>
      {/* A little plant on the desk, by the headphones */}
      <group position={[0.64, DESK.y, DESK.z - 0.22]}>
        <Model url="/models/ph_potted_plant_04.glb" fit={{ height: 0.2 }} shadows={false} fallback={null} />
      </group>
    </group>
  )
}

/** A globe pendant in the middle of the ceiling: the room's main warm light at night. */
export function Pendant({ lighting }: { lighting: Lighting }) {
  const night = lighting.phase === 'night'
  const level = night ? 1 : lighting.phase === 'day' ? 0 : 0.6
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(0.6 + level * 1.4), toneMapped: false }), [level])
  const glass = useCallback((root: THREE.Group) => {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      // The frosted globe glows from the bulb inside.
      if (mat.name.includes('glass') || mat.name.includes('globe')) {
        mat.emissive = new THREE.Color('#ffcf94')
        mat.emissiveIntensity = 0.2 + level * 1.6
        mat.transparent = false
      }
      mesh.castShadow = false
    })
  }, [level])
  const y = ROOM.height
  const drop = 0.75
  return (
    <group position={[-0.1, 0, 0.35]}>
      <Model url="/models/ph_modern_ceiling_lamp_01.glb" fit={{ height: drop }} position={[0, y - drop, 0]} onReady={glass} shadows={false} fallback={<mesh position={[0, y - drop + 0.12, 0]} material={bulb}><sphereGeometry args={[0.12, 24, 16]} /></mesh>} />
      <pointLight position={[0, y - drop + 0.05, 0]} intensity={level * 2.0} distance={7} decay={1.6} color="#ffc98a" />
      <Glow position={[0, y - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} size={[2.4, 2.4]} color="#ffcf94" strength={0.12 * level} />
    </group>
  )
}

/** Bias lighting behind the monitor: an LED strip on the back of the desk that washes the green wall in purple. */
export function DeskGlow({ lighting }: { lighting: Lighting }) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const strip = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])
  const level = lighting.phase === 'day' ? 0.35 : 1
  useFrame(({ clock }) => {
    const hue = 0.74 + Math.sin(clock.elapsedTime * 0.15) * 0.1
    material.color.setHSL(hue, 0.8, 0.5).multiplyScalar(0.22 * level)
    strip.color.setHSL(hue, 0.9, 0.6).multiplyScalar(1.6 * level)
  })
  const z = -ROOM.halfD + 0.006
  return (
    <group>
      <mesh position={[0, DESK.y - 0.02, -ROOM.halfD + 0.02]} material={strip}>
        <boxGeometry args={[1.8, 0.008, 0.008]} />
      </mesh>
      <Glow position={[0, DESK.y + 0.3, z]} size={[2.4, 1.0]} material={material} />
    </group>
  )
}
