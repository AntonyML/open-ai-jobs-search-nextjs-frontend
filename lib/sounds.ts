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

import { bind, play, setEnabled } from 'cuelume'
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

/** Map of action names to distinct cuelume sound recipes.
 *
 * Each action gets its own sonic identity so users can tell
 * which process completed without looking at the screen.
 */
const ACTION_SOUNDS: Record<string, 'sparkle' | 'success' | 'bloom' | 'chime' | 'toggle'> = {
  search: 'sparkle',    // bright ascending twinkle — discovery
  rank: 'success',      // warm three-note confirmation — evaluation done
  expand: 'bloom',      // warm swelling pad — skills growing
  upskill: 'chime',     // soft two-note bell — clean learning
  apply: 'toggle',      // mechanical click-clack — action dispatched
  interview: 'sparkle', // bright ascending twinkle — preparation complete
}

/**
 * Play an action-specific completion sound.
 *
 * Each action (search, rank, expand, upskill, apply, interview)
 * has its own distinct sonic identity. Falls back to `'success'`
 * for unknown actions.
 *
 * Automatically respects the accessibility `reducedMotion` setting.
 */
function areSoundsEnabled(): boolean {
  const settings = loadSettings()
  return !settings.reducedMotion && settings.soundEnabled
}

export function playActionSound(action: string): void {
  if (!areSoundsEnabled()) return
  play(ACTION_SOUNDS[action] || 'success')
}

/** @deprecated Use `playActionSound(action)` instead. */
export function playCompletionSound(): void {
  playActionSound('rank')
}

/**
 * Play a gentle error sound — for when a process fails.
 *
 * Uses the warm 'droplet' glide (a falling tone) rather than a harsh
 * alarm, keeping the UX pleasant.
 */
export function playErrorSound(): void {
  if (!areSoundsEnabled()) return
  play('droplet')
}
