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

/** Map of pipeline names to distinct cuelume sound recipes.
 *
 * Each pipeline gets its own sonic identity so users can tell
 * which process completed without looking at the screen.
 */
const PIPELINE_SOUNDS: Record<string, 'sparkle' | 'success' | 'bloom' | 'chime' | 'toggle'> = {
  scrape: 'sparkle',    // bright ascending twinkle — discovery
  rank: 'success',      // warm three-note confirmation — evaluation done
  expand: 'bloom',      // warm swelling pad — skills growing
  upskill: 'chime',     // soft two-note bell — clean learning
  apply: 'toggle',      // mechanical click-clack — action dispatched
  interview: 'sparkle', // bright ascending twinkle — preparation complete
}

/**
 * Play a pipeline-specific completion sound.
 *
 * Each pipeline (scrape, rank, expand, upskill, apply, interview)
 * has its own distinct sonic identity. Falls back to `'success'`
 * for unknown pipelines.
 *
 * Automatically respects the accessibility `reducedMotion` setting.
 */
function areSoundsEnabled(): boolean {
  const settings = loadSettings()
  return !settings.reducedMotion && settings.soundEnabled
}

export function playPipelineSound(pipeline: string): void {
  if (!areSoundsEnabled()) return
  play(PIPELINE_SOUNDS[pipeline] || 'success')
}

/** @deprecated Use `playPipelineSound(pipeline)` instead. */
export function playCompletionSound(): void {
  playPipelineSound('rank')
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
