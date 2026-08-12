'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'

/** Low particle budget (plan: CTA ≤ 300). */
const COUNT = 260

/** Low-density drifting particles for the final CTA background. */
export function CtaAurora() {
  const pointsRef = useRef<THREE.Points>(null)
  const rand = useMemo(() => mulberry32(2024), [])

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (rand() - 0.5) * 22
      arr[i * 3 + 1] = (rand() - 0.5) * 8
      arr[i * 3 + 2] = (rand() - 0.5) * 6
    }
    return arr
  }, [rand])

  const colors = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    const base: [number, number, number] = [0.0, 0.44, 0.89]
    for (let i = 0; i < COUNT; i++) {
      const f = 0.5 + rand() * 0.5
      arr[i * 3] = base[0] * f
      arr[i * 3 + 1] = base[1] * f
      arr[i * 3 + 2] = base[2] * f
    }
    return arr
  }, [rand])

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return
    points.rotation.y = state.clock.elapsedTime * 0.02
    points.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
