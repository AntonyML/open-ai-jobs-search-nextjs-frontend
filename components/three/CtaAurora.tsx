'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture } from './textures'

const DUST_COUNT = 200
const GLOW_COUNT = 10

/**
 * Low-density drifting particles for the final CTA background.
 *
 * Soft round sprites + NORMAL blending keep the aurora visible on the light
 * section (additive blending would wash out over white). A few larger, very
 * transparent glow dots add gentle depth.
 */
export function CtaAurora() {
  const texture = useSoftParticleTexture()
  const groupRef = useRef<THREE.Group>(null)
  const rand = useMemo(() => mulberry32(2024), [])

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(DUST_COUNT * 3)
    for (let i = 0; i < DUST_COUNT; i++) {
      arr[i * 3] = (rand() - 0.5) * 22
      arr[i * 3 + 1] = (rand() - 0.5) * 8
      arr[i * 3 + 2] = (rand() - 0.5) * 6
    }
    return arr
  }, [rand])

  const dustColors = useMemo(() => {
    const arr = new Float32Array(DUST_COUNT * 3)
    const blue = new THREE.Color('#9cc0f5')
    const cyan = new THREE.Color('#8adced')
    for (let i = 0; i < DUST_COUNT; i++) {
      const base = i % 4 === 0 ? cyan : blue
      const f = 0.6 + rand() * 0.4
      arr[i * 3] = base.r * f
      arr[i * 3 + 1] = base.g * f
      arr[i * 3 + 2] = base.b * f
    }
    return arr
  }, [rand])

  const glowPositions = useMemo(() => {
    const arr = new Float32Array(GLOW_COUNT * 3)
    for (let i = 0; i < GLOW_COUNT; i++) {
      arr[i * 3] = (rand() - 0.5) * 18
      arr[i * 3 + 1] = (rand() - 0.5) * 7
      arr[i * 3 + 2] = (rand() - 0.5) * 3
    }
    return arr
  }, [rand])

  const glowColors = useMemo(() => {
    const arr = new Float32Array(GLOW_COUNT * 3)
    const c = new THREE.Color('#bcd6f9')
    for (let i = 0; i < GLOW_COUNT; i++) {
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y = state.clock.elapsedTime * 0.02
    group.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1
  })

  if (!texture) return null

  return (
    <group ref={groupRef}>
      {/* Fine dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          vertexColors
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* Soft glow dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[glowColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          vertexColors
          size={0.3}
          sizeAttenuation
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
