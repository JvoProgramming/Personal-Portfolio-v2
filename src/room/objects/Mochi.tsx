import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { useRoom } from '../roomStore'

const BED = new THREE.Vector3(-1.75, 0, -0.75)
const REST_HEADING = 0.9
const SPEED = 0.8
const MOUTH = 0.3

type Task = { kind: 'walk'; to: THREE.Vector3 } | { kind: 'pickup' } | { kind: 'drop' } | { kind: 'lie' }

const FUR = '#e2b47a'
const CREAM = '#f6e7cf'

function Bone(props: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.13, 8]} />
        <meshStandardMaterial color="#f3ecdc" />
      </mesh>
      {[-0.065, 0.065].map((x) =>
        [-0.014, 0.014].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0, z]} castShadow>
            <sphereGeometry args={[0.019, 10, 8]} />
            <meshStandardMaterial color="#f3ecdc" />
          </mesh>
        )),
      )}
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
  const tail = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Mesh | null)[]>([])
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
      leg.scale.y = s.lying ? 0.15 : 1
      leg.rotation.x = moving ? Math.sin(s.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 : 0
    })
    if (tail.current) tail.current.rotation.z = Math.sin(t * (s.lying ? 2 : 12)) * (s.lying ? 0.15 : 0.6)
    if (carriedBone.current) carriedBone.current.visible = s.carrying
    if (floorBone.current) {
      floorBone.current.visible = !s.carrying
      floorBone.current.position.set(s.bone.x, 0.02, s.bone.z)
    }
  })

  return (
    <group>
      {/* Dog bed */}
      <group position={[BED.x, 0, BED.z]} {...props}>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[0.3, 0.08, 14, 32]} />
          <meshStandardMaterial color="#b85c5c" roughness={1} />
        </mesh>
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#f0dcc0" roughness={1} />
        </mesh>
      </group>

      <group ref={floorBone} {...props}>
        <Bone rotation={[0, 0.6, 0]} />
      </group>

      {/* Mochi */}
      <group ref={dog} {...props}>
        <group ref={body}>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.2, 8, 16]} />
            <meshStandardMaterial color={FUR} roughness={1} />
          </mesh>
          <mesh position={[0, 0.17, 0.1]} castShadow>
            <sphereGeometry args={[0.07, 14, 12]} />
            <meshStandardMaterial color={CREAM} roughness={1} />
          </mesh>
          <group ref={head} position={[0, 0.29, 0.17]}>
            <mesh castShadow>
              <sphereGeometry args={[0.085, 18, 14]} />
              <meshStandardMaterial color={FUR} roughness={1} />
            </mesh>
            <mesh position={[0, -0.025, 0.07]} scale={[1, 0.8, 1.2]}>
              <sphereGeometry args={[0.045, 14, 12]} />
              <meshStandardMaterial color={CREAM} roughness={1} />
            </mesh>
            <mesh position={[0, -0.01, 0.125]}>
              <sphereGeometry args={[0.014, 10, 8]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
            </mesh>
            {[-1, 1].map((x) => (
              <group key={x}>
                <mesh position={[x * 0.035, 0.025, 0.07]}>
                  <sphereGeometry args={[0.011, 10, 8]} />
                  <meshStandardMaterial color="#111" roughness={0.2} />
                </mesh>
                <mesh position={[x * 0.05, 0.085, -0.01]} rotation={[0, 0, -x * 0.25]} castShadow>
                  <coneGeometry args={[0.03, 0.07, 10]} />
                  <meshStandardMaterial color={FUR} roughness={1} />
                </mesh>
              </group>
            ))}
            <group ref={carriedBone} position={[0, -0.05, MOUTH - 0.17]} visible={false}>
              <Bone />
            </group>
          </group>
          <mesh ref={tail} position={[0, 0.27, -0.17]} rotation={[0.9, 0, 0]} castShadow>
            <torusGeometry args={[0.04, 0.016, 8, 12, Math.PI * 1.4]} />
            <meshStandardMaterial color={FUR} roughness={1} />
          </mesh>
        </group>
        {[
          [-0.05, 0.1],
          [0.05, 0.1],
          [-0.05, -0.1],
          [0.05, -0.1],
        ].map(([x, z], i) => (
          <mesh
            key={i}
            ref={(m) => {
              legs.current[i] = m
            }}
            position={[x, 0.07, z]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.018, 0.14, 8]} />
            <meshStandardMaterial color={FUR} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
