'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'

const NODES = 7

/**
 * "Provider network" — a light node graph (7 providers + center orchestrator)
 * with slow auto-rotation. Gently accelerates and highlights while hovered.
 * Wrap it with `<SceneDynamic interactive>` so pointer events reach the meshes.
 */
export function FeatureShowcase3D() {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const rand = useMemo(() => mulberry32(42), [])

  const nodePositions = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let i = 0; i < NODES; i++) {
      const angle = (i / NODES) * Math.PI * 2
      arr.push([Math.cos(angle) * 2.1, Math.sin(angle) * 1.25, (rand() - 0.5) * 1.2])
    }
    return arr
  }, [rand])

  const linePositions = useMemo(() => {
    const center: [number, number, number] = [0, 0, 0]
    const pts: number[] = []
    for (let i = 0; i < NODES; i++) {
      pts.push(...center, ...nodePositions[i])
      pts.push(...nodePositions[i], ...nodePositions[(i + 1) % NODES])
    }
    return new Float32Array(pts)
  }, [nodePositions])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y += hovered ? 0.01 : 0.002
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.18
  })

  return (
    <group ref={groupRef}>
      {/* Center orchestrator */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial
          color="#0071e3"
          emissive="#0071e3"
          emissiveIntensity={hovered ? 0.6 : 0.25}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={hovered ? '#0071e3' : '#7fb2f0'} transparent opacity={hovered ? 0.9 : 0.45} />
      </lineSegments>

      {/* Provider nodes */}
      {nodePositions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial
            color="#0a84ff"
            emissive="#0a84ff"
            emissiveIntensity={hovered ? 0.8 : 0.2}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}
