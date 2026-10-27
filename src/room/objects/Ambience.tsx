import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Lighting } from '../time'
import { seeded, WINDOW } from '../layout'

const DUST = 110

/** Dust motes drifting in the light by the window; brighter when the sun is up. */
export function Dust({ lighting }: { lighting: Lighting }) {
  const points = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(DUST * 3)
    const speeds = new Float32Array(DUST)
    const random = seeded(42)
    for (let i = 0; i < DUST; i++) {
      positions[i * 3] = 1.3 + random() * 1.6
      positions[i * 3 + 1] = 0.2 + random() * 1.9
      positions[i * 3 + 2] = WINDOW.z0 - 0.2 + random() * 1.8
      speeds[i] = 0.2 + random() * 0.8
    }
    return { positions, speeds }
  }, [])

  useFrame(({ clock }, delta) => {
    const geo = points.current?.geometry
    if (!geo) return
    const pos = geo.attributes.position as THREE.BufferAttribute
    const t = clock.elapsedTime
    for (let i = 0; i < DUST; i++) {
      let y = pos.getY(i) + Math.sin(t * speeds[i] + i) * 0.0008 - delta * 0.01 * speeds[i]
      if (y < 0.1) y = 2.1
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.cos(t * 0.3 * speeds[i] + i) * 0.0006)
    }
    pos.needsUpdate = true
  })

  const day = lighting.phase === 'day' ? 1 : lighting.phase === 'night' ? 0.15 : 0.6
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.007} color="#fff4d6" transparent opacity={0.3 * day} depthWrite={false} sizeAttenuation />
    </points>
  )
}

/** Every so often a fly (or a bee, in daytime) buzzes around the lamp. */
export function Buzzer({ lighting }: { lighting: Lighting }) {
  const bug = useRef<THREE.Group>(null)
  const wings = useRef<THREE.Group>(null)
  const isBee = lighting.phase === 'day'
  const CYCLE = 24
  const ACTIVE = 9

  useFrame(({ clock }) => {
    if (!bug.current) return
    const t = clock.elapsedTime % CYCLE
    const active = t > CYCLE - ACTIVE
    bug.current.visible = active
    if (!active) return
    const k = (t - (CYCLE - ACTIVE)) * 1.6
    // Wanders on a figure-of-eight near the lamp, then flies off to the window.
    const leave = Math.max(0, t - (CYCLE - 1.5)) / 1.5
    const x = -0.3 + Math.sin(k) * 0.6 + leave * 3.5
    const y = 1.35 + Math.sin(k * 2.3) * 0.15 + leave * 0.3
    const z = -1.8 + Math.sin(k * 2) * 0.35 + leave
    bug.current.position.set(x, y, z)
    bug.current.rotation.y = Math.cos(k) > 0 ? 0.6 : -2.5
    if (wings.current) wings.current.rotation.x = Math.sin(clock.elapsedTime * 90) * 0.6
  })

  return (
    <group ref={bug} visible={false} scale={isBee ? 1.4 : 1}>
      <mesh scale={[1, 0.8, 1.4]}>
        <sphereGeometry args={[0.01, 8, 6]} />
        <meshStandardMaterial color={isBee ? '#f2c12e' : '#1a1a1a'} />
      </mesh>
      {isBee && (
        <mesh scale={[1.02, 0.82, 0.4]}>
          <sphereGeometry args={[0.01, 8, 6]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}
      <group ref={wings} position={[0, 0.008, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.009, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.008, 8]} />
            <meshBasicMaterial color="#dfe8ff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
