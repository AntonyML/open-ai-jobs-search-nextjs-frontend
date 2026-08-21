'use client'

import { useTranslations } from 'next-intl'
import { Target, Sparkles } from 'lucide-react'
import { TagInput } from '@/components/ui/TagInput'

export interface JobTarget {
  target_titles: string[]
  seniority: string | null
  work_mode: string[]
  search_locations: string[]
  search_radius_km: number | null
  employment_types: string[]
  industry: string[]
  keywords: string[]
  exclude_keywords: string[]
  exclude_companies: string[]
  salary_min: number | null
  salary_max: number | null
  availability: string | null
  visa_needed: boolean | null
  relocation_willing: boolean | null
}

export const DEFAULT_JOB_TARGET: JobTarget = {
  target_titles: [],
  seniority: null,
  work_mode: [],
  search_locations: [],
  search_radius_km: null,
  employment_types: [],
  industry: [],
  keywords: [],
  exclude_keywords: [],
  exclude_companies: [],
  salary_min: null,
  salary_max: null,
  availability: null,
  visa_needed: null,
  relocation_willing: null,
}

const POPULAR_ROLES_SUGGESTIONS = [
  'Software Engineer',
  'Chef / Cocinero',
  'Asistente Administrativo',
  'Médico General',
  'Diseñador UX/UI',
  'Ejecutivo de Ventas',
  'Profesor / Docente',
  'Project Manager',
  'Recepcionista',
  'Técnico Electricista',
]

interface Props {
  value: JobTarget
  onChange: (value: JobTarget) => void
}

export function JobTargetSection({ value, onChange }: Props) {
  const t = useTranslations('setup')

  function handleAddRole(role: string) {
    if (!value.target_titles.includes(role)) {
      onChange({
        ...value,
        target_titles: [...value.target_titles, role],
      })
    }
  }

  return (
    <div id="section-job-target" className="card space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
          <Target className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
            {t('jobTarget')}
          </h2>
          <p className="mt-0.5 text-[11px] text-[#5f6368] leading-relaxed">
            {t('jobTargetUniversalDesc')}
          </p>
        </div>
      </div>

      {/* Target Titles Input */}
      <div className="space-y-2">
        <label htmlFor="target-titles-input" className="block text-xs font-semibold text-[#1d1d1f]">
          {t('targetTitles')} <span className="text-[#5f6368] font-normal">({t('optional')})</span>
        </label>
        
        <TagInput
          tags={value.target_titles}
          onChange={(titles) => onChange({ ...value, target_titles: titles })}
          placeholder={t('targetTitlePlaceholder')}
          color="blue"
          ariaLabel={t('targetTitles')}
        />

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1" role="group" aria-label={t('quickSuggestions')}>
          <span className="text-[10px] text-[#5f6368] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#0071e3]" aria-hidden="true" />
            {t('quickSuggestions')}:
          </span>
          {POPULAR_ROLES_SUGGESTIONS.map((role) => {
            const hasIt = value.target_titles.includes(role)
            if (hasIt) return null
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleAddRole(role)}
                className="rounded-md border border-[#d2d2d7] bg-white px-2 py-0.5 text-[10px] text-[#1d1d1f] transition-colors hover:border-[#0066cc] hover:bg-[#f4f8fb] hover:text-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                aria-label={`Agregar puesto ${role}`}
              >
                + {role}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[8px] bg-[#f4f8fb] border border-[#0066cc]/15 p-2.5 text-[11px] text-[#0066cc] leading-normal flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{t('jobTargetUniversalHint')}</span>
      </div>
    </div>
  )
}
