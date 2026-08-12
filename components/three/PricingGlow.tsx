'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture } from './textures'
import { useIsMobile } from '@/hooks/use-mobile'

const DUST_COUNT = 160
const MOBILE_DUST_COUNT = 80
const RING_COUNT = 16
const MOBILE_RING_COUNT = 10

/**
 * Pricing section ambient scene — a visible "credit constellation" over white:
 *
 * - A drifting particle field (blue / cyan, NORMAL blending): each particle
 *   rises slowly and wraps around, so the section feels alive.
 * - Two rings of dots rotating in opposite directions (the credit/refill cycle).
 * - A soft pulsing nucleus echoes the credit balance.
 * - Gentle parallax follows the pointer; the whole group floats.
 *
 * Frameloop is handled by SceneCanvas: frozen ('never') when out of view, tab
 * hidden or reduced motion. Densities stay modest (≤160 dust particles).
 */
export function PricingGlow() {
  const softTexture = useSoftParticleTexture()
  const isMobile = useIsMobile()

  const groupRef = useRef<THREE.Group>(null)
  const ringARef = useRef<THREE.Group>(null)
  const ringBRef = useRef<THREE.Group>(null)
  const dustRef = useRef<THREE.Points>(null)
  const nucleusRef = useRef<THREE.Points>(null)

  const rand = useMemo(() => mulberry32(4242), [])
  const dustCount = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
  const ringCount = isMobile ? MOBILE_RING_COUNT : RING_COUNT

  // Dust: scattered across the section's span, each with its own drift speed.
  const dustPositions = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3] = (rand() - 0.5) * 18
      arr[i * 3 + 1] = (rand() - 0.5) * 7
      arr[i * 3 + 2] = (rand() - 0.5) * 4
    }
    return arr
  }, [rand, dustCount])

  const dustDrift = useMemo(() => {
    // Rise speed (units/sec) + horizontal sway phase per particle.
    const arr = new Float32Array(dustCount * 2)
    for (let i = 0; i < dustCount; i++) {
      arr[i * 2] = 0.12 + rand() * 0.3 // rise
      arr[i * 2 + 1] = rand() * Math.PI * 2 // sway phase
    }
    return arr
  }, [rand, dustCount])

  const dustColors = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    const palette = ['#8fb8f5', '#7fd7e8', '#a8c9f5', '#6db3f2', '#b7d7f7']
    for (let i = 0; i < dustCount; i++) {
      const c = new THREE.Color(palette[i % palette.length])
      const f = 0.55 + rand() * 0.45
      arr[i * 3] = c.r * f
      arr[i * 3 + 1] = c.g * f
      arr[i * 3 + 2] = c.b * f
    }
    return arr
  }, [rand, dustCount])

  const ringAPositions = useMemo(() => {
    const arr = new Float32Array(ringCount * 3)
    const radius = isMobile ? 2.4 : 4.2
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius * 0.3
      arr[i * 3 + 2] = -0.6
    }
    return arr
  }, [ringCount, isMobile])

  const ringBPositions = useMemo(() => {
    const arr = new Float32Array(ringCount * 3)
    // Mobile half-width is ~2.2 units — keep the outer ring visible there.
    const radius = isMobile ? 1.7 : 6.0
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius * 0.22
      arr[i * 3 + 2] = -1.4
    }
    return arr
  }, [ringCount, isMobile])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    // Parallax + float
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.1, 0.03)
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.05, 0.03)
    group.position.y = Math.sin(t * 0.22) * 0.2

    // Rings rotate in opposite directions
    if (ringARef.current) ringARef.current.rotation.z = t * 0.1
    if (ringBRef.current) ringBRef.current.rotation.z = -t * 0.06

    // Nucleus pulses
    if (nucleusRef.current) {
      const mat = nucleusRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.22 + Math.sin(t * 1.2) * 0.08
      const s = 1 + Math.sin(t * 1.2) * 0.15
      nucleusRef.current.scale.setScalar(s)
    }

    // Individual dust drift: rise + wrap + horizontal sway
    const dust = dustRef.current
    if (dust && delta < 0.5) {
      const geo = dust.geometry
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < dustCount; i++) {
        let y = arr[i * 3 + 1] + dustDrift[i * 2] * delta
        if (y > 3.6) y = -3.6
        arr[i * 3 + 1] = y
        arr[i * 3] += Math.sin(t * 0.4 + dustDrift[i * 2 + 1]) * 0.002
      }
      posAttr.needsUpdate = true
    }

    // Dust opacity shimmer — subtle breathing over time
    if (dust) {
      const mat = dust.material as THREE.PointsMaterial
      mat.opacity = 0.55 + Math.sin(t * 0.6) * 0.1
    }
  })

  if (!softTexture) return null

  return (
    <group ref={groupRef}>
      {/* Soft pulsing nucleus (credit balance echo) */}
      <points ref={nucleusRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={softTexture}
          color="#0071e3"
          size={isMobile ? 1.4 : 2.2}
          sizeAttenuation
          transparent
          opacity={0.24}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* Inner ring (clockwise) */}
      <group ref={ringARef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ringAPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={softTexture}
            color="#0a84ff"
            size={isMobile ? 0.09 : 0.12}
            sizeAttenuation
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </points>
      </group>

      {/* Outer ring (counter-clockwise) */}
      <group ref={ringBRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ringBPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={softTexture}
            color="#5ac8fa"
            size={isMobile ? 0.06 : 0.08}
            sizeAttenuation
            transparent
            opacity={0.4}
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
          size={isMobile ? 0.1 : 0.12}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
