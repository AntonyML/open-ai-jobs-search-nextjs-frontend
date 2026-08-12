'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * One-shot in-view hook: returns `shown` = true once the element enters the
 * viewport, then stops observing. Used by landing sections to trigger
 * scroll-reveal animations (fade / rise / blur) exactly once.
 *
 * SSR-safe: without IntersectionObserver the element is treated as shown.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, shown }
}
