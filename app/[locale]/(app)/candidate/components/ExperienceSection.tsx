'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'
import { TagInput } from '@/components/ui/TagInput'

export interface ExperienceEntry {
  _id: string
  title: string
  company: string
  start_date: string
  end_date: string
  is_current?: boolean
  location: string
  work_mode?: 'onsite' | 'hybrid' | 'remote'
  client_context?: string
  technologies?: string[]
  bullets: string[]
}

const POPULAR_EXPERIENCE_TECHS = [
  'C#',
  '.NET',
  'PostgreSQL',
  'SQL Server',
  'React',
  'TypeScript',
  'Docker',
  'Git',
  'AWS',
  'FastAPI',
]

interface Props {
  experiences: ExperienceEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof ExperienceEntry, value: any) => void
  onUpdateBullets: (id: string, bullets: string[]) => void
  onUpdateTechnologies?: (id: string, technologies: string[]) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function ExperienceSection({
  experiences,
  openCards,
  onToggle,
  onUpdate,
  onUpdateBullets,
  onUpdateTechnologies,
  onAdd,
  onRemove,
}: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const filled = experiences.filter((e) => e.title.trim())

  function handleAddTech(id: string, currentTechs: string[], tech: string) {
    if (!currentTechs.includes(tech)) {
      const next = [...currentTechs, tech]
      if (onUpdateTechnologies) onUpdateTechnologies(id, next)
      else onUpdate(id, 'technologies', next)
    }
  }

  function handleWorkModeSelect(id: string, mode: 'onsite' | 'hybrid' | 'remote') {
    onUpdate(id, 'work_mode', mode)
  }

  return (
    <div id="section-experience">
      <CollapsibleCardListWrapper
        title={t('experience')}
        countLabel={t('positionsAdded', { count: filled.length })}
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        }
        count={filled.length}
        emptyMessage={t('noExperience')}
        addLabel={t('addExperience')}
        onAdd={onAdd}
        isEmpty={experiences.length === 0}
      >
        {experiences.map((exp, idx) => (
          <CollapsibleCard
            key={exp._id}
            id={exp._id}
            index={idx}
            title={
              exp.title && exp.company
                ? `${exp.title} — ${exp.company}`
                : exp.title || t('positionFallback', { n: idx + 1 })
            }
            isFilled={!!exp.title.trim() && !!exp.company.trim()}
            isOpen={openCards.has(exp._id)}
            onToggle={onToggle}
            onRemove={onRemove}
            badgeColor="bg-emerald-100"
            badgeTextColor="text-emerald-700"
            placeholder="position"
          >
            <div className="space-y-4">
              {/* Row 1: Title & Company */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-[#1d1d1f]">
                  {t('jobTitle')} <span className="text-rose-400">*</span>
                  <input
                    required
                    className="field mt-1.5"
                    placeholder={t('expTitlePlaceholder')}
                    value={exp.title}
                    onChange={(e) => onUpdate(exp._id, 'title', e.target.value)}
                  />
                </label>

                <label className="block text-sm text-[#1d1d1f]">
                  {t('company')} <span className="text-rose-400">*</span>
                  <input
                    required
                    className="field mt-1.5"
                    placeholder={t('expCompanyPlaceholder')}
                    value={exp.company}
                    onChange={(e) => onUpdate(exp._id, 'company', e.target.value)}
                  />
                </label>
              </div>

              {/* Row 2: Dates with 'Currently working here' toggle */}
              <div className="rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
                    {t('period')}
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-[#505050] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!exp.is_current || (!exp.end_date && !!exp.start_date)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        onUpdate(exp._id, 'is_current', checked)
                        if (checked) onUpdate(exp._id, 'end_date', '')
                      }}
                      className="rounded border-[#d2d2d7] text-[#0066cc] focus:ring-[#0066cc]"
                    />
                    <span className="font-medium">{t('currentlyWorkingHere')}</span>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[#1d1d1f]">
                    {t('startDate')} <span className="text-[#858585]">{t('dateFormat')}</span>
                    <input
                      type="month"
                      className="field mt-1 text-xs"
                      value={exp.start_date}
                      onChange={(e) => onUpdate(exp._id, 'start_date', e.target.value)}
                    />
                  </label>

                  <label className="block text-xs font-medium text-[#1d1d1f]">
                    {t('endDate')} <span className="text-[#858585]">{exp.is_current ? t('present') : t('orPresent')}</span>
                    <input
                      type="month"
                      disabled={!!exp.is_current}
                      className="field mt-1 text-xs disabled:bg-[#f2f2f7] disabled:text-[#858585]"
                      placeholder={exp.is_current ? t('present') : 'AAAA-MM'}
                      value={exp.is_current ? '' : exp.end_date}
                      onChange={(e) => onUpdate(exp._id, 'end_date', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* Row 3: Structured Location & Context */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1d1d1f]">
                      {t('location')} <span className="text-rose-400">*</span>
                    </span>
                    {/* Work mode chips */}
                    <div className="flex items-center gap-1">
                      {(['onsite', 'hybrid', 'remote'] as const).map((mode) => {
                        const isSelected = exp.work_mode === mode
                        const label =
                          mode === 'onsite'
                            ? t('workModeOnsite')
                            : mode === 'hybrid'
                            ? t('workModeHybrid')
                            : t('workModeRemote')
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => handleWorkModeSelect(exp._id, mode)}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-[#0066cc] text-white shadow-2xs'
                                : 'bg-[#e5e5ea] text-[#505050] hover:bg-[#d2d2d7]'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <input
                    required
                    className="field mt-0.5"
                    placeholder={t('expLocationPlaceholder')}
                    value={exp.location}
                    onChange={(e) => onUpdate(exp._id, 'location', e.target.value)}
                  />
                </div>

                <label className="block text-sm text-[#1d1d1f]">
                  {t('contextClient')} <span className="text-[#858585]">{tc('optional')}</span>
                  <input
                    className="field mt-1.5"
                    placeholder={t('contextClientPlaceholder')}
                    value={exp.client_context || ''}
                    onChange={(e) => onUpdate(exp._id, 'client_context', e.target.value)}
                  />
                </label>
              </div>

              {/* Row 4: Technologies Used in Role with Quick Suggestions */}
              <div>
                <label className="block text-sm text-[#1d1d1f]">
                  {t('technologiesUsedInRole')} <span className="text-[#858585]">{tc('optional')}</span>
                </label>
                <div className="mt-1.5">
                  <TagInput
                    tags={exp.technologies || []}
                    onChange={(tags) => {
                      if (onUpdateTechnologies) onUpdateTechnologies(exp._id, tags)
                      else onUpdate(exp._id, 'technologies', tags)
                    }}
                    placeholder={t('techTagPlaceholder')}
                    color="violet"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#707070]">{t('quickSuggestions')}:</span>
                  {POPULAR_EXPERIENCE_TECHS.map((tech) => {
                    const hasIt = (exp.technologies || []).includes(tech)
                    if (hasIt) return null
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleAddTech(exp._id, exp.technologies || [], tech)}
                        className="rounded-md border border-[#d2d2d7] bg-white px-2 py-0.5 text-[10px] text-[#404040] transition-colors hover:border-[#0066cc] hover:bg-[#f4f8fb] hover:text-[#0066cc]"
                      >
                        + {tech}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row 5: Achievements / Bullets */}
              <label className="block text-sm text-[#1d1d1f]">
                {t('achievements')} <span className="text-[#858585]">{t('onePerLine')}</span>
                <div className="mt-1.5">
                  <TagInput
                    tags={exp.bullets}
                    onChange={(tags) => onUpdateBullets(exp._id, tags)}
                    placeholder={t('expBulletsPlaceholder')}
                    color="blue"
                  />
                </div>
              </label>
            </div>
          </CollapsibleCard>
        ))}
      </CollapsibleCardListWrapper>
    </div>
  )
}
