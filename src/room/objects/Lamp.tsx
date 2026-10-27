import { useMemo } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { useRoom } from '../roomStore'
import { DESK } from '../layout'

export function Lamp() {
  const lampOn = useRoom((s) => s.lampOn)
  const toggleLamp = useRoom((s) => s.toggleLamp)
  const { props } = useInteractive('obj.lamp', toggleLamp)
  const target = useMemo(() => new THREE.Object3D(), [])
  const x = -0.68
  const z = DESK.z - 0.12
  const y = DESK.y

  return (
    <group {...props}>
      <mesh position={[x, y + 0.012, z]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.025, 24]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[x, y + 0.24, z]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.46, 8]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.09, y + 0.47, z + 0.05]} rotation={[0.35, 0, -0.9]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.24, 8]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
      </mesh>
      <group position={[x + 0.2, y + 0.52, z + 0.1]} rotation={[0.3, 0, -0.35]}>
        <mesh castShadow>
          <coneGeometry args={[0.12, 0.16, 24, 1, true]} />
          <meshStandardMaterial color="#1e7d4a" side={THREE.DoubleSide} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshBasicMaterial color={lampOn ? '#fff1c4' : '#77705e'} toneMapped={!lampOn} />
        </mesh>
      </group>
      <primitive object={target} position={[x + 0.35, y, z + 0.25]} />
      {/* Lights stay mounted (intensity 0 when off), so switching doesn't recompile every material. */}
      <spotLight
        position={[x + 0.2, y + 0.48, z + 0.1]}
        target={target}
        angle={1.0}
        penumbra={0.7}
        intensity={lampOn ? 6 : 0}
        distance={4}
        color="#ffc777"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.001}
      />
      <pointLight position={[x + 0.2, y + 0.55, z + 0.1]} intensity={lampOn ? 1.2 : 0} distance={3.5} color="#ffbe6b" />
    </group>
  )
}
