'use client'

export function RankSlider({
  value,
  onChange,
  t,
}: {
  value: number
  onChange: (v: number) => void
  t: (key: string) => string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#1d1d1f] font-medium">{t('topResults')}</p>
        <span className="text-sm font-bold text-[#0071e3]">{value}</span>
      </div>
      <input
        type="range"
        min={1} max={50} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#0071e3]"
      />
      <div className="flex justify-between text-[11px] text-[#b0b0b0] mt-1">
        <span>1</span><span>25</span><span>50</span>
      </div>
    </div>
  )
}
