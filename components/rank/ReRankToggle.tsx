'use client'

export function ReRankToggle({
  value,
  onChange,
  t,
}: {
  value: boolean
  onChange: (v: boolean) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 flex-1">
      <div>
        <p className="text-sm text-[#1d1d1f] font-medium">{t('reRank')}</p>
        <p className="text-xs text-[#858585] mt-0.5">{t('reRankDesc')}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
        }`}
      >
        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}
