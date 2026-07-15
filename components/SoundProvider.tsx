'use client'

import { useEffect } from 'react'
import { initSounds } from '@/lib/sounds'

/**
 * SoundProvider — initializes cuelume's DOM binding on mount.
 *
 * This enables data-cuelume-press, data-cuelume-release, etc. on all
 * interactive elements across the app.
 *
 * Automatically disables sounds if the user has enabled "Reducir
 * movimiento" in accessibility settings, and reactively updates when
 * settings change via storage events.
 *
 * Must be a client component and placed inside <body>.
 */
export default function SoundProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const cleanup = initSounds()
    return cleanup
  }, [])

  return <>{children}</>
}
