'use client'

import { useTranslations } from 'next-intl'
import type { CVAnalysis } from '@/lib/cv'

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

/** Recruiter-lens analysis of an adapted CV (match score, keywords, red flags). */
export function CvAnalysisPanel({ analysis }: { analysis: CVAnalysis }) {
  const t = useTranslations('cvBuilder')

  return (
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
  )
}
