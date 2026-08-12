'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDocumentTextures } from './textures'

interface DocLayout {
  pos: [number, number, number]
  rot: [number, number, number]
}

/**
 * Back → front stack: base CV, adapted CV, cover letter — the artifacts the
 * app produces. The stack fans out and rotates as the user scrolls through
 * the HowItWorks section (progress 0..1). Rounded "paper" textures keep the
 * scene light, crisp and visible on the light background.
 */
const DOCS: DocLayout[] = [
  { pos: [-0.32, 0.3, -0.15], rot: [-0.12, 0.2, -0.05] },
  { pos: [0, 0, 0], rot: [0, 0, 0] },
  { pos: [0.32, -0.3, 0.18], rot: [0.12, -0.18, 0.05] },
]

export function JourneyScene({ progress = 0 }: { progress?: number }) {
  const textures = useDocumentTextures()
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    const t = state.clock.elapsedTime
    // Scroll progress swings the stack and slightly changes its tilt.
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -0.45 + progress * 0.9, 0.06)
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0.2 - progress * 0.25, 0.06)
    group.position.y = Math.sin(t * 0.45) * 0.14
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, 0.92 + progress * 0.12, 0.06))
    // Per-document gentle bob.
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.y = DOCS[i].pos[1] + Math.sin(t * 0.7 + i * 2.1) * 0.05
    })
  })

  if (!textures) return null

  return (
    <group ref={groupRef}>
      {DOCS.map((doc, i) => (
        <mesh
          key={i}
          position={doc.pos}
          rotation={doc.rot}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
        >
          <planeGeometry args={[2.15, 2.7]} />
          <meshBasicMaterial
            map={textures[i]}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
