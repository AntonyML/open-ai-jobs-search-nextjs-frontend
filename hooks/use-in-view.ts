'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * One-shot in-view hook: returns `shown` = true once the element enters the
 * viewport, then stops observing. Used by landing sections to trigger
 * scroll-reveal animations (fade / rise / blur) exactly once.
 *
 * Uses a state-backed callback ref so the IntersectionObserver is created
 * (or re-created) whenever the DOM element changes — this fixes a race
 * where the effect ran while the element was absent (e.g. during a
 * loading skeleton) and never re-ran.
 *
 * SSR-safe: without IntersectionObserver the element is treated as shown.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  // Store the element via state so the effect re-runs when it changes.
  const [el, setEl] = useState<T | null>(null)
  const elRef = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  // Callback ref: keeps the ref object stable while updating state.
  const ref: React.RefCallback<T> = (node) => {
    if (elRef.current !== node) {
      elRef.current = node
      setEl(node)
    }
  }

  useEffect(() => {
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
  }, [el, threshold])

  return { ref, shown }
}
