'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './random'
import { useSoftParticleTexture, useDocumentTextures } from './textures'
import { useIsMobile } from '@/hooks/use-mobile'

const NODE_COUNT = 12
const MOBILE_NODE_COUNT = 8
const DUST_COUNT = 120
const MOBILE_DUST_COUNT = 60

type Vec3 = [number, number, number]

/**
 * Hero scene — AI orchestration constellation:
 * - Central glowing nucleus (the orchestrator)
 * - Provider nodes on gentle elliptical orbits
 * - Soft link lines that pulse toward the center
 * - 3 floating document planes (base CV → adapted → cover)
 * - Ambient dust for depth
 *
 * Designed for the light Apple-style hero background (NORMAL blending).
 * Mobile: fewer nodes/dust, tighter layout, slightly larger sprites.
 * Pauses automatically via SceneCanvas frameloop (out of view / reduced motion).
 */
export function HeroParticles() {
  const softTexture = useSoftParticleTexture()
  const docTextures = useDocumentTextures()
  const isMobile = useIsMobile()

  const groupRef = useRef<THREE.Group>(null)
  const nucleusRef = useRef<THREE.Mesh>(null)
  const nucleusGlowRef = useRef<THREE.Points>(null)
  const linksRef = useRef<THREE.LineSegments>(null)
  const docsGroupRef = useRef<THREE.Group>(null)
  const nodeMeshRefs = useRef<(THREE.Mesh | null)[]>([])

  const rand = useMemo(() => mulberry32(1337), [])
  const nodeCount = isMobile ? MOBILE_NODE_COUNT : NODE_COUNT

  // Orbital parameters per node (radius, speed, phase, vertical amplitude)
  //
  // Calibration vs the camera frustum (z=8, fov 50 → visible half-height ±3.73):
  // - Desktop worst-case aspect ~4:3 gives a visible half-width of ~5.0, so the
  //   radius is capped at 5.0 — outer nodes graze the edge but never orbit off.
  // - Mobile (portrait) shows only ~±1.9, so orbits stay at 0.9–1.8.
  // - Inner nodes orbit faster (Keplerian feel), all slow enough to stay calm.
  const orbits = useMemo(() => {
    const arr: { radius: number; speed: number; phase: number; yAmp: number; zOff: number }[] = []
    for (let i = 0; i < nodeCount; i++) {
      const radius = isMobile ? 0.9 + rand() * 0.9 : 2.8 + rand() * 2.2
      arr.push({
        radius,
        speed: 0.14 + 0.35 / radius,
        phase: rand() * Math.PI * 2,
        yAmp: 0.35 + rand() * 0.55,
        zOff: (rand() - 0.5) * (isMobile ? 1.2 : 2.2),
      })
    }
    return arr
  }, [rand, nodeCount, isMobile])

  // Initial positions (updated every frame via mesh refs)
  const initialNodePositions = useMemo<Vec3[]>(() => {
    return orbits.map((o) => [
      Math.cos(o.phase) * o.radius,
      Math.sin(o.phase * 0.7) * o.yAmp,
      o.zOff,
    ])
  }, [orbits])

  // Dust
  const dustPositions = useMemo(() => {
    const count = isMobile ? MOBILE_DUST_COUNT : DUST_COUNT
    const arr = new Float32Array(count * 3)
    const extentX = isMobile ? 7 : 16
    const extentY = isMobile ? 8 : 9
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * extentX
      arr[i * 3 + 1] = (rand() - 0.5) * extentY
      arr[i * 3 + 2] = (rand() - 0.5) * 5 - 1.5
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
      const f = 0.55 + rand() * 0.4
      arr[i * 3] = base.r * f
      arr[i * 3 + 1] = base.g * f
      arr[i * 3 + 2] = base.b * f
    }
    return arr
  }, [rand, isMobile])

  // Document layouts — kept on the right side of the hero, behind the CV mockup
  // area, so they never sit behind the left-aligned copy (readability).
  const docLayouts = useMemo(() => {
    if (isMobile) {
      return [
        { pos: [-1.8, 1.4, -1.2] as Vec3, rot: [-0.15, 0.35, -0.08] as Vec3, scale: 0.55 },
        { pos: [1.6, -0.6, -0.8] as Vec3, rot: [0.1, -0.28, 0.06] as Vec3, scale: 0.5 },
      ]
    }
    // Kept inside ~±5.0 so they stay on screen at common desktop aspects.
    return [
      { pos: [4.2, 1.8, -1.5] as Vec3, rot: [-0.12, 0.42, -0.06] as Vec3, scale: 0.8 },
      { pos: [4.8, -0.6, -1.0] as Vec3, rot: [0.08, -0.38, 0.05] as Vec3, scale: 0.7 },
      { pos: [3.6, -1.9, -2.0] as Vec3, rot: [0.18, 0.25, 0.1] as Vec3, scale: 0.58 },
    ]
  }, [isMobile])

  // Shared buffer for dynamic link positions (center → each node)
  const linkPosBuffer = useMemo(() => new Float32Array(nodeCount * 6), [nodeCount])
  const linkColBuffer = useMemo(() => {
    const cols = new Float32Array(nodeCount * 6)
    const soft = new THREE.Color('#a8c9f5')
    const strong = new THREE.Color('#0071e3')
    for (let i = 0; i < nodeCount; i++) {
      // center vertex color
      cols[i * 6] = strong.r
      cols[i * 6 + 1] = strong.g
      cols[i * 6 + 2] = strong.b
      // node vertex color
      cols[i * 6 + 3] = soft.r
      cols[i * 6 + 4] = soft.g
      cols[i * 6 + 5] = soft.b
    }
    return cols
  }, [nodeCount])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    // —— Group parallax + gentle float ——
    // Parallax is capped so the rotation never pushes outer nodes off-screen.
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.18, 0.04)
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.1, 0.04)
    group.position.y = Math.sin(t * 0.2) * 0.12

    // —— Nucleus pulse ——
    if (nucleusRef.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.08
      nucleusRef.current.scale.setScalar(pulse)
    }
    if (nucleusGlowRef.current) {
      const mat = nucleusGlowRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.18 + Math.sin(t * 1.4) * 0.06
    }

    // —— Orbit nodes + update link positions ——
    // The link buffer is mutated through the geometry attribute (runtime ref),
    // never through the render-scope buffer, to satisfy render purity rules.
    const linkAttr = linksRef.current
      ? (linksRef.current.geometry.getAttribute('position') as THREE.BufferAttribute)
      : null
    const linkArr = linkAttr ? (linkAttr.array as Float32Array) : null

    for (let i = 0; i < nodeCount; i++) {
      const o = orbits[i]
      const mesh = nodeMeshRefs.current[i]
      if (!mesh) continue

      const angle = o.phase + t * o.speed
      const x = Math.cos(angle) * o.radius
      const y = Math.sin(angle * 0.65) * o.yAmp + Math.sin(t * 0.5 + i) * 0.08
      const z = o.zOff + Math.sin(angle * 0.4) * 0.35

      mesh.position.set(x, y, z)

      // Soft scale pulse staggered per node
      const s = 1 + Math.sin(t * 1.8 + i * 0.7) * 0.12
      mesh.scale.setScalar(s)

      // Link: center (0,0,0) → node
      if (linkArr) {
        linkArr[i * 6] = 0
        linkArr[i * 6 + 1] = 0
        linkArr[i * 6 + 2] = 0
        linkArr[i * 6 + 3] = x
        linkArr[i * 6 + 4] = y
        linkArr[i * 6 + 5] = z
      }
    }

    if (linkAttr) {
      linkAttr.needsUpdate = true
      const mat = linksRef.current!.material as THREE.LineBasicMaterial
      mat.opacity = 0.28 + Math.sin(t * 1.1) * 0.1
    }

    // —— Documents gentle bob + tilt ——
    if (docsGroupRef.current) {
      docsGroupRef.current.children.forEach((child, i) => {
        if (!(child instanceof THREE.Mesh)) return
        const base = docLayouts[i]
        if (!base) return
        child.position.y = base.pos[1] + Math.sin(t * 0.55 + i * 1.7) * 0.12
        child.rotation.z = base.rot[2] + Math.sin(t * 0.35 + i) * 0.03
        child.rotation.y = base.rot[1] + Math.sin(t * 0.25 + i * 0.9) * 0.04
      })
    }
  })

  if (!softTexture) return null

  const nucleusSize = isMobile ? 0.32 : 0.42
  const nodeSize = isMobile ? 0.11 : 0.13

  return (
    <group ref={groupRef}>
      {/* ========== NUCLEUS (orchestrator) ========== */}
      <mesh ref={nucleusRef} position={[0, 0, 0]}>
        <sphereGeometry args={[nucleusSize, 32, 32]} />
        <meshStandardMaterial
          color="#0071e3"
          emissive="#0071e3"
          emissiveIntensity={0.55}
          metalness={0.35}
          roughness={0.25}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Soft glow halo around nucleus */}
      <points ref={nucleusGlowRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0]), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={softTexture}
          color="#4da3ff"
          size={isMobile ? 1.6 : 2.4}
          sizeAttenuation
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* ========== CONNECTION LINES ========== */}
      <lineSegments ref={linksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linkPosBuffer, 3]} />
          <bufferAttribute attach="attributes-color" args={[linkColBuffer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </lineSegments>

      {/* ========== ORBITING PROVIDER NODES ========== */}
      <group>
        {initialNodePositions.map((pos, i) => (
          <mesh
            key={i}
            position={pos}
            ref={(el) => {
              nodeMeshRefs.current[i] = el
            }}
          >
            <sphereGeometry args={[nodeSize, 16, 16]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#0a84ff' : i % 3 === 1 ? '#00c2e0' : '#0071e3'}
              emissive={i % 3 === 0 ? '#0a84ff' : i % 3 === 1 ? '#00c2e0' : '#0071e3'}
              emissiveIntensity={0.35}
              metalness={0.3}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>

      {/* ========== FLOATING DOCUMENTS ========== */}
      {docTextures && (
        <group ref={docsGroupRef}>
          {docLayouts.map((layout, i) => {
            // Cycle textures: base, adapted, cover
            const tex = docTextures[i % docTextures.length]
            return (
              <mesh
                key={i}
                position={layout.pos}
                rotation={layout.rot}
                scale={layout.scale}
              >
                <planeGeometry args={[2.1, 2.65]} />
                <meshBasicMaterial
                  map={tex}
                  transparent
                  opacity={0.65}
                  depthWrite={false}
                  toneMapped={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {/* ========== AMBIENT DUST ========== */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={softTexture}
          vertexColors
          size={isMobile ? 0.07 : 0.065}
          sizeAttenuation
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  )
}
