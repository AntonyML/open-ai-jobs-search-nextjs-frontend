'use client'

import type { CalibrationInsight } from '@/types/shared'
import { AppleBadge } from '@/components/ui/apple-badge'

const impactColor = {
  high: 'blue',
  medium: 'blue',
  low: 'slate',
} as const

const impactBorder = {
  high: 'border-l-[#0071e3] bg-[#f4f8fb]',
  medium: 'border-l-[#2997ff]',
  low: 'border-l-[#e2e2e5]',
}

export function InsightCard({ insight }: { insight: CalibrationInsight }) {
  return (
    <div className={`rounded-xl border border-[#d2d2d7] border-l-[3px] p-4 ${impactBorder[insight.impact as keyof typeof impactBorder] || impactBorder.low}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1d1d1f]">{insight.insight}</p>
          <p className="mt-1 text-[12px] text-[#707070] leading-snug">{insight.recommendation}</p>
        </div>
        <AppleBadge color={impactColor[insight.impact as keyof typeof impactColor] || 'slate'} size="sm" className="uppercase shrink-0">
          {insight.impact}
        </AppleBadge>
      </div>
    </div>
  )
}
