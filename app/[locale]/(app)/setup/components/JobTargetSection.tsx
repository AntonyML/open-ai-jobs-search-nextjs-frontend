'use client'

import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { TagInput } from '@/components/ui/TagInput'

export interface JobTarget {
  target_titles: string[]
  seniority: string | null
  work_mode: string[]
  search_locations: string[]
  search_radius_km: number | null
  employment_types: string[]
  industry: string
  keywords: string[]
  exclude_keywords: string[]
  exclude_companies: string[]
  salary_min: number | null
  salary_max: number | null
  availability: string | null
  visa_needed: boolean | null
  relocation_willing: boolean | null
}

const DEFAULT_JOB_TARGET: JobTarget = {
  target_titles: [],
  seniority: null,
  work_mode: [],
  search_locations: [],
  search_radius_km: null,
  employment_types: [],
  industry: '',
  keywords: [],
  exclude_keywords: [],
  exclude_companies: [],
  salary_min: null,
  salary_max: null,
  availability: null,
  visa_needed: null,
  relocation_willing: null,
}

interface Props {
  value: JobTarget
  onChange: (value: JobTarget) => void
}

const SENIORITY_OPTIONS = [
  'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive',
] as const

const WORK_MODE_OPTIONS = ['remote', 'hybrid', 'onsite'] as const

const EMPLOYMENT_TYPE_OPTIONS = [
  'full-time', 'part-time', 'contract', 'freelance', 'internship',
] as const

const AVAILABILITY_OPTIONS = ['immediate', 'within_month', 'exploring'] as const

type TagField = 'target_titles' | 'search_locations'

export function JobTargetSection({ value, onChange }: Props) {
  const t = useTranslations('setup')

  function update<K extends keyof JobTarget>(key: K, val: JobTarget[K]) {
    onChange({ ...value, [key]: val })
  }

  function toggleListItem(field: 'work_mode' | 'employment_types', item: string) {
    const list = value[field] as string[]
    if (list.includes(item)) {
      update(field, list.filter((x) => x !== item) as any)
    } else {
      update(field, [...list, item] as any)
    }
  }

  function addTag(field: TagField) {
    update(field, [...value[field], ''] as any)
  }

  function updateTag(field: TagField, idx: number, text: string) {
    const list = [...value[field]]
    list[idx] = text
    update(field, list as any)
  }

  function removeTag(field: TagField, idx: number) {
    update(field, value[field].filter((_, i) => i !== idx) as any)
  }

  function renderTagList(field: TagField, placeholder: string, hint: string) {
    const items = value[field]
    return (
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className="field flex-1 text-sm"
              placeholder={t(placeholder)}
              value={item}
              onChange={(e) => updateTag(field, i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeTag(field, i)}
              className="shrink-0 text-[#b0b0b0] hover:text-rose-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addTag(field)}
          className="text-[11px] font-medium text-[#0066cc] hover:underline"
        >
          + {hint}
        </button>
      </div>
    )
  }

  function renderChipGroup(
    field: 'work_mode' | 'employment_types',
    options: readonly string[],
    labelKey: string,
  ) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = (value[field] as string[]).includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleListItem(field, opt)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                selected
                  ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                  : 'border-[#d2d2d7] text-[#707070] hover:border-[#0071e3] hover:text-[#0071e3]'
              }`}
            >
              {t(labelKey + opt.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(''))}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">{t('jobTarget')}</p>
          <p className="text-[11px] text-[#b0b0b0]">{t('jobTargetDesc')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm text-[#1d1d1f]">
            {t('targetTitles')} <span className="text-rose-400">*</span>
            <span className="ml-1 text-[11px] text-[#b0b0b0]">{t('targetTitlesHint')}</span>
          </label>
          {renderTagList('target_titles', 'targetTitlesPlaceholder', t('targetTitles'))}
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('seniority')} <span className="text-rose-400">*</span>
          </label>
          <select
            className="field mt-1.5 text-sm"
            value={value.seniority ?? ''}
            onChange={(e) => update('seniority', e.target.value || null)}
          >
            <option value="">--</option>
            {SENIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{t('seniority' + opt.charAt(0).toUpperCase() + opt.slice(1))}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('industry')}
          </label>
          <input
            className="field mt-1.5 text-sm"
            placeholder={t('industryPlaceholder')}
            value={value.industry}
            onChange={(e) => update('industry', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-[#1d1d1f]">
            {t('workMode')} <span className="text-rose-400">*</span>
          </label>
          <div className="mt-1.5">
            {renderChipGroup('work_mode', WORK_MODE_OPTIONS, 'workMode')}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-[#1d1d1f]">
            {t('searchLocations')} <span className="text-rose-400">*</span>
            <span className="ml-1 text-[11px] text-[#b0b0b0]">{t('searchLocationsHint')}</span>
          </label>
          {renderTagList('search_locations', 'searchLocationsPlaceholder', t('searchLocations'))}
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('searchRadius')}
          </label>
          <input
            type="number"
            min="0"
            className="field mt-1.5 text-sm"
            placeholder="80"
            value={value.search_radius_km ?? ''}
            onChange={(e) => update('search_radius_km', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-[#1d1d1f]">
            {t('employmentTypes')} <span className="text-rose-400">*</span>
          </label>
          <div className="mt-1.5">
            {renderChipGroup('employment_types', EMPLOYMENT_TYPE_OPTIONS, 'employmentType')}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-[#1d1d1f]">
            {t('keywords')}
          </label>
          <div className="mt-1.5">
            <TagInput
              tags={value.keywords}
              onChange={(tags) => update('keywords', tags)}
              placeholder="Type a keyword and press Enter..."
              color="blue"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('excludeKeywords')}
          </label>
          <div className="mt-1.5">
            <TagInput
              tags={value.exclude_keywords}
              onChange={(tags) => update('exclude_keywords', tags)}
              placeholder="Type a keyword and press Enter..."
              color="rose"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('excludeCompanies')}
          </label>
          <textarea
            className="field mt-1.5 h-20 resize-none text-sm"
            placeholder={"Meta\nGoogle\nAmazon"}
            value={value.exclude_companies.join('\n')}
            onChange={(e) => update('exclude_companies', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          />
          <p className="mt-1 text-[11px] text-[#b0b0b0]">{t('excludeCompanies')} — one per line</p>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('salaryRange')}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="field flex-1 text-sm"
              placeholder={t('salaryMin')}
              value={value.salary_min ?? ''}
              onChange={(e) => update('salary_min', e.target.value ? parseInt(e.target.value) : null)}
            />
            <span className="text-xs text-[#b0b0b0]">—</span>
            <input
              type="number"
              min="0"
              className="field flex-1 text-sm"
              placeholder={t('salaryMax')}
              value={value.salary_max ?? ''}
              onChange={(e) => update('salary_max', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('availability')}
          </label>
          <select
            className="field mt-1.5 text-sm"
            value={value.availability ?? ''}
            onChange={(e) => update('availability', e.target.value || null)}
          >
            <option value="">--</option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{t('availability' + opt.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(''))}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('visaNeeded')}
          </label>
          <div className="mt-1.5 flex gap-2">
            {([
              ['yes', true],
              ['no', false],
              ['notSure', null],
            ] as const).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => update('visa_needed', val)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  value.visa_needed === val
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                    : 'border-[#d2d2d7] text-[#707070] hover:border-[#0071e3]'
                }`}
              >
                {t('visaNeeded' + key.charAt(0).toUpperCase() + key.slice(1))}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('relocationWilling')}
          </label>
          <div className="mt-1.5 flex gap-2">
            {[
              ['yes', true] as const,
              ['no', false] as const,
            ].map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => update('relocation_willing', val as boolean | null)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  value.relocation_willing === val
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                    : 'border-[#d2d2d7] text-[#707070] hover:border-[#0071e3]'
                }`}
              >
                {t('relocationWilling' + key.charAt(0).toUpperCase() + key.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DEFAULT_JOB_TARGET }
