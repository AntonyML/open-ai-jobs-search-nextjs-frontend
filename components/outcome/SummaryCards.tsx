'use client'

interface Card {
  label: string
  value: number
  color: string
}

export function SummaryCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(card => (
        <div key={card.label} className="card">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
            {card.label}
          </p>
          <p className={`mt-1 text-[32px] font-semibold leading-none tabular-nums ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
