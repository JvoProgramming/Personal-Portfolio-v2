import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useInteractive } from '../interactive'
import { deform, grainNormal, strandNormal, weaveNormal } from '../materials'

// Measurements (meters). The seat's front faces -z (toward the desk); the backrest is at +z.
const SEAT_Y = 0.48
const SEAT = { w: 0.5, d: 0.47, t: 0.09 }
const BACK = { w: 0.46, h: 0.56, t: 0.075 }
const BACK_Z = 0.25
const BACK_Y = SEAT_Y + 0.12
const RECLINE = 0.16 // radians, top of the backrest leans away from the seat

/** A contoured seat cushion: rounded box with a dished top and a rolled "waterfall" front edge. */
function seatGeometry() {
  const g = new RoundedBoxGeometry(SEAT.w, SEAT.t, SEAT.d, 6, 0.035)
  const hw = SEAT.w / 2
  const hd = SEAT.d / 2
  return deform(g, (v) => {
    if (v.y > 0) {
      const nx = v.x / hw
      const nz = v.z / hd
      v.y -= 0.018 * (1 - nx * nx) * (1 - nz * nz) // sit dip
      v.y += 0.012 * nx * nx // raised side bolsters
    }
    if (v.z < -hd * 0.6) v.y -= ((-v.z - hd * 0.6) / (hd * 0.4)) ** 2 * 0.02 // waterfall front
  })
}

/** Backrest that wraps around you and bulges at the lower back. */
function backGeometry() {
  const g = new RoundedBoxGeometry(BACK.w, BACK.h, BACK.t, 6, 0.03)
  const hw = BACK.w / 2
  return deform(g, (v) => {
    const nx = v.x / hw
    const ny = v.y / (BACK.h / 2)
    v.z -= nx * nx * 0.05 // wraps around the sitter (who is on the -z side)
    v.z -= Math.exp(-((ny + 0.35) ** 2) * 6) * 0.022 // lumbar bulge
    v.x *= 1 - (ny + 1) * 0.04 // slightly narrower at the top
  })
}

/** A hoodie thrown over the top of the backrest, hanging down the back with the sleeves dangling. */
function HoodieDrape() {
  const geometry = useMemo(() => {
    // u runs across the hoodie, v runs from the front lip, over the top, down the back.
    const g = new THREE.PlaneGeometry(1, 1, 24, 30)
    const pos = g.attributes.position as THREE.BufferAttribute
    const top = BACK.h / 2
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) // -0.5..0.5
      const v = pos.getY(i) + 0.5 // 0..1
      const x = u * 0.4
      const wave = Math.sin(u * 22 + v * 5) * 0.006 + Math.sin(u * 9) * 0.004
      let y: number
      let z: number
      if (v < 0.18) {
        // Short lip over the front.
        const a = v / 0.18
        y = top - 0.06 + a * 0.06
        z = -BACK.t / 2 - 0.012 + a * 0.004
      } else if (v < 0.32) {
        // Over the rounded top edge.
        const a = ((v - 0.18) / 0.14) * Math.PI
        y = top + Math.sin(a) * 0.018 + 0.004
        z = -Math.cos(a) * (BACK.t / 2 + 0.012)
      } else {
        // Down the back, bunching outward a little near the bottom.
        const a = (v - 0.32) / 0.68
        y = top - a * 0.34
        z = BACK.t / 2 + 0.012 + a * a * 0.03 + Math.abs(wave) * 2
      }
      pos.setXYZ(i, x * (1 + (v > 0.32 ? (v - 0.32) * 0.25 : 0)), y, z + wave)
    }
    g.computeVertexNormals()
    return g
  }, [])

  const sleeve = useMemo(
    () =>
      [-1, 1].map(
        (s) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(s * 0.15, BACK.h / 2 - 0.01, BACK.t / 2 + 0.025),
              new THREE.Vector3(s * 0.19, BACK.h / 2 - 0.12, BACK.t / 2 + 0.05),
              new THREE.Vector3(s * 0.2, BACK.h / 2 - 0.3, BACK.t / 2 + 0.045),
              new THREE.Vector3(s * 0.185, BACK.h / 2 - 0.44, BACK.t / 2 + 0.06),
            ]),
            24,
            0.028,
            10,
          ),
      ),
    [],
  )

  const fabric = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#8b1e2d',
        roughness: 0.95,
        sheen: 0.35,
        sheenColor: new THREE.Color('#d66a6a'),
        sheenRoughness: 0.6,
        normalMap: strandNormal(4, 1800),
        normalScale: new THREE.Vector2(0.4, 0.4),
        side: THREE.DoubleSide,
      }),
    [],
  )

  return (
    <group>
      <mesh geometry={geometry} material={fabric} castShadow receiveShadow />
      {sleeve.map((g, i) => (
        <mesh key={i} geometry={g} material={fabric} castShadow />
      ))}
      {/* Cuffs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.185, BACK.h / 2 - 0.455, BACK.t / 2 + 0.06]} material={fabric}>
          <cylinderGeometry args={[0.032, 0.032, 0.04, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** One leg of the five-star base: tapered, sloping down to a twin-wheel caster. */
function BaseLeg({ angle, metal, plastic }: { angle: number; metal: THREE.Material; plastic: THREE.Material }) {
  const leg = useMemo(() => {
    const g = new RoundedBoxGeometry(0.3, 0.035, 0.05, 3, 0.012)
    return deform(g, (v) => {
      const t = (v.x + 0.15) / 0.3 // 0 at hub, 1 at tip
      v.z *= 1 - t * 0.35
      v.y *= 1 - t * 0.3
      v.y -= t * 0.035 // slope down
    })
  }, [])
  return (
    <group rotation={[0, angle, 0]}>
      <mesh geometry={leg} material={metal} position={[0.17, 0.09, 0]} castShadow receiveShadow />
      {/* Caster: swivel stem, fork and two wheels */}
      <group position={[0.31, 0, 0]}>
        <mesh position={[0, 0.06, 0]} material={metal}>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
        </mesh>
        <mesh position={[-0.012, 0.042, 0]} material={plastic} castShadow>
          <boxGeometry args={[0.045, 0.012, 0.05]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-0.02, 0.026, s * 0.014]} rotation={[Math.PI / 2, 0, 0]} material={plastic} castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.014, 18]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Office chair you can grab and spin; it keeps spinning a little after you let go. */
export function Chair() {
  const spinner = useRef<THREE.Group>(null)
  const drag = useRef<{ x: number; last: number; v: number } | null>(null)
  const velocity = useRef(0)
  const { props } = useInteractive('obj.chair', undefined, 'grab')

  const mats = useMemo(() => {
    const fabric = new THREE.MeshPhysicalMaterial({
      color: '#2b2e3b',
      roughness: 0.9,
      sheen: 0.5,
      sheenColor: new THREE.Color('#6a7090'),
      normalMap: weaveNormal(10),
      normalScale: new THREE.Vector2(0.6, 0.6),
    })
    const plastic = new THREE.MeshStandardMaterial({ color: '#17181c', roughness: 0.45, normalMap: grainNormal(3), normalScale: new THREE.Vector2(0.15, 0.15) })
    const metal = new THREE.MeshStandardMaterial({ color: '#2a2b30', metalness: 0.7, roughness: 0.35 })
    const chrome = new THREE.MeshStandardMaterial({ color: '#d8dbe0', metalness: 1, roughness: 0.15 })
    return { fabric, plastic, metal, chrome }
  }, [])
  const seat = useMemo(() => seatGeometry(), [])
  const back = useMemo(() => backGeometry(), [])
  // Dust cover over the gas lift: a ribbed sleeve.
  const bellows = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) pts.push(new THREE.Vector2(0.032 + (i % 2) * 0.004, 0.12 + (i / 24) * 0.12))
    return new THREE.LatheGeometry(pts, 20)
  }, [])
  // Curved steel spine from under the seat up to the backrest.
  const spine = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, SEAT_Y - 0.05, 0.05),
          new THREE.Vector3(0, SEAT_Y - 0.06, 0.2),
          new THREE.Vector3(0, SEAT_Y + 0.02, 0.27),
          new THREE.Vector3(0, BACK_Y + 0.12, 0.29),
        ]),
        24,
        0.016,
        8,
      ),
    [],
  )

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

  // Pushed back from the desk and turned toward you, so it doesn't hide the monitor.
  return (
    <group position={[0.42, 0, -1.02]}>
      {/* Five-star base */}
      {[0, 1, 2, 3, 4].map((i) => (
        <BaseLeg key={i} angle={(i / 5) * Math.PI * 2 + 0.3} metal={mats.metal} plastic={mats.plastic} />
      ))}
      <mesh position={[0, 0.1, 0]} material={mats.metal} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.05, 20]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={mats.chrome} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.36, 16]} />
      </mesh>
      <mesh geometry={bellows} material={mats.plastic} castShadow />
      {/* Spinning top part */}
      <group ref={spinner} rotation={[0, -0.75, 0]} {...props} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        {/* Tilt mechanism and lever */}
        <mesh position={[0, SEAT_Y - 0.07, 0]} material={mats.metal} castShadow>
          <boxGeometry args={[0.2, 0.04, 0.22]} />
        </mesh>
        <mesh position={[0.15, SEAT_Y - 0.075, -0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 8]} />
        </mesh>
        <mesh position={[0.21, SEAT_Y - 0.075, -0.06]} material={mats.plastic}>
          <sphereGeometry args={[0.013, 12, 10]} />
        </mesh>
        {/* Seat: plastic shell under a cushion */}
        <mesh position={[0, SEAT_Y - 0.035, 0]} material={mats.plastic} castShadow>
          <boxGeometry args={[SEAT.w - 0.04, 0.02, SEAT.d - 0.04]} />
        </mesh>
        <mesh geometry={seat} material={mats.fabric} position={[0, SEAT_Y + 0.015, 0]} castShadow receiveShadow />
        {/* Backrest on its spine, reclined slightly away from the seat */}
        <mesh geometry={spine} material={mats.metal} castShadow />
        <group position={[0, BACK_Y + BACK.h / 2, BACK_Z]} rotation={[RECLINE, 0, 0]}>
          <mesh geometry={back} material={mats.fabric} castShadow receiveShadow />
          <HoodieDrape />
        </group>
        {/* Armrests: posts with soft pads */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.27, 0, 0.02]}>
            <mesh position={[0, SEAT_Y - 0.04, 0.04]} material={mats.plastic} castShadow>
              <boxGeometry args={[0.03, 0.02, 0.14]} />
            </mesh>
            <mesh position={[0, SEAT_Y + 0.08, 0.06]} material={mats.plastic} castShadow>
              <boxGeometry args={[0.03, 0.24, 0.05]} />
            </mesh>
            <mesh position={[0, SEAT_Y + 0.21, 0.02]} material={mats.plastic} castShadow geometry={ARM_PAD} />
          </group>
        ))}
      </group>
    </group>
  )
}

const ARM_PAD = new RoundedBoxGeometry(0.07, 0.03, 0.25, 4, 0.014)
