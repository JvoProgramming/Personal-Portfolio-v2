import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { grainNormal } from '../materials'
import { useRoom } from '../roomStore'
import { screenTexture } from '../textures'

import { DESK, SCREEN_POS } from '../layout'
import { Model } from '../Model'

type V3 = [number, number, number]

function Part({ pos, size, color, rough = 0.7, radius = 0 }: { pos: V3; size: V3; color: string; rough?: number; radius?: number }) {
  if (radius > 0) {
    return (
      <RoundedBox args={size} radius={radius} smoothness={3} position={pos} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={rough} />
      </RoundedBox>
    )
  }
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  )
}

/** Rows of keycaps as one instanced mesh: 60-odd keys for the price of one draw call. */
function Keycaps({ position }: { position: V3 }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const keys = useMemo(() => {
    const list: { x: number; z: number; w: number }[] = []
    const pitch = 0.029
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 14; col++) list.push({ x: -0.19 + col * pitch + (row % 2) * 0.007, z: -0.045 + row * pitch, w: 0.024 })
    }
    list.push({ x: 0, z: -0.045 + 4 * pitch, w: 0.15 })
    return list
  }, [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    keys.forEach((k, i) => {
      m.compose(new THREE.Vector3(k.x, 0, k.z), new THREE.Quaternion(), new THREE.Vector3(k.w / 0.024, 1, 1))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [keys])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, keys.length]} position={position} castShadow>
      <boxGeometry args={[0.024, 0.01, 0.024]} />
      <meshStandardMaterial color="#f1ede2" roughness={0.6} />
    </instancedMesh>
  )
}

const MOUSE_CABLE = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.33, DESK.y + 0.012, DESK.z + 0.2),
    new THREE.Vector3(0.34, DESK.y + 0.004, DESK.z + 0.12),
    new THREE.Vector3(0.4, DESK.y + 0.004, DESK.z + 0.02),
    new THREE.Vector3(0.48, DESK.y + 0.004, DESK.z - 0.15),
  ]),
  30,
  0.003,
  6,
)

/** The old hand-built mug of tea, shown until the mug model loads. */
const MUG = (
  <>
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.032, 0.09, 20]} />
          <meshStandardMaterial color="#2f6db5" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.088, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.031, 20]} />
          <meshStandardMaterial color="#6b3d1e" roughness={0.2} />
        </mesh>
        <mesh position={[0.04, 0.048, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.02, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#2f6db5" roughness={0.35} />
        </mesh>
  </>
)

export function Desk() {
  const { y, z } = DESK
  return (
    <group>
      {/* Desk: a downloaded modern desk with a drawer unit, stretched to fit the wall */}
      <group position={[0, 0, z]}>
        <Model
          url="/models/desk_office_drawers.glb"
          fit={{ box: [2.0, y, 0.75] }}
          fallback={
            <group position={[0, 0, -z]}>
            <Part pos={[0, y - 0.025, z]} size={[2.0, 0.05, 0.75]} color="#8a6243" rough={0.55} radius={0.012} />
            {/* Drawer unit with two drawers and handles, plus legs */}
            <Part pos={[-0.72, (y - 0.05) / 2, z]} size={[0.5, y - 0.05, 0.7]} color="#7a5538" radius={0.01} />
            {[0.2, 0.47].map((dy) => (
              <group key={dy}>
                <Part pos={[-0.72, dy, z + 0.352]} size={[0.44, 0.24, 0.01]} color="#835c3d" rough={0.6} />
                <Part pos={[-0.72, dy + 0.06, z + 0.362]} size={[0.12, 0.014, 0.014]} color="#c9b48a" rough={0.3} radius={0.006} />
              </group>
            ))}
            <Part pos={[0.96, (y - 0.05) / 2, z - 0.3]} size={[0.05, y - 0.05, 0.05]} color="#6e4d34" />
            <Part pos={[0.96, (y - 0.05) / 2, z + 0.3]} size={[0.05, y - 0.05, 0.05]} color="#6e4d34" />
            </group>
          }
        />
      </group>
      {/* Keyboard and mouse */}
      <group position={[0, y, z + 0.24]}>
        <Model
          url="/models/keyboard_mech_logitech.glb"
          fit={{ width: 0.44 }}
          fallback={
            <group position={[0, -y, -z - 0.24]}>
            <Part pos={[0, y + 0.012, z + 0.24]} size={[0.46, 0.024, 0.17]} color="#e6e1d3" radius={0.008} />
            <Keycaps position={[0, y + 0.028, z + 0.235]} />
            </group>
          }
        />
      </group>
      <mesh position={[0.33, y + 0.016, z + 0.24]} scale={[1, 0.6, 1.4]} castShadow>
        <sphereGeometry args={[0.03, 16, 12]} />
        <meshStandardMaterial color="#e6e1d3" />
      </mesh>
      <mesh position={[0.33, y + 0.022, z + 0.24]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.002, 0.004, 0.035]} />
        <meshStandardMaterial color="#b8b2a2" />
      </mesh>
      <mesh geometry={MOUSE_CABLE}>
        <meshStandardMaterial color="#d8d2c2" roughness={0.6} />
      </mesh>
      <Part pos={[0.33, y + 0.002, z + 0.24]} size={[0.2, 0.004, 0.18]} color="#2a2a40" radius={0.002} />
      {/* A mug of tea */}
      <group position={[-0.42, y, z + 0.12]} rotation={[0, 2.4, 0]}>
        <Model url="/models/mug_red.glb" fit={{ height: 0.095 }} fallback={<group rotation={[0, -2.4, 0]}>{MUG}</group>} />
      </group>
      {/* Books on the desk */}
      {['#c0392b', '#2e86c1', '#27ae60'].map((c, i) => (
        <Part key={c} pos={[0.82, y + 0.015 + i * 0.03, z - 0.25]} size={[0.24, 0.028, 0.17]} color={c} radius={0.004} />
      ))}
    </group>
  )
}

/** The idle CRT plays an XP-style screensaver, so the one thing to click is the thing that glows and moves. */
interface ScreenRect {
  pos: THREE.Vector3
  w: number
  h: number
}

const BUILT_SCREEN: ScreenRect = { pos: SCREEN_POS.clone(), w: 0.44, h: 0.33 }

function ScreenGlass({ poweringOn, hovered, rect }: { poweringOn: boolean; hovered: boolean; rect: ScreenRect }) {
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const saver = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  const motion = useRef({ x: 40, y: 50, vx: 46, vy: 34, acc: 1 })

  useFrame((_, delta) => {
    const map = material.current?.map
    if (poweringOn || !map) return
    const s = motion.current
    s.acc += delta
    if (s.acc < 1 / 24) return
    const dt = Math.min(s.acc, 0.2)
    s.acc = 0
    const canvas = map.image as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const logoW = 132
    const logoH = 64
    s.x += s.vx * dt
    s.y += s.vy * dt
    if (s.x < 0 || s.x > w - logoW) s.vx = -s.vx
    if (s.y < 0 || s.y > h - logoH) s.vy = -s.vy
    s.x = Math.max(0, Math.min(w - logoW, s.x))
    s.y = Math.max(0, Math.min(h - logoH, s.y))

    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7)
    g.addColorStop(0, '#0b1d5c')
    g.addColorStop(1, '#010414')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const colors = ['#f25022', '#7fba00', '#00a4ef', '#ffb900']
    colors.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(s.x + (i % 2) * 17, s.y + 8 + Math.floor(i / 2) * 16, 15, 14)
    })
    ctx.fillStyle = '#fff'
    ctx.font = 'italic bold 22px Tahoma, Verdana, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('Johnny', s.x + 40, s.y + 18)
    ctx.fillStyle = '#ff8a1f'
    ctx.fillText('XP', s.x + 40, s.y + 42)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '12px Tahoma, Verdana, sans-serif'
    ctx.fillText('click to log in', w / 2 - 38, h - 14)
    // Scanlines.
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    for (let yy = 0; yy < h; yy += 3) ctx.fillRect(0, yy, w, 1)
    map.needsUpdate = true
  })

  return (
    <mesh position={rect.pos} geometry={GLASS} scale={[rect.w / 0.44, rect.h / 0.33, 1]}>
      <meshBasicMaterial ref={material} map={poweringOn ? screenTexture(true) : saver} toneMapped={false} color={poweringOn ? '#ffffff' : hovered ? '#e8eeff' : '#b8c4e6'} />
    </mesh>
  )
}

// CRT glass bulges outward a little, like the real thing.
const GLASS = (() => {
  const g = new THREE.PlaneGeometry(0.44, 0.33, 16, 12)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / 0.22
    const ny = pos.getY(i) / 0.165
    pos.setZ(i, 0.007 * (1 - nx * nx * 0.6 - ny * ny * 0.6))
  }
  g.computeVertexNormals()
  return g
})()

/** The tapered back of the CRT: a rectangular frustum pointing away from the screen. */
const CRT_BACK = (() => {
  const g = new THREE.CylinderGeometry(1, 0.62, 0.3, 4, 1)
  g.rotateY(Math.PI / 4)
  g.scale(0.27 / Math.SQRT1_2, 1, 0.215 / Math.SQRT1_2)
  g.rotateX(Math.PI / 2)
  return g.toNonIndexed()
})()

const BEIGE = '#ddd7c7'
/** Turns the downloaded monitor to face the room. */
const CRT_TURN = 0

export function Computer() {
  const poweringOn = useRoom((s) => s.poweringOn)
  const powerOn = useRoom((s) => s.powerOn)
  const { hovered, props } = useInteractive('obj.computer', powerOn)
  const { y, z } = DESK
  const ledMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#39ff6a', toneMapped: false }), [])
  // Lights stay mounted and only change brightness: adding or removing a light recompiles every material.
  const glow = poweringOn ? 2.5 : hovered ? 1.1 : 0.45
  const [screen, setScreen] = useState(BUILT_SCREEN)
  // When the downloaded monitor arrives, fit the screensaver onto its glass and aim the fly-in there.
  const onMonitor = useCallback((root: THREE.Group) => {
    root.updateWorldMatrix(true, true)
    let glass: THREE.Object3D | undefined
    root.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined
      if (mat && mat.name === 'monitor_glass') glass = o
    })
    if (!glass) return
    const box = new THREE.Box3().setFromObject(glass)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const pos = new THREE.Vector3(center.x, center.y, box.max.z + 0.001)
    SCREEN_POS.copy(pos)
    setScreen({ pos, w: size.x * 0.86, h: size.y * 0.84 })
  }, [])

  return (
    <group {...props}>
      <Model
        url="/models/crt_monitor.glb"
        fit={{ height: 0.5 }}
        position={[0, DESK.y, DESK.z - 0.12]}
        rotation={[0, CRT_TURN, 0]}
        onReady={onMonitor}
        fallback={
          <>
          {/* CRT monitor: swivel stand, deep tapered body, bezel, curved glass */}
          <mesh position={[0, y + 0.012, z - 0.08]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 0.024, 40]} />
            <meshStandardMaterial color={BEIGE} roughness={0.55} normalMap={grainNormal(2)} normalScale={[0.2, 0.2]} />
          </mesh>
          <Part pos={[0, y + 0.045, z - 0.08]} size={[0.18, 0.04, 0.16]} color="#d3ccba" radius={0.012} />
          <Part pos={[0, y + 0.3, z - 0.01]} size={[0.56, 0.46, 0.12]} color={BEIGE} radius={0.03} rough={0.55} />
          <mesh geometry={CRT_BACK} position={[0, y + 0.31, z - 0.21]} castShadow>
            <meshStandardMaterial color="#d6cfbd" roughness={0.6} flatShading />
          </mesh>
          {/* Vent slots on the back */}
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-0.12 + i * 0.03, y + 0.47, z - 0.25]} rotation={[-0.42, 0, 0]}>
              <boxGeometry args={[0.012, 0.004, 0.12]} />
              <meshStandardMaterial color="#5a564c" />
            </mesh>
          ))}
          <mesh position={[0, SCREEN_POS.y, SCREEN_POS.z - 0.001]}>
            <planeGeometry args={[0.48, 0.37]} />
            <meshStandardMaterial color="#26251f" roughness={0.3} />
          </mesh>
          </>
        }
      />
      <ScreenGlass poweringOn={poweringOn} hovered={hovered} rect={screen} />
      {/* Brand plate, control buttons, power LED */}
      <mesh position={[0, y + 0.1, z + 0.053]}>
        <planeGeometry args={[0.1, 0.012]} />
        <meshStandardMaterial color="#8d8676" metalness={0.4} roughness={0.4} />
      </mesh>
      {[-0.2, -0.175, -0.15, 0.15, 0.175].map((bx) => (
        <mesh key={bx} position={[bx, y + 0.1, z + 0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.006, 12]} />
          <meshStandardMaterial color="#c9c2b0" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.22, y + 0.1, z + 0.053]} material={ledMaterial}>
        <circleGeometry args={[0.008, 12]} />
      </mesh>
      {/* Tower: two drive bays, floppy drive, power and reset, front vents */}
      <Part pos={[0.62, y + 0.23, z - 0.05]} size={[0.2, 0.46, 0.44]} color={BEIGE} radius={0.015} rough={0.55} />
      <Part pos={[0.62, y + 0.23, z + 0.168]} size={[0.18, 0.44, 0.01]} color="#d4cdbb" radius={0.004} />
      {[0.41, 0.36].map((by) => (
        <group key={by}>
          <Part pos={[0.62, y + by, z + 0.175]} size={[0.15, 0.04, 0.006]} color="#cfc8b5" radius={0.003} />
          <Part pos={[0.67, y + by - 0.01, z + 0.179]} size={[0.02, 0.008, 0.004]} color="#a9a291" />
        </group>
      ))}
      <Part pos={[0.62, y + 0.3, z + 0.175]} size={[0.11, 0.03, 0.006]} color="#cfc8b5" radius={0.003} />
      <Part pos={[0.6, y + 0.3, z + 0.179]} size={[0.07, 0.005, 0.004]} color="#3a372f" />
      <mesh position={[0.62, y + 0.16, z + 0.176]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.01, 24]} />
        <meshStandardMaterial color="#c9c2b0" roughness={0.45} />
      </mesh>
      <mesh position={[0.66, y + 0.16, z + 0.176]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.008, 12]} />
        <meshStandardMaterial color="#a9a291" />
      </mesh>
      <mesh position={[0.58, y + 0.16, z + 0.177]} material={ledMaterial}>
        <circleGeometry args={[0.005, 12]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.62, y + 0.05 + i * 0.012, z + 0.174]}>
          <boxGeometry args={[0.12, 0.004, 0.002]} />
          <meshStandardMaterial color="#8f8979" />
        </mesh>
      ))}
      <pointLight position={[0, y + 0.3, z + 0.35]} intensity={glow} distance={2.2} color="#7fa6ff" />
    </group>
  )
}
