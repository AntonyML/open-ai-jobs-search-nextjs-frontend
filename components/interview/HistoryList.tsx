'use client'

import type { InterviewPrepSummary, Application } from '@/types/shared'
import { AppleBadge } from '@/components/ui/apple-badge'

const stageLabels: Record<string, string> = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  case: 'Case Study',
  final_round: 'Final Round',
}

export function HistoryList({
  preps,
  applications,
  selectedPrepId,
  onSelect,
  t,
}: {
  preps: InterviewPrepSummary[]
  applications: Application[]
  selectedPrepId?: string
  onSelect: (id: string) => void
  t: (key: string) => string
}) {
  function getAppLabel(appId: string) {
    const app = applications.find(a => a.id === appId)
    return app ? appId.slice(0, 12) + '...' : appId.slice(0, 12) + '...'
  }

  if (preps.length === 0) {
    return (
      <div className="card border-dashed p-6 text-center">
        <p className="text-sm text-[#858585]">{t('noPreps')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {preps.map(prep => {
        const isSelected = prep.id === selectedPrepId
        return (
          <button
            key={prep.id}
            onClick={() => onSelect(prep.id)}
            className={`w-full text-left card transition-all hover:border-[#d2d2d7] ${
              isSelected ? 'border-[#2997ff] bg-[#f4f8fb]' : 'border-[#e2e2e5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <AppleBadge color="blue" size="sm">
                {stageLabels[prep.stage] || prep.stage}
              </AppleBadge>
              <span className="text-[10px] text-[#858585]">
                {new Date(prep.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-[#707070]">
              {getAppLabel(prep.application_id)}
            </p>
          </button>
        )
      })}
    </div>
  )
}
