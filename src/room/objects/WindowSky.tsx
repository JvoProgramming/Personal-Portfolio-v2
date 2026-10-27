import { useMemo } from 'react'
import * as THREE from 'three'
import { canvasTexture } from '../textures'
import type { Lighting } from '../time'
import { useInteractive } from '../interactive'
import { WINDOW } from '../layout'

const SKY_X = 5

/** Palm tree and hill silhouettes for the view outside. */
function skylineTexture() {
  return canvasTexture('skyline', 1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.bezierCurveTo(w * 0.2, h * 0.62, w * 0.45, h * 0.7, w * 0.6, h * 0.66)
    ctx.bezierCurveTo(w * 0.8, h * 0.6, w * 0.9, h * 0.72, w, h * 0.7)
    ctx.lineTo(w, h)
    ctx.fill()
    const palm = (x: number, height: number) => {
      ctx.lineWidth = 7
      ctx.strokeStyle = '#000'
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.quadraticCurveTo(x + 18, h - height / 2, x + 8, h - height)
      ctx.stroke()
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(x + 8, h - height)
        ctx.quadraticCurveTo(x + 8 + Math.cos(a) * 40, h - height - 20, x + 8 + Math.cos(a) * 70, h - height + 18 + Math.abs(Math.sin(a)) * 10)
        ctx.stroke()
      }
    }
    palm(w * 0.32, 300)
    palm(w * 0.45, 360)
    palm(w * 0.7, 280)
  })
}

export function WindowSky({ lighting }: { lighting: Lighting }) {
  const { z0, z1, y0, y1 } = WINDOW
  const wz = (z0 + z1) / 2
  const wy = (y0 + y1) / 2
  const interactive = useInteractive('obj.window')
  const skyline = skylineTexture()
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
      <mesh position={[SKY_X - 0.1, wy - 0.9, wz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={skyline} color={silhouette} transparent toneMapped={false} />
      </mesh>
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
