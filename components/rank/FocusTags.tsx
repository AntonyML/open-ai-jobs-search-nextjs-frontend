'use client'

import { cn } from '@/lib/utils'

const FOCUS_TAGS = [
  'AI Engineering',
  'Full-Stack Development',
  'Backend Engineering',
  'Data Science',
  'DevOps / Platform',
  'Mobile Development',
  'Frontend Development',
  'Machine Learning',
]

export function FocusTags({
  focusArea,
  customFocus,
  onToggleTag,
  onCustomFocus,
  t,
  tc,
}: {
  focusArea: string
  customFocus: string
  onToggleTag: (tag: string) => void
  onCustomFocus: (value: string) => void
  t: (key: string) => string
  tc: (key: string) => string
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
        {t('focusArea')} <span className="text-[#b0b0b0] font-normal normal-case">{tc('optional')}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {FOCUS_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all',
              focusArea === tag
                ? 'bg-[#0071e3] text-white'
                : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder={t('customFocusPlaceholder')}
        value={customFocus}
        onChange={e => { onCustomFocus(e.target.value) }}
        className="field mt-3 text-sm"
      />
    </div>
  )
}
