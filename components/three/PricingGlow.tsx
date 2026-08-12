'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture } from './textures'
import { useIsMobile } from '@/hooks/use-mobile'

const DUST_COUNT = 90
const MOBILE_DUST_COUNT = 45
const RING_COUNT = 14
const MOBILE_RING_COUNT = 9

/**
 * Pricing section ambient scene — a soft "aurora" of particles over white:
 *
 * - A faint drifting particle field (blue / cyan, NORMAL blending so it stays
 *   visible on the light background).
 * - A ring of dots that slowly rotates, echoing the credit/refill cycle.
 * - Gentle parallax follows the pointer; the whole group floats.
 *
 * Frameloop is handled by SceneCanvas: frozen ('never') when out of view,
 * tab hidden or reduced motion. Low density on purpose (≤90 dust particles).
 */
export function PricingGlow() {
  const softTexture = useSoftParticleTexture()
  const isMobile = useIsMobile()

  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Group>(null)
  const dustRef = useRef<THREE.Points>(null)

  const rand = useMemo(() => mulberry32(4242), [])
  const dustCount = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
  const ringCount = isMobile ? MOBILE_RING_COUNT : RING_COUNT

  // Dust: scattered across the section's horizontal span, slow upward drift.
  const dustPositions = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3] = (rand() - 0.5) * 18
      arr[i * 3 + 1] = (rand() - 0.5) * 7
      arr[i * 3 + 2] = (rand() - 0.5) * 4
    }
    return arr
  }, [rand, dustCount])

  const dustColors = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    const palette = ['#8fb8f5', '#7fd7e8', '#a8c9f5', '#6db3f2']
    for (let i = 0; i < dustCount; i++) {
      const c = new THREE.Color(palette[i % palette.length])
      const f = 0.5 + rand() * 0.5
      arr[i * 3] = c.r * f
      arr[i * 3 + 1] = c.g * f
      arr[i * 3 + 2] = c.b * f
    }
    return arr
  }, [rand, dustCount])

  const ringPositions = useMemo(() => {
    const arr = new Float32Array(ringCount * 3)
    const radius = isMobile ? 2.6 : 4.6
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius * 0.32
      arr[i * 3 + 2] = -1.2
    }
    return arr
  }, [ringCount, isMobile])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    // Gentle parallax + float
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.08, 0.03)
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.04, 0.03)
    group.position.y = Math.sin(t * 0.22) * 0.18

    // Ring rotation (slow)
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.05
    }

    // Dust opacity shimmer — subtle breathing over time
    const dust = dustRef.current
    if (dust) {
      const mat = dust.material as THREE.PointsMaterial
      mat.opacity = 0.3 + Math.sin(t * 0.6) * 0.08
    }
  })

  if (!softTexture) return null

  return (
    <group ref={groupRef}>
      {/* Faint rotating ring (credit/refill cycle echo) */}
      <group ref={ringRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ringPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={softTexture}
            color="#0071e3"
            size={isMobile ? 0.05 : 0.07}
            sizeAttenuation
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </points>
      </group>

      {/* Ambient dust */}
      <points name="pricing-dust" ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={softTexture}
          vertexColors
          size={isMobile ? 0.055 : 0.07}
          sizeAttenuation
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
