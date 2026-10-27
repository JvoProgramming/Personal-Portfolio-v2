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


// Mochi is a Chihuahua mix, modeled from a photo of her: a solid fawn coat, a stocky barrel
// body on short legs, one upright ear and one folded ear, big dark eyes, a short muzzle
// with a darker nose and mouth, a happy open-mouthed smile, pale toe tips and an upturned tail.
// Her shapes are baked once from smooth blended primitives (see sdf.ts).
const TAN = new THREE.Color('#c8945c')
const BACK = new THREE.Color('#b9844e')
const LIGHT = new THREE.Color('#d9ad78')
const MUZZLE = new THREE.Color('#8a6040')
const TOES = new THREE.Color('#efe2cc')
/** She's small; the whole dog is modeled at this scale. */
const SIZE = 0.8
/** Where the head sits on the body group. */
/** Hip and shoulder height: her legs are short. */
const LEG_Y = 0.13
const HEAD: [number, number, number] = [0, 0.29, 0.155]

let shapes: ReturnType<typeof buildShapes> | null = null
function getShapes() {
  shapes ??= buildShapes()
  return shapes
}

function buildShapes() {
  // Ears are flattened front-to-back. Her right ear (-x, since she faces +z) stands up in a point;
  // her left ear rises, then folds out and down at the tip.
  const F = 0.45
  const upright = scaled([1, 1, F], cone([-0.042, 0.05, -0.012 / F], [-0.078, 0.14, -0.008 / F], 0.032, 0.006))
  const folded = scaled(
    [1, 1, F],
    union(0.006, cone([0.042, 0.05, -0.012 / F], [0.07, 0.092, -0.006 / F], 0.03, 0.017), cone([0.07, 0.092, -0.006 / F], [0.098, 0.074, 0.004 / F], 0.017, 0.007)),
  )
  const eyeDist = (p: THREE.Vector3) => Math.min(Math.hypot(p.x - 0.033, p.y - 0.008, p.z - 0.058), Math.hypot(p.x + 0.033, p.y - 0.008, p.z - 0.058))
  const head = bake(
    union(
      0.024,
      sphere([0, 0.012, 0], 0.07),
      sphere([-0.031, -0.02, 0.03], 0.033),
      sphere([0.031, -0.02, 0.03], 0.033),
      cone([0, -0.022, 0.045], [0, -0.03, 0.086], 0.033, 0.021),
      union(0.012, upright, folded),
    ),
    {
      center: [0, 0.035, 0.01],
      half: 0.14,
      resolution: 68,
      color: (p) => {
        // Slightly darker inside the folded ears.
        if (Math.abs(p.x) > 0.05 && p.y > 0.055 && p.z > -0.002) return BACK
        // A shadowy ring around the eyes, a dark muzzle tip, a lighter chin.
        let c = mixColor(TAN, BACK, 1 - (eyeDist(p) - 0.016) / 0.012)
        c = mixColor(c, LIGHT, (-0.04 - p.y) / 0.02)
        return mixColor(c, MUZZLE, (p.z - 0.09) / 0.016)
      },
    },
  )
  // A stocky barrel: deep chest, round belly, wide hips, thick short neck.
  const body = bake(
    union(
      0.045,
      ellipsoid([0, 0.188, -0.01], [0.076, 0.08, 0.1]),
      // A little belly sag.
      ellipsoid([0, 0.155, 0], [0.06, 0.045, 0.07]),
      sphere([0, 0.19, 0.06], 0.07),
      sphere([0, 0.2, -0.08], 0.066),
      cone([0, 0.21, 0.08], [0, 0.275, 0.13], 0.058, 0.046),
    ),
    {
      center: [0, 0.2, 0],
      half: 0.18,
      resolution: 68,
      color: (p) => mixColor(mixColor(LIGHT, TAN, (p.y - 0.14) / 0.05), BACK, (p.y - 0.235) / 0.03),
    },
  )
  const leg = bake(
    union(0.016, cone([0, 0.01, 0], [0, -0.08, 0], 0.031, 0.018), cone([0, -0.08, 0], [0, -0.114, 0.005], 0.017, 0.015), ellipsoid([0, -0.12, 0.014], [0.02, 0.012, 0.027])),
    {
      center: [0, -0.06, 0.01],
      half: 0.085,
      resolution: 40,
      // Pale toe tips.
      color: (p) => mixColor(TAN, TOES, Math.min((-0.11 - p.y) / 0.01, (p.z - 0.018) / 0.012)),
    },
  )
  const tail = bake(
    chain(
      [
        [0, 0, 0],
        [0, 0.025, -0.045],
        [0, 0.05, -0.085],
        [0, 0.072, -0.115],
        [0, 0.09, -0.132],
      ],
      0.018,
      0.007,
      0.012,
    ),
    {
      center: [0, 0.05, -0.065],
      half: 0.09,
      resolution: 40,
      color: (p) => mixColor(TAN, LIGHT, (0.04 - p.y) / 0.04 + (p.z + 0.03) / 0.04 - 1),
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

/** Mochi (a Chihuahua mix) naps in her bed. Click her (or the bed or bone) and she fetches her bone, or drops it off. */
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
    if (body.current) body.current.position.y = s.lying ? -0.1 : moving ? Math.abs(Math.sin(s.phase)) * 0.015 : 0
    if (head.current) {
      const dip = task?.kind === 'pickup' || task?.kind === 'drop' ? -0.35 : 0
      head.current.rotation.x = s.lying ? 0.15 + Math.sin(t * 0.8) * 0.03 : dip
    }
    legs.current.forEach((leg, i) => {
      if (!leg) return
      // Lying down: front paws stretch forward, back legs tuck behind (a sphinx pose).
      const front = i < 2
      leg.position.y = s.lying ? 0.05 : LEG_Y
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
        sheenColor: new THREE.Color('#f3d6ae'),
        sheenRoughness: 0.5,
        normalMap: strandNormal(2, 3600),
        normalScale: new THREE.Vector2(0.35, 0.35),
      }),
    [],
  )
  const glossy = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#141210', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }), [])
  const mouth = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1610', roughness: 0.5 }), [])
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
        <group scale={SIZE}>
        <group ref={body}>
          <mesh geometry={parts.body} material={fur} castShadow />
          {/* Red collar with a little gold tag */}
          <mesh position={[0, 0.25, 0.118]} rotation={[1.0, 0, 0]}>
            <torusGeometry args={[0.052, 0.007, 10, 36]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.214, 0.152]} rotation={[0.55, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.003, 16]} />
            <meshStandardMaterial color="#e3b341" metalness={0.9} roughness={0.25} />
          </mesh>
          <group ref={head} position={HEAD}>
            <group scale={1.12}>
            <mesh geometry={parts.head} material={fur} castShadow />
            {/* Dark nose at the end of the short muzzle */}
            <mesh position={[0, -0.021, 0.105]} scale={[1.25, 0.9, 0.85]} material={glossy}>
              <sphereGeometry args={[0.012, 16, 12]} />
            </mesh>
            {/* Big, round, dark eyes with a catch-light */}
            {[-1, 1].map((x) => (
              <group key={x} position={[x * 0.033, 0.008, 0.056]} rotation={[0, x * 0.45, 0]}>
                <mesh scale={[1, 1, 0.75]} material={glossy}>
                  <sphereGeometry args={[0.016, 20, 16]} />
                </mesh>
                <mesh position={[x * -0.004, 0.006, 0.011]}>
                  <sphereGeometry args={[0.0036, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
            {/* Happy open-mouthed smile: dark lips curving up at the corners, a pink tongue */}
            <mesh position={[0, -0.047, 0.077]} scale={[0.024, 0.009, 0.017]} material={mouth}>
              <sphereGeometry args={[1, 20, 12]} />
            </mesh>
            {[-1, 1].map((x) => (
              <mesh key={x} position={[x * 0.024, -0.04, 0.073]} rotation={[0, x * -0.9, x * 0.6]} scale={[0.014, 0.0035, 0.006]} material={mouth}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
            ))}
            <mesh position={[0, -0.051, 0.085]} scale={[0.013, 0.004, 0.011]}>
              <sphereGeometry args={[1, 16, 10]} />
              <meshStandardMaterial color="#e0707a" roughness={0.4} />
            </mesh>
            </group>
            <group ref={carriedBone} position={[0, -0.05, MOUTH - HEAD[2]]} visible={false}>
              <Bone />
            </group>
          </group>
          <group ref={tail} position={[0, 0.23, -0.135]}>
            <mesh geometry={parts.tail} material={fur} castShadow />
          </group>
        </group>
        {[
          [-0.048, 0.085],
          [0.048, 0.085],
          [-0.05, -0.095],
          [0.05, -0.095],
        ].map(([x, z], i) => (
          <group
            key={i}
            ref={(g) => {
              legs.current[i] = g
            }}
            position={[x, LEG_Y, z]}
          >
            <mesh geometry={parts.leg} material={fur} castShadow />
          </group>
        ))}
        </group>
      </group>
    </group>
  )
}
