'use client'

import type { CalibrationKeyword } from '@/types/pipeline'

function KeywordRow({ kw, barColor, dotColor }: {
  kw: CalibrationKeyword
  barColor: string
  dotColor: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
      <span className="text-sm text-[#1d1d1f] min-w-[120px] capitalize">{kw.keyword}</span>
      <div className="flex-1 h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${kw.interview_rate}%` }} />
      </div>
      <span className="w-12 text-right text-[11px] text-[#707070] tabular-nums">{kw.interview_rate}%</span>
      <span className="w-16 text-right text-[11px] text-[#858585]">in {kw.present_in_count} jobs</span>
    </div>
  )
}

export function KeywordList({ title, keywords, variant = 'top' }: {
  title: string
  keywords: CalibrationKeyword[]
  variant?: 'top' | 'bottom'
}) {
  if (!keywords.length) return null

  const barColor = variant === 'top' ? 'bg-emerald-400' : 'bg-rose-300'
  const dotColor = variant === 'top' ? 'bg-emerald-400' : 'bg-rose-300'
  const limit = variant === 'top' ? 8 : 5

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">{title}</h3>
      <div className="space-y-2">
        {keywords.slice(0, limit).map((kw, i) => (
          <KeywordRow key={i} kw={kw} barColor={barColor} dotColor={dotColor} />
        ))}
      </div>
    </div>
  )
}
