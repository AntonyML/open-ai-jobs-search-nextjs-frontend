'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AccessibilitySettings as AccessibilitySettingsType,
  DEFAULT_SETTINGS,
  FONT_SIZE_LABELS,
  FONT_SIZE_TICK_VALUES,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_STEP,
  LETTER_SPACING_LABELS,
  LINE_HEIGHT_LABELS,
  loadSettings,
  saveSettings,
  applySettings,
} from '@/lib/accessibility'

// ── Toggle component ───────────────────────────────────────────────

function Toggle({
  label,
  description,
  enabled,
  onChange,
  icon,
}: {
  label: string
  description?: string
  enabled: boolean
  onChange: (v: boolean) => void
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#e2e2e5] last:border-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && <span className="mt-0.5 shrink-0 text-[#707070]">{icon}</span>}
        <div>
          <p className="text-[14px] font-medium text-[#1d1d1f]">{label}</p>
          {description && (
            <p className="text-[12px] text-[#858585] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
          } mt-[2px]`}
        />
      </button>
    </div>
  )
}

// ── Apple NSSlider-style font size slider (with tick marks + snap) ──

function FontSizeSlider({
  label,
  description,
  value,
  onChange,
  t,
}: {
  label: string
  description?: string
  value: number
  onChange: (v: number) => void
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const tickValues = [...FONT_SIZE_TICK_VALUES]
  const min = tickValues[0]
  const max = tickValues[tickValues.length - 1]
  const step = FONT_SIZE_STEP

  // Snap to nearest tick
  const snapToTick = (raw: number) => {
    const closest = tickValues.reduce((prev, curr) =>
      Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
    )
    return closest
  }

  const pct = ((value - min) / (max - min)) * 100

  // Find current label
  const currentLabelKey = FONT_SIZE_LABELS.find(l => l.value === value)?.label || 'normal'
  const currentLabel = t(currentLabelKey)
  const displayValue = value.toFixed(2).replace(/0$/, '').replace(/\.?0+$/, '')

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value)
    onChange(snapToTick(raw))
  }

  return (
    <div className="py-4 border-b border-[#e2e2e5] last:border-0">
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[14px] font-medium text-[#1d1d1f]">{label}</p>
          {description && (
            <p className="text-[12px] text-[#858585]">{description}</p>
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#0071e3] min-w-[56px] text-right tabular-nums">
          {t('sizePreview', { value: displayValue })}
        </span>
      </div>

      {/* Slider */}
      <div className="relative h-9 mb-2">
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 rounded-full bg-[#e2e2e5]" />

        {/* Filled track (leading portion) */}
        <div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-[#0071e3]"
          style={{ width: `${pct}%` }}
        />

        {/* Tick marks */}
        {tickValues.map((tick) => {
          const tickPct = ((tick - min) / (max - min)) * 100
          const isActive = tick <= value
          return (
            <div
              key={tick}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${tickPct}%` }}
            >
              <div
                className={`w-[1.5px] h-2 rounded-full transition-colors -translate-x-1/2 ${
                  isActive ? 'bg-[#0071e3]' : 'bg-[#b0b0b0]'
                }`}
              />
            </div>
          )
        })}

        {/* Native range input (invisible, for drag handling) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${currentLabel} (${value.toFixed(2)}×)`}
        />

        {/* Custom knob (thumb) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)] border border-[#d2d2d7] pointer-events-none z-[5]"
          style={{ left: `calc(${pct}% - 9px)` }}
        />
      </div>

      {/* Tick labels row — grid with 5 columns avoids overlap */}
      <div className="grid grid-cols-5 gap-0 px-0">
        {tickValues.filter((_, i) => i % 2 === 0).map((tick) => {
          const labelKey = FONT_SIZE_LABELS.find(l => l.value === tick)?.label || 'normal'
          return (
            <span
              key={tick}
              className="text-[9px] text-[#858585] tabular-nums select-none text-center"
            >
              {t(labelKey)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Slider select component (for line-height, letter-spacing) ──────

function SliderSelect<T extends string | number>({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string
  description?: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const currentIndex = options.findIndex(o => o.value === value)
  const selectedIndex = currentIndex >= 0 ? currentIndex : 1

  return (
    <div className="py-3 border-b border-[#e2e2e5] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[14px] font-medium text-[#1d1d1f]">{label}</p>
          {description && (
            <p className="text-[12px] text-[#858585]">{description}</p>
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#0071e3] min-w-[80px] text-right">
          {options[selectedIndex]?.label || ''}
        </span>
      </div>
      <div className="flex gap-1">
        {options.map((opt, i) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition-all ${
              opt.value === value
                ? 'bg-[#0071e3] text-white shadow-sm'
                : 'bg-[#f5f5f7] text-[#707070] hover:bg-[#e8e8ea]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Icon components ────────────────────────────────────────────────

const IconTextSize = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 20V4h12v16" /><path d="M10 8h4" /><path d="M12 8v12" />
  </svg>
)

const IconContrast = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20" />
  </svg>
)

const IconMotion = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
)

const IconTextSpacing = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16" /><path d="M8 12h8" /><path d="M6 20h12" />
  </svg>
)

const IconFont = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
  </svg>
)

const IconSound = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

// ── Settings controls (shared between variants) ───────────────────

function SettingsPanel({
  settings,
  update,
  resetAll,
  t,
  showResetConfirm,
  setShowResetConfirm,
}: {
  settings: AccessibilitySettingsType
  update: <K extends keyof AccessibilitySettingsType>(key: K, value: AccessibilitySettingsType[K]) => void
  resetAll: () => void
  t: (key: string) => string
  showResetConfirm: boolean
  setShowResetConfirm: (v: boolean) => void
}) {
  return (
    <>
      <FontSizeSlider
        label={t('fontSize')}
        description={t('fontSizeSliderDesc')}
        value={settings.fontSize}
        onChange={v => update('fontSize', v)}
        t={t}
      />
      <SliderSelect
        label={t('lineHeight')}
        description={t('lineHeightDesc')}
        options={LINE_HEIGHT_LABELS}
        value={settings.lineHeight}
        onChange={v => update('lineHeight', v)}
      />
      <SliderSelect
        label={t('letterSpacing')}
        description={t('letterSpacingDesc')}
        options={LETTER_SPACING_LABELS}
        value={settings.letterSpacing}
        onChange={v => update('letterSpacing', v)}
      />
      <div className="py-3 border-b border-[#e2e2e5] last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[14px] font-medium text-[#1d1d1f]">{t('fontFamily')}</p>
            <p className="text-[12px] text-[#858585]">{t('fontFamilyDesc')}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[
            { value: 'system' as const, label: t('system') },
            { value: 'sans-serif' as const, label: t('sansSerif') },
            { value: 'serif' as const, label: t('serif') },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('fontFamily', opt.value)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition-all ${
                settings.fontFamily === opt.value
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'bg-[#f5f5f7] text-[#707070] hover:bg-[#e8e8ea]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <Toggle
        label={t('highContrast')}
        description={t('highContrastDesc')}
        enabled={settings.highContrast}
        onChange={v => update('highContrast', v)}
        icon={<IconContrast />}
      />
      <Toggle
        label={t('reducedMotion')}
        description={t('reducedMotionDesc')}
        enabled={settings.reducedMotion}
        onChange={v => update('reducedMotion', v)}
        icon={<IconMotion />}
      />
      <Toggle
        label={t('soundEnabled')}
        description={t('soundEnabledDesc')}
        enabled={settings.soundEnabled}
        onChange={v => update('soundEnabled', v)}
        icon={<IconSound />}
      />
      <Toggle
        label={t('dyslexiaFont')}
        description={t('dyslexiaFontDesc')}
        enabled={settings.dyslexiaFont}
        onChange={v => update('dyslexiaFont', v)}
        icon={<IconFont />}
      />
      <div className="pt-3">
        {showResetConfirm ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-[12px] text-rose-600 flex-1">{t('resetConfirm')}</p>
            <button
              onClick={resetAll}
              className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-rose-600 transition-colors"
            >
              {t('resetYes')}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-[11px] font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
            >
              {t('resetCancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full rounded-lg border border-[#e2e2e5] py-2.5 text-[12px] font-medium text-[#858585] hover:bg-[#f5f5f7] hover:text-rose-500 transition-all"
          >
            {t('reset')}
          </button>
        )}
      </div>
    </>
  )
}

// ── Main Component ─────────────────────────────────────────────────

export default function AccessibilitySettings({ variant = 'card' }: { variant?: 'card' | 'inline' }) {
  const t = useTranslations('accessibility')
  const [settings, setSettings] = useState<AccessibilitySettingsType>(DEFAULT_SETTINGS)
  const [expanded, setExpanded] = useState(variant === 'inline' ? true : false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Update a single setting and persist
  const update = useCallback(<K extends keyof AccessibilitySettingsType>(
    key: K,
    value: AccessibilitySettingsType[K]
  ) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      applySettings(next)
      return next
    })
    window.dispatchEvent(new Event('accessibility-change'))
  }, [])

  const resetAll = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
    applySettings(DEFAULT_SETTINGS)
    setSettings(DEFAULT_SETTINGS)
    setShowResetConfirm(false)
    window.dispatchEvent(new Event('accessibility-change'))
  }, [])

  // Inline variant — no collapsible wrapper, just the controls
  if (variant === 'inline') {
    return (
      <SettingsPanel
        settings={settings}
        update={update}
        resetAll={resetAll}
        t={t}
        showResetConfirm={showResetConfirm}
        setShowResetConfirm={setShowResetConfirm}
      />
    )
  }

  // Card variant — collapsible card with header
  return (
    <div className="rounded-xl border border-[#d2d2d7] bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#fafafa] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#f4f8fb] flex items-center justify-center">
            <IconTextSize />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f]">{t('title')}</h3>
            <p className="text-[12px] text-[#858585]">{t('description')}</p>
          </div>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-[#858585] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#e2e2e5]">
          <SettingsPanel
            settings={settings}
            update={update}
            resetAll={resetAll}
            t={t}
            showResetConfirm={showResetConfirm}
            setShowResetConfirm={setShowResetConfirm}
          />
        </div>
      )}
    </div>
  )
}
