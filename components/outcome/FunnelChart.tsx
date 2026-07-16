'use client'

import { FunnelBar } from './FunnelBar'
import type { FunnelMetrics } from '@/types/pipeline'

export function FunnelChart({ funnel }: { funnel?: FunnelMetrics }) {
  const maxValue = funnel
    ? Math.max(funnel.total_applications, funnel.interviews, funnel.offers, funnel.hired, 1)
    : 1

  if (!funnel || funnel.total_applications === 0) {
    return (
      <div className="card border-dashed p-12 text-center">
        <p className="text-sm text-[#858585]">
          No outcomes recorded yet. Start by saving an outcome for one of your applications.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Conversion funnel</h3>
      <div className="space-y-3">
        <FunnelBar label="Applications" value={funnel.total_applications} pct={100} max={maxValue} color="bg-[#e2e2e5]" />
        <FunnelBar label="→ Interviews" value={funnel.interviews} pct={funnel.application_to_interview_pct} max={maxValue} color="bg-[#2997ff]" />
        <FunnelBar label="→ Offers" value={funnel.offers} pct={funnel.interview_to_offer_pct} max={maxValue} color="bg-[#0071e3]" />
        <FunnelBar label="→ Hired" value={funnel.hired} pct={funnel.overall_success_pct} max={maxValue} color="bg-emerald-400" />
      </div>
    </div>
  )
}
