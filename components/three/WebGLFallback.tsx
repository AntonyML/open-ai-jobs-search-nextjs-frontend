'use client'

/**
 * WebGL availability check + static placeholder.
 *
 * `detectWebGL()` must only run client-side (WebGL contexts don't exist during
 * SSR). Call it inside a `useEffect`/event — never during render — to avoid
 * hydration mismatches.
 */
export function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
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
