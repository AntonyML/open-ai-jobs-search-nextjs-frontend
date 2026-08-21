'use client'

import { useTranslations } from 'next-intl'

interface SectionStatus {
  id: string
  labelKey: string
  isComplete: boolean
  count?: number
}

interface Props {
  sections: SectionStatus[]
  activeSection?: string
  onSelectSection?: (id: string) => void
}

export function ProfileSectionNav({ sections, activeSection, onSelectSection }: Props) {
  const t = useTranslations('setup')

  function scrollToSection(id: string) {
    onSelectSection?.(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      aria-label={t('jumpToSection')}
      className="sticky top-16 z-20 my-4 -mx-2 sm:mx-0 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#e5e5ea] bg-white/85 p-1.5 backdrop-blur-md shadow-xs scrollbar-none"
    >
      {sections.map((sec) => {
        const isActive = activeSection === sec.id
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollToSection(sec.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
              isActive
                ? 'bg-[#0066cc] text-white shadow-xs'
                : 'text-[#505050] hover:bg-[#f2f2f7] hover:text-[#1d1d1f]'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                sec.isComplete
                  ? isActive
                    ? 'bg-white/30 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                  : isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[#e5e5ea] text-[#707070]'
              }`}
            >
              {sec.isComplete ? '✓' : '•'}
            </span>
            <span>{t(sec.labelKey)}</span>
            {typeof sec.count === 'number' && sec.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#e5e5ea] text-[#505050]'
                }`}
              >
                {sec.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
