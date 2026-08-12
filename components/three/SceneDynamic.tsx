'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { SceneCanvas } from './SceneCanvas'
import { useSceneVisibility } from './useSceneVisibility'
import { detectWebGL, StaticSceneFallback } from './WebGLFallback'

interface SceneDynamicProps {
  children: ReactNode
  /** Static placeholder while the scene loads or when WebGL is unavailable. */
  fallback?: ReactNode
  className?: string
  activeFrameloop?: 'always' | 'demand'
  /** Allow pointer events to reach the canvas (e.g. hoverable meshes). */
  interactive?: boolean
}

/**
 * Lazy, visibility-gated wrapper for marketing 3D scenes.
 *
 * - WebGL is detected client-side only (never during SSR) → static fallback
 *   when unavailable (avoids hydration mismatches).
 * - The <Canvas> mounts only when the section approaches the viewport and is
 *   unmounted again when it scrolls out or the tab is hidden (battery saving).
 * - Sections are server components: they pass their client scene component as
 *   children, keeping `three` out of the server bundle.
 *
 * The `className` must give the container a size (e.g. `aspect-ratio`).
 */
export function SceneDynamic({
  children,
  fallback,
  className,
  activeFrameloop = 'always',
  interactive = false,
}: SceneDynamicProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const visible = useSceneVisibility(containerRef)
  const [webglOk, setWebglOk] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setWebglOk(detectWebGL())
  }, [])

  // Mount once the scene approaches the viewport; keep it mounted afterwards.
  // When it scrolls out (or the tab hides), SceneCanvas freezes via
  // `frameloop='never'` instead of re-creating the WebGL context each time.
  useEffect(() => {
    if (visible) setMounted(true)
  }, [visible])

  const placeholder = fallback ?? <StaticSceneFallback />

  const containerStyle = { pointerEvents: interactive ? ('auto' as const) : ('none' as const) }

  if (webglOk === null || !webglOk) {
    return (
      <div ref={containerRef} aria-hidden="true" className={className} style={containerStyle}>
        {placeholder}
      </div>
    )
  }

  return (
    <div ref={containerRef} aria-hidden="true" className={className} style={containerStyle}>
      {mounted ? (
        <Suspense fallback={placeholder}>
          <SceneCanvas activeFrameloop={activeFrameloop} visible={visible}>
            {children}
          </SceneCanvas>
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  )
}
