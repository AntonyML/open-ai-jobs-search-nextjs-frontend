'use client'

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
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
 * Catches render-time errors thrown inside the 3D scene and swaps in the
 * static placeholder instead of leaving the section blank or crashing the
 * marketing page (a single scene must never take the landing down).
 */
class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Lazy, visibility-gated wrapper for marketing 3D scenes.
 *
 * - WebGL is detected client-side only (never during SSR) → static fallback
 *   when unavailable (avoids hydration mismatches).
 * - The <Canvas> mounts only when the section approaches the viewport and is
 *   unmounted again when it scrolls out or the tab is hidden (battery saving).
 * - A scene that throws or loses its WebGL context (GPU reset, driver crash)
 *   drops to the static placeholder instead of a frozen blank canvas.
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
  const [contextLost, setContextLost] = useState(false)

  useEffect(() => {
    setWebglOk(detectWebGL())
  }, [])

  // If the browser loses the WebGL context after the scene mounted (GPU reset,
  // driver crash, remote-desktop reconnection), show the placeholder instead
  // of a frozen blank canvas. `webglcontextlost` bubbles from the canvas.
  useEffect(() => {
    const el = containerRef.current
    if (!el || webglOk !== true) return
    const onLost = (e: Event) => {
      e.preventDefault()
      setContextLost(true)
    }
    el.addEventListener('webglcontextlost', onLost)
    return () => el.removeEventListener('webglcontextlost', onLost)
  }, [webglOk])

  // Mount once the scene approaches the viewport; keep it mounted afterwards.
  // When it scrolls out (or the tab hides), SceneCanvas freezes via
  // `frameloop='never'` instead of re-creating the WebGL context each time.
  useEffect(() => {
    if (visible) setMounted(true)
  }, [visible])

  const placeholder = fallback ?? <StaticSceneFallback />

  const containerStyle = { pointerEvents: interactive ? ('auto' as const) : ('none' as const) }

  if (webglOk === null || !webglOk || contextLost) {
    return (
      <div ref={containerRef} aria-hidden="true" className={className} style={containerStyle}>
        {placeholder}
      </div>
    )
  }

  return (
    <div ref={containerRef} aria-hidden="true" className={className} style={containerStyle}>
      {mounted ? (
        <SceneErrorBoundary fallback={placeholder}>
          <Suspense fallback={placeholder}>
            <SceneCanvas activeFrameloop={activeFrameloop} visible={visible}>
              {children}
            </SceneCanvas>
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        placeholder
      )}
    </div>
  )
}
