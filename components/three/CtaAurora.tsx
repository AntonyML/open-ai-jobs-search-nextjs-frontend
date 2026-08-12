'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture } from './textures'
import { useIsMobile } from '@/hooks/use-mobile'

const DUST_COUNT = 220
const MOBILE_DUST_COUNT = 110
const RING_COUNT = 14
const MOBILE_RING_COUNT = 9

/**
 * CTA background — same calibrated constellation language as the pricing
 * section, so the two closing sections feel unified:
 *
 * - Drifting dust (blue / cyan, NORMAL blending) — visibly perceptible over
 *   the light gradient section.
 * - A soft pulsing nucleus (the "ready" call-to-action echo).
 * - A thin rotating ring of dots.
 *
 * Frameloop freezes via SceneCanvas when out of view / hidden tab / reduced
 * motion. Densities stay modest (≤220 dust particles).
 */
export function CtaAurora() {
  const texture = useSoftParticleTexture()
  const isMobile = useIsMobile()

  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Group>(null)
  const nucleusRef = useRef<THREE.Points>(null)
  const dustRef = useRef<THREE.Points>(null)

  const rand = useMemo(() => mulberry32(2024), [])
  const dustCount = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
  const ringCount = isMobile ? MOBILE_RING_COUNT : RING_COUNT

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3] = (rand() - 0.5) * 22
      arr[i * 3 + 1] = (rand() - 0.5) * 8
      arr[i * 3 + 2] = (rand() - 0.5) * 6
    }
    return arr
  }, [rand, dustCount])

  const dustDrift = useMemo(() => {
    const arr = new Float32Array(dustCount * 2)
    for (let i = 0; i < dustCount; i++) {
      arr[i * 2] = 0.1 + rand() * 0.28 // rise speed
      arr[i * 2 + 1] = rand() * Math.PI * 2 // sway phase
    }
    return arr
  }, [rand, dustCount])

  const dustColors = useMemo(() => {
    const arr = new Float32Array(dustCount * 3)
    const blue = new THREE.Color('#9cc0f5')
    const cyan = new THREE.Color('#8adced')
    for (let i = 0; i < dustCount; i++) {
      const base = i % 4 === 0 ? cyan : blue
      const f = 0.6 + rand() * 0.4
      arr[i * 3] = base.r * f
      arr[i * 3 + 1] = base.g * f
      arr[i * 3 + 2] = base.b * f
    }
    return arr
  }, [rand, dustCount])

  const ringPositions = useMemo(() => {
    const arr = new Float32Array(ringCount * 3)
    const radius = isMobile ? 2.2 : 4.0
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius * 0.3
      arr[i * 3 + 2] = -0.6
    }
    return arr
  }, [ringCount, isMobile])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    group.rotation.y = state.clock.elapsedTime * 0.02
    group.position.y = Math.sin(t * 0.15) * 0.12

    if (ringRef.current) ringRef.current.rotation.z = t * 0.09

    if (nucleusRef.current) {
      const mat = nucleusRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.34 + Math.sin(t * 1.1) * 0.1
      const s = 1 + Math.sin(t * 1.1) * 0.14
      nucleusRef.current.scale.setScalar(s)
    }

    const dust = dustRef.current
    if (dust && delta < 0.5) {
      const posAttr = dust.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < dustCount; i++) {
        let y = arr[i * 3 + 1] + dustDrift[i * 2] * delta
        if (y > 4) y = -4
        arr[i * 3 + 1] = y
        arr[i * 3] += Math.sin(t * 0.35 + dustDrift[i * 2 + 1]) * 0.002
      }
      posAttr.needsUpdate = true
      const mat = dust.material as THREE.PointsMaterial
      mat.opacity = 0.7 + Math.sin(t * 0.5) * 0.1
    }
  })

  if (!texture) return null

  return (
    <group ref={groupRef}>
      {/* Pulsing nucleus */}
      <points ref={nucleusRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color="#0071e3"
          size={isMobile ? 2.0 : 3.0}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* Rotating ring */}
      <group ref={ringRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ringPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={texture}
            color="#0a84ff"
            size={isMobile ? 0.14 : 0.2}
            sizeAttenuation
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </points>
      </group>

      {/* Drifting dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          vertexColors
          size={isMobile ? 0.16 : 0.22}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
