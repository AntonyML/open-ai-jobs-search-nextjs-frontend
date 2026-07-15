/**
 * Sound utility — initializes cuelume with accessibility awareness.
 *
 * If the user has "Reducir movimiento" enabled in accessibility settings,
 * all sounds are automatically disabled via setEnabled(false).
 *
 * Uses the declarative approach: call initSounds() once, then use
 * data-cuelume-press, data-cuelume-release, etc. on any HTML element.
 *
 * The library is only ~2KB and requires no audio files.
 */

'use client'

import { bind, setEnabled } from 'cuelume'
import { loadSettings } from '@/lib/accessibility'

/**
 * Initialize cuelume's DOM binding for data-cuelume-* attributes.
 * Call this once in a client component near the root.
 *
 * Respects the accessibility reducedMotion setting:
 * - If reducedMotion is ON → sounds are disabled
 * - If reducedMotion is OFF → sounds are enabled
 *
 * Also listens for storage changes so if the user updates accessibility
 * settings on another tab, sounds update reactively.
 */
export function initSounds(): () => void {
  // Apply current accessibility setting
  const settings = loadSettings()
  setEnabled(!settings.reducedMotion)

  // Bind data-cuelume-* attributes
  bind()

  // Listen for accessibility setting changes (dispatched by AccessibilitySettings component)
  const handleAccessibilityChange = () => {
    const updated = loadSettings()
    setEnabled(!updated.reducedMotion)
  }
  window.addEventListener('accessibility-change', handleAccessibilityChange)

  // Return cleanup function
  return () => {
    window.removeEventListener('accessibility-change', handleAccessibilityChange)
  }
}
