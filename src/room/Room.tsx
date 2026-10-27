import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Buzzer, Dust } from './objects/Ambience'
import { Chair } from './objects/Chair'
import { Food, GameBoy, GuitarController, Posters, Shelf, TennisGear } from './objects/Decor'
import { SCREEN_POS } from './layout'
import { Computer, Desk } from './objects/Desk'
import { Lamp } from './objects/Lamp'
import { Mochi } from './objects/Mochi'
import { Structure } from './objects/Structure'
import { WindowSky } from './objects/WindowSky'
import { useRoom } from './roomStore'
import type { Lighting } from './time'

const HOME = new THREE.Vector3(-0.55, 1.55, 2.25)
const LOOK = new THREE.Vector3(0.45, 0.95, -1.8)

function CameraRig({ onEnter }: { onEnter: () => void }) {
  const { camera, pointer } = useThree()
  const poweringOn = useRoom((s) => s.poweringOn)
  const arrived = useRef(false)
  const goal = useRef(new THREE.Vector3())
  const look = useRef(LOOK.clone())
  const timer = useRef(0)

  useFrame((_, delta) => {
    if (poweringOn) {
      // Short pause so you see the screen light up, then fly into it.
      timer.current += delta
      if (timer.current > 0.5) {
        goal.current.set(SCREEN_POS.x, SCREEN_POS.y, SCREEN_POS.z + 0.32)
        camera.position.lerp(goal.current, 1 - Math.exp(-delta * 2.6))
        look.current.lerp(SCREEN_POS, 1 - Math.exp(-delta * 5))
        if (!arrived.current && camera.position.distanceTo(goal.current) < 0.04) {
          arrived.current = true
          onEnter()
        }
      }
    } else {
      goal.current.set(HOME.x + pointer.x * 0.35, HOME.y + pointer.y * 0.12, HOME.z)
      camera.position.lerp(goal.current, 1 - Math.exp(-delta * 2))
    }
    camera.lookAt(look.current)
  })
  return null
}

function Scene({ lighting, onEnter }: { lighting: Lighting; onEnter: () => void }) {
  return (
    <>
      <color attach="background" args={['#05060c']} />
      <hemisphereLight args={['#c9d6ff', '#3a2a20', lighting.ambient]} />
      <CameraRig onEnter={onEnter} />
      <Structure />
      <WindowSky lighting={lighting} />
      <Desk />
      <Computer />
      <Lamp />
      <Chair />
      <Shelf />
      <Posters />
      <GameBoy />
      <Food />
      <TennisGear />
      <GuitarController />
      <Mochi />
      <Dust lighting={lighting} />
      <Buzzer lighting={lighting} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.9} />
        <Vignette offset={0.25} darkness={0.55} />
      </EffectComposer>
    </>
  )
}

export default function Room({ onEnter, lighting }: { onEnter: () => void; lighting: Lighting }) {
  const setHover = useRoom((s) => s.setHover)

  useEffect(() => () => setHover(null), [setHover])

  return (
    <Canvas
      shadows
      camera={{ position: HOME.toArray(), fov: 55, near: 0.05, far: 40 }}
      dpr={[1, 1.75]}
      onPointerMissed={() => setHover(null)}
      aria-label="Johnny's bedroom in 3D"
    >
      <Scene lighting={lighting} onEnter={onEnter} />
    </Canvas>
  )
}
