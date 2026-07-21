'use client'

import { useTranslations } from 'next-intl'

interface SkillsForm {
  skills_raw: string
  profile_statement: string
}

interface Props {
  form: SkillsForm
  onFieldChange: (name: string, value: string) => void
}

export function SkillsSection({ form, onFieldChange }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const skillTags = form.skills_raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">{t('skillsAndSummary')}</p>
          <p className="text-[11px] text-[#b0b0b0]">{t('skillsAndSummaryDesc')}</p>
        </div>
      </div>

      <label className="block text-sm text-[#1d1d1f]">
        {t('skills')} <span className="text-[#b0b0b0]">{t('commaSeparated')}</span>
        <input
          className="field mt-1.5"
          placeholder="Python, FastAPI, React, PostgreSQL, Docker…"
          value={form.skills_raw}
          onChange={(e) => onFieldChange('skills_raw', e.target.value)}
        />
      </label>

      {skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skillTags.map((skill, i) => (
            <span
              key={i}
              className="animate-fade-in-up rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] text-[#474747]"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <label className="block text-sm text-[#1d1d1f]">
        {t('profileStatement')} <span className="text-[#b0b0b0]">{tc('optional')} — 2-3 sentences</span>
        <textarea
          className="field mt-1.5 h-24 resize-none"
          placeholder="ML engineer with 5+ years building production systems at scale. Passionate about turning complex problems into elegant solutions."
          value={form.profile_statement}
          onChange={(e) => onFieldChange('profile_statement', e.target.value)}
        />
      </label>

      <div className="flex items-center gap-2 text-[11px] text-[#b0b0b0]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {t('summaryHint')}
      </div>
    </div>
  )
}
