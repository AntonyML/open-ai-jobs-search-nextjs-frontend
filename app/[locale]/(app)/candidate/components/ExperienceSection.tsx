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
  location: string
  client_context?: string
  technologies?: string[]
  bullets: string[]
}

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

  return (
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
          title={exp.title || t('positionFallback', { n: idx + 1 })}
          isFilled={!!exp.title.trim()}
          isOpen={openCards.has(exp._id)}
          onToggle={onToggle}
          onRemove={onRemove}
          badgeColor="bg-emerald-100"
          badgeTextColor="text-emerald-700"
          placeholder="position"
        >
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
            <label className="block text-sm text-[#1d1d1f]">
              {t('startDate')} <span className="text-[#858585]">{t('dateFormat')}</span>
              <input
                type="month"
                className="field mt-1.5"
                value={exp.start_date}
                onChange={(e) => onUpdate(exp._id, 'start_date', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('endDate')} <span className="text-[#858585]">{t('orPresent')}</span>
              <input
                type="month"
                className="field mt-1.5"
                value={exp.end_date}
                onChange={(e) => onUpdate(exp._id, 'end_date', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('location')} <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder={t('expLocationPlaceholder')}
                value={exp.location}
                onChange={(e) => onUpdate(exp._id, 'location', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              Context / Client / Project <span className="text-[#858585]">{tc('optional')}</span>
              <input
                className="field mt-1.5"
                placeholder="e.g. International Client (Dominican Rep.)"
                value={exp.client_context || ''}
                onChange={(e) => onUpdate(exp._id, 'client_context', e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm text-[#1d1d1f] sm:col-span-2">
            Technologies Used in this Role <span className="text-[#858585]">{tc('optional')} — press Enter after each tag</span>
            <div className="mt-1.5">
              <TagInput
                tags={exp.technologies || []}
                onChange={(tags) => {
                  if (onUpdateTechnologies) onUpdateTechnologies(exp._id, tags)
                  else onUpdate(exp._id, 'technologies', tags)
                }}
                placeholder="e.g. C#, .NET, PostgreSQL"
                color="violet"
              />
            </div>
          </label>

          <label className="block text-sm text-[#1d1d1f] sm:col-span-2">
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
        </CollapsibleCard>
      ))}
    </CollapsibleCardListWrapper>
  )
}
