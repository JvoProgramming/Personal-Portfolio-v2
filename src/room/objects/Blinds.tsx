import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { ROOM, WINDOW } from '../layout'
import { rattle } from '../play/sound'
import { useRoom } from '../roomStore'
import type { Lighting } from '../time'
import { shade } from '../shade'

// Venetian blinds inside the window. Click them and the slats tilt shut (or open) one after another,
// top to bottom. The sunlight and the room's daylight fade with them.

const X = ROOM.halfW - 0.14
const SLAT_GAP = 0.042
/** Slats tilt this far when shut (a bit short of vertical, like real blinds). */
const SHUT = 1.4
const OPEN_TILT = 0.06

export function Blinds({ lighting }: { lighting: Lighting }) {
  const closed = useRoom((s) => s.blindsClosed)
  const toggle = useRoom((s) => s.toggleBlinds)
  const { props } = useInteractive('obj.blinds', () => {
    toggle()
    rattle()
  })
  const { z0, z1, y0, y1 } = WINDOW
  const wz = (z0 + z1) / 2
  const len = z1 - z0 + 0.06
  const count = Math.floor((y1 - y0 - 0.06) / SLAT_GAP)
  const slats = useRef<(THREE.Mesh | null)[]>([])

  const geo = useMemo(() => {
    // A slightly curved aluminum slat, like the real ones.
    const g = new THREE.BoxGeometry(0.05, 0.0025, len, 6, 1, 1)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / 0.025
      pos.setY(i, pos.getY(i) + (1 - x * x) * 0.0035)
    }
    g.computeVertexNormals()
    return g
  }, [len])
  const mats = useMemo(
    () => ({
      slat: new THREE.MeshStandardMaterial({ color: '#ece8df', roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide }),
      rail: new THREE.MeshStandardMaterial({ color: '#e2ddd2', roughness: 0.4, metalness: 0.2 }),
      cord: new THREE.MeshStandardMaterial({ color: '#d9d3c4', roughness: 0.9 }),
      wand: new THREE.MeshPhysicalMaterial({ color: '#f2efe8', roughness: 0.15, transmission: 0.3, thickness: 0.01 }),
    }),
    [],
  )

  useFrame((_, delta) => {
    const target = closed ? 1 : 0
    shade.closed += (target - shade.closed) * (1 - Math.exp(-Math.min(delta, 0.1) * 3.2))
    if (Math.abs(target - shade.closed) < 0.001) shade.closed = target
    // Shut slats glow faintly with the daylight behind them.
    const leak = lighting.phase === 'day' ? 0.12 : lighting.phase === 'night' ? 0.02 : 0.08
    mats.slat.emissive.copy(lighting.sunColor).multiplyScalar(leak * shade.closed)
    // Each slat turns a moment after the one above it, so a wave runs down (and back up when opening).
    const n = slats.current.length
    slats.current.forEach((m, i) => {
      if (!m) return
      const lag = (i / n) * 0.35
      const t = THREE.MathUtils.clamp((shade.closed - lag) / 0.65, 0, 1)
      const eased = t * t * (3 - 2 * t)
      m.rotation.z = OPEN_TILT + eased * (SHUT - OPEN_TILT)
    })
  })

  const top = y1 + 0.035
  return (
    <group {...props}>
      {/* Head rail */}
      <mesh material={mats.rail} position={[X, top, wz]} castShadow>
        <boxGeometry args={[0.055, 0.04, len + 0.02]} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            slats.current[i] = m
          }}
          geometry={geo}
          material={mats.slat}
          position={[X, top - 0.045 - i * SLAT_GAP, wz]}
          castShadow
          receiveShadow
        />
      ))}
      {/* Bottom rail */}
      <mesh material={mats.rail} position={[X, top - 0.045 - count * SLAT_GAP, wz]} castShadow>
        <boxGeometry args={[0.05, 0.014, len]} />
      </mesh>
      {/* Ladder cords on both edges of the slats */}
      {[z0 + 0.22, z1 - 0.22].flatMap((z) =>
        [-1, 1].map((s) => (
          <mesh key={`${z}${s}`} material={mats.cord} position={[X + s * 0.024, top - 0.02 - (count * SLAT_GAP) / 2, z]}>
            <cylinderGeometry args={[0.0012, 0.0012, count * SLAT_GAP + 0.03, 4]} />
          </mesh>
        )),
      )}
      {/* Tilt wand hanging by the right edge */}
      <mesh material={mats.wand} position={[X - 0.035, top - 0.38, z1 - 0.03]}>
        <cylinderGeometry args={[0.005, 0.005, 0.7, 8]} />
      </mesh>
      {/* An invisible panel over the whole blind, so it's easy to click even when it's open */}
      <mesh visible={false} position={[X, (top + y0) / 2, wz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[len, top - y0]} />
      </mesh>
    </group>
  )
}
