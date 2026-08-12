'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch, ApiError } from '@/lib/api'
import type { CVResponse } from '@/lib/cv'
import { showError, showSuccess } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'

function Chip({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'red' }) {
  const tones = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-[980px] border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {label}
    </span>
  )
}

export function CvBuilderOferta() {
  const t = useTranslations('cvBuilder')
  const [offer, setOffer] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [cv, setCv] = useState<CVResponse | null>(null)

  const minChars = 50

  async function generate() {
    setError('')
    if (offer.trim().length < minChars) {
      setError(t('tooShort'))
      showError(t('tooShort'))
      return
    }
    setAnalyzing(true)
    setCv(null)
    try {
      const res = await apiFetch<CVResponse>('/api/v1/cv/personalize', {
        method: 'POST',
        body: JSON.stringify({ job_description_text: offer.trim() }),
      })
      setCv(res)
      showSuccess(t('ofertaGenerated'))
    } catch (x: any) {
      if (x instanceof ApiError && x.status === 400) {
        setError(t('profileRequired'))
        showError(t('profileRequired'))
      } else {
        const msg = x instanceof Error ? x.message : t('generateFailed')
        setError(msg)
        showError(msg)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const analysis = cv?.analysis

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <label htmlFor="cv-oferta-input" className="block text-sm font-medium text-[#1d1d1f]">
          {t('ofertaLabel')}
        </label>
        <p className="mt-1 text-xs text-[#707070]">{t('ofertaHint')}</p>
        <textarea
          id="cv-oferta-input"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder={t('ofertaPlaceholder')}
          rows={8}
          className="mt-3 w-full resize-y rounded-xl border border-[#d2d2d7]/60 bg-white px-4 py-3 text-sm text-[#1d1d1f] outline-none transition-colors placeholder:text-[#b0b0b0] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className={`text-xs ${offer.trim().length >= minChars ? 'text-emerald-600' : 'text-[#707070]'}`}>
            {offer.trim().length} / {minChars} {t('ofertaMinLabel')}
          </p>
          <AppleButton loading={analyzing} disabled={analyzing} onClick={generate}>
            {analyzing ? t('generating') : t('analyze')}
          </AppleButton>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-4 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-semibold text-[#1d1d1f]">{analysis.match_score}%</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e2e5]">
              <div
                className="h-full rounded-full bg-[#0071e3] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, analysis.match_score))}%` }}
              />
            </div>
            <span className="text-xs text-[#707070]">{t('matchScore')}</span>
          </div>

          {analysis.missing_keywords.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[#707070]">{t('missingKeywords')}</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing_keywords.map((k, i) => (
                  <Chip key={i} label={k} tone="warn" />
                ))}
              </div>
            </div>
          )}

          {analysis.red_flags.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[#707070]">{t('redFlags')}</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.red_flags.map((r, i) => (
                  <Chip key={i} label={r} tone="red" />
                ))}
              </div>
            </div>
          )}

          {analysis.adapted_experience.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[#707070]">{t('adaptedExperience')}</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.adapted_experience.map((e, i) => (
                  <Chip key={i} label={e} tone="ok" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {cv && <CvPdfPreview cv={cv} />}
    </div>
  )
}