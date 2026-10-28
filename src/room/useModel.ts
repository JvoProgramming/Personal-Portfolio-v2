import { useGLTF } from '@react-three/drei'
import { useState } from 'react'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

const DRACO = '/draco/'

export type Fit = { height: number } | { width: number } | { depth: number } | { longest: number }

export interface ModelProps {
  url: string
  /** Scale the model so this dimension (meters) matches. */
  fit: Fit
  rotation?: [number, number, number]
  /** Euler order for `rotation` (default XYZ). */
  order?: THREE.EulerOrder
  position?: [number, number, number]
  /** Called with the prepared scene, e.g. to grab bones or tweak materials. */
  onReady?: (scene: THREE.Group) => void
  shadows?: boolean
}

/** Loads a GLB, scales it to real size, sits it on y = 0 centered on x/z, and turns on shadows. */
export function useModel(url: string, fit: Fit, rotation: [number, number, number] = [0, 0, 0], shadows = true, order: THREE.EulerOrder = 'XYZ') {
  const gltf = useGLTF(url, DRACO, true)
  // Prepared once per mount; the GLTF itself is cached by URL.
  const [prepared] = useState(() => {
    const scene = cloneSkinned(gltf.scene) as THREE.Group
    const inner = new THREE.Group()
    inner.add(scene)
    inner.rotation.set(rotation[0], rotation[1], rotation[2], order)
    inner.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(inner)
    const size = box.getSize(new THREE.Vector3())
    const target =
      'height' in fit ? fit.height / size.y : 'width' in fit ? fit.width / size.x : 'depth' in fit ? fit.depth / size.z : fit.longest / Math.max(size.x, size.y, size.z)
    const outer = new THREE.Group()
    outer.add(inner)
    outer.scale.setScalar(target)
    const center = box.getCenter(new THREE.Vector3())
    inner.position.set(-center.x, -box.min.y, -center.z)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = shadows
        mesh.receiveShadow = true
        // Scans often ship with huge bounds after skinning; keep them from being culled.
        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) mesh.frustumCulled = false
      }
    })
    return { root: outer, animations: gltf.animations, scene }
  })
  return prepared
}

