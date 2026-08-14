'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'

export interface ProjectEntry {
  _id: string
  name: string
  description: string
}

interface Props {
  projects: ProjectEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof ProjectEntry, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function ProjectsSection({
  projects,
  openCards,
  onToggle,
  onUpdate,
  onAdd,
  onRemove,
}: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const filled = projects.filter((p) => p.name.trim())

  return (
    <CollapsibleCardListWrapper
      title={t('projects')}
      countLabel={t('projectsAdded', { count: filled.length })}
      icon={
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
      }
      count={filled.length}
      emptyMessage={t('noProjects')}
      addLabel={t('addProject')}
      onAdd={onAdd}
      isEmpty={projects.length === 0}
    >
      {projects.map((proj, idx) => (
        <CollapsibleCard
          key={proj._id}
          id={proj._id}
          index={idx}
                  title={proj.name || t('projectFallback', { n: idx + 1 })}
          isFilled={!!proj.name.trim()}
          isOpen={openCards.has(proj._id)}
          onToggle={onToggle}
          onRemove={onRemove}
          badgeColor="bg-sky-100"
          badgeTextColor="text-sky-700"
          placeholder="project"
        >
          <label className="block text-sm text-[#1d1d1f]">
            {t('projectName')} <span className="text-rose-400">*</span>
            <input
              required
              className="field mt-1.5"
              placeholder={t('projectNamePlaceholder')}
              value={proj.name}
              onChange={(e) => onUpdate(proj._id, 'name', e.target.value)}
            />
          </label>
          <label className="block text-sm text-[#1d1d1f]">
            {t('description')} <span className="text-[#858585]">{tc('optional')}</span>
            <textarea
              className="field mt-1.5 h-20 resize-none"
              placeholder={t('projectDescPlaceholder')}
              value={proj.description}
              onChange={(e) => onUpdate(proj._id, 'description', e.target.value)}
            />
          </label>
        </CollapsibleCard>
      ))}
    </CollapsibleCardListWrapper>
  )
}
