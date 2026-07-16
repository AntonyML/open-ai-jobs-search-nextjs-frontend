'use client'

interface FunnelBarProps {
  label: string
  value: number
  pct: number
  max: number
  color: string
}

export function FunnelBar({ label, value, pct, max, color }: FunnelBarProps) {
  const width = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-right text-[12px] font-medium text-[#1d1d1f] shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-20 text-[12px] font-semibold text-[#1d1d1f] tabular-nums">
        {value}
        {pct > 0 && <span className="text-[#858585] font-normal ml-1">({pct}%)</span>}
      </span>
    </div>
  )
}
