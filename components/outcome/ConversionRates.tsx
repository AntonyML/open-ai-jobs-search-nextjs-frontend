'use client'

import type { FunnelMetrics } from '@/types/pipeline'

export function ConversionRates({ funnel }: { funnel?: FunnelMetrics }) {
  if (!funnel || funnel.total_applications === 0) return null

  const rates = [
    { label: 'App → Interview', value: `${funnel.application_to_interview_pct}%`, desc: `${funnel.interviews} of ${funnel.total_applications}` },
    { label: 'Interview → Offer', value: `${funnel.interview_to_offer_pct}%`, desc: `${funnel.offers} of ${funnel.interviews}` },
    { label: 'Offer → Hired', value: `${funnel.offer_to_hired_pct}%`, desc: `${funnel.hired} of ${funnel.offers}` },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {rates.map(card => (
        <div key={card.label} className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-[#1d1d1f] tabular-nums">{card.value}</p>
          <p className="mt-0.5 text-[11px] text-[#858585]">{card.label}</p>
          <p className="text-[10px] text-[#858585]">{card.desc}</p>
        </div>
      ))}
    </div>
  )
}
