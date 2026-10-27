import { useCursor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

// A simple first pass at the room. Phase 2 replaces these boxes with real models.

const SCREEN_POS = new THREE.Vector3(0, 1.32, -0.55)

function CameraRig({ zooming, onArrive }: { zooming: boolean; onArrive: () => void }) {
  const { camera, pointer } = useThree()
  const arrived = useRef(false)
  const target = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (zooming) {
      target.current.set(SCREEN_POS.x, SCREEN_POS.y, SCREEN_POS.z + 0.45)
      camera.position.lerp(target.current, 1 - Math.exp(-delta * 3))
      if (!arrived.current && camera.position.distanceTo(target.current) < 0.05) {
        arrived.current = true
        onArrive()
      }
    } else {
      // Gentle parallax as the mouse moves.
      target.current.set(pointer.x * 0.4, 1.7 + pointer.y * 0.15, 2.6)
      camera.position.lerp(target.current, 1 - Math.exp(-delta * 2))
    }
    camera.lookAt(SCREEN_POS.x, SCREEN_POS.y - 0.1, SCREEN_POS.z)
  })
  return null
}

function Monitor({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 1.32, -0.6]} castShadow>
        <boxGeometry args={[0.9, 0.62, 0.08]} />
        <meshStandardMaterial color="#d8d4c8" />
      </mesh>
      <mesh position={SCREEN_POS}>
        <planeGeometry args={[0.78, 0.5]} />
        <meshStandardMaterial color="#1d4fc4" emissive={hovered ? '#4f86ff' : '#2a5fe0'} emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.6]}>
        <boxGeometry args={[0.12, 0.22, 0.1]} />
        <meshStandardMaterial color="#c9c5b8" />
      </mesh>
      {/* PC tower */}
      <mesh position={[0.75, 1.03, -0.55]} castShadow>
        <boxGeometry args={[0.22, 0.5, 0.5]} />
        <meshStandardMaterial color="#d8d4c8" />
      </mesh>
      <pointLight position={[0, 1.3, -0.3]} intensity={hovered ? 2.2 : 1.5} distance={2.5} color="#6f9bff" />
    </group>
  )
}

function Lamp() {
  const [on, setOn] = useState(true)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <group
      position={[-0.8, 0.78, -0.55]}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.16, 0.2, 24, 1, true]} />
        <meshStandardMaterial color="#f2d9a6" emissive={on ? '#ffcf7a' : '#000'} emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {on && <pointLight position={[0, 0.45, 0]} intensity={3} distance={4} color="#ffc46b" castShadow />}
    </group>
  )
}

function Room3D({ onEnter }: { onEnter: () => void }) {
  const [zooming, setZooming] = useState(false)
  return (
    <>
      <color attach="background" args={['#0d0f1a']} />
      <ambientLight intensity={0.25} />
      <CameraRig zooming={zooming} onArrive={onEnter} />

      {/* Floor and walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#6b4f3a" />
      </mesh>
      <mesh position={[0, 2, -1]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#3a4766" />
      </mesh>
      {/* Window with night sky */}
      <mesh position={[1.9, 2.1, -0.99]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#1b2550" emissive="#24346e" emissiveIntensity={0.6} />
      </mesh>

      {/* Desk */}
      <mesh position={[0, 0.76, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.06, 0.9]} />
        <meshStandardMaterial color="#8a6243" />
      </mesh>
      {[-1.0, 1.0].map((x) => (
        <mesh key={x} position={[x, 0.37, -0.45]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.8]} />
          <meshStandardMaterial color="#6e4d34" />
        </mesh>
      ))}

      <Monitor onClick={() => setZooming(true)} />
      <Lamp />

      {/* Mochi's bed */}
      <mesh position={[-1.6, 0.08, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.1, 12, 32]} />
        <meshStandardMaterial color="#b85c5c" />
      </mesh>
    </>
  )
}

export default function Room({ onEnter }: { onEnter: () => void }) {
  return (
    <Canvas shadows camera={{ position: [0, 1.7, 2.6], fov: 50 }} dpr={[1, 2]}>
      <Room3D onEnter={onEnter} />
    </Canvas>
  )
}
