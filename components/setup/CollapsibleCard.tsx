'use client'

import { useTranslations } from 'next-intl'

interface CollapsibleCardProps {
  id: string
  index: number
  title: string
  isFilled: boolean
  isOpen: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  badgeColor: string
  badgeTextColor: string
  placeholder: string
  children: React.ReactNode
}

export function CollapsibleCard({
  id,
  index,
  title,
  isFilled,
  isOpen,
  onToggle,
  onRemove,
  badgeColor,
  badgeTextColor,
  placeholder,
  children,
}: CollapsibleCardProps) {
  const t = useTranslations('setup')
  return (
    <div className="animate-fade-in-up overflow-hidden rounded-xl border border-[#e2e2e5] bg-white">
      {/* Clickable header — toggles collapse */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => onToggle(id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(id)
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#fafafa]"
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${badgeColor} ${badgeTextColor}`}
          >
            {index + 1}
          </span>
          <span className="text-[13px] font-medium text-[#474747]">{title}</span>
          {!isFilled && (
            <span className="text-[11px] text-[#858585]">{t('notFilled')}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            className={`h-3.5 w-3.5 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(id)
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#858585] transition-all hover:bg-rose-50 hover:text-rose-500"
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible body */}
      {isOpen && (
        <div className="animate-fade-in-up space-y-3 border-t border-[#e2e2e5] p-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Section wrapper (used for list of collapsible cards) ──────────

interface CollapsibleCardListWrapperProps {
  title: string
  countLabel: string
  icon: React.ReactNode
  count: number
  emptyMessage: string
  addLabel: string
  onAdd: () => void
  isEmpty: boolean
  children: React.ReactNode
}

export function CollapsibleCardListWrapper({
  title,
  countLabel,
  icon,
  count,
  emptyMessage,
  addLabel,
  onAdd,
  isEmpty,
  children,
}: CollapsibleCardListWrapperProps) {
  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          {icon}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
              {title}
            </p>
            <p className="text-[11px] text-[#858585]">
              {countLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-full border border-[#0066cc] px-3 py-1.5 text-[11px] font-medium text-[#0066cc] transition-all hover:bg-[#f4f8fb]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {addLabel}
        </button>
      </div>

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-[#d2d2d7] p-8 text-center">
          <p className="text-sm text-[#858585]">{emptyMessage}</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 text-[13px] font-medium text-[#0066cc] hover:underline"
          >
            + {addLabel}
          </button>
        </div>
      )}

      {!isEmpty && <div className="space-y-4">{children}</div>}
    </div>
  )
}
