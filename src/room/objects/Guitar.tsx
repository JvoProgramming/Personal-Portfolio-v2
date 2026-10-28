import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useOs } from '../../os/store'
import { useInteractive } from '../interactive'
import { ROOM } from '../layout'
import { useRoom } from '../roomStore'
import { Model } from '../Model'

// A plastic rhythm-game guitar controller, modeled on the classic SG-shaped one:
// glossy red body with a white pickguard, five colored fret buttons, strum bar, whammy bar.

const FRETS = ['#2ecc40', '#ff4136', '#ffdc00', '#1e7bff', '#ff851b']

/** SG-style body outline with two pointed horns, in meters, bottom at y = 0. */
function bodyShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.1, 0, 0.155, 0.03, 0.155, 0.1)
  s.bezierCurveTo(0.155, 0.17, 0.13, 0.2, 0.125, 0.24)
  s.bezierCurveTo(0.12, 0.29, 0.14, 0.33, 0.135, 0.37)
  s.bezierCurveTo(0.11, 0.35, 0.08, 0.3, 0.035, 0.31)
  s.lineTo(-0.035, 0.31)
  s.bezierCurveTo(-0.07, 0.3, -0.09, 0.32, -0.115, 0.345)
  s.bezierCurveTo(-0.125, 0.3, -0.11, 0.27, -0.118, 0.235)
  s.bezierCurveTo(-0.125, 0.2, -0.155, 0.17, -0.155, 0.1)
  s.bezierCurveTo(-0.155, 0.03, -0.1, 0, 0, 0)
  return s
}

function pickguardShape() {
  const s = new THREE.Shape()
  s.moveTo(0.02, 0.06)
  s.bezierCurveTo(0.09, 0.05, 0.12, 0.09, 0.115, 0.14)
  s.bezierCurveTo(0.11, 0.2, 0.09, 0.24, 0.05, 0.27)
  s.lineTo(-0.03, 0.29)
  s.bezierCurveTo(-0.07, 0.25, -0.06, 0.18, -0.04, 0.12)
  s.bezierCurveTo(-0.03, 0.08, -0.01, 0.065, 0.02, 0.06)
  // Hole for the strum bar.
  const hole = new THREE.Path()
  hole.moveTo(-0.045, 0.14)
  hole.lineTo(0.075, 0.14)
  hole.quadraticCurveTo(0.09, 0.155, 0.075, 0.17)
  hole.lineTo(-0.045, 0.17)
  hole.quadraticCurveTo(-0.06, 0.155, -0.045, 0.14)
  s.holes.push(hole)
  return s
}

function headstockShape() {
  const s = new THREE.Shape()
  s.moveTo(-0.028, 0)
  s.lineTo(0.028, 0)
  s.bezierCurveTo(0.05, 0.04, 0.05, 0.1, 0.035, 0.14)
  s.lineTo(-0.035, 0.15)
  s.bezierCurveTo(-0.05, 0.1, -0.045, 0.04, -0.028, 0)
  return s
}

export function GuitarController() {
  const powerOn = useRoom((s) => s.powerOn)
  const { props } = useInteractive('obj.guitar', () => {
    useOs.getState().setPendingApp({ appId: 'arcade', options: { props: { game: 'rhythm' } } })
    powerOn()
  })

  const parts = useMemo(() => {
    const depth = 0.038
    const body = new THREE.ExtrudeGeometry(bodyShape(), { depth, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.007, bevelSegments: 4, curveSegments: 32 })
    body.translate(0, 0, -depth / 2)
    const guard = new THREE.ExtrudeGeometry(pickguardShape(), { depth: 0.003, bevelEnabled: false, curveSegments: 24 })
    const head = new THREE.ExtrudeGeometry(headstockShape(), { depth: 0.016, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 16 })
    head.translate(0, 0, -0.008)
    const neck = new RoundedBoxGeometry(0.052, 0.56, 0.026, 3, 0.008)
    const fret = new RoundedBoxGeometry(0.04, 0.03, 0.014, 3, 0.005)
    const strum = new RoundedBoxGeometry(0.12, 0.022, 0.024, 4, 0.01)
    const whammy = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.08, 0.075, 0.03), new THREE.Vector3(0.1, 0.06, 0.05), new THREE.Vector3(0.14, 0.02, 0.06), new THREE.Vector3(0.18, -0.03, 0.055)]),
      20,
      0.0045,
      8,
    )
    return { body, guard, head, neck, fret, strum, whammy }
  }, [])

  const mats = useMemo(
    () => ({
      red: new THREE.MeshPhysicalMaterial({ color: '#c8102e', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
      white: new THREE.MeshPhysicalMaterial({ color: '#f4f2ec', roughness: 0.35, clearcoat: 0.6 }),
      black: new THREE.MeshPhysicalMaterial({ color: '#111114', roughness: 0.4, clearcoat: 0.5 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#e4e6ea', metalness: 1, roughness: 0.15 }),
      gray: new THREE.MeshStandardMaterial({ color: '#8a8d93', roughness: 0.5 }),
      frets: FRETS.map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 1, emissive: c, emissiveIntensity: 0.15 })),
    }),
    [],
  )
  const front = 0.019 + 0.007

  return (
    <group position={[1.35, 0.015, -ROOM.halfD + 0.17]} rotation={[0.16, -0.3, 0.1]} {...props}>
      <Model
        url="/models/guitar_hero_controller.glb"
        fit={{ longest: 0.98 }}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        order="ZYX"
        fallback={
          <>
            <group scale={1.3}>
            <mesh geometry={parts.body} material={mats.red} castShadow receiveShadow />
            <mesh geometry={parts.guard} material={mats.white} position={[0, 0, front]} castShadow />
            {/* Strum bar sits in the pickguard's slot */}
            <mesh geometry={parts.strum} material={mats.white} position={[0.015, 0.155, front + 0.006]} castShadow />
            <mesh geometry={parts.whammy} material={mats.chrome} position={[0, 0, front - 0.03]} castShadow />
            <mesh material={mats.chrome} position={[0.08, 0.075, front + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
            </mesh>
            {/* Start / select and volume knobs */}
            {[
              [-0.075, 0.11],
              [-0.095, 0.075],
            ].map(([x, y]) => (
              <mesh key={x} material={mats.black} position={[x, y, front + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.011, 0.012, 0.012, 20]} />
              </mesh>
            ))}
            <mesh material={mats.gray} position={[0.04, 0.215, front + 0.003]}>
              <boxGeometry args={[0.05, 0.012, 0.006]} />
            </mesh>
            </group>
            {/* Neck, fretboard, buttons, headstock */}
            <group position={[0, 0.08, 0]}>
            <mesh geometry={parts.neck} material={mats.black} position={[0, 0.58, 0]} castShadow />
            {[0.34, 0.42, 0.5, 0.58, 0.66].map((y) => (
              <mesh key={y} material={mats.gray} position={[0, y, 0.0135]}>
                <boxGeometry args={[0.05, 0.002, 0.001]} />
              </mesh>
            ))}
            {FRETS.map((_, i) => (
              <mesh key={i} geometry={parts.fret} material={mats.frets[i]} position={[0, 0.83 - i * 0.036, 0.016]} castShadow />
            ))}
            <mesh geometry={parts.head} material={mats.red} position={[0, 0.855, 0]} rotation={[-0.12, 0, 0]} castShadow />
            <mesh material={mats.white} position={[0, 0.94, 0.012]}>
              <boxGeometry args={[0.03, 0.03, 0.002]} />
            </mesh>
            </group>
          </>
        }
      />
    </group>
  )
}
