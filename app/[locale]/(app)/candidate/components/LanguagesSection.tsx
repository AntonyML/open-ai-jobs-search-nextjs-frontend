'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'

export interface LanguageEntry {
  _id: string
  language: string
  proficiency: string
}

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

  const proficiencyOptions = [
    { value: 'Native', label: t('langNative') },
    { value: 'Fluent', label: t('langFluent') },
    { value: 'Advanced', label: t('langAdvanced') },
    { value: 'Intermediate', label: t('langIntermediate') },
    { value: 'Basic', label: t('langBasic') },
  ]

  return (
    <div id="section-languages">
      <CollapsibleCardListWrapper
        title={t('languages')}
        countLabel={t('languagesAdded', { count: filled.length })}
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="7" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        }
        count={filled.length}
        emptyMessage={t('noLanguages')}
        addLabel={t('addLanguage')}
        onAdd={onAdd}
        isEmpty={languages.length === 0}
      >
        {languages.map((lang, idx) => {
          const langId = `lang-name-${lang._id}`
          const profId = `lang-prof-${lang._id}`

          return (
            <CollapsibleCard
              key={lang._id}
              id={lang._id}
              index={idx}
              title={lang.language ? `${lang.language} (${lang.proficiency || 'Native'})` : t('langFallback', { n: idx + 1 })}
              isFilled={!!lang.language.trim()}
              isOpen={openCards.has(lang._id)}
              onToggle={onToggle}
              onRemove={onRemove}
              badgeColor="bg-cyan-100"
              badgeTextColor="text-cyan-700"
              placeholder="language"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={langId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('languageName')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    <span className="sr-only"> ({t('required')})</span>
                  </label>
                  <input
                    id={langId}
                    name={`languageName_${lang._id}`}
                    required
                    aria-required="true"
                    className="field"
                    placeholder="e.g. English, Spanish"
                    value={lang.language}
                    onChange={(e) => onUpdate(lang._id, 'language', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={profId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('languageProficiency')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    <span className="sr-only"> ({t('required')})</span>
                  </label>
                  <select
                    id={profId}
                    name={`languageProficiency_${lang._id}`}
                    className="field"
                    value={lang.proficiency || 'Native'}
                    onChange={(e) => onUpdate(lang._id, 'proficiency', e.target.value)}
                  >
                    {proficiencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CollapsibleCard>
          )
        })}
      </CollapsibleCardListWrapper>
    </div>
  )
}
