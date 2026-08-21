'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'
import { TagInput } from '@/components/ui/TagInput'

export interface EducationEntry {
  _id: string
  degree: string
  institution: string
  start_date: string
  end_date: string
  key_topics: string[]
}

interface Props {
  educations: EducationEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof EducationEntry, value: any) => void
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
    <div id="section-education">
      <CollapsibleCardListWrapper
        title={t('education')}
        countLabel={t('degreesAdded', { count: filled.length })}
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        {educations.map((edu, idx) => {
          const degreeId = `edu-degree-${edu._id}`
          const instId = `edu-inst-${edu._id}`
          const startId = `edu-start-${edu._id}`
          const endId = `edu-end-${edu._id}`

          return (
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
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={degreeId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      {t('degree')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                      <span className="sr-only"> ({t('required')})</span>
                    </label>
                    <input
                      id={degreeId}
                      name={`degree_${edu._id}`}
                      required
                      aria-required="true"
                      className="field"
                      placeholder={t('eduDegreePlaceholder')}
                      value={edu.degree}
                      onChange={(e) => onUpdate(edu._id, 'degree', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor={instId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      {t('institution')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                      <span className="sr-only"> ({t('required')})</span>
                    </label>
                    <input
                      id={instId}
                      name={`institution_${edu._id}`}
                      required
                      aria-required="true"
                      className="field"
                      placeholder={t('eduInstitutionPlaceholder')}
                      value={edu.institution}
                      onChange={(e) => onUpdate(edu._id, 'institution', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor={startId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      {t('startDate')} <span className="text-[#707070] font-normal">({t('dateFormat')})</span>
                    </label>
                    <input
                      id={startId}
                      type="month"
                      className="field text-xs"
                      aria-label={t('startDate')}
                      value={edu.start_date}
                      onChange={(e) => onUpdate(edu._id, 'start_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor={endId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      {t('endDate')} <span className="text-[#707070] font-normal">({t('orPresent')})</span>
                    </label>
                    <input
                      id={endId}
                      type="month"
                      className="field text-xs"
                      aria-label={t('endDate')}
                      value={edu.end_date}
                      onChange={(e) => onUpdate(edu._id, 'end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('keyTopics')} <span className="text-[#707070] font-normal">({tc('optional')} — {t('relevantCoursework')})</span>
                  </span>
                  <TagInput
                    tags={edu.key_topics}
                    onChange={(tags) => onUpdate(edu._id, 'key_topics', tags)}
                    placeholder={t('eduTopicsPlaceholder')}
                    color="violet"
                  />
                </div>
              </div>
            </CollapsibleCard>
          )
        })}
      </CollapsibleCardListWrapper>
    </div>
  )
}
