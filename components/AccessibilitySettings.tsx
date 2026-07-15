'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AccessibilitySettings as AccessibilitySettingsType,
  DEFAULT_SETTINGS,
  FONT_SIZE_LABELS,
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

// ── Slider select component ────────────────────────────────────────

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
          {options[selectedIndex]?.label || 'Normal'}
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

// ── Main Component ─────────────────────────────────────────────────

export default function AccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettingsType>(DEFAULT_SETTINGS)
  const [expanded, setExpanded] = useState(false)
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
    // Notify SoundProvider to re-check reducedMotion
    window.dispatchEvent(new Event('accessibility-change'))
  }, [])

  const resetAll = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
    applySettings(DEFAULT_SETTINGS)
    setSettings(DEFAULT_SETTINGS)
    setShowResetConfirm(false)
    // Notify SoundProvider to re-check reducedMotion
    window.dispatchEvent(new Event('accessibility-change'))
  }, [])

  return (
    <div className="rounded-xl border border-[#d2d2d7] bg-white overflow-hidden">
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#fafafa] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#f4f8fb] flex items-center justify-center">
            <IconTextSize />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f]">Accesibilidad</h3>
            <p className="text-[12px] text-[#858585]">Ajusta el tamaño de letra, contraste y más</p>
          </div>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-[#858585] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Settings panel */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#e2e2e5]">
          {/* Font size */}
          <SliderSelect
            label="Tamaño de letra"
            description="Aumenta o reduce el tamaño del texto en toda la aplicación"
            options={FONT_SIZE_LABELS}
            value={settings.fontSize}
            onChange={v => update('fontSize', v)}
          />

          {/* Line height */}
          <SliderSelect
            label="Espaciado entre líneas"
            description="Más espacio facilita la lectura"
            options={LINE_HEIGHT_LABELS}
            value={settings.lineHeight}
            onChange={v => update('lineHeight', v)}
          />

          {/* Letter spacing */}
          <SliderSelect
            label="Espaciado entre letras"
            description="Útil para personas con dislexia"
            options={LETTER_SPACING_LABELS}
            value={settings.letterSpacing}
            onChange={v => update('letterSpacing', v)}
          />

          {/* Font family */}
          <div className="py-3 border-b border-[#e2e2e5] last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[14px] font-medium text-[#1d1d1f]">Tipografía</p>
                <p className="text-[12px] text-[#858585]">Cambia la familia tipográfica</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[
                { value: 'system' as const, label: 'Sistema' },
                { value: 'sans-serif' as const, label: 'Sans-serif' },
                { value: 'serif' as const, label: 'Serif' },
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

          {/* High contrast */}
          <Toggle
            label="Alto contraste"
            description="Aumenta el contraste de colores para mejorar la legibilidad"
            enabled={settings.highContrast}
            onChange={v => update('highContrast', v)}
            icon={<IconContrast />}
          />

          {/* Reduced motion */}
          <Toggle
            label="Reducir movimiento"
            description="Desactiva animaciones y transiciones"
            enabled={settings.reducedMotion}
            onChange={v => update('reducedMotion', v)}
            icon={<IconMotion />}
          />

          {/* Dyslexia font */}
          <Toggle
            label="Fuente para dislexia"
            description="Usa una fuente diseñada para facilitar la lectura a personas con dislexia"
            enabled={settings.dyslexiaFont}
            onChange={v => update('dyslexiaFont', v)}
            icon={<IconFont />}
          />

          {/* Reset button */}
          <div className="pt-3">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-[12px] text-rose-600 flex-1">¿Restaurar valores predeterminados?</p>
                <button
                  onClick={resetAll}
                  className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-rose-600 transition-colors"
                >
                  Sí, restaurar
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-[11px] font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full rounded-lg border border-[#e2e2e5] py-2.5 text-[12px] font-medium text-[#858585] hover:bg-[#f5f5f7] hover:text-rose-500 transition-all"
              >
                Restaurar valores predeterminados
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
