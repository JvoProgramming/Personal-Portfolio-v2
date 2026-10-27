import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ROOM, WINDOW, seeded } from '../layout'
import { laHours, type Lighting } from '../time'

const BULBS = 34
const BULB_COLORS = ['#ffcf7a', '#ffb35c', '#ffe2a8', '#ff9f6b']

/** Warm string lights draped along the top of the back wall. They glow (via bloom) and twinkle a little. */
export function FairyLights({ lighting }: { lighting: Lighting }) {
  const bulbs = useRef<THREE.InstancedMesh>(null)
  const wire = useMemo(() => {
    const back = -ROOM.halfD + 0.04
    const points: THREE.Vector3[] = []
    const swags = 5
    for (let i = 0; i <= 120; i++) {
      const t = i / 120
      const x = -2.9 + t * 5.8
      const sag = Math.abs(Math.sin(t * Math.PI * swags)) * 0.16
      points.push(new THREE.Vector3(x, 2.62 - sag, back))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])
  const tube = useMemo(() => new THREE.TubeGeometry(wire, 200, 0.003, 4), [wire])
  const colors = useMemo(() => BULB_COLORS.map((c) => new THREE.Color(c)), [])
  // Dimmer in daylight, bright at night.
  const level = lighting.phase === 'day' ? 1.4 : lighting.phase === 'night' ? 3.2 : 2.4

  useLayoutEffect(() => {
    const mesh = bulbs.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    for (let i = 0; i < BULBS; i++) {
      const p = wire.getPointAt((i + 0.5) / BULBS)
      m.makeTranslation(p.x, p.y - 0.018, p.z + 0.005)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, colors[i % colors.length].clone().multiplyScalar(level))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [wire, colors, level])

  const tmp = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const mesh = bulbs.current
    if (!mesh || !mesh.instanceColor) return
    const t = clock.elapsedTime
    for (let i = 0; i < BULBS; i++) {
      const flicker = 0.8 + 0.2 * Math.sin(t * (0.8 + (i % 5) * 0.3) + i * 1.7)
      mesh.setColorAt(i, tmp.copy(colors[i % colors.length]).multiplyScalar(level * flicker))
    }
    mesh.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color="#1f2a1c" roughness={0.8} />
      </mesh>
      <instancedMesh ref={bulbs} args={[undefined, undefined, BULBS]}>
        <sphereGeometry args={[0.016, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

/** A wall clock that shows the real time in Los Angeles. */
export function WallClock() {
  const hour = useRef<THREE.Group>(null)
  const minute = useRef<THREE.Group>(null)
  const second = useRef<THREE.Group>(null)
  const last = useRef(-1)
  const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), [])

  useFrame(() => {
    const now = Math.floor(Date.now() / 1000)
    if (now === last.current) return
    last.current = now
    const h = laHours()
    const m = (h % 1) * 60
    const s = (m % 1) * 60
    if (hour.current) hour.current.rotation.z = -((h % 12) / 12) * Math.PI * 2
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2
    if (second.current) second.current.rotation.z = -(Math.floor(s) / 60) * Math.PI * 2
  })

  return (
    <group position={[0.98, 2.12, -ROOM.halfD + 0.02]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 40]} />
        <meshStandardMaterial color="#c0392b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <circleGeometry args={[0.13, 40]} />
        <meshStandardMaterial color="#f7f3e8" roughness={0.6} />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.112, Math.cos(a) * 0.112, 0.018]} rotation={[0, 0, -a]}>
          <planeGeometry args={[0.006, i % 3 === 0 ? 0.024 : 0.012]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      ))}
      <group ref={hour} position={[0, 0, 0.02]}>
        <mesh position={[0, 0.03, 0]}>
          <planeGeometry args={[0.012, 0.07]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.022]}>
        <mesh position={[0, 0.045, 0]}>
          <planeGeometry args={[0.008, 0.1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </group>
      <group ref={second} position={[0, 0, 0.024]}>
        <mesh position={[0, 0.04, 0]}>
          <planeGeometry args={[0.003, 0.11]} />
          <meshBasicMaterial color="#c0392b" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.026]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

/** A snake plant in a terracotta pot, in the corner by the window. */
export function Plant() {
  const leaves = useMemo(() => {
    const random = seeded(7)
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + random() * 0.4
      const lean = 0.08 + random() * 0.18
      return { a, lean, h: 0.45 + random() * 0.35, tone: random() > 0.5 ? '#3f7d3a' : '#2f6a33' }
    })
  }, [])
  return (
    <group position={[2.62, 0, -2.12]}>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.11, 0.26, 24]} />
        <meshStandardMaterial color="#b5653d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 24]} />
        <meshStandardMaterial color="#3b2a1c" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[Math.cos(l.a) * 0.05, 0.25, Math.sin(l.a) * 0.05]} rotation={[Math.sin(l.a) * l.lean, l.a, -Math.cos(l.a) * l.lean]}>
          <mesh position={[0, l.h / 2, 0]} scale={[1, 1, 0.22]} castShadow>
            <coneGeometry args={[0.04, l.h, 8]} />
            <meshStandardMaterial color={l.tone} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Wavy curtains on either side of the window, with a rod. */
export function Curtains() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.42, 1.55, 24, 1)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 52) * 0.025)
    g.computeVertexNormals()
    return g
  }, [])
  const x = ROOM.halfW - 0.07
  const y = 1.68
  const { z0, z1 } = WINDOW
  return (
    <group>
      <mesh position={[x + 0.02, 2.42, (z0 + z1) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, z1 - z0 + 1.1, 10]} />
        <meshStandardMaterial color="#3a2a1d" metalness={0.3} roughness={0.5} />
      </mesh>
      {[z0 - 0.26, z1 + 0.26].map((z) => (
        <mesh key={z} geometry={geometry} position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#a8573c" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
