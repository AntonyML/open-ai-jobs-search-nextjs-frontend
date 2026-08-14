'use client'

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  t,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  t: (key: string) => string
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-medium text-[#474747] hover:bg-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('prev')}
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
            return (
              <span key={p} className="flex items-center">
                {showEllipsis && <span className="px-1 text-[11px] text-[#b0b0b0]">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[32px] rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-[#0071e3] text-white'
                      : 'text-[#474747] hover:bg-[#f5f5f7]'
                  }`}
                >
                  {p}
                </button>
              </span>
            )
          })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-medium text-[#474747] hover:bg-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('next')}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
