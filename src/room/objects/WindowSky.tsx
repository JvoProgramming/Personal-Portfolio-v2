import { useTexture } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { canvasTexture } from '../textures'
import type { Lighting } from '../time'
import { useInteractive } from '../interactive'
import { WINDOW, seeded } from '../layout'

const SKY_X = 5

// The view out the window is a 6 m wide picture 2 m behind the glass. Only a slice of it shows
// through the window (about 5%..41% across, 30%..60% down), so the city is drawn there.
const W = 2048
const H = 1024
const u = (f: number) => f * W
const v = (f: number) => f * H

interface Tower {
  x: number
  w: number
  top: number
  /** Stepped crown, like the US Bank Tower. */
  crown?: boolean
  spire?: boolean
}

/** Downtown LA's cluster of towers, left to right. */
const TOWERS: Tower[] = [
  { x: 0.13, w: 0.012, top: 0.47 },
  { x: 0.145, w: 0.016, top: 0.42 },
  { x: 0.163, w: 0.011, top: 0.45 },
  { x: 0.177, w: 0.018, top: 0.36, spire: true },
  { x: 0.198, w: 0.022, top: 0.33, crown: true },
  { x: 0.223, w: 0.014, top: 0.4 },
  { x: 0.24, w: 0.017, top: 0.38 },
  { x: 0.26, w: 0.012, top: 0.44 },
  { x: 0.275, w: 0.015, top: 0.41 },
  { x: 0.293, w: 0.01, top: 0.48 },
]
const GROUND = 0.56

function towerPath(ctx: CanvasRenderingContext2D, t: Tower) {
  const x0 = u(t.x - t.w / 2)
  const x1 = u(t.x + t.w / 2)
  const y = v(t.top)
  ctx.beginPath()
  if (t.crown) {
    // Rounded, stepped top.
    ctx.moveTo(x0, v(GROUND))
    ctx.lineTo(x0, y + 30)
    ctx.quadraticCurveTo(x0, y + 8, (x0 + x1) / 2 - 10, y + 4)
    ctx.lineTo((x0 + x1) / 2 - 10, y)
    ctx.lineTo((x0 + x1) / 2 + 10, y)
    ctx.quadraticCurveTo(x1, y + 4, x1, y + 30)
    ctx.lineTo(x1, v(GROUND))
  } else {
    ctx.rect(x0, y, x1 - x0, v(GROUND) - y)
  }
  ctx.fill()
  if (t.spire) ctx.fillRect((x0 + x1) / 2 - 2, y - 40, 4, 40)
}

/** Hills, downtown towers and palms, as one black silhouette (tinted by time of day). */
function skylineTexture() {
  return canvasTexture('skyline-la', W, H, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#000'
    // Hollywood Hills behind the city.
    ctx.beginPath()
    ctx.moveTo(0, v(0.6))
    ctx.bezierCurveTo(u(0.08), v(0.42), u(0.2), v(0.47), u(0.3), v(0.44))
    ctx.bezierCurveTo(u(0.36), v(0.4), u(0.42), v(0.45), u(0.5), v(0.5))
    ctx.bezierCurveTo(u(0.7), v(0.6), u(0.85), v(0.55), w, v(0.6))
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()
    for (const t of TOWERS) towerPath(ctx, t)
    // Low-rise city in front.
    for (let x = 0.02; x < 0.5; x += 0.006) ctx.fillRect(u(x), v(GROUND - 0.015 - Math.abs(Math.sin(x * 340)) * 0.02), u(0.006) + 1, v(0.1))
    const palm = (x: number, height: number) => {
      const base = v(0.62)
      ctx.lineWidth = 6
      ctx.strokeStyle = '#000'
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.quadraticCurveTo(x + 14, base - height / 2, x + 6, base - height)
      ctx.stroke()
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(x + 6, base - height)
        ctx.quadraticCurveTo(x + 6 + Math.cos(a) * 34, base - height - 18, x + 6 + Math.cos(a) * 60, base - height + 16 + Math.abs(Math.sin(a)) * 10)
        ctx.stroke()
      }
    }
    palm(u(0.09), 330)
    palm(u(0.33), 380)
    palm(u(0.37), 300)
  })
}

/** Things that glow: office windows and the Hollywood sign on the hill. */
function cityLightsTexture() {
  return canvasTexture('skyline-la-lights', W, H, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const rand = seeded(7)
    for (const t of TOWERS) {
      const x0 = u(t.x - t.w / 2) + 4
      const x1 = u(t.x + t.w / 2) - 4
      for (let y = v(t.top) + 14; y < v(GROUND) - 6; y += 9) {
        for (let x = x0; x < x1; x += 7) {
          if (rand() < 0.42) continue
          ctx.fillStyle = rand() < 0.8 ? '#ffd88a' : '#cfe6ff'
          ctx.fillRect(x, y, 4, 5)
        }
      }
      // Red aircraft light on top.
      ctx.fillStyle = '#ff4040'
      ctx.fillRect(u(t.x) - 3, v(t.top) - (t.spire ? 44 : 6), 6, 6)
    }
    // Street lights scattered over the low-rise city.
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rand() < 0.7 ? '#ffcf70' : '#ffffff'
      ctx.fillRect(u(0.02 + rand() * 0.46), v(GROUND - 0.02 + rand() * 0.06), 2, 2)
    }
    ctx.fillStyle = '#f4f1e8'
    ctx.font = 'bold 30px Arial, sans-serif'
    ctx.save()
    ctx.translate(u(0.335), v(0.425))
    ctx.rotate(-0.06)
    ctx.scale(1, 1.25)
    ctx.fillText('HOLLYWOOD', 0, 0)
    ctx.restore()
    void w
    void h
  })
}

/** At night the window shows a real photo of downtown LA ("L.A. Skyline 02" by JonDoeForty, CC BY 2.0). */
function NightPhoto({ opacity, z, y }: { opacity: number; z: number; y: number }) {
  const map = useTexture('/textures/la_night.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })
  return (
    <mesh position={[SKY_X - 0.3, y, z]} rotation={[0, -Math.PI / 2, 0]} renderOrder={1}>
      <planeGeometry args={[4.4, 4.4 / 2.565]} />
      <meshBasicMaterial map={map} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
    </mesh>
  )
}

export function WindowSky({ lighting }: { lighting: Lighting }) {
  const { z0, z1, y0, y1 } = WINDOW
  const wz = (z0 + z1) / 2
  const wy = (y0 + y1) / 2
  const interactive = useInteractive('obj.window')
  const skyline = skylineTexture()
  const lights = cityLightsTexture()
  const sunTarget = useMemo(() => new THREE.Object3D(), [])

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { top: { value: lighting.skyTop }, bottom: { value: lighting.skyBottom } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.2, 0.9, vUv.y)), 1.0); }',
        toneMapped: false,
      }),
    [lighting],
  )

  const isNight = lighting.phase === 'night'
  // Sun or moon height on the sky plane, from the real elevation.
  const discY = wy - 0.4 + Math.max(-0.6, Math.min(1.4, (isNight ? 35 : lighting.elevation) / 30))
  const discZ = wz + (lighting.morning ? -0.9 : 0.9)
  const silhouette = useMemo(() => new THREE.Color(isNight ? '#05070f' : lighting.phase === 'day' ? '#2c4a33' : '#2a1a2e'), [isNight, lighting.phase])

  // Sunlight shines in through the window and lands on the floor.
  const elev = THREE.MathUtils.clamp(lighting.elevation, 12, 55)
  const sunPos: [number, number, number] = [8, 1.5 + Math.tan((elev * Math.PI) / 180) * 7, wz + (lighting.morning ? -2.5 : 2.5)]

  return (
    <group>
      <mesh position={[SKY_X, wy, wz]} rotation={[0, -Math.PI / 2, 0]} material={skyMaterial}>
        <planeGeometry args={[8, 6]} />
      </mesh>
      <mesh position={[SKY_X - 0.05, discY, discZ]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[isNight ? 0.18 : 0.25, 32]} />
        <meshBasicMaterial color={isNight ? '#f4f1d0' : lighting.phase === 'day' ? '#fffbe8' : '#ffb070'} toneMapped={false} />
      </mesh>
      <mesh position={[SKY_X - 0.1, wy - 0.62, wz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={skyline} color={silhouette} transparent toneMapped={false} />
      </mesh>
      {/* City lights come on at dusk; the sign is always there */}
      <mesh position={[SKY_X - 0.12, wy - 0.62, wz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={lights} transparent opacity={isNight ? 1 : lighting.phase === 'day' ? 0.15 : 0.8} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Real skyline photo after dark, over the drawn one */}
      {lighting.phase !== 'day' && (
        <Suspense fallback={null}>
          <NightPhoto opacity={isNight ? 1 : 0.75} z={wz - 1.6} y={wy - 0.1} />
        </Suspense>
      )}
      {/* Faint glass, for hover */}
      <mesh position={[3.0, wy, wz]} rotation={[0, -Math.PI / 2, 0]} {...interactive.props}>
        <planeGeometry args={[z1 - z0, y1 - y0]} />
        <meshStandardMaterial color="#cfe6ff" transparent opacity={0.06} roughness={0} />
      </mesh>
      <primitive object={sunTarget} position={[0, 0, wz]} />
      <directionalLight
        position={sunPos}
        target={sunTarget}
        color={lighting.sunColor}
        intensity={lighting.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />
    </group>
  )
}
