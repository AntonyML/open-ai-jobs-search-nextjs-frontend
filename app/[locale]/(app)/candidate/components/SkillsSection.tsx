'use client'

import { useTranslations } from 'next-intl'
import { TagInput } from '@/components/ui/TagInput'

export interface CategorizedSkills {
  languages: string[]
  frameworks: string[]
  tools_db: string[]
}

interface SkillsForm {
  skills_categorized?: CategorizedSkills
  skills_raw: string
  profile_statement: string
}

interface Props {
  form: SkillsForm
  onFieldChange: (name: string, value: any) => void
}

export function SkillsSection({ form, onFieldChange }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const cat = form.skills_categorized || {
    languages: [],
    frameworks: [],
    tools_db: form.skills_raw ? form.skills_raw.split(',').map((s) => s.trim()).filter(Boolean) : [],
  }

  function handleCatChange(key: keyof CategorizedSkills, tags: string[]) {
    const updated = { ...cat, [key]: tags }
    onFieldChange('skills_categorized', updated)
    // keep skills_raw in sync for backward compatibility
    const all = [...updated.languages, ...updated.frameworks, ...updated.tools_db]
    onFieldChange('skills_raw', all.join(', '))
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('skillsAndSummary')}</p>
          <p className="mt-0.5 text-[11px] text-[#707070] leading-relaxed">
            Categorize your technical skills to help ATS parsers and recruiters evaluate your profile instantly.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm text-[#1d1d1f]">
          <span className="font-semibold">Programming Languages</span>
          <div className="mt-1.5">
            <TagInput
              tags={cat.languages}
              onChange={(tags) => handleCatChange('languages', tags)}
              placeholder="e.g. C#, Java, Python, TypeScript"
              color="blue"
            />
          </div>
        </label>

        <label className="block text-sm text-[#1d1d1f]">
          <span className="font-semibold">Frameworks & Libraries</span>
          <div className="mt-1.5">
            <TagInput
              tags={cat.frameworks}
              onChange={(tags) => handleCatChange('frameworks', tags)}
              placeholder="e.g. .NET, React, Next.js, FastAPI"
              color="violet"
            />
          </div>
        </label>

        <label className="block text-sm text-[#1d1d1f]">
          <span className="font-semibold">Databases & DevOps Tools</span>
          <div className="mt-1.5">
            <TagInput
              tags={cat.tools_db}
              onChange={(tags) => handleCatChange('tools_db', tags)}
              placeholder="e.g. PostgreSQL, Docker, Git, Linux"
              color="amber"
            />
          </div>
        </label>
      </div>

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
