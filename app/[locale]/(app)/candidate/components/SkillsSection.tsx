'use client'

import { useTranslations } from 'next-intl'
import { TagInput } from '@/components/ui/TagInput'

export interface CategorizedSkills {
  languages: string[]
  frameworks: string[]
  databases: string[]
  architecture: string[]
  tools_db: string[]
  methodologies: string[]
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

const SKILL_SUGGESTIONS: Record<keyof CategorizedSkills, { labelKey: string; color: 'blue' | 'violet' | 'amber' | 'rose'; placeholder: string; items: string[] }> = {
  languages: {
    labelKey: 'skillsLanguages',
    color: 'blue',
    placeholder: 'e.g. C#, TypeScript, Java, Python...',
    items: ['C#', 'TypeScript', 'Java', 'Python', 'Kotlin', 'Go', 'PHP', 'JavaScript', 'C++', 'Rust', 'SQL'],
  },
  frameworks: {
    labelKey: 'skillsFrameworks',
    color: 'violet',
    placeholder: 'e.g. .NET, NestJS, React, Next.js...',
    items: ['.NET', 'NestJS', 'React', 'Next.js', 'Spring Boot', 'Flutter', 'Electron', 'Astro', 'FastAPI', 'Node.js', 'Vue.js'],
  },
  databases: {
    labelKey: 'skillsDatabases',
    color: 'amber',
    placeholder: 'e.g. PostgreSQL, SQL Server, Supabase...',
    items: ['PostgreSQL', 'SQL Server', 'MySQL', 'Oracle', 'D1 Cloudflare', 'Supabase', 'MongoDB', 'Redis', 'SQLite'],
  },
  architecture: {
    labelKey: 'skillsArchitecture',
    color: 'rose',
    placeholder: 'e.g. Microservicios, Clean Architecture...',
    items: ['Microservicios', 'Clean Architecture', 'Hexagonal', 'Event-Driven', 'SOLID', 'Domain-Driven Design (DDD)', 'CQRS', 'RESTful APIs'],
  },
  tools_db: {
    labelKey: 'skillsDevOps',
    color: 'amber',
    placeholder: 'e.g. Git, Docker, Cloudflare, Linux...',
    items: ['Git', 'GitHub', 'Jenkins CI/CD', 'Docker', 'Cloudflare', 'Linux', 'JMeter', 'Kubernetes', 'AWS', 'Azure', 'Postman'],
  },
  methodologies: {
    labelKey: 'skillsMethodologies',
    color: 'violet',
    placeholder: 'e.g. Scrum, PMBOK, Taiga...',
    items: ['Scrum', 'PMBOK', 'Gestión en Taiga', 'Kanban', 'Agile', 'Jira', 'Trello', 'CI/CD Workflows'],
  },
}

export function SkillsSection({ form, onFieldChange }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const cat: CategorizedSkills = {
    languages: form.skills_categorized?.languages || [],
    frameworks: form.skills_categorized?.frameworks || [],
    databases: form.skills_categorized?.databases || [],
    architecture: form.skills_categorized?.architecture || [],
    tools_db: form.skills_categorized?.tools_db || (form.skills_raw ? form.skills_raw.split(',').map((s) => s.trim()).filter(Boolean) : []),
    methodologies: form.skills_categorized?.methodologies || [],
  }

  function handleCatChange(key: keyof CategorizedSkills, tags: string[]) {
    const updated = { ...cat, [key]: tags }
    onFieldChange('skills_categorized', updated)
    // keep skills_raw in sync for backward compatibility
    const all = [
      ...updated.languages,
      ...updated.frameworks,
      ...updated.databases,
      ...updated.architecture,
      ...updated.tools_db,
      ...updated.methodologies,
    ]
    onFieldChange('skills_raw', all.join(', '))
  }

  function addSuggestion(key: keyof CategorizedSkills, item: string) {
    if (!cat[key].includes(item)) {
      handleCatChange(key, [...cat[key], item])
    }
  }

  return (
    <div id="section-skills" className="card space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('skillsAndSummary')}</p>
          <p className="mt-0.5 text-[11px] text-[#707070] leading-relaxed">
            {t('skillsCategorizedDesc')}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {(Object.keys(SKILL_SUGGESTIONS) as (keyof CategorizedSkills)[]).map((key) => {
          const config = SKILL_SUGGESTIONS[key]
          const currentValues = cat[key]

          return (
            <div key={key} className="rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                  {t(config.labelKey)}
                </span>
                <span className="text-[10px] text-[#707070]">
                  {currentValues.length} seleccionada(s)
                </span>
              </div>

              <TagInput
                tags={currentValues}
                onChange={(tags) => handleCatChange(key, tags)}
                placeholder={config.placeholder}
                color={config.color}
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {config.items.map((item) => {
                  const isSelected = currentValues.includes(item)
                  if (isSelected) return null
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addSuggestion(key, item)}
                      className="rounded-md border border-[#d2d2d7] bg-white px-2 py-0.5 text-[10px] text-[#404040] transition-colors hover:border-[#0066cc] hover:bg-[#f4f8fb] hover:text-[#0066cc]"
                    >
                      + {item}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2">
        <label htmlFor="skills-profile-statement" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
          {t('profileStatement')} <span className="text-[#707070] font-normal">({tc('optional')} — {t('twoThreeSentences')})</span>
        </label>
        <textarea
          id="skills-profile-statement"
          name="profile_statement"
          aria-describedby="skills-summary-hint"
          className="field h-24 resize-none"
          placeholder={t('profileStatementPlaceholder')}
          value={form.profile_statement}
          onChange={(e) => onFieldChange('profile_statement', e.target.value)}
        />
        <p id="skills-summary-hint" className="mt-1.5 flex items-center gap-2 text-[11px] text-[#5f6368]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{t('summaryHint')}</span>
        </p>
      </div>
    </div>
  )
}
