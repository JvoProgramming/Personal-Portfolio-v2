import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, events as createPointerEvents, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Buzzer, Dust } from './objects/Ambience'
import { Chair } from './objects/Chair'
import { BeanBag, Curtains, FairyLights, Plant, WallClock } from './objects/Cozy'
import { Food, GameBoy, Posters, Shelf } from './objects/Decor'
import { GuitarController } from './objects/Guitar'
import { TennisGear } from './objects/Tennis'
import { SCREEN_POS, SEAT_EYE } from './layout'
import { pointerDrag, setVeil } from './look'
import { Computer, Desk } from './objects/Desk'
import { Lamp } from './objects/Lamp'
import { Mochi } from './objects/Mochi'
import { Toys } from './play/Toys'
import { Bed, Headphones, LedStrip } from './objects/Bedroom'
import { Structure } from './objects/Structure'
import { Blinds } from './objects/Blinds'
import { shade } from './shade'
import { WindowSky } from './objects/WindowSky'
import { isCoarsePointer } from '../lib/env'
import { useRoom } from './roomStore'
import type { Lighting } from './time'

// `?cam=x,y,z,tx,ty,tz` pins the camera for close-up screenshots while working on models.
const CAM = new URLSearchParams(window.location.search).get('cam')?.split(',').map(Number)
const HOME = CAM?.length === 6 ? new THREE.Vector3(CAM[0], CAM[1], CAM[2]) : new THREE.Vector3(-0.55, 1.55, 2.25)
const LOOK = CAM?.length === 6 ? new THREE.Vector3(CAM[3], CAM[4], CAM[5]) : new THREE.Vector3(0.45, 0.95, -1.8)
const PARALLAX = CAM ? 0 : 1

/** How far in front of the glass the fly-in ends: close enough that the screen fills the view. */
const PC_DIST = 0.2
const FLY_IN = 1.25
const PULL_BACK = 1.5
const SIT = 1.1
/** Looking around from the chair (radians per pixel): mouse while captured, finger drag on touch screens. */
const MOUSE_SPEED = 0.0024
const TOUCH_SPEED = 0.005

function lockPointer(el: HTMLCanvasElement) {
  try {
    // Raw input skips OS mouse acceleration where supported, which feels more like a game.
    const p = (el.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void)({ unadjustedMovement: true })
    if (p && 'catch' in p) p.catch(() => Promise.resolve(el.requestPointerLock()).catch(() => {}))
  } catch {
    // Pointer lock isn't available (some embedded browsers): clicks still work, just without mouse look.
  }
}

/**
 * Pointer events for the room. Seated with a mouse, everything aims through the middle of the screen (the
 * crosshair); until the mouse is captured, nothing in the room reacts, so the first click only captures it.
 */
const roomEvents: typeof createPointerEvents = (store) => ({
  ...createPointerEvents(store),
  compute(event, state) {
    const seatedFps = useRoom.getState().seated && !isCoarsePointer()
    if (seatedFps) {
      if (document.pointerLockElement) state.pointer.set(0, 0)
      else state.pointer.set(9, 9)
    } else {
      state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1)
    }
    state.raycaster.setFromCamera(state.pointer, state.camera)
  },
})

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

type Mode = 'home' | 'seat' | 'pc'
interface Tween {
  kind: 'move' | 'in' | 'out'
  from: THREE.Vector3
  fromLook: THREE.Vector3
  t: number
  dur: number
}

/** Yaw and pitch that point from the chair at the monitor. */
function seatFacing() {
  const v = SCREEN_POS.clone().setY(SCREEN_POS.y - 0.08).sub(SEAT_EYE)
  return { yaw: Math.atan2(-v.x, -v.z), pitch: Math.atan2(v.y, Math.hypot(v.x, v.z)) }
}

function CameraRig({ onEnter, active }: { onEnter: () => void; active: boolean }) {
  const { camera, pointer, size, gl } = useThree()
  const poweringOn = useRoom((s) => s.poweringOn)
  const seated = useRoom((s) => s.seated)
  const mode: Mode = poweringOn ? 'pc' : seated ? 'seat' : 'home'
  const modeRef = useRef(mode)
  useLayoutEffect(() => {
    modeRef.current = mode
  }, [mode])
  const shown = useRef<Mode>(mode)
  const tween = useRef<Tween | null>(null)
  const entered = useRef(false)
  const look = useRef(LOOK.clone())
  const goal = useRef(new THREE.Vector3())
  const lookGoal = useRef(new THREE.Vector3())
  const view = useRef({ ...seatFacing(), yawGoal: 0, pitchGoal: 0 })
  const aspect = size.width / size.height
  // Phones held upright see less of the room, so widen the lens and let a drag pan across it.
  const portrait = aspect < 1
  const fov = aspect < 0.8 ? 72 : aspect < 1.3 ? 62 : 55

  // Coming back from the PC (Shut Down or otherwise): start against the glass, behind the black veil, and pull back out.
  const wasActive = useRef(active)
  useEffect(() => {
    if (active && !wasActive.current) {
      camera.position.set(SCREEN_POS.x, SCREEN_POS.y, SCREEN_POS.z + PC_DIST)
      look.current.copy(SCREEN_POS)
      camera.lookAt(look.current)
      tween.current = { kind: 'out', from: camera.position.clone(), fromLook: SCREEN_POS.clone(), t: 0, dur: PULL_BACK }
      shown.current = modeRef.current
      entered.current = false
    }
    wasActive.current = active
  }, [active, camera])

  // From the chair, look around like a first-person game: the mouse is captured and turns your head, and a
  // click acts on whatever is under the crosshair. Touch screens drag to look instead.
  useEffect(() => {
    const el = gl.domElement
    const fps = !isCoarsePointer()
    let last: { x: number; y: number } | null = null
    const turn = (dx: number, dy: number, speed: number) => {
      const v = view.current
      v.yawGoal -= dx * speed
      v.pitchGoal = THREE.MathUtils.clamp(v.pitchGoal - dy * speed, -1.2, 1.0)
    }
    const down = (e: PointerEvent) => {
      pointerDrag.moved = 0
      pointerDrag.claimed = false
      last = { x: e.clientX, y: e.clientY }
      // Clicking the room while seated (and not yet captured) grabs the mouse instead of clicking things.
      if (fps && modeRef.current === 'seat' && !document.pointerLockElement && e.target === el) lockPointer(el)
    }
    const move = (e: PointerEvent) => {
      if (document.pointerLockElement === el) {
        if (modeRef.current === 'seat' && !tween.current) turn(e.movementX, e.movementY, MOUSE_SPEED)
        return
      }
      if (!last) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      last = { x: e.clientX, y: e.clientY }
      pointerDrag.moved += Math.abs(dx) + Math.abs(dy)
      // Touch: drag the view around (it moves with your finger).
      if (!fps && modeRef.current === 'seat' && !pointerDrag.claimed && !tween.current) turn(-dx, -dy, TOUCH_SPEED)
    }
    const up = () => {
      last = null
    }
    let unlockedAt = 0
    const lockChange = () => {
      const locked = document.pointerLockElement === el
      if (!locked) unlockedAt = performance.now()
      useRoom.setState({ locked })
    }
    const key = (e: KeyboardEvent) => {
      if (modeRef.current !== 'seat' || useRoom.getState().modal) return
      // With the mouse captured the browser uses the first Escape to free it; the next one stands you up.
      if (e.key === 'Escape') {
        if (document.pointerLockElement || performance.now() - unlockedAt < 250) return
        useRoom.getState().stand()
      }
      else if (e.key === 'ArrowLeft') view.current.yawGoal += 0.35
      else if (e.key === 'ArrowRight') view.current.yawGoal -= 0.35
      else if (e.key === 'ArrowUp') view.current.pitchGoal = Math.min(1.0, view.current.pitchGoal + 0.2)
      else if (e.key === 'ArrowDown') view.current.pitchGoal = Math.max(-1.2, view.current.pitchGoal - 0.2)
    }
    // Capture phase, so the counters reset before any object's own handler runs.
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('keydown', key)
    document.addEventListener('pointerlockchange', lockChange)
    return () => {
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', key)
      document.removeEventListener('pointerlockchange', lockChange)
    }
  }, [gl])

  // Sitting down captures the mouse straight away (the click that sat you down still counts as a gesture).
  // Standing up, or turning the PC on, lets go of it.
  useEffect(() => {
    if (mode === 'seat' && active && !isCoarsePointer()) lockPointer(gl.domElement)
    else if ((mode !== 'seat' || !active) && document.pointerLockElement === gl.domElement) document.exitPointerLock()
  }, [mode, active, gl])

  /** Where the camera wants to be (and look) in a mode, ignoring any transition. */
  const rest = (m: Mode, delta: number) => {
    if (m === 'pc') {
      goal.current.set(SCREEN_POS.x, SCREEN_POS.y, SCREEN_POS.z + PC_DIST)
      lookGoal.current.copy(SCREEN_POS)
    } else if (m === 'seat') {
      const v = view.current
      const k = 1 - Math.exp(-delta * 28)
      v.yaw += (v.yawGoal - v.yaw) * k
      v.pitch += (v.pitchGoal - v.pitch) * k
      goal.current.copy(SEAT_EYE)
      const c = Math.cos(v.pitch)
      lookGoal.current.set(SEAT_EYE.x - Math.sin(v.yaw) * c, SEAT_EYE.y + Math.sin(v.pitch), SEAT_EYE.z - Math.cos(v.yaw) * c)
    } else {
      const px = THREE.MathUtils.clamp(pointer.x, -1, 1)
      const py = THREE.MathUtils.clamp(pointer.y, -1, 1)
      goal.current.set(HOME.x + px * (portrait ? 0.15 : 0.35) * PARALLAX, HOME.y + py * 0.12 * PARALLAX, HOME.z)
      lookGoal.current.set(LOOK.x + (portrait ? px * 1.4 * PARALLAX : 0), LOOK.y, LOOK.z)
    }
  }

  useFrame((state, rawDelta) => {
    // The first frame after the room un-pauses can carry a huge delta; never let it jump the camera.
    const delta = Math.min(rawDelta, 1 / 20)
    const cam = state.camera as THREE.PerspectiveCamera
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    // A new mode starts an eased move from wherever the camera is right now, on the very next frame.
    if (mode !== shown.current) {
      if (mode === 'seat') {
        const f = seatFacing()
        Object.assign(view.current, { yaw: f.yaw, pitch: f.pitch, yawGoal: f.yaw, pitchGoal: f.pitch })
      }
      tween.current = {
        kind: mode === 'pc' ? 'in' : 'move',
        from: camera.position.clone(),
        fromLook: look.current.clone(),
        t: 0,
        dur: mode === 'pc' ? FLY_IN : SIT,
      }
      shown.current = mode
      entered.current = false
    }

    rest(mode, delta)
    const tw = tween.current
    if (tw) {
      tw.t = Math.min(1, tw.t + delta / tw.dur)
      const e = easeInOut(tw.t)
      camera.position.lerpVectors(tw.from, goal.current, e)
      look.current.lerpVectors(tw.fromLook, lookGoal.current, e)
      if (tw.kind === 'in') setVeil(smooth(0.6, 1, tw.t))
      if (tw.kind === 'out') setVeil(1 - smooth(0.05, 0.45, tw.t))
      if (tw.t >= 1) {
        tween.current = null
        if (tw.kind === 'in' && !entered.current) {
          entered.current = true
          onEnter()
        }
      }
    } else if (mode === 'home') {
      camera.position.lerp(goal.current, 1 - Math.exp(-delta * 2))
      look.current.lerp(lookGoal.current, 1 - Math.exp(-delta * 2.5))
    } else {
      camera.position.copy(goal.current)
      look.current.copy(lookGoal.current)
    }
    camera.lookAt(look.current)
  })
  return null
}

/** The room's soft fill light. Most of it comes in through the window, so it dims as the blinds shut. */
function Daylight({ ambient, night }: { ambient: number; night: boolean }) {
  const ref = useRef<THREE.HemisphereLight>(null)
  useFrame(() => {
    if (ref.current) ref.current.intensity = ambient * (1 - shade.closed * (night ? 0.25 : 0.6))
  })
  return <hemisphereLight ref={ref} args={['#c9d6ff', '#3a2a20', ambient]} />
}

function Scene({ lighting, onEnter, effects, active }: { lighting: Lighting; onEnter: () => void; effects: boolean; active: boolean }) {
  return (
    <>
      <color attach="background" args={['#05060c']} />
      <Daylight ambient={lighting.ambient} night={lighting.phase === 'night'} />
      <CameraRig onEnter={onEnter} active={active} />
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
      <Toys />
      <Bed />
      <Headphones />
      <LedStrip lighting={lighting} />
      <FairyLights lighting={lighting} />
      <WallClock />
      <Plant />
      <BeanBag />
      <Curtains />
      <Blinds lighting={lighting} />
      <Dust lighting={lighting} />
      <Buzzer lighting={lighting} />
      {effects && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.9} />
          <Vignette offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  )
}

export default function Room({ onEnter, lighting, active = true }: { onEnter: () => void; lighting: Lighting; active?: boolean }) {
  const setHover = useRoom((s) => s.setHover)
  // Start sharp on desktops and lighter on touch devices, then adjust to how fast this GPU really is.
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5)
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
      // Paused while the OS is on screen: no frames drawn, but every model, texture and shader stays loaded.
      frameloop={active ? 'always' : 'never'}
      onPointerMissed={() => setHover(null)}
      events={roomEvents}
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
        <Scene lighting={lighting} onEnter={onEnter} effects={effects} active={active} />
      </PerformanceMonitor>
    </Canvas>
  )
}
