import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { useInteractive } from '../interactive'

/** Office chair you can grab and spin; it keeps spinning a little after you let go. */
export function Chair() {
  const spinner = useRef<THREE.Group>(null)
  const drag = useRef<{ x: number; last: number; v: number } | null>(null)
  const velocity = useRef(0)
  const { props } = useInteractive('obj.chair', undefined, 'grab')

  useFrame((_, delta) => {
    if (!spinner.current || drag.current) return
    spinner.current.rotation.y += velocity.current * delta
    velocity.current *= Math.exp(-delta * 1.6)
  })

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, last: performance.now(), v: 0 }
    document.body.style.cursor = 'grabbing'
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current || !spinner.current) return
    const dx = e.clientX - drag.current.x
    const now = performance.now()
    const dt = Math.max(1, now - drag.current.last) / 1000
    spinner.current.rotation.y += dx * 0.012
    drag.current = { x: e.clientX, last: now, v: (dx * 0.012) / dt }
  }
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    if (drag.current) velocity.current = Math.max(-12, Math.min(12, drag.current.v))
    drag.current = null
    document.body.style.cursor = ''
  }

  const fabric = '#2d2f3a'
  // Pushed back from the desk and turned toward you, so it doesn't hide the monitor.
  return (
    <group position={[0.42, 0, -1.02]}>
      {/* Star base and wheels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.17, 0.06, 0]} castShadow>
              <boxGeometry args={[0.34, 0.03, 0.04]} />
              <meshStandardMaterial color="#1b1b1f" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0.32, 0.025, 0]}>
              <sphereGeometry args={[0.025, 10, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.38, 12]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Spinning top part */}
      <group ref={spinner} rotation={[0, -0.75, 0]} {...props} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <RoundedBox args={[0.48, 0.08, 0.46]} radius={0.035} smoothness={3} position={[0, 0.47, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={fabric} roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[0.46, 0.56, 0.07]} radius={0.03} smoothness={3} position={[0, 0.8, 0.23]} rotation={[-0.12, 0, 0]} castShadow>
          <meshStandardMaterial color={fabric} roughness={0.9} />
        </RoundedBox>
        <mesh position={[0, 0.58, 0.22]} castShadow>
          <boxGeometry args={[0.06, 0.16, 0.04]} />
          <meshStandardMaterial color="#1b1b1f" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.26, 0.6, 0.02]} castShadow>
            <boxGeometry args={[0.05, 0.03, 0.3]} />
            <meshStandardMaterial color="#1b1b1f" />
          </mesh>
        ))}
        {/* A hoodie thrown over the back */}
        <mesh position={[0.05, 1.02, 0.27]} rotation={[0.2, 0, 0.15]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.12]} />
          <meshStandardMaterial color="#8b1e2d" roughness={1} />
        </mesh>
      </group>
    </group>
  )
}
