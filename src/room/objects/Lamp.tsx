import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { useRoom } from '../roomStore'
import { DESK } from '../layout'
import { Model } from '../Model'

type V3 = [number, number, number]

/** A cylinder stretched between two points. */
function Rod({ a, b, r, material }: { a: V3; b: V3; r: number; material: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    return {
      position: va.clone().add(vb).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
      length: dir.length(),
    }
  }, [a, b])
  return (
    <mesh position={position} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[r, r, length, 10]} />
    </mesh>
  )
}

/** A coil spring between two points. */
function Spring({ a, b, material }: { a: V3; b: V3; material: THREE.Material }) {
  const geometry = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const axis = vb.clone().sub(va)
    const len = axis.length()
    axis.normalize()
    const side = new THREE.Vector3(0, 0, 1).cross(axis).normalize()
    const up = axis.clone().cross(side)
    const pts: THREE.Vector3[] = []
    const turns = 22
    for (let i = 0; i <= turns * 12; i++) {
      const t = i / (turns * 12)
      const ang = t * turns * Math.PI * 2
      pts.push(va.clone().addScaledVector(axis, t * len).addScaledVector(side, Math.cos(ang) * 0.006).addScaledVector(up, Math.sin(ang) * 0.006))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length, 0.0012, 4)
  }, [a, b])
  return <mesh geometry={geometry} material={material} />
}

const AT = { x: -0.68, y: DESK.y, z: DESK.z - 0.12 }
// Joints of the articulated arm.
const base: V3 = [AT.x, AT.y + 0.045, AT.z]
const elbow: V3 = [AT.x + 0.02, AT.y + 0.32, AT.z - 0.03]
const head: V3 = [AT.x + 0.17, AT.y + 0.5, AT.z + 0.07]

/** Turns the downloaded lamp so its head points at the keyboard. */
const LAMP_TURN = 0

export function Lamp() {
  const lampOn = useRoom((s) => s.lampOn)
  const toggleLamp = useRoom((s) => s.toggleLamp)
  const { props } = useInteractive('obj.lamp', toggleLamp)
  const target = useMemo(() => new THREE.Object3D(), [])
  const { x, y, z } = AT

  const mats = useMemo(
    () => ({
      paint: new THREE.MeshPhysicalMaterial({ color: '#1e7d4a', roughness: 0.35, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2, side: THREE.DoubleSide }),
      inside: new THREE.MeshStandardMaterial({ color: '#f3efe4', roughness: 0.6, side: THREE.BackSide }),
      steel: new THREE.MeshStandardMaterial({ color: '#c7cbd1', metalness: 1, roughness: 0.25 }),
      dark: new THREE.MeshStandardMaterial({ color: '#202124', metalness: 0.6, roughness: 0.35 }),
    }),
    [],
  )
  const baseGeo = useMemo(() => {
    const pts = [
      [0, 0],
      [0.095, 0],
      [0.1, 0.006],
      [0.098, 0.016],
      [0.07, 0.026],
      [0.03, 0.03],
      [0.022, 0.045],
      [0, 0.046],
    ].map(([r, h]) => new THREE.Vector2(r, h))
    return new THREE.LatheGeometry(pts, 40)
  }, [])
  // Bell-shaped shade with a rolled rim; its opening faces -y.
  const shadeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new THREE.Vector2(0.028 + Math.pow(t, 1.6) * 0.085, 0.07 - t * 0.14))
    }
    pts.push(new THREE.Vector2(0.116, -0.074))
    return new THREE.LatheGeometry(pts, 48)
  }, [])
  const shadeQuat = useMemo(() => {
    const dir = new THREE.Vector3(x + 0.35, y, z + 0.25).sub(new THREE.Vector3(...head)).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
  }, [x, y, z])
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])
  bulbMat.color.set(lampOn ? '#fff1c4' : '#77705e')
  // The downloaded lamp's bulb is the "Ceramic" material; make it glow while the lamp is on.
  const modelBulb = useRef<THREE.MeshStandardMaterial | null>(null)
  const paintBulb = (m: THREE.MeshStandardMaterial, on: boolean) => {
    m.emissive.set(on ? '#ffe6a8' : '#000000')
    m.emissiveIntensity = on ? 2.2 : 0
  }
  const onLampModel = useCallback((root: THREE.Group) => {
    root.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (mat?.name === 'Ceramic') {
        const glow = mat.clone()
        glow.toneMapped = false
        ;(o as THREE.Mesh).material = glow
        modelBulb.current = glow
        paintBulb(glow, useRoom.getState().lampOn)
      }
    })
  }, [])
  useEffect(() => {
    if (modelBulb.current) paintBulb(modelBulb.current, lampOn)
  }, [lampOn])

  return (
    <group {...props}>
      <Model
        url="/models/desk_lamp.glb"
        fit={{ height: 0.56 }}
        position={[x, y, z]}
        rotation={[0, LAMP_TURN, 0]}
        onReady={onLampModel}
        fallback={
          <>
          <mesh geometry={baseGeo} position={[x, y, z]} material={mats.paint} castShadow receiveShadow />
          {/* On/off switch on the base */}
          <mesh position={[x + 0.05, y + 0.026, z + 0.03]} rotation={[0, 0.5, 0]} material={mats.dark}>
            <boxGeometry args={[0.018, 0.008, 0.012]} />
          </mesh>
          {/* Lower and upper arms: twin rods with tension springs, joined by knuckles */}
          {[-0.008, 0.008].map((o) => (
            <group key={o}>
              <Rod a={[base[0] + o, base[1], base[2]]} b={[elbow[0] + o, elbow[1], elbow[2]]} r={0.0045} material={mats.paint} />
              <Rod a={[elbow[0] + o, elbow[1], elbow[2]]} b={[head[0] + o, head[1], head[2]]} r={0.0045} material={mats.paint} />
            </group>
          ))}
          <Spring a={[base[0] - 0.02, base[1] + 0.03, base[2]]} b={[elbow[0] - 0.02, elbow[1] - 0.08, elbow[2]]} material={mats.steel} />
          <Spring a={[elbow[0] - 0.012, elbow[1] + 0.02, elbow[2] + 0.01]} b={[head[0] - 0.05, head[1] - 0.02, head[2] - 0.03]} material={mats.steel} />
          {[base, elbow, head].map((p, i) => (
            <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} material={mats.steel} castShadow>
              <cylinderGeometry args={[0.009, 0.009, 0.03, 16]} />
            </mesh>
          ))}
          {/* Shade, bulb and a cord trailing off the back */}
          <group position={head} quaternion={shadeQuat}>
            <mesh geometry={shadeGeo} position={[0, -0.05, 0]} material={mats.paint} castShadow />
            <mesh geometry={shadeGeo} position={[0, -0.05, 0]} material={mats.inside} />
            <mesh position={[0, -0.0, 0]} material={mats.dark}>
              <cylinderGeometry args={[0.016, 0.02, 0.04, 16]} />
            </mesh>
            <mesh position={[0, -0.075, 0]} material={bulbMat}>
              <sphereGeometry args={[0.032, 20, 16]} />
            </mesh>
          </group>
          </>
        }
      />
      <primitive object={target} position={[x + 0.35, y, z + 0.25]} />
      {/* Lights stay mounted (intensity 0 when off), so switching doesn't recompile every material. */}
      <spotLight
        position={[x + 0.2, y + 0.48, z + 0.1]}
        target={target}
        angle={1.0}
        penumbra={0.7}
        intensity={lampOn ? 6 : 0}
        distance={4}
        color="#ffc777"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.001}
      />
      <pointLight position={[x + 0.2, y + 0.55, z + 0.1]} intensity={lampOn ? 1.2 : 0} distance={3.5} color="#ffbe6b" />
    </group>
  )
}
