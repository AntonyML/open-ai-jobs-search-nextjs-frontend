'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'

export interface EducationEntry {
  _id: string
  degree: string
  institution: string
  period: string
  key_topics: string
}

interface Props {
  educations: EducationEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof EducationEntry, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function EducationSection({
  educations,
  openCards,
  onToggle,
  onUpdate,
  onAdd,
  onRemove,
}: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const filled = educations.filter((e) => e.degree.trim())

  return (
    <CollapsibleCardListWrapper
      title={t('education')}
      countLabel={t('degreesAdded', { count: filled.length })}
      icon={
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
      }
      count={filled.length}
      emptyMessage={t('noEducation')}
      addLabel={t('addEducation')}
      onAdd={onAdd}
      isEmpty={educations.length === 0}
    >
      {educations.map((edu, idx) => (
        <CollapsibleCard
          key={edu._id}
          id={edu._id}
          index={idx}
          title={edu.degree || t('degreeFallback', { n: idx + 1 })}
          isFilled={!!edu.degree.trim()}
          isOpen={openCards.has(edu._id)}
          onToggle={onToggle}
          onRemove={onRemove}
          badgeColor="bg-violet-100"
          badgeTextColor="text-violet-700"
          placeholder="degree"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-[#1d1d1f]">
              {t('degree')} <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder="B.Sc. Computer Science"
                value={edu.degree}
                onChange={(e) => onUpdate(edu._id, 'degree', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('institution')} <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder="MIT"
                value={edu.institution}
                onChange={(e) => onUpdate(edu._id, 'institution', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('period')} <span className="text-[#b0b0b0]">{t('dateFormat')}</span>
              <input
                type="month"
                className="field mt-1.5"
                placeholder="2020-09"
                value={edu.period}
                onChange={(e) => onUpdate(edu._id, 'period', e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm text-[#1d1d1f]">
            {t('keyTopics')} <span className="text-[#b0b0b0]">{tc('optional')} — {t('relevantCoursework')}</span>
            <textarea
              className="field mt-1.5 h-16 resize-none"
              placeholder="Machine Learning, Distributed Systems, Algorithm Design"
              value={edu.key_topics}
              onChange={(e) => onUpdate(edu._id, 'key_topics', e.target.value)}
            />
          </label>
        </CollapsibleCard>
      ))}
    </CollapsibleCardListWrapper>
  )
}
