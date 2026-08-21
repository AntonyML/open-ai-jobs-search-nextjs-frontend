'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'

export interface LanguageEntry {
  _id: string
  language: string
  proficiency: string
}

const PROFICIENCY_OPTIONS = [
  { value: 'Native', label: 'Native / Bilingual' },
  { value: 'Fluent', label: 'Fluent / Full Professional (C2)' },
  { value: 'Advanced', label: 'Advanced (B2 / C1)' },
  { value: 'Intermediate', label: 'Intermediate (B1)' },
  { value: 'Basic', label: 'Elementary / Basic (A1 / A2)' },
]

interface Props {
  languages: LanguageEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof LanguageEntry, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function LanguagesSection({
  languages,
  openCards,
  onToggle,
  onUpdate,
  onAdd,
  onRemove,
}: Props) {
  const t = useTranslations('setup')
  const filled = languages.filter((l) => l.language.trim())

  return (
    <CollapsibleCardListWrapper
      title="Languages"
      countLabel={`${filled.length} added`}
      icon={
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
      }
      count={filled.length}
      emptyMessage="No languages added yet"
      addLabel="Add Language"
      onAdd={onAdd}
      isEmpty={languages.length === 0}
    >
      {languages.map((lang, idx) => (
        <CollapsibleCard
          key={lang._id}
          id={lang._id}
          index={idx}
          title={lang.language ? `${lang.language} (${lang.proficiency || 'Native'})` : `Language #${idx + 1}`}
          isFilled={!!lang.language.trim()}
          isOpen={openCards.has(lang._id)}
          onToggle={onToggle}
          onRemove={onRemove}
          badgeColor="bg-cyan-100"
          badgeTextColor="text-cyan-700"
          placeholder="language"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-[#1d1d1f]">
              Language <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder="e.g. English, Spanish"
                value={lang.language}
                onChange={(e) => onUpdate(lang._id, 'language', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              Proficiency Level <span className="text-rose-400">*</span>
              <select
                className="field mt-1.5"
                value={lang.proficiency || 'Native'}
                onChange={(e) => onUpdate(lang._id, 'proficiency', e.target.value)}
              >
                {PROFICIENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CollapsibleCard>
      ))}
    </CollapsibleCardListWrapper>
  )
}
