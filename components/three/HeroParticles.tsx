'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture } from './textures'
import { useIsMobile } from '@/hooks/use-mobile'

const NODE_COUNT = 18
const DUST_COUNT = 150
const MOBILE_DUST_COUNT = 90
const LINK_THRESHOLD = 3.2
const MOBILE_LINK_THRESHOLD = 2.6

type Vec3 = [number, number, number]

/**
 * "AI orchestration constellation" — a light node graph (providers / services
 * connected through the orchestrator) with soft link lines and gentle dust.
 *
 * Uses NORMAL blending + soft round sprites so everything stays visible on the
 * light hero background (additive blending washes out over white). Pauses
 * automatically via SceneCanvas frameloop (out of view / hidden tab /
 * prefers-reduced-motion).
 *
 * Responsive: on mobile the camera frustum is very narrow horizontally (portrait
 * aspect), so nodes are packed into a tight vertical column, sprites grow
 * slightly for readability and dust is thinned out to save GPU/battery.
 */
export function HeroParticles() {
  const texture = useSoftParticleTexture()
  const isMobile = useIsMobile()
  const groupRef = useRef<THREE.Group>(null)
  const linksRef = useRef<THREE.LineSegments>(null)
  const rand = useMemo(() => mulberry32(1337), [])

  // Node positions spread within the visible frustum (camera z=8, fov 50 →
  // ~±3.7 world units tall at z=0), so the constellation stays on screen.
  const nodes = useMemo<Vec3[]>(() => {
    const arr: Vec3[] = []
    const extentX = isMobile ? 5 : 13
    const extentY = isMobile ? 6.8 : 6.6
    for (let i = 0; i < NODE_COUNT; i++) {
      arr.push([(rand() - 0.5) * extentX, (rand() - 0.5) * extentY, (rand() - 0.5) * 3 - 1])
    }
    return arr
  }, [rand, isMobile])

  // Links between close nodes; closer links get a stronger brand blue.
  const { linkPositions, linkColors } = useMemo(() => {
    const pts: number[] = []
    const cols: number[] = []
    const soft = new THREE.Color('#a8c9f5')
    const strong = new THREE.Color('#0071e3')
    const threshold = isMobile ? MOBILE_LINK_THRESHOLD : LINK_THRESHOLD
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i][0] - nodes[j][0]
        const dy = nodes[i][1] - nodes[j][1]
        const dz = nodes[i][2] - nodes[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist > threshold) continue
        pts.push(...nodes[i], ...nodes[j])
        const c = soft.clone().lerp(strong, 1 - dist / threshold)
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b)
      }
    }
    return { linkPositions: new Float32Array(pts), linkColors: new Float32Array(cols) }
  }, [nodes, isMobile])

  const nodePositions = useMemo(() => new Float32Array(nodes.flat()), [nodes])

  const nodeColors = useMemo(() => {
    const palette: Vec3[] = [
      [0.0, 0.44, 0.89], // #0071e3
      [0.04, 0.52, 1.0], // #0a84ff
      [0.0, 0.72, 0.86], // cyan
    ]
    const arr = new Float32Array(NODE_COUNT * 3)
    for (let i = 0; i < NODE_COUNT; i++) {
      const c = palette[i % palette.length]
      arr[i * 3] = c[0]
      arr[i * 3 + 1] = c[1]
      arr[i * 3 + 2] = c[2]
    }
    return arr
  }, [])

  const dustPositions = useMemo(() => {
    const count = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
    const arr = new Float32Array(count * 3)
    const extentX = isMobile ? 6 : 15
    const extentY = isMobile ? 7.5 : 8
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * extentX
      arr[i * 3 + 1] = (rand() - 0.5) * extentY
      arr[i * 3 + 2] = (rand() - 0.5) * 4 - 1
    }
    return arr
  }, [rand, isMobile])

  const dustColors = useMemo(() => {
    const count = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
    const arr = new Float32Array(count * 3)
    const blue = new THREE.Color('#8fb8f5')
    const cyan = new THREE.Color('#7fd7e8')
    for (let i = 0; i < count; i++) {
      const base = i % 5 === 0 ? cyan : blue
      const f = 0.65 + rand() * 0.35
      arr[i * 3] = base.r * f
      arr[i * 3 + 1] = base.g * f
      arr[i * 3 + 2] = base.b * f
    }
    return arr
  }, [rand, isMobile])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    const t = state.clock.elapsedTime
    // Smooth mouse parallax (lerp towards normalized pointer).
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.18, 0.035)
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.1, 0.035)
    group.position.y = Math.sin(t * 0.22) * 0.15
    // Gentle pulse on the links.
    if (linksRef.current) {
      const mat = linksRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.42 + Math.sin(t * 1.1) * 0.08
    }
  })

  if (!texture) return null

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      {linkPositions.length > 0 && (
        <lineSegments ref={linksRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linkPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[linkColors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.42} depthWrite={false} />
        </lineSegments>
      )}

      {/* Provider / service nodes (soft sprites) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          vertexColors
          size={isMobile ? 0.44 : 0.34}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* Ambient dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          vertexColors
          size={isMobile ? 0.08 : 0.07}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
