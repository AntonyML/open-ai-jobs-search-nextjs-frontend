'use client'

import { useEffect, useState } from 'react'

/**
 * Detect if the user prefers reduced motion.
 *
 * Combines the native `prefers-reduced-motion` media query with the app's
 * accessibility setting (class `access-reduced-motion` on <html>, toggled by
 * AccessibilityProvider). 3D scenes must freeze (frameloop 'never') when true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const check = () => {
      const classBased = document.documentElement.classList.contains('access-reduced-motion')
      setReduced(mq.matches || classBased)
    }
    check()
    mq.addEventListener('change', check)

    // AccessibilityProvider toggles `access-reduced-motion` on <html> at runtime.
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      mq.removeEventListener('change', check)
      observer.disconnect()
    }
  }, [])

  return reduced
}
