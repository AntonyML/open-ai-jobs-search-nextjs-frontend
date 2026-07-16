/**
 * Accessibility settings — persisted in localStorage, applied globally via CSS variables.
 *
 * Settings:
 * - fontSize: scale factor (0.875 = smaller, 1 = normal, 1.125 = large, 1.25 = x-large)
 * - lineHeight: multiplier (1.4 = tight, 1.6 = normal, 1.8 = relaxed, 2.0 = wide)
 * - letterSpacing: additional tracking in em (0 = normal, 0.05 = relaxed, 0.1 = wide)
 * - highContrast: increase contrast ratio for readability
 * - reducedMotion: disable animations and transitions
 * - soundEnabled: enable/disable sound effects (separate from reducedMotion)
 * - dyslexiaFont: use OpenDyslexic-style font family
 * - fontFamily: override font family (system, serif, sans-serif)
 */

export interface AccessibilitySettings {
  fontSize: number      // 0.875 | 1 | 1.125 | 1.25
  lineHeight: number    // 1.4 | 1.6 | 1.8 | 2.0
  letterSpacing: number // 0 | 0.03 | 0.06 | 0.1
  highContrast: boolean
  reducedMotion: boolean
  soundEnabled: boolean
  dyslexiaFont: boolean
  fontFamily: 'system' | 'serif' | 'sans-serif'
}

const STORAGE_KEY = 'accessibility_settings'

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 1,
  lineHeight: 1.6,
  letterSpacing: 0,
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
  dyslexiaFont: false,
  fontFamily: 'system',
}

export function loadSettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AccessibilitySettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/**
 * Apply accessibility settings as CSS custom properties on the document element.
 */
export function applySettings(settings: AccessibilitySettings): void {
  const root = document.documentElement

  // Font size scale
  root.style.setProperty('--access-font-size', String(settings.fontSize))

  // Line height
  root.style.setProperty('--access-line-height', String(settings.lineHeight))

  // Letter spacing (additional tracking)
  root.style.setProperty('--access-letter-spacing', `${settings.letterSpacing}em`)

  // High contrast
  root.classList.toggle('access-high-contrast', settings.highContrast)

  // Reduced motion
  root.classList.toggle('access-reduced-motion', settings.reducedMotion)

  // Dyslexia font
  root.classList.toggle('access-dyslexia-font', settings.dyslexiaFont)

  // Font family override
  root.classList.remove('access-font-system', 'access-font-serif', 'access-font-sans-serif')
  root.classList.add(`access-font-${settings.fontFamily}`)
}

/**
 * Font size slider constants — Apple NSSlider style with tick marks.
 */
export const FONT_SIZE_MIN = 0.75
export const FONT_SIZE_MAX = 1.75
export const FONT_SIZE_STEP = 0.125

export const FONT_SIZE_TICK_VALUES = [0.75, 0.875, 1.0, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75] as const

/**
 * Size key labels for the UI slider — translated via i18n.
 */
export const FONT_SIZE_LABELS = [
  { value: 0.75, label: 'extraSmall' },
  { value: 0.875, label: 'small' },
  { value: 1, label: 'normal' },
  { value: 1.125, label: 'large' },
  { value: 1.25, label: 'extraLarge' },
  { value: 1.375, label: 'xxLarge' },
  { value: 1.5, label: 'x3Large' },
  { value: 1.625, label: 'x4Large' },
  { value: 1.75, label: 'x5Large' },
] as const

export const LINE_HEIGHT_LABELS = [
  { value: 1.4, label: 'Compact' },
  { value: 1.6, label: 'Normal' },
  { value: 1.8, label: 'Relaxed' },
  { value: 2.0, label: 'Wide' },
] as const

export const LETTER_SPACING_LABELS = [
  { value: 0, label: 'Normal' },
  { value: 0.03, label: 'Light' },
  { value: 0.06, label: 'Medium' },
  { value: 0.1, label: 'Wide' },
] as const
