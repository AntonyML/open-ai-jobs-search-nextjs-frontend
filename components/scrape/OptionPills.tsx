'use client'

interface OptionPillsProps {
  label: string
  options: { value: number; label: string }[]
  selected: number
  onChange: (value: number) => void
  accent?: boolean
}

export function OptionPills({ label, options, selected, onChange, accent }: OptionPillsProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
        {label}
        {accent && <span className="text-[#0071e3] font-bold normal-case ml-1">{selected}</span>}
      </p>
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              selected === opt.value
                ? 'bg-[#0071e3] text-white'
                : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
