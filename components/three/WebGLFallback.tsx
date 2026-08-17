'use client'

import { WebGLRenderer } from 'three'

/**
 * WebGL availability check + static placeholder.
 *
 * `detectWebGL()` must only run client-side (WebGL contexts don't exist during
 * SSR). Call it inside a `useEffect`/event — never during render — to avoid
 * hydration mismatches.
 *
 * It does more than `canvas.getContext(...)`: it also constructs the actual
 * `WebGLRenderer` with the same options used at runtime. On some machines the
 * probe context succeeds but the full renderer setup throws (blocklisted GPU
 * drivers, dual-GPU laptops, remote desktop, VMs…), which would otherwise make
 * the scene fail silently. Treating those as "no WebGL" shows the static
 * placeholder instead of a blank canvas.
 */
export function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const probe = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!probe) return false
    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'default',
    })
    renderer.dispose()
    return true
  } catch {
    return false
  }
}

/**
 * Static gradient placeholder shown while a 3D scene loads, or instead of it
 * when the browser has no WebGL support.
 *
 * The parent container must provide the height (e.g. `aspect-ratio` or a fixed
 * height class) so this placeholder matches the space the canvas would use.
 */
export function StaticSceneFallback({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe] ${className}`}
    >
      <div className="h-24 w-24 rounded-full bg-[#0071e3]/10 blur-2xl" />
    </div>
  )
}

/**
 * Subtle ambient glow used when WebGL is unavailable, so ambient sections
 * (pricing, CTA) keep a soft constellation-like wash instead of an empty gap.
 * Must not fight the section's own background — keep it very light.
 */
export function AmbientGlowFallback({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-full w-full ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,113,227,0.07), rgba(0,113,227,0.02) 55%, transparent 75%)',
      }}
    />
  )
}
