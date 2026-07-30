'use client'

import { useTranslations } from 'next-intl'
import { TagInput } from '@/components/ui/TagInput'

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

  const tags = form.skills_raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  function handleTagsChange(newTags: string[]) {
    onFieldChange('skills_raw', newTags.join(', '))
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#707070]">{t('skillsAndSummary')}</p>
          <p className="text-[11px] text-[#858585]">{t('skillsAndSummaryDesc')}</p>
        </div>
      </div>

      <label className="block text-sm text-[#1d1d1f]">
        {t('skills')}
        <div className="mt-1.5">
          <TagInput
            tags={tags}
            onChange={handleTagsChange}
            placeholder={t('skillsPlaceholder')}
            color="amber"
          />
        </div>
        <p className="mt-1 text-[11px] text-[#858585]">{t('skillsHint')}</p>
      </label>

      <label className="block text-sm text-[#1d1d1f]">
        {t('profileStatement')} <span className="text-[#858585]">{tc('optional')} — {t('twoThreeSentences')}</span>
        <textarea
          className="field mt-1.5 h-24 resize-none"
          placeholder={t('profileStatementPlaceholder')}
          value={form.profile_statement}
          onChange={(e) => onFieldChange('profile_statement', e.target.value)}
        />
      </label>

      <div className="flex items-center gap-2 text-[11px] text-[#858585]">
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
