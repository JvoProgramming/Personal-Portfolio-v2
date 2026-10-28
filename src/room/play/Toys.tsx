import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { strandNormal } from '../materials'
import { Model } from '../Model'
import { TennisBall } from '../objects/Tennis'
import { bake, cone, ellipsoid, mixColor, sphere, union } from '../sdf'
import { squeak } from './sound'
import { grab, release, toys, updateToys, type Toy, type ToyKind } from './toys'

// Press a toy to pick it up, then flick and let go to throw it. A plain click lobs it gently forward.

/** How far in front of the camera a held toy floats. */
const HOLD = 0.75

let boneGeo: THREE.BufferGeometry | null = null
function boneGeometry() {
  boneGeo ??= bake(
    union(
      0.012,
      cone([-0.055, 0, 0], [0.055, 0, 0], 0.012, 0.012),
      sphere([-0.064, 0, -0.014], 0.019),
      sphere([-0.064, 0, 0.014], 0.019),
      sphere([0.064, 0, -0.014], 0.019),
      sphere([0.064, 0, 0.014], 0.019),
    ),
    { center: [0, 0, 0], half: 0.1, resolution: 36 },
  )
  return boneGeo
}

let duckGeo: THREE.BufferGeometry | null = null
const YELLOW = new THREE.Color('#ffd23a')
const ORANGE = new THREE.Color('#ff8a1f')
function duckGeometry() {
  duckGeo ??= bake(
    union(
      0.014,
      ellipsoid([0, -0.008, -0.005], [0.036, 0.028, 0.046]),
      // Tail flick
      cone([0, -0.004, -0.035], [0, 0.012, -0.052], 0.016, 0.006),
      sphere([0, 0.03, 0.02], 0.024),
      ellipsoid([0, 0.026, 0.046], [0.013, 0.006, 0.014]),
    ),
    {
      center: [0, 0.005, 0],
      half: 0.07,
      resolution: 40,
      color: (p) => mixColor(YELLOW, ORANGE, (p.z - 0.036) / 0.006 - (p.y - 0.034) / 0.004),
    },
  )
  return duckGeo
}

/** A blue and white twisted rope with a knot at each end. */
function Rope() {
  const { tube, stripes } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.08, 0, 0), new THREE.Vector3(-0.03, 0.004, 0.012), new THREE.Vector3(0.03, -0.004, -0.01), new THREE.Vector3(0.08, 0, 0)])
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#f4efe4'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#2f6fd6'
    for (let i = -64; i < 128; i += 32) {
      g.beginPath()
      g.moveTo(i, 0)
      g.lineTo(i + 16, 0)
      g.lineTo(i + 16 + 64, 64)
      g.lineTo(i + 64, 64)
      g.fill()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(10, 1)
    return { tube: new THREE.TubeGeometry(curve, 40, 0.013, 10), stripes: t }
  }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: stripes, roughness: 1, normalMap: strandNormal(6, 2400), normalScale: new THREE.Vector2(0.8, 0.8) }), [stripes])
  return (
    <group>
      <mesh geometry={tube} material={mat} castShadow />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.085, 0, 0]}>
          <mesh material={mat} scale={[0.9, 1, 1]} castShadow>
            <sphereGeometry args={[0.024, 16, 12]} />
          </mesh>
          {/* Frayed tassel */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} material={mat} position={[s * 0.03, Math.sin(i * 1.3) * 0.008, Math.cos(i * 1.3) * 0.008]} rotation={[0, 0, (s * Math.PI) / 2 + Math.sin(i) * 0.2]}>
              <coneGeometry args={[0.005, 0.03, 5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Duck() {
  const shine = useMemo(() => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8 }), [])
  return (
    <group>
      <mesh geometry={duckGeometry()} material={shine} castShadow />
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * 0.014, 0.038, 0.037]}>
          <sphereGeometry args={[0.0045, 10, 8]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Bone() {
  return (
    <mesh geometry={boneGeometry()} castShadow>
      <meshStandardMaterial color="#f3ecdc" roughness={0.55} />
    </mesh>
  )
}

/** Downloaded toy models (see /credits), centered so they tumble around their middle. */
const RopeToy = () => <Model url="/models/toy_rope.glb" fit={{ longest: 0.2 }} centered fallback={<Rope />} />
const DuckToy = () => <Model url="/models/rubber_duck_toy.glb" fit={{ height: 0.075 }} centered fallback={<Duck />} />
// The chicken stands upright in its file; lay it down on its back.
const ChickenToy = () => <Model url="/models/toy_rubber_chicken_alt.glb" fit={{ longest: 0.22 }} rotation={[Math.PI / 2, 0, 0]} centered fallback={<Bone />} />
const CrocToy = () => <Model url="/models/toy_crocodile.glb" fit={{ longest: 0.17 }} centered fallback={<Bone />} />

const LOOKS: Record<ToyKind, () => React.JSX.Element> = { ball: TennisBall, bone: Bone, rope: RopeToy, duck: DuckToy, chicken: ChickenToy, croc: CrocToy }

interface Drag {
  toy: Toy
  /** Recent pointer positions (pixels) and times (seconds), for the flick speed. */
  trail: { x: number; y: number; t: number }[]
}

function ToyMesh({ toy, onGrab }: { toy: Toy; onGrab: (t: Toy, e: ThreeEvent<PointerEvent>) => void }) {
  const ref = useRef<THREE.Group>(null)
  const { props } = useInteractive('obj.toy', undefined, 'grab')
  const Look = LOOKS[toy.kind]
  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.position.copy(toy.pos)
    g.quaternion.copy(toy.spin)
  })
  return (
    <group
      ref={ref}
      {...props}
      onPointerDown={(e) => {
        if (toy.state === 'carried') return
        e.stopPropagation()
        onGrab(toy, e)
      }}
    >
      <Look />
      {/* A bigger invisible grab area, so small or stringy toys are easy to pick up (and to tap on phones). */}
      <mesh visible={false}>
        <sphereGeometry args={[0.075, 8, 6]} />
      </mesh>
    </group>
  )
}

/** All the throwable toys, plus the pick up and flick to throw controls. */
export function Toys() {
  const { camera, gl } = useThree()
  const drag = useRef<Drag | null>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = gl.domElement
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      pointer.current = { x: e.clientX, y: e.clientY }
      d.trail.push({ x: e.clientX, y: e.clientY, t: performance.now() / 1000 })
      if (d.trail.length > 12) d.trail.shift()
    }
    const up = () => {
      const d = drag.current
      if (!d) return
      drag.current = null
      document.body.style.cursor = ''
      // Flick speed over the last ~120 ms, in screen heights per second.
      const now = performance.now() / 1000
      const recent = d.trail.filter((p) => now - p.t < 0.12)
      let vx = 0
      let vy = 0
      if (recent.length >= 2) {
        const a = recent[0]
        const b = recent[recent.length - 1]
        const dt = Math.max(0.016, b.t - a.t)
        const h = el.clientHeight || 1
        vx = (b.x - a.x) / h / dt
        vy = -(b.y - a.y) / h / dt
      }
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3(-forward.z, 0, forward.x)
      // Upward flicks throw farther; sideways flicks curve the throw left or right.
      const lift = THREE.MathUtils.clamp(vy, 0, 4)
      const v = forward
        .clone()
        .multiplyScalar(1.4 + lift * 1.3)
        .addScaledVector(right, THREE.MathUtils.clamp(vx, -3, 3) * 1.1)
      v.y = 1.2 + lift * 0.9
      v.clampLength(0, 7.5)
      release(d.toy, v, now)
      if (d.toy.kind === 'duck' || d.toy.kind === 'chicken') squeak()
    }
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [camera, gl])

  const onGrab = (toy: Toy, e: ThreeEvent<PointerEvent>) => {
    grab(toy)
    pointer.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
    drag.current = { toy, trail: [{ ...pointer.current, t: performance.now() / 1000 }] }
    document.body.style.cursor = 'grabbing'
    if (toy.kind === 'duck' || toy.kind === 'chicken') squeak()
  }

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  useFrame((_, delta) => {
    const d = drag.current
    if (d) {
      // The held toy floats under the pointer, a little in front of the camera.
      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(((pointer.current.x - rect.left) / rect.width) * 2 - 1, -((pointer.current.y - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      d.toy.pos.copy(ray.ray.origin).addScaledVector(ray.ray.direction, HOLD)
    }
    updateToys(delta)
  })

  return (
    <group>
      {toys.map((t) => (
        <ToyMesh key={t.id} toy={t} onGrab={onGrab} />
      ))}
    </group>
  )
}
