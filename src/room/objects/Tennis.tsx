import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useInteractive } from '../interactive'
import { ROOM } from '../layout'
import { grainNormal, strandNormal, tennisBallMap } from '../materials'
import { bake, cone, mixColor, union } from '../sdf'

const HEAD = { rx: 0.125, ry: 0.158 }

/** Overgrip wrapped in a spiral, painted on a canvas. */
function gripTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f1f1ee'
  ctx.fillRect(0, 0, 64, 256)
  ctx.strokeStyle = '#c9c9c3'
  ctx.lineWidth = 3
  for (let y = -64; y < 320; y += 22) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(64, y + 18)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** A modern racquet: oval frame with a bumper guard, open throat, strung bed, wrapped grip. */
function Racquet() {
  const strings = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => {
    const frameCurve = new THREE.EllipseCurve(0, 0, HEAD.rx, HEAD.ry, 0, Math.PI * 2, false, 0)
    const pts = frameCurve.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0))
    const frame = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.009, 10, true)
    frame.scale(1, 1, 1.5) // frames are deeper than they are wide
    const bumperPts = new THREE.EllipseCurve(0, 0, HEAD.rx + 0.006, HEAD.ry + 0.006, Math.PI * 0.2, Math.PI * 0.8, false, 0).getPoints(40).map((p) => new THREE.Vector3(p.x, p.y, 0))
    const bumper = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bumperPts), 40, 0.007, 8)
    const throat = [-1, 1].map(
      (s) =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(s * HEAD.rx * 0.72, -HEAD.ry * 0.7, 0),
            new THREE.Vector3(s * 0.04, -HEAD.ry - 0.04, 0),
            new THREE.Vector3(s * 0.012, -HEAD.ry - 0.1, 0),
          ]),
          24,
          0.009,
          8,
        ),
    )
    const bridge = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(-HEAD.rx * 0.6, -HEAD.ry * 0.82, 0), new THREE.Vector3(0, -HEAD.ry * 0.95, 0), new THREE.Vector3(HEAD.rx * 0.6, -HEAD.ry * 0.82, 0)]),
      20,
      0.006,
      8,
    )
    const shaft = new THREE.CylinderGeometry(0.014, 0.015, 0.06, 10)
    const grip = new THREE.CylinderGeometry(0.016, 0.016, 0.19, 8)
    const butt = new THREE.CylinderGeometry(0.019, 0.017, 0.014, 8)
    return { frame, bumper, throat, bridge, shaft, grip, butt }
  }, [])
  const grip = useMemo(() => gripTexture(), [])

  // 16 mains and 19 crosses, each cut to the inside of the oval.
  const lines = useMemo(() => {
    const list: { x: number; y: number; len: number; vertical: boolean }[] = []
    const ix = HEAD.rx - 0.008
    const iy = HEAD.ry - 0.008
    for (let i = 0; i < 16; i++) {
      const x = -ix + ((i + 0.5) / 16) * ix * 2
      list.push({ x, y: 0, len: 2 * iy * Math.sqrt(1 - (x / ix) ** 2), vertical: true })
    }
    for (let i = 0; i < 19; i++) {
      const y = -iy + ((i + 0.5) / 19) * iy * 2
      list.push({ x: 0, y, len: 2 * ix * Math.sqrt(1 - (y / iy) ** 2), vertical: false })
    }
    return list
  }, [])

  useLayoutEffect(() => {
    const mesh = strings.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const zRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
    lines.forEach((l, i) => {
      m.compose(new THREE.Vector3(l.x, l.y, 0), l.vertical ? q : zRot, new THREE.Vector3(1, l.len, 1))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [lines])

  const frameMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#16161a', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }), [])
  const accent = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#1565c0', roughness: 0.3, clearcoat: 1 }), [])
  const handleY = -HEAD.ry - 0.1

  return (
    <group>
      <mesh geometry={geo.frame} material={frameMat} castShadow />
      <mesh geometry={geo.bumper} material={accent} />
      {geo.throat.map((g, i) => (
        <mesh key={i} geometry={g} material={i ? accent : frameMat} castShadow />
      ))}
      <mesh geometry={geo.bridge} material={frameMat} />
      <instancedMesh ref={strings} args={[undefined, undefined, lines.length]}>
        <cylinderGeometry args={[0.0011, 0.0011, 1, 4]} />
        <meshStandardMaterial color="#f2efe2" roughness={0.6} />
      </instancedMesh>
      <mesh geometry={geo.shaft} material={frameMat} position={[0, handleY - 0.02, 0]} />
      <mesh geometry={geo.grip} position={[0, handleY - 0.145, 0]} castShadow>
        <meshStandardMaterial map={grip} roughness={0.85} />
      </mesh>
      <mesh geometry={geo.butt} material={frameMat} position={[0, handleY - 0.245, 0]} />
    </group>
  )
}

/** A three-racquet tennis bag lying along the wall: padded body, zippers, strap and handles. */
function TennisBag() {
  const body = useMemo(() => {
    const navy = new THREE.Color('#1d3557')
    const red = new THREE.Color('#d62839')
    const shape = union(0.05, cone([-0.3, 0.13, 0], [0.3, 0.13, 0], 0.13, 0.13))
    // Squash front-to-back and give it a flat bottom so it sits on the floor.
    return bake(
      (x, y, z) => Math.max(shape(x, y, z / 0.72) * 0.72, 0.004 - y),
      {
        center: [0, 0.13, 0],
        half: 0.46,
        resolution: 72,
        color: (p) => {
          const band = 1 - Math.abs(Math.abs(p.x) - 0.2) / 0.05
          return mixColor(navy, red, band * 3 - 1)
        },
      },
    )
  }, [])
  // Zipper runs along the top and curls down around both ends.
  const zipper = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const r = 0.128
    for (let i = 0; i <= 12; i++) {
      const a = 0.35 + (i / 12) * (Math.PI / 2 - 0.35)
      pts.push(new THREE.Vector3(-0.3 - Math.cos(a) * r, 0.13 + Math.sin(a) * r, 0.03))
    }
    for (let i = 12; i >= 0; i--) {
      const a = 0.35 + (i / 12) * (Math.PI / 2 - 0.35)
      pts.push(new THREE.Vector3(0.3 + Math.cos(a) * r, 0.13 + Math.sin(a) * r, 0.03))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.004, 6)
  }, [])
  const strap = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.26, 0.23, -0.04),
          new THREE.Vector3(-0.1, 0.27, -0.06),
          new THREE.Vector3(0.1, 0.27, -0.06),
          new THREE.Vector3(0.26, 0.23, -0.04),
          new THREE.Vector3(0.36, 0.06, 0.16),
          new THREE.Vector3(0.2, 0.01, 0.22),
        ]),
        60,
        0.012,
        6,
      ),
    [],
  )
  const handle = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(-0.08, 0.25, 0.02), new THREE.Vector3(-0.04, 0.31, 0.02), new THREE.Vector3(0.04, 0.31, 0.02), new THREE.Vector3(0.08, 0.25, 0.02)]),
        24,
        0.009,
        8,
      ),
    [],
  )
  const fabric = useMemo(
    () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.75, sheen: 0.3, sheenColor: new THREE.Color('#8fa4d0'), normalMap: grainNormal(6), normalScale: new THREE.Vector2(0.4, 0.4) }),
    [],
  )
  const black = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.7 }), [])
  return (
    <group>
      <mesh geometry={body} material={fabric} castShadow receiveShadow />
      <mesh geometry={zipper} material={black} />
      <mesh geometry={strap} material={black} castShadow />
      <mesh geometry={handle} material={black} castShadow />
      {/* Zipper pulls */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.27, 0.045]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.012, 0.03, 0.004]} />
          <meshStandardMaterial color="#c0c3c8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

function Ball({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <mesh position={position} rotation={[rotation, rotation * 1.7, 0]} castShadow>
      <sphereGeometry args={[0.033, 32, 24]} />
      <meshStandardMaterial map={tennisBallMap()} normalMap={strandNormal(2, 3000)} normalScale={[0.6, 0.6]} roughness={1} />
    </mesh>
  )
}

/** A can of balls by the bag, with one ball on top. */
function BallCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.037, 0.037, 0.22, 28, 1, true]} />
        <meshPhysicalMaterial color="#dfe9f2" transparent opacity={0.45} roughness={0.1} transmission={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.012, 28]} />
        <meshStandardMaterial color="#c0c3c8" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.224, 0]}>
        <cylinderGeometry args={[0.039, 0.039, 0.012, 28]} />
        <meshStandardMaterial color="#e63946" roughness={0.5} />
      </mesh>
      {[0.04, 0.11, 0.18].map((y) => (
        <Ball key={y} position={[0, y, 0]} rotation={y * 9} />
      ))}
    </group>
  )
}

export function TennisGear() {
  const { props } = useInteractive('obj.tennis')
  const balls: [number, number, number][] = [
    [-1.95, 0.033, -1.55],
    [-1.75, 0.033, -1.35],
    [-0.9, 0.033, -1.7],
    [0.9, 0.033, 0.4],
  ]
  return (
    <group {...props}>
      <group position={[-2.3, 0, -2.18]} rotation={[0, 0.05, 0]}>
        <TennisBag />
      </group>
      <BallCan position={[-2.72, 0, -1.92]} />
      {/* Racquet hanging on a hook by the desk */}
      <mesh position={[-1.2, 1.3, -ROOM.halfD + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.03, 8]} />
        <meshStandardMaterial color="#b8bcc2" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position={[-1.2, 1.13, -ROOM.halfD + 0.035]} rotation={[0, 0, 0.12]}>
        <Racquet />
      </group>
      {balls.map((p, i) => (
        <Ball key={i} position={p} rotation={i * 1.3} />
      ))}
    </group>
  )
}
