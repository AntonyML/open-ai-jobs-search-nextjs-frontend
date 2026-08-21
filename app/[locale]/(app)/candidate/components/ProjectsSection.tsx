'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'
import { TagInput } from '@/components/ui/TagInput'

export interface ProjectEntry {
  _id: string
  name: string
  description: string
  role?: string
  client?: string
  start_date?: string
  end_date?: string
  is_ongoing?: boolean
  url?: string
  technologies?: string[]
}

const POPULAR_PROJECT_TECHS = [
  'React',
  'TypeScript',
  'Next.js',
  'Python',
  'C#',
  '.NET',
  'FastAPI',
  'PostgreSQL',
  'Docker',
  'Tailwind CSS',
]

interface Props {
  projects: ProjectEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof ProjectEntry, value: any) => void
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
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  const filled = projects.filter((p) => p.name.trim())

  function checkDetailsOpen(proj: ProjectEntry): boolean {
    if (expandedMap[proj._id] !== undefined) {
      return expandedMap[proj._id]
    }
    return false
  }

  function toggleDetails(id: string, currentOpen: boolean) {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !currentOpen,
    }))
  }

  function handleAddTech(id: string, currentTechs: string[], tech: string) {
    if (!currentTechs.includes(tech)) {
      onUpdate(id, 'technologies', [...currentTechs, tech])
    }
  }

  return (
    <div id="section-projects">
      <CollapsibleCardListWrapper
        title={t('projects')}
        countLabel={t('projectsAdded', { count: filled.length })}
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        {projects.map((proj, idx) => {
          const isDetailsOpen = checkDetailsOpen(proj)
          const nameId = `proj-name-${proj._id}`
          const startId = `proj-start-${proj._id}`
          const endId = `proj-end-${proj._id}`
          const descId = `proj-desc-${proj._id}`
          const roleId = `proj-role-${proj._id}`
          const clientId = `proj-client-${proj._id}`
          const urlId = `proj-url-${proj._id}`
          const ongoingId = `proj-ongoing-${proj._id}`
          const detailsContainerId = `proj-details-${proj._id}`

          return (
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
              {/* Essential Tier 1 Fields */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Project Name */}
                  <div>
                    <label htmlFor={nameId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      {t('projectName')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                      <span className="sr-only"> ({t('required')})</span>
                    </label>
                    <input
                      id={nameId}
                      name={`projectName_${proj._id}`}
                      required
                      aria-required="true"
                      className="field"
                      placeholder={t('projectNamePlaceholder')}
                      value={proj.name}
                      onChange={(e) => onUpdate(proj._id, 'name', e.target.value)}
                    />
                  </div>

                  {/* Dates & Period with Ongoing toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#1d1d1f]">
                        {t('projectPeriod')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                      </span>
                      <label htmlFor={ongoingId} className="inline-flex items-center gap-1.5 text-xs text-[#505050] cursor-pointer">
                        <input
                          id={ongoingId}
                          type="checkbox"
                          checked={!!proj.is_ongoing}
                          onChange={(e) => {
                            const checked = e.target.checked
                            onUpdate(proj._id, 'is_ongoing', checked)
                            if (checked) onUpdate(proj._id, 'end_date', '')
                          }}
                          className="rounded border-[#d2d2d7] text-[#0066cc] focus:ring-[#0066cc]"
                        />
                        <span>{t('projectOngoing')}</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={startId} className="sr-only">{t('startDate')}</label>
                        <input
                          id={startId}
                          type="month"
                          className="field text-xs"
                          aria-label={t('startDate')}
                          value={proj.start_date || ''}
                          onChange={(e) => onUpdate(proj._id, 'start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={endId} className="sr-only">{t('endDate')}</label>
                        <input
                          id={endId}
                          type="month"
                          disabled={!!proj.is_ongoing}
                          className="field text-xs disabled:bg-[#f2f2f7] disabled:text-[#858585]"
                          aria-label={t('endDate')}
                          placeholder={proj.is_ongoing ? t('present') : 'AAAA-MM'}
                          value={proj.is_ongoing ? '' : proj.end_date || ''}
                          onChange={(e) => onUpdate(proj._id, 'end_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor={descId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('description')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                  </label>
                  <textarea
                    id={descId}
                    className="field h-20 resize-none"
                    placeholder={t('projectDescPlaceholder')}
                    value={proj.description}
                    onChange={(e) => onUpdate(proj._id, 'description', e.target.value)}
                  />
                </div>

                {/* Progressive Disclosure Toggle */}
                <div className="border-t border-[#f0f0f4] pt-2">
                  <button
                    type="button"
                    aria-expanded={isDetailsOpen}
                    aria-controls={detailsContainerId}
                    onClick={() => toggleDetails(proj._id, isDetailsOpen)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#0066cc] hover:bg-[#f4f8fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] transition-colors"
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isDetailsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{isDetailsOpen ? t('hideDetails') : t('showMoreDetails')}</span>
                  </button>
                </div>

                {/* Tier 2: Additional Details (Role, URL, Client, Technologies) */}
                {isDetailsOpen && (
                  <div
                    id={detailsContainerId}
                    className="space-y-4 rounded-xl bg-[#fbfbfd] p-3.5 border border-[#e5e5ea] animate-fade-in-up"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={roleId} className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                          {t('projectRole')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                        </label>
                        <input
                          id={roleId}
                          className="field text-xs"
                          placeholder={t('projectRolePlaceholder')}
                          value={proj.role || ''}
                          onChange={(e) => onUpdate(proj._id, 'role', e.target.value)}
                        />
                      </div>

                      <div>
                        <label htmlFor={clientId} className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                          {t('projectClient')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                        </label>
                        <input
                          id={clientId}
                          className="field text-xs"
                          placeholder={t('projectClientPlaceholder')}
                          value={proj.client || ''}
                          onChange={(e) => onUpdate(proj._id, 'client', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={urlId} className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                        {t('projectUrl')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                      </label>
                      <input
                        id={urlId}
                        type="url"
                        className="field text-xs"
                        placeholder={t('projectUrlPlaceholder')}
                        value={proj.url || ''}
                        onChange={(e) => onUpdate(proj._id, 'url', e.target.value)}
                      />
                    </div>

                    {/* Technologies TagInput & Quick Suggestions */}
                    <div>
                      <span className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                        {t('projectTechnologies')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                      </span>
                      <TagInput
                        tags={proj.technologies || []}
                        onChange={(tags) => onUpdate(proj._id, 'technologies', tags)}
                        placeholder="e.g. React, Next.js, Python..."
                        color="blue"
                      />

                      {/* Quick Chips */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={t('quickSuggestions')}>
                        <span className="text-[10px] text-[#707070]">{t('quickSuggestions')}:</span>
                        {POPULAR_PROJECT_TECHS.map((tech) => {
                          const hasIt = (proj.technologies || []).includes(tech)
                          if (hasIt) return null
                          return (
                            <button
                              key={tech}
                              type="button"
                              onClick={() => handleAddTech(proj._id, proj.technologies || [], tech)}
                              className="rounded-md border border-[#d2d2d7] bg-white px-2 py-0.5 text-[10px] text-[#404040] transition-colors hover:border-[#0066cc] hover:bg-[#f4f8fb] hover:text-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                              aria-label={`Agregar tecnología ${tech}`}
                            >
                              + {tech}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )
        })}
      </CollapsibleCardListWrapper>
    </div>
  )
}
