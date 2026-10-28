import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Buzzer, Dust } from './objects/Ambience'
import { Chair } from './objects/Chair'
import { BeanBag, Curtains, FairyLights, Plant, WallClock } from './objects/Cozy'
import { Food, GameBoy, Posters, Shelf } from './objects/Decor'
import { GuitarController } from './objects/Guitar'
import { TennisGear } from './objects/Tennis'
import { SCREEN_POS } from './layout'
import { Computer, Desk } from './objects/Desk'
import { Lamp } from './objects/Lamp'
import { Mochi } from './objects/Mochi'
import { Structure } from './objects/Structure'
import { WindowSky } from './objects/WindowSky'
import { isCoarsePointer } from '../lib/env'
import { useRoom } from './roomStore'
import type { Lighting } from './time'

// `?cam=x,y,z,tx,ty,tz` pins the camera for close-up screenshots while working on models.
const CAM = new URLSearchParams(window.location.search).get('cam')?.split(',').map(Number)
const HOME = CAM?.length === 6 ? new THREE.Vector3(CAM[0], CAM[1], CAM[2]) : new THREE.Vector3(-0.55, 1.55, 2.25)
const LOOK = CAM?.length === 6 ? new THREE.Vector3(CAM[3], CAM[4], CAM[5]) : new THREE.Vector3(0.45, 0.95, -1.8)
const PARALLAX = CAM ? 0 : 1

function CameraRig({ onEnter }: { onEnter: () => void }) {
  const { camera, pointer, size } = useThree()
  const poweringOn = useRoom((s) => s.poweringOn)
  const arrived = useRef(false)
  const goal = useRef(new THREE.Vector3())
  const look = useRef(LOOK.clone())
  const lookGoal = useRef(LOOK.clone())
  const timer = useRef(0)
  const aspect = size.width / size.height
  // Phones held upright see less of the room, so widen the lens and let a drag pan across it.
  const portrait = aspect < 1
  const fov = aspect < 0.8 ? 72 : aspect < 1.3 ? 62 : 55

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
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
      goal.current.set(HOME.x + pointer.x * (portrait ? 0.15 : 0.35) * PARALLAX, HOME.y + pointer.y * 0.12 * PARALLAX, HOME.z)
      camera.position.lerp(goal.current, 1 - Math.exp(-delta * 2))
      lookGoal.current.set(LOOK.x + (portrait ? pointer.x * 1.4 * PARALLAX : 0), LOOK.y, LOOK.z)
      look.current.lerp(lookGoal.current, 1 - Math.exp(-delta * 2.5))
    }
    camera.lookAt(look.current)
  })
  return null
}

function Scene({ lighting, onEnter, effects }: { lighting: Lighting; onEnter: () => void; effects: boolean }) {
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
      <FairyLights lighting={lighting} />
      <WallClock />
      <Plant />
      <BeanBag />
      <Curtains />
      <Dust lighting={lighting} />
      <Buzzer lighting={lighting} />
      {effects && (
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.9} />
          <Vignette offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  )
}

export default function Room({ onEnter, lighting }: { onEnter: () => void; lighting: Lighting }) {
  const setHover = useRoom((s) => s.setHover)
  // Start sharp on desktops and lighter on touch devices, then adjust to how fast this GPU really is.
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.75)
  const [dpr, setDpr] = useState(isCoarsePointer() ? 1 : maxDpr)
  const [effects, setEffects] = useState(!isCoarsePointer())

  useEffect(() => () => setHover(null), [setHover])

  return (
    <Canvas
      shadows="percentage"
      // No tone mapping, so the room looks the same with or without the post effects.
      flat
      camera={{ position: HOME.toArray(), fov: 55, near: 0.05, far: 40 }}
      dpr={dpr}
      onPointerMissed={() => setHover(null)}
      aria-label="Johnny's bedroom in 3D"
    >
      <PerformanceMonitor
        flipflops={3}
        onIncline={() => setDpr(maxDpr)}
        onDecline={() => {
          setDpr(1)
          setEffects(false)
        }}
        onFallback={() => {
          setDpr(1)
          setEffects(false)
        }}
      >
        <Scene lighting={lighting} onEnter={onEnter} effects={effects} />
      </PerformanceMonitor>
    </Canvas>
  )
}
