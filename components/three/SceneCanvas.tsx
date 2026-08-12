'use client'

import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { PerformanceMonitor } from './PerformanceMonitor'
import { useReducedMotion } from './useReducedMotion'

interface SceneCanvasProps {
  children: React.ReactNode
  /** Render mode while the scene is visible and motion is allowed. */
  activeFrameloop?: 'always' | 'demand'
  /** False → freeze the scene (out of viewport / hidden tab). */
  visible?: boolean
  className?: string
}

/**
 * Client-only WebGL canvas shared by every marketing section.
 *
 * - `dpr` is capped and adaptively lowered by PerformanceMonitor (mobile GPUs).
 * - `frameloop` freezes to 'never' when the scene is out of view, the tab is
 *   hidden or the user prefers reduced motion (static scene, one frame).
 * - `pointer-events` are disabled: the canvas is a pure visual layer and the
 *   semantic HTML content sits above it.
 *
 * The parent container must give the canvas its size (e.g. `aspect-ratio`).
 */
export function SceneCanvas({
  children,
  activeFrameloop = 'always',
  visible = true,
  className,
}: SceneCanvasProps) {
  const reducedMotion = useReducedMotion()
  const [dpr, setDpr] = useState(2)

  const frameloop = !visible || reducedMotion ? 'never' : activeFrameloop

  return (
    <Canvas
      className={className}
      dpr={[1, dpr]}
      frameloop={frameloop}
      gl={{
        powerPreference: 'high-performance',
        antialias: false,
        alpha: true,
      }}
      camera={{ position: [0, 0, 8], fov: 50 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(2)} />
      {children}
    </Canvas>
  )
}
