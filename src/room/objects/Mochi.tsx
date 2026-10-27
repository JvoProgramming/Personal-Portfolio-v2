import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { deform, strandNormal } from '../materials'
import { useRoom } from '../roomStore'
import { bake, chain, cone, ellipsoid, mixColor, scaled, sphere, union } from '../sdf'

const BED = new THREE.Vector3(-1.75, 0, -0.75)
const REST_HEADING = 0.9
const SPEED = 0.8
const MOUTH = 0.3

type Task = { kind: 'walk'; to: THREE.Vector3 } | { kind: 'pickup' } | { kind: 'drop' } | { kind: 'lie' }


// Mochi's shapes are baked once from smooth blended primitives (see sdf.ts), with tan fur on top
// and the cream "urajiro" markings a Shiba has on her muzzle, cheeks, chest, belly and socks.
const TAN = new THREE.Color('#d9934f')
const CREAM_C = new THREE.Color('#f7ead6')
const PINK = new THREE.Color('#e9b9a6')

let shapes: ReturnType<typeof buildShapes> | null = null
function getShapes() {
  shapes ??= buildShapes()
  return shapes
}

function buildShapes() {
  const head = bake(
    union(
      0.03,
      ellipsoid([0, 0.012, 0], [0.074, 0.068, 0.07]),
      sphere([-0.04, -0.026, 0.018], 0.036),
      sphere([0.04, -0.026, 0.018], 0.036),
      cone([0, -0.018, 0.04], [0, -0.03, 0.112], 0.04, 0.024),
      union(
        0.012,
        scaled([1, 1, 0.55], cone([-0.04, 0.05, -0.004], [-0.056, 0.124, 0.002], 0.03, 0.006)),
        scaled([1, 1, 0.55], cone([0.04, 0.05, -0.004], [0.056, 0.124, 0.002], 0.03, 0.006)),
      ),
    ),
    {
      center: [0, 0.02, 0.02],
      half: 0.13,
      resolution: 60,
      color: (p) => {
        // Inner ear.
        if (p.y > 0.065 && p.z > 0.005 && Math.abs(Math.abs(p.x) - 0.048) < 0.014) return PINK.clone()
        // Eyebrow dots.
        const brow = 1 - Math.hypot(Math.abs(p.x) - 0.03, (p.y - 0.044) * 1.4, p.z - 0.055) / 0.009
        // Cream muzzle and cheeks, tan forehead and back of the head.
        const lower = (0.005 - p.y) / 0.025 + (p.z - 0.01) / 0.05
        return mixColor(TAN, CREAM_C, Math.max(lower, brow * 1.5))
      },
    },
  )
  const body = bake(
    union(
      0.045,
      cone([0, 0.2, -0.085], [0, 0.21, 0.06], 0.072, 0.078),
      sphere([0, 0.185, 0.11], 0.07),
      cone([0, 0.21, 0.12], [0, 0.28, 0.17], 0.058, 0.05),
      sphere([-0.032, 0.19, -0.085], 0.064),
      sphere([0.032, 0.19, -0.085], 0.064),
    ),
    {
      center: [0, 0.2, 0],
      half: 0.2,
      resolution: 64,
      color: (p) => mixColor(TAN, CREAM_C, Math.max((0.175 - p.y) / 0.03, (p.z - 0.1) / 0.04 + (0.24 - p.y) / 0.04 - 1)),
    },
  )
  const leg = bake(union(0.02, cone([0, 0, 0], [0, -0.09, 0], 0.033, 0.021), cone([0, -0.09, 0], [0, -0.13, 0.008], 0.021, 0.022), ellipsoid([0, -0.136, 0.018], [0.026, 0.016, 0.033])), {
    center: [0, -0.07, 0.01],
    half: 0.09,
    resolution: 40,
    color: (p) => mixColor(TAN, CREAM_C, (-0.07 - p.y) / 0.03),
  })
  const tail = bake(
    chain(
      [
        [0, 0, 0],
        [0, 0.06, -0.035],
        [0, 0.115, -0.005],
        [0.01, 0.105, 0.055],
        [0.03, 0.06, 0.05],
      ],
      0.03,
      0.017,
      0.02,
    ),
    {
      center: [0.01, 0.05, 0.005],
      half: 0.1,
      resolution: 44,
      color: (p) => mixColor(TAN, CREAM_C, (p.z + 0.01) / 0.05 - (p.y - 0.06) / 0.04),
    },
  )
  const bone = bake(
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
  return { head, body, leg, tail, bone }
}

function Bone(props: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh {...props} geometry={getShapes().bone} castShadow>
      <meshStandardMaterial color="#f3ecdc" roughness={0.55} />
    </mesh>
  )
}

/** The donut-shaped plush bed: a lathed bolster ring and a tufted cushion. */
function DogBed() {
  const ring = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2
      pts.push(new THREE.Vector2(0.31 + Math.cos(a) * 0.085, 0.085 + Math.sin(a) * 0.08))
    }
    // Puffy segments around the ring, like a stitched bolster.
    return deform(new THREE.LatheGeometry(pts, 96), (v) => {
      const a = Math.atan2(v.z, v.x)
      const r = Math.hypot(v.x, v.z)
      const puff = 1 + Math.abs(Math.sin(a * 6)) * 0.035
      const k = 0.31 + (r - 0.31) * puff
      v.x = (v.x / r) * k
      v.z = (v.z / r) * k
      v.y = Math.max(0.004, v.y * (0.95 + Math.abs(Math.sin(a * 6)) * 0.06))
    })
  }, [])
  const cushion = useMemo(
    () =>
      deform(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 48, 1, false), (v) => {
        if (v.y > 0) v.y += 0.012 * (1 - (v.x * v.x + v.z * v.z) / 0.09)
      }),
    [],
  )
  return (
    <group>
      <mesh geometry={ring} castShadow receiveShadow>
        <meshPhysicalMaterial color="#9c4a52" roughness={1} sheen={0.7} sheenColor="#e8a0a8" sheenRoughness={0.5} normalMap={strandNormal(8, 3200)} normalScale={[0.5, 0.5]} />
      </mesh>
      <mesh geometry={cushion} position={[0, 0.035, 0]} receiveShadow>
        <meshPhysicalMaterial color="#efe0c8" roughness={1} sheen={0.6} sheenColor="#ffffff" normalMap={strandNormal(10, 3200)} normalScale={[0.5, 0.5]} />
      </mesh>
    </group>
  )
}

/** Mochi naps in her bed. Click her (or the bed or bone) and she fetches her bone, or drops it off. */
export function Mochi() {
  const calls = useRoom((s) => s.mochiCalls)
  const callMochi = useRoom((s) => s.callMochi)
  const { props } = useInteractive('obj.mochi', callMochi)

  const dog = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Group | null)[]>([])
  const carriedBone = useRef<THREE.Group>(null)
  const floorBone = useRef<THREE.Group>(null)

  const state = useRef({
    pos: BED.clone(),
    heading: REST_HEADING,
    lying: true,
    carrying: false,
    bone: new THREE.Vector3(-0.35, 0, 0.45),
    queue: [] as Task[],
    timer: 0,
    phase: 0,
  })

  useEffect(() => {
    if (calls === 0) return
    const s = state.current
    if (s.queue.length) return
    s.lying = false
    if (!s.carrying) {
      const approach = s.bone.clone().sub(BED).setY(0).normalize()
      s.queue = [{ kind: 'walk', to: s.bone.clone().addScaledVector(approach, -MOUTH) }, { kind: 'pickup' }, { kind: 'walk', to: BED.clone() }, { kind: 'lie' }]
    } else {
      const spot = new THREE.Vector3(-1.1 + Math.random() * 1.4, 0, -0.2 + Math.random() * 0.8)
      s.queue = [{ kind: 'walk', to: spot }, { kind: 'drop' }, { kind: 'walk', to: BED.clone() }, { kind: 'lie' }]
    }
  }, [calls])

  useFrame(({ clock }, delta) => {
    const s = state.current
    const task = s.queue[0]
    let moving = false
    if (task?.kind === 'walk') {
      const dir = task.to.clone().sub(s.pos).setY(0)
      const dist = dir.length()
      if (dist < 0.02) {
        s.queue.shift()
      } else {
        moving = true
        s.pos.addScaledVector(dir.normalize(), Math.min(dist, SPEED * delta))
        const want = Math.atan2(dir.x, dir.z)
        let diff = want - s.heading
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        s.heading += diff * Math.min(1, delta * 10)
      }
    } else if (task?.kind === 'pickup' || task?.kind === 'drop') {
      s.timer += delta
      if (s.timer > 0.45) {
        s.timer = 0
        if (task.kind === 'pickup') {
          s.carrying = true
        } else {
          s.carrying = false
          s.bone.set(s.pos.x + Math.sin(s.heading) * MOUTH, 0, s.pos.z + Math.cos(s.heading) * MOUTH)
        }
        s.queue.shift()
      }
    } else if (task?.kind === 'lie') {
      let diff = REST_HEADING - s.heading
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      s.heading += diff * Math.min(1, delta * 4)
      if (Math.abs(diff) < 0.05) {
        s.lying = true
        s.queue.shift()
      }
    }

    if (moving) s.phase += delta * 14
    const t = clock.elapsedTime
    if (dog.current) {
      dog.current.position.set(s.pos.x, s.lying ? 0.05 : 0, s.pos.z)
      dog.current.rotation.y = s.heading
    }
    if (body.current) body.current.position.y = s.lying ? -0.12 : moving ? Math.abs(Math.sin(s.phase)) * 0.015 : 0
    if (head.current) {
      const dip = task?.kind === 'pickup' || task?.kind === 'drop' ? -0.35 : 0
      head.current.rotation.x = s.lying ? 0.15 + Math.sin(t * 0.8) * 0.03 : dip
    }
    legs.current.forEach((leg, i) => {
      if (!leg) return
      // Lying down: front paws stretch forward, back legs tuck behind (a sphinx pose).
      const front = i < 2
      leg.position.y = s.lying ? 0.05 : 0.15
      leg.rotation.x = s.lying ? (front ? -1.45 : 1.45) : moving ? Math.sin(s.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 : 0
    })
    if (tail.current) tail.current.rotation.z = Math.sin(t * (s.lying ? 2 : 12)) * (s.lying ? 0.15 : 0.6)
    if (carriedBone.current) carriedBone.current.visible = s.carrying
    if (floorBone.current) {
      floorBone.current.visible = !s.carrying
      floorBone.current.position.set(s.bone.x, 0.02, s.bone.z)
    }
  })

  const fur = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.95,
        sheen: 0.6,
        sheenColor: new THREE.Color('#fff0d8'),
        sheenRoughness: 0.5,
        normalMap: strandNormal(2, 3600),
        normalScale: new THREE.Vector2(0.7, 0.7),
      }),
    [],
  )
  const glossy = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#141210', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }), [])
  const parts = getShapes()

  return (
    <group>
      <group position={[BED.x, 0, BED.z]} {...props}>
        <DogBed />
      </group>

      <group ref={floorBone} {...props}>
        <Bone rotation={[0, 0.6, 0]} />
      </group>

      {/* Mochi */}
      <group ref={dog} {...props}>
        <group ref={body}>
          <mesh geometry={parts.body} material={fur} castShadow receiveShadow />
          {/* Red collar with a little gold tag */}
          <mesh position={[0, 0.245, 0.15]} rotation={[1.0, 0, 0]}>
            <torusGeometry args={[0.052, 0.008, 10, 32]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.205, 0.185]} rotation={[0.55, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.003, 16]} />
            <meshStandardMaterial color="#e3b341" metalness={0.9} roughness={0.25} />
          </mesh>
          <group ref={head} position={[0, 0.29, 0.17]}>
            <mesh geometry={parts.head} material={fur} castShadow />
            {/* Nose, eyes with a catch-light, and a smiling mouth */}
            <mesh position={[0, -0.018, 0.134]} scale={[1.25, 0.85, 0.9]} material={glossy}>
              <sphereGeometry args={[0.013, 16, 12]} />
            </mesh>
            {[-1, 1].map((x) => (
              <group key={x} position={[x * 0.032, 0.022, 0.062]} rotation={[0, x * 0.35, 0]}>
                <mesh scale={[1, 1.1, 0.7]} material={glossy}>
                  <sphereGeometry args={[0.0105, 16, 12]} />
                </mesh>
                <mesh position={[0.003, 0.004, 0.007]}>
                  <sphereGeometry args={[0.0028, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -0.045, 0.104]} rotation={[0.25, 0, Math.PI]}>
              <torusGeometry args={[0.014, 0.0022, 6, 16, Math.PI]} />
              <meshStandardMaterial color="#3a2418" />
            </mesh>
            <group ref={carriedBone} position={[0, -0.05, MOUTH - 0.17]} visible={false}>
              <Bone />
            </group>
          </group>
          <group ref={tail} position={[0, 0.25, -0.16]}>
            <mesh geometry={parts.tail} material={fur} castShadow />
          </group>
        </group>
        {[
          [-0.045, 0.11],
          [0.045, 0.11],
          [-0.045, -0.1],
          [0.045, -0.1],
        ].map(([x, z], i) => (
          <group
            key={i}
            ref={(g) => {
              legs.current[i] = g
            }}
            position={[x, 0.15, z]}
          >
            <mesh geometry={parts.leg} material={fur} castShadow />
          </group>
        ))}
      </group>
    </group>
  )
}
