import { useMemo } from 'react'
import * as THREE from 'three'
import { rugTexture, woodTexture } from '../textures'

import { ROOM, WINDOW } from '../layout'

const WALL = '#46557a'
const T = 0.1

function Box({ pos, size, color, cast = true }: { pos: [number, number, number]; size: [number, number, number]; color: string; cast?: boolean }) {
  return (
    <mesh position={pos} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}

export function Structure() {
  const floorTex = useMemo(() => {
    const t = woodTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 3)
    t.needsUpdate = true
    return t
  }, [])
  const rug = rugTexture()
  const { halfW, halfD, height } = ROOM
  const { z0, z1, y0, y1 } = WINDOW
  const wz = (z0 + z1) / 2
  const wy = (y0 + y1) / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[halfW * 2, halfD * 2 + 1]} />
        <meshStandardMaterial map={floorTex} roughness={0.8} />
      </mesh>
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.005, 0.1]} receiveShadow>
        <planeGeometry args={[2.4, 1.8]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>
      {/* Ceiling */}
      <Box pos={[0, height + T / 2, 0]} size={[halfW * 2 + 0.2, T, halfD * 2 + 1]} color="#2c3550" />
      {/* Back and left walls */}
      <Box pos={[0, height / 2, -halfD - T / 2]} size={[halfW * 2 + 0.2, height, T]} color={WALL} />
      <Box pos={[-halfW - T / 2, height / 2, 0]} size={[T, height, halfD * 2 + 1]} color={WALL} />
      {/* Right wall, built around the window hole so sunlight comes through it */}
      <Box pos={[halfW + T / 2, y0 / 2, 0]} size={[T, y0, halfD * 2 + 1]} color={WALL} />
      <Box pos={[halfW + T / 2, (y1 + height) / 2, 0]} size={[T, height - y1, halfD * 2 + 1]} color={WALL} />
      <Box pos={[halfW + T / 2, wy, (-halfD - 0.5 + z0) / 2]} size={[T, y1 - y0, z0 + halfD + 0.5]} color={WALL} />
      <Box pos={[halfW + T / 2, wy, (z1 + halfD + 0.5) / 2]} size={[T, y1 - y0, halfD + 0.5 - z1]} color={WALL} />
      {/* Window frame and cross bars */}
      <Box pos={[halfW, y0 - 0.03, wz]} size={[0.2, 0.06, z1 - z0 + 0.1]} color="#e9e4d8" />
      <Box pos={[halfW, y1 + 0.03, wz]} size={[0.14, 0.06, z1 - z0 + 0.1]} color="#e9e4d8" />
      <Box pos={[halfW, wy, z0 - 0.03]} size={[0.14, y1 - y0, 0.06]} color="#e9e4d8" />
      <Box pos={[halfW, wy, z1 + 0.03]} size={[0.14, y1 - y0, 0.06]} color="#e9e4d8" />
      <Box pos={[halfW, wy, wz]} size={[0.06, y1 - y0, 0.04]} color="#e9e4d8" />
      <Box pos={[halfW, wy, wz]} size={[0.06, 0.04, z1 - z0]} color="#e9e4d8" />
      {/* Baseboards */}
      <Box pos={[0, 0.05, -halfD + 0.01]} size={[halfW * 2, 0.1, 0.02]} color="#d8d2c2" cast={false} />
      <Box pos={[-halfW + 0.01, 0.05, 0]} size={[0.02, 0.1, halfD * 2 + 1]} color="#d8d2c2" cast={false} />
    </group>
  )
}
