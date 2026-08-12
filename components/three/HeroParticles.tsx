'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'

/** Particle budget (plan: hero ≤ 800). */
const COUNT = 650

/**
 * "AI constellation" — a field of brand-colored particles with subtle drift
 * and mouse parallax. Pauses automatically via SceneCanvas frameloop
 * (out of view / hidden tab / prefers-reduced-motion).
 */
export function HeroParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const rand = useMemo(() => mulberry32(1337), [])

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (rand() - 0.5) * 18
      arr[i * 3 + 1] = (rand() - 0.5) * 11
      arr[i * 3 + 2] = (rand() - 0.5) * 7
    }
    return arr
  }, [rand])

  const colors = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    const palette: [number, number, number][] = [
      [0.0, 0.44, 0.89], // #0071e3
      [0.2, 0.55, 0.95],
      [0.0, 0.72, 0.86], // cyan
      [0.45, 0.62, 0.95],
    ]
    for (let i = 0; i < COUNT; i++) {
      const c = palette[i % palette.length]
      arr[i * 3] = c[0]
      arr[i * 3 + 1] = c[1]
      arr[i * 3 + 2] = c[2]
    }
    return arr
  }, [])

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return
    const t = state.clock.elapsedTime
    // Smooth mouse parallax (lerp towards normalized pointer).
    points.rotation.y = THREE.MathUtils.lerp(points.rotation.y, state.pointer.x * 0.25, 0.03)
    points.rotation.x = THREE.MathUtils.lerp(points.rotation.x, state.pointer.y * 0.15, 0.03)
    points.position.y = Math.sin(t * 0.2) * 0.15
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
