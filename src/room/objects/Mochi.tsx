import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { deform, strandNormal } from '../materials'
import { keepOut } from '../play/physics'
import { bark, sigh, yip } from '../play/sound'
import { drop, play, toys } from '../play/toys'
import { bake, chain, cone, ellipsoid, mixColor, scaled, sphere, union } from '../sdf'

const BED = new THREE.Vector3(-1.75, 0, -0.75)
const REST_HEADING = 0.9
const WALK = 0.8
const RUN = 1.7
/** Where she brings toys back to: on the rug, in front of you. */
const DROP_SPOT = new THREE.Vector3(-0.2, 0, 0.35)
/** Where the viewer is, so she can look at you. */
const VIEWER = new THREE.Vector3(-0.55, 0, 2.25)
/** How far ahead of her center her mouth is (meters, at her scale). */
const REACH = 0.2
/** She waits this long for another throw before going back to bed. */
const PATIENCE = 12

type Mode =
  /** Napping in her bed. */
  | 'sleep'
  /** Running after a thrown toy. */
  | 'chase'
  /** Bringing a toy back to you. */
  | 'return'
  /** The toy landed somewhere she can't reach (desk, bed): she barks at it. */
  | 'stuck'
  /** Sitting in front of you, tail going, hoping for another throw. */
  | 'wait'
  /** Heading back to bed. */
  | 'bed'


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
  return { head, body, leg, tail }
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

/** A heart, painted once, for the hearts that float up when you pet her. */
let heartTex: THREE.CanvasTexture | null = null
function heartTexture() {
  if (heartTex) return heartTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#ff4f7b'
  g.beginPath()
  g.moveTo(32, 56)
  g.bezierCurveTo(4, 36, 2, 14, 18, 10)
  g.bezierCurveTo(26, 8, 31, 14, 32, 20)
  g.bezierCurveTo(33, 14, 38, 8, 46, 10)
  g.bezierCurveTo(62, 14, 60, 36, 32, 56)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.7)'
  g.beginPath()
  g.ellipse(20, 20, 5, 3, -0.6, 0, Math.PI * 2)
  g.fill()
  heartTex = new THREE.CanvasTexture(c)
  heartTex.colorSpace = THREE.SRGBColorSpace
  return heartTex
}

const HEARTS = 12
const HEARTS_LIST = Array.from({ length: HEARTS }, (_, i) => i)
interface Heart {
  age: number
  vel: THREE.Vector3
}

/** Mochi (a Chihuahua mix). Throw a toy and she fetches it; hold or stroke her to pet her. */
export function Mochi() {
  const petting = useRef(false)
  const { props } = useInteractive('obj.mochi', undefined, 'pointer')

  const dog = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const mouthAt = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Group | null)[]>([])
  const hearts = useRef<(THREE.Sprite | null)[]>([])
  const heartState = useRef<Heart[]>(Array.from({ length: HEARTS }, () => ({ age: 99, vel: new THREE.Vector3() })))

  const state = useRef({
    mode: 'sleep' as Mode,
    pos: BED.clone(),
    heading: REST_HEADING,
    lying: true,
    target: -1,
    carry: -1,
    seenThrows: 0,
    timer: 0,
    phase: 0,
    /** Seconds of happy wiggle left after a pet. */
    happy: 0,
    nextHeart: 0,
    /** For noticing when she's stuck behind something. */
    best: Infinity,
    stall: 0,
  })

  // Petting: press on her (and keep holding or stroking) for hearts and happy noises.
  useEffect(() => {
    const stop = () => {
      petting.current = false
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])
  const startPet = () => {
    const s = state.current
    petting.current = true
    s.nextHeart = 0
    if (s.mode === 'sleep') sigh()
    else yip()
    if (s.mode === 'wait') s.timer = 0
  }

  const tmp = useMemo(() => ({ v: new THREE.Vector3(), mouth: new THREE.Vector3(), q: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0) }), [])

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const s = state.current
    const t = clock.elapsedTime

    // Mouth position in the room, for picking up and carrying toys.
    if (mouthAt.current) mouthAt.current.getWorldPosition(tmp.mouth)

    // A new throw always wins: drop whatever she has and run for the newest toy.
    if (play.throws !== s.seenThrows) {
      s.seenThrows = play.throws
      const thrown = play.lastThrown
      if (s.carry >= 0 && s.carry !== thrown) {
        drop(toys[s.carry], tmp.mouth)
        s.carry = -1
      }
      if (s.carry !== thrown) {
        s.target = thrown
        s.mode = 'chase'
        s.lying = false
        s.best = Infinity
        s.stall = 0
        if (Math.random() < 0.5) yip()
      }
    }

    /** Walks (or runs) toward a floor point; returns the distance left. */
    const goTo = (goal: THREE.Vector3, speed: number, stopAt = 0.02) => {
      const dir = tmp.v.copy(goal).sub(s.pos).setY(0)
      const dist = dir.length()
      if (dist > stopAt) {
        const want = Math.atan2(dir.x, dir.z)
        let diff = want - s.heading
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        s.heading += diff * Math.min(1, delta * 10)
        // Turn first, then go: she doesn't moonwalk.
        const facing = Math.max(0, Math.cos(diff))
        s.pos.x += Math.sin(s.heading) * Math.min(dist - stopAt, speed * delta) * facing
        s.pos.z += Math.cos(s.heading) * Math.min(dist - stopAt, speed * delta) * facing
        keepOut(s.pos, 0.12)
        s.phase += delta * (speed > 1 ? 20 : 14)
      }
      return dist
    }
    const face = (p: THREE.Vector3) => {
      let diff = Math.atan2(p.x - s.pos.x, p.z - s.pos.z) - s.heading
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      s.heading += diff * Math.min(1, delta * 5)
    }

    let moving = false
    const toy = s.target >= 0 ? toys[s.target] : null
    switch (s.mode) {
      case 'chase': {
        if (!toy || toy.state === 'held') {
          s.mode = 'wait'
          s.timer = 0
          break
        }
        // Aim so her mouth, not her middle, ends up on the toy.
        const dir = tmp.v.copy(toy.pos).sub(s.pos).setY(0)
        const d = dir.length()
        const goal = d > 0.001 ? toy.pos.clone().setY(0).addScaledVector(dir.normalize(), -REACH) : toy.pos.clone().setY(0)
        const left = goTo(goal, RUN, 0.01)
        moving = left > 0.01
        const reach = Math.hypot(tmp.mouth.x - toy.pos.x, tmp.mouth.z - toy.pos.z)
        // Notice when walking isn't getting her closer (something's in the way).
        if (reach < s.best - 0.01) {
          s.best = reach
          s.stall = 0
        } else s.stall += delta
        const resting = !toy.moving || toy.vel.length() < 0.25
        const onFloor = toy.pos.y < 0.15
        if (onFloor && (reach < 0.07 || (s.stall > 1 && reach < 0.3 && resting))) {
          toy.state = 'carried'
          toy.moving = false
          s.carry = toy.id
          s.mode = 'return'
        } else if (resting && (!onFloor || s.stall > 2.5)) {
          // Up on the desk or bed, or wedged where she can't get to it.
          s.mode = 'stuck'
          s.timer = 0
          bark()
        }
        break
      }
      case 'return': {
        const left = goTo(DROP_SPOT, WALK * 1.2)
        moving = left > 0.02
        if (!moving) {
          face(VIEWER)
          if (s.carry >= 0) {
            drop(toys[s.carry], tmp.mouth)
            s.carry = -1
            yip()
          }
          s.mode = 'wait'
          s.timer = 0
        }
        break
      }
      case 'stuck': {
        s.timer += delta
        if (toy) face(toy.pos)
        if (s.timer > 0.9 && s.timer - delta <= 0.9) bark()
        if (s.timer > 2.2) {
          s.mode = 'wait'
          s.timer = 0
        }
        break
      }
      case 'wait': {
        s.timer += delta
        face(VIEWER)
        if (s.timer > PATIENCE) s.mode = 'bed'
        break
      }
      case 'bed': {
        const left = goTo(BED, WALK)
        moving = left > 0.02
        if (!moving) {
          let diff = REST_HEADING - s.heading
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          s.heading += diff * Math.min(1, delta * 4)
          if (Math.abs(diff) < 0.05) {
            s.lying = true
            s.mode = 'sleep'
          }
        }
        break
      }
      case 'sleep':
        break
    }

    // Carried toy sits in her mouth, crosswise.
    if (s.carry >= 0) {
      const c = toys[s.carry]
      c.pos.copy(tmp.mouth)
      c.spin.setFromAxisAngle(tmp.up, s.heading)
    }

    // Petting: hearts float up from her head while you hold or stroke her.
    if (petting.current) {
      s.happy = 1.2
      s.nextHeart -= delta
      if (s.nextHeart <= 0) {
        s.nextHeart = 0.22
        const free = heartState.current.findIndex((h) => h.age > 1.4)
        if (free >= 0) {
          const h = heartState.current[free]
          h.age = 0
          h.vel.set((Math.random() - 0.5) * 0.15, 0.32 + Math.random() * 0.1, (Math.random() - 0.5) * 0.15)
          hearts.current[free]?.position.copy(tmp.mouth).add(tmp.v.set(0, 0.12, 0))
        }
        if (Math.random() < 0.12) (s.mode === 'sleep' ? sigh : yip)()
      }
    }
    s.happy = Math.max(0, s.happy - delta)
    heartState.current.forEach((h, i) => {
      const sp = hearts.current[i]
      if (!sp) return
      h.age += delta
      sp.visible = h.age < 1.4
      if (!sp.visible) return
      sp.position.addScaledVector(h.vel, delta)
      sp.position.x += Math.sin((h.age + i) * 6) * 0.002
      const k = Math.min(1, h.age * 6)
      sp.scale.setScalar(0.07 * k)
      ;(sp.material as THREE.SpriteMaterial).opacity = Math.min(1, (1.4 - h.age) * 2)
    })

    // Pose and animation.
    const excited = s.mode === 'wait' || s.mode === 'stuck' || s.happy > 0
    if (dog.current) {
      dog.current.position.set(s.pos.x, s.lying ? 0.05 : 0, s.pos.z)
      dog.current.rotation.y = s.heading
    }
    if (body.current) body.current.position.y = s.lying ? -0.1 : moving ? Math.abs(Math.sin(s.phase)) * 0.015 : excited ? Math.abs(Math.sin(t * 9)) * 0.004 : 0
    if (head.current) {
      const dip = s.carry < 0 && s.mode === 'chase' && moving ? -0.12 : 0
      head.current.rotation.x = s.lying ? 0.15 + Math.sin(t * 0.8) * 0.03 : s.happy > 0 ? -0.25 : s.mode === 'stuck' ? -0.35 : dip
      // The classic head tilt while she waits for you.
      head.current.rotation.z = s.mode === 'wait' || s.happy > 0 ? Math.sin(t * 0.7) * 0.25 : 0
    }
    legs.current.forEach((leg, i) => {
      if (!leg) return
      // Lying down: front paws stretch forward, back legs tuck behind (a sphinx pose).
      const front = i < 2
      leg.position.y = s.lying ? 0.05 : LEG_Y
      leg.rotation.x = s.lying ? (front ? -1.45 : 1.45) : moving ? Math.sin(s.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 : 0
    })
    if (tail.current) {
      const fast = excited || s.carry >= 0
      tail.current.rotation.z = Math.sin(t * (s.lying && !s.happy ? 2 : fast ? 22 : 12)) * (s.lying && !s.happy ? 0.15 : fast ? 0.7 : 0.5)
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
      <group position={[BED.x, 0, BED.z]}>
        <DogBed />
      </group>

      {HEARTS_LIST.map((i) => (
        <sprite
          key={i}
          ref={(sp) => {
            hearts.current[i] = sp
          }}
          visible={false}
        >
          <spriteMaterial map={heartTexture()} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}

      {/* Mochi: press to pet her, or stroke her with the button held down */}
      <group
        ref={dog}
        {...props}
        onPointerDown={(e) => {
          e.stopPropagation()
          startPet()
        }}
        onPointerMove={(e) => {
          if (e.buttons && !petting.current && play.held < 0) startPet()
        }}
      >
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
            {/* Where a carried toy sits */}
            <group ref={mouthAt} position={[0, -0.056, 0.112]} />
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
