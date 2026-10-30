import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import type * as THREE from 'three'
import { useOs } from '../../os/store'
import { useInteractive } from '../interactive'
import { useRoom } from '../roomStore'
import { FRAME_PHOTOS, gameBoyScreen, photoTexture, posters, type FramePhoto } from '../textures'
import { DESK, ROOM } from '../layout'
import { Model, Upgrade } from '../Model'

type V3 = [number, number, number]

/** The art itself: a texture on a plane. */
function PosterArt({ map, size }: { map: THREE.Texture; size: [number, number] }) {
  return (
    <mesh position={[0, 0, 0.007]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.6} />
    </mesh>
  )
}

/** Official poster art (fan tribute; copyright belongs to the owners, see public/posters). */
function OfficialArt({ url, size }: { url: string; size: [number, number] }) {
  const map = useTexture(url, (t) => {
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
  })
  return <PosterArt map={map} size={size} />
}

/** A framed poster: official art streams in, with the drawn version shown until then (or if it fails). */
function Poster({ url, drawn, position, rotation = [0, 0, 0], size = [0.6, 0.9] }: { url: string; drawn: THREE.Texture; position: V3; rotation?: V3; size?: [number, number] }) {
  const { props } = useInteractive('obj.poster')
  return (
    <group position={position} rotation={rotation} {...props}>
      {/* Thin black frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size[0] + 0.03, size[1] + 0.03, 0.012]} />
        <meshStandardMaterial color="#141418" roughness={0.4} />
      </mesh>
      <Upgrade fallback={<PosterArt map={drawn} size={size} />}>
        <OfficialArt url={url} size={size} />
      </Upgrade>
    </group>
  )
}

export function Posters() {
  const back = -ROOM.halfD + 0.008
  const right = ROOM.halfW - 0.008
  return (
    <group>
      <Poster url="/posters/guitar_hero_3_cover.jpg" drawn={posters.rock()} position={[-2.55, 1.6, back]} size={[0.46, 0.69]} />
      <Poster url="/posters/spider_verse_into_poster.png" drawn={posters.spidey()} position={[-1.75, 1.55, back]} />
      <Poster url="/posters/attack_on_titan_manga_vol1.jpg" drawn={posters.titan()} position={[1.75, 1.6, back]} />
      <Poster url="/posters/invincible_comic_issue75.jpg" drawn={posters.invincible()} position={[right, 1.6, -2.22]} rotation={[0, -Math.PI / 2, 0]} size={[0.44, 0.68]} />
    </group>
  )
}

function Frame({ photo, position, rotation }: { photo: FramePhoto; position: [number, number, number]; rotation: [number, number, number] }) {
  const setModal = useRoom((s) => s.setModal)
  const { props } = useInteractive('obj.photos', () => setModal({ type: 'photo', id: photo.id }))
  return (
    <group position={position} rotation={rotation} {...props}>
      <mesh castShadow>
        <boxGeometry args={[0.17, 0.21, 0.015]} />
        <meshStandardMaterial color="#3a2a1d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[0.135, 0.17]} />
        <meshStandardMaterial map={photoTexture(photo)} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** A wall shelf above the desk holding the photo frames and a few books. */
export function Shelf() {
  const z = -ROOM.halfD + 0.12
  const y = 1.62
  return (
    <group>
      <mesh position={[0, y, z]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.03, 0.24]} />
        <meshStandardMaterial color="#e8e2d2" roughness={0.7} />
      </mesh>
      {FRAME_PHOTOS.map((p, i) => (
        <Frame key={p.id} photo={p} position={[-0.6 + i * 0.27, y + 0.12, z + (i % 2) * 0.03]} rotation={[-0.1, (i - 1.5) * 0.08, 0]} />
      ))}
      <group position={[0.6, y + 0.015, z]}>
        <Model
          url="/models/books_encyclopedia_set.glb"
          fit={{ width: 0.34 }}
          fallback={
            <group position={[-0.6, -0.015, 0]}>
              {['#6c3483', '#1f618d', '#b9770e', '#117a65', '#922b21'].map((c, i) => (
                <mesh key={c} position={[0.5 + i * 0.045, y + 0.1 + (i % 2) * 0.01, z]} rotation={[0, 0, i === 4 ? 0.25 : 0]} castShadow>
                  <boxGeometry args={[0.035, 0.18 + (i % 3) * 0.02, 0.15]} />
                  <meshStandardMaterial color={c} />
                </mesh>
              ))}
            </group>
          }
        />
      </group>
    </group>
  )
}

export function GameBoy() {
  const setModal = useRoom((s) => s.setModal)
  const { props } = useInteractive('obj.gameboy', () => setModal({ type: 'gameboy' }))
  return (
    <group position={[-0.32, DESK.y + 0.012, DESK.z + 0.27]} rotation={[-Math.PI / 2, 0, 0.35]} {...props}>
      {/* Model stands upright in its file; this group lays it flat on the desk, screen up. */}
      <Model
        url="/models/gameboy_original.glb"
        fit={{ height: 0.148 }}
        position={[0, -0.074, 0]}
        fallback={
          <>
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.14, 0.022]} />
            <meshStandardMaterial color="#c9c4bc" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.03, 0.012]}>
            <planeGeometry args={[0.07, 0.06]} />
            <meshStandardMaterial color="#555b6e" />
          </mesh>
          <mesh position={[0, 0.03, 0.013]}>
            <planeGeometry args={[0.05, 0.045]} />
            <meshStandardMaterial map={gameBoyScreen()} emissiveMap={gameBoyScreen()} emissive="#ffffff" emissiveIntensity={0.25} />
          </mesh>
          {[
            [0.022, -0.035, '#8b1a4a'],
            [0.035, -0.025, '#8b1a4a'],
          ].map(([x, y, c]) => (
            <mesh key={String(x)} position={[x as number, y as number, 0.013]}>
              <circleGeometry args={[0.008, 12]} />
              <meshStandardMaterial color={c as string} />
            </mesh>
          ))}
          <mesh position={[-0.025, -0.03, 0.013]}>
            <planeGeometry args={[0.025, 0.008]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[-0.025, -0.03, 0.0131]}>
            <planeGeometry args={[0.008, 0.025]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          </>
        }
      />
    </group>
  )
}

/** Side table by the window with pizza and picanha frites. Clicking it opens the Cookbook. */
export function Food() {
  const powerOn = useRoom((s) => s.powerOn)
  const { props } = useInteractive('obj.food', () => {
    useOs.getState().setPendingApp({ appId: 'cookbook' })
    powerOn()
  })
  const x = 2.4
  const z = -0.75
  const top = 0.58
  return (
    <group>
      <Model
        url="/models/side_table_marble_round.glb"
        fit={{ height: top }}
        position={[x, 0, z]}
        fallback={
          <>
            <mesh position={[x, top - 0.015, z]} castShadow receiveShadow>
              <cylinderGeometry args={[0.38, 0.38, 0.03, 32]} />
              <meshStandardMaterial color="#5b3b28" roughness={0.6} />
            </mesh>
            <mesh position={[x, (top - 0.03) / 2, z]} castShadow>
              <cylinderGeometry args={[0.03, 0.05, top - 0.03, 12]} />
              <meshStandardMaterial color="#3d281b" />
            </mesh>
          </>
        }
      />
      <group {...props}>
        <group position={[x - 0.12, top, z - 0.05]}>
          <Model
            url="/models/pizza.glb"
            fit={{ width: 0.36 }}
            fallback={
              <group position={[0, 0.01, 0]}>
        {/* Pizza: crust, sauce, cheese, pepperoni, ricotta, basil */}
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.02, 32]} />
            <meshStandardMaterial color="#d79a54" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.011, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.004, 32]} />
            <meshStandardMaterial color="#f2d27a" roughness={0.7} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const a = i * 2.4
            const r = 0.04 + (i % 3) * 0.035
            return (
              <mesh key={i} position={[Math.cos(a) * r, 0.015, Math.sin(a) * r]}>
                <cylinderGeometry args={[0.022, 0.022, 0.005, 14]} />
                <meshStandardMaterial color="#a8321f" roughness={0.6} />
              </mesh>
            )
          })}
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={`r${i}`} position={[Math.cos(i * 1.3 + 0.5) * 0.08, 0.018, Math.sin(i * 1.3 + 0.5) * 0.08]}>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color="#fbf7ee" roughness={1} />
            </mesh>
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <mesh key={`b${i}`} position={[Math.cos(i * 1.6 + 1) * 0.1, 0.02, Math.sin(i * 1.6 + 1) * 0.1]} rotation={[-Math.PI / 2, 0, i]}>
              <circleGeometry args={[0.015, 8]} />
              <meshStandardMaterial color="#2f7d32" />
            </mesh>
          ))}
              </group>
            }
          />
        </group>
        {/* Picanha frites */}
        <group position={[x + 0.17, top + 0.008, z + 0.08]}>
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.015, 28]} />
            <meshStandardMaterial color="#f4f4f0" roughness={0.3} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.04 + i * 0.035, 0.022, -0.02]} rotation={[0, 0.3, 0.25]} castShadow>
              <boxGeometry args={[0.03, 0.025, 0.09]} />
              <meshStandardMaterial color={i === 1 ? '#b5544a' : '#8a3b2d'} roughness={0.8} />
            </mesh>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={`f${i}`} position={[-0.05 + (i % 4) * 0.03, 0.02 + Math.floor(i / 4) * 0.012, 0.05]} rotation={[0, i * 0.7, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.008, 0.07, 0.008]} />
              <meshStandardMaterial color="#e8b84a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
