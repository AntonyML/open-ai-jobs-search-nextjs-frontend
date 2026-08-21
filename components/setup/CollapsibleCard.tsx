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
  children,
}: CollapsibleCardProps) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')
  const contentId = `collapsible-content-${id}`

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e2e5] bg-white transition-all duration-200 shadow-sm hover:border-[#d2d2d7]">
      {/* Semantic Accessible Accordion Header */}
      <div className="flex w-full items-center justify-between px-4 py-3 bg-[#fafafc] transition-colors hover:bg-[#f4f4f7]">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => onToggle(id)}
          className="flex flex-1 items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] rounded-md"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-xs ${badgeColor} ${badgeTextColor}`}
          >
            {index + 1}
          </span>
          <span className="text-[13px] font-semibold text-[#1d1d1f] truncate">
            {title}
          </span>
          {!isFilled && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 shrink-0">
              {t('notFilled')}
            </span>
          )}
          {isFilled && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200 shrink-0">
              ✓
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 pl-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => onToggle(id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#707070] transition-colors hover:bg-[#e8e8ed] hover:text-[#1d1d1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
            title={isOpen ? 'Collapse' : 'Expand'}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(id)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#858585] transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title={tc('remove') || 'Remove'}
            aria-label={`${tc('remove') || 'Remove'} ${title}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Accessible Collapsible Body */}
      {isOpen && (
        <div id={contentId} className="space-y-4 border-t border-[#e2e2e5] p-4 bg-white">
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
  emptyMessage,
  addLabel,
  onAdd,
  isEmpty,
  children,
}: CollapsibleCardListWrapperProps) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
              {title}
            </p>
            <p className="text-[11px] text-[#707070] font-medium">
              {countLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066cc] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#0055b3] active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {addLabel}
        </button>
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-[#d2d2d7] bg-[#fbfbfd] p-6 text-center">
          <p className="text-xs text-[#707070] mb-3">{emptyMessage}</p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d2d2d7] bg-white px-3 py-1.5 text-xs font-medium text-[#1d1d1f] shadow-2xs hover:bg-[#f5f5f7] hover:border-[#c7c7cc] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {addLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">{children}</div>
      )}
    </div>
  )
}
