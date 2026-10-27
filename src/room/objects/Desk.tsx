import { useMemo } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { useRoom } from '../roomStore'
import { screenTexture } from '../textures'

import { DESK, SCREEN_POS } from '../layout'

function Part({ pos, size, color, rough = 0.7 }: { pos: [number, number, number]; size: [number, number, number]; color: string; rough?: number }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  )
}

export function Desk() {
  const { y, z } = DESK
  return (
    <group>
      <Part pos={[0, y - 0.025, z]} size={[2.0, 0.05, 0.75]} color="#8a6243" rough={0.6} />
      {/* Drawer unit and legs */}
      <Part pos={[-0.72, (y - 0.05) / 2, z]} size={[0.5, y - 0.05, 0.7]} color="#7a5538" />
      {[0.55, 0.62].map((dy) => (
        <Part key={dy} pos={[-0.72, y - dy + 0.4, z + 0.352]} size={[0.44, 0.005, 0.005]} color="#3b2a1d" />
      ))}
      <Part pos={[0.96, (y - 0.05) / 2, z - 0.3]} size={[0.05, y - 0.05, 0.05]} color="#6e4d34" />
      <Part pos={[0.96, (y - 0.05) / 2, z + 0.3]} size={[0.05, y - 0.05, 0.05]} color="#6e4d34" />
      {/* Keyboard and mouse */}
      <Part pos={[0, y + 0.012, z + 0.24]} size={[0.46, 0.024, 0.15]} color="#e6e1d3" />
      <mesh position={[0, y + 0.026, z + 0.24]}>
        <boxGeometry args={[0.42, 0.006, 0.12]} />
        <meshStandardMaterial color="#cfc9b8" />
      </mesh>
      <mesh position={[0.33, y + 0.016, z + 0.24]} scale={[1, 0.6, 1.4]} castShadow>
        <sphereGeometry args={[0.03, 16, 12]} />
        <meshStandardMaterial color="#e6e1d3" />
      </mesh>
      <Part pos={[0.33, y + 0.002, z + 0.24]} size={[0.2, 0.004, 0.18]} color="#2a2a40" />
      {/* Books on the desk */}
      {['#c0392b', '#2e86c1', '#27ae60'].map((c, i) => (
        <Part key={c} pos={[0.82, y + 0.015 + i * 0.03, z - 0.25]} size={[0.24, 0.028, 0.17]} color={c} />
      ))}
    </group>
  )
}

export function Computer() {
  const poweringOn = useRoom((s) => s.poweringOn)
  const powerOn = useRoom((s) => s.powerOn)
  const { hovered, props } = useInteractive('obj.computer', powerOn)
  const screen = screenTexture(poweringOn)
  const { y, z } = DESK
  const glow = poweringOn || hovered
  const ledMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#39ff6a', toneMapped: false }), [])

  return (
    <group {...props}>
      {/* CRT monitor: chunky beige body with the glass on the front */}
      <Part pos={[0, y + 0.03, z - 0.05]} size={[0.3, 0.03, 0.25]} color="#d9d3c3" />
      <Part pos={[0, y + 0.3, z - 0.1]} size={[0.56, 0.46, 0.3]} color="#ddd7c7" />
      <Part pos={[0, y + 0.3, z - 0.33]} size={[0.44, 0.36, 0.2]} color="#cfc8b6" />
      <mesh position={SCREEN_POS}>
        <planeGeometry args={[0.44, 0.33]} />
        <meshStandardMaterial map={screen} emissiveMap={screen} emissive="#ffffff" emissiveIntensity={poweringOn ? 1.6 : 0.25} toneMapped={!poweringOn} />
      </mesh>
      <mesh position={[0.22, y + 0.1, z + 0.052]} material={ledMaterial}>
        <circleGeometry args={[0.008, 12]} />
      </mesh>
      {/* Tower */}
      <Part pos={[0.62, y + 0.23, z - 0.05]} size={[0.2, 0.46, 0.44]} color="#ddd7c7" />
      <Part pos={[0.62, y + 0.38, z + 0.172]} size={[0.15, 0.03, 0.005]} color="#bdb6a3" />
      <mesh position={[0.62, y + 0.1, z + 0.176]} material={ledMaterial}>
        <circleGeometry args={[0.01, 12]} />
      </mesh>
      {glow && <pointLight position={[0, y + 0.3, z + 0.35]} intensity={poweringOn ? 2.5 : 0.8} distance={2.2} color="#7fa6ff" />}
    </group>
  )
}
