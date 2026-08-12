'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * True while the element is inside the (expanded) viewport AND the tab is
 * visible. Used to mount/pause 3D scenes on demand:
 *
 * - The WebGL context is created only when the section approaches the viewport.
 * - Scrolling out or hiding the tab unmounts / freezes the scene.
 *
 * @param ref       Container element observed by the IntersectionObserver.
 * @param rootMargin Extra margin (px) so scenes start loading slightly before
 *                   they become visible.
 */
export function useSceneVisibility(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '300px 0px',
): boolean {
  const [visible, setVisible] = useState(false)
  const intersectingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      // No observer support → keep the scene mounted and visible.
      intersectingRef.current = true
      setVisible(true)
      return
    }

    const update = () => setVisible(!document.hidden && intersectingRef.current)

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        intersectingRef.current = entry.isIntersecting
        update()
      },
      { rootMargin, threshold: 0 },
    )
    io.observe(el)

    const onVisibility = () => update()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ref, rootMargin])

  return visible
}
