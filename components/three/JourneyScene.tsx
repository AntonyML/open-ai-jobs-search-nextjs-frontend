'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Floating torus-knot that advances along the section as the user scrolls
 * (progress 0..1 drives rotation + horizontal position). Pauses automatically
 * via SceneCanvas frameloop (out of view / reduced motion).
 */
export function JourneyScene({ progress = 0 }: { progress?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0.6 + progress * Math.PI, 0.06)
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, t * 0.25, 0.06)
    mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, (progress - 0.5) * 2.2, 0.06)
    mesh.position.y = Math.sin(t * 0.5) * 0.25
    const scale = 0.85 + progress * 0.3
    mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, scale, 0.06))
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.9, 0.3, 140, 20]} />
      <meshStandardMaterial color="#0071e3" metalness={0.65} roughness={0.22} transparent opacity={0.92} />
    </mesh>
  )
}
