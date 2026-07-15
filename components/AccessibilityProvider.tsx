'use client'

import { useEffect } from 'react'
import { loadSettings, applySettings } from '@/lib/accessibility'

/**
 * AccessibilityProvider — applies saved accessibility settings on mount.
 *
 * This component MUST be a client component and should be placed high
 * in the component tree (inside <body>) so CSS variables are set early.
 *
 * It reads settings from localStorage and applies them as:
 * - CSS custom properties on <html> (--access-font-size, --access-line-height, etc.)
 * - CSS classes on <html> (access-high-contrast, access-reduced-motion, etc.)
 */
export default function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const settings = loadSettings()
    applySettings(settings)
  }, [])

  return <>{children}</>
}
