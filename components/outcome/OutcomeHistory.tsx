'use client'

import type { OutcomeSummary, Application } from '@/types/shared'
import { AppleButton } from '@/components/ui/apple-button'
import { AppleBadge } from '@/components/ui/apple-badge'

const STATUS_LABELS: Record<string, string> = {
  interview_invited: 'Interview invited',
  phone_screen_completed: 'Phone screen done',
  technical_completed: 'Technical done',
  case_completed: 'Case done',
  final_round_completed: 'Final round done',
  offer_received: 'Offer received',
  hired: 'Hired',
  offer_declined: 'Offer declined',
  rejected: 'Rejected',
  no_response: 'No response',
  interview_only: 'Interview only',
  withdrawn: 'Withdrawn',
}

const STATUS_BADGE_COLORS: Record<string, 'blue' | 'amber' | 'emerald' | 'rose' | 'slate' | 'purple'> = {
  interview_invited: 'blue',
  phone_screen_completed: 'blue',
  technical_completed: 'blue',
  case_completed: 'blue',
  final_round_completed: 'blue',
  offer_received: 'amber',
  hired: 'emerald',
  offer_declined: 'amber',
  rejected: 'rose',
  no_response: 'slate',
  interview_only: 'purple',
  withdrawn: 'slate',
}

function getLabel(appId: string, apps: Application[]): string {
  const app = apps.find(a => a.id === appId)
  if (!app) return appId.slice(0, 12) + '...'
  const company = (app as any).job_posting?.company || ''
  const title = (app as any).job_posting?.title || ''
  const parts = [company, title].filter(Boolean)
  return parts.length ? parts.join(' — ') : appId.slice(0, 12) + '...'
}

export function OutcomeHistory({
  outcomes,
  applications,
  onAdd,
  t,
  tc,
}: {
  outcomes: OutcomeSummary[]
  applications: Application[]
  onAdd: () => void
  t: (key: string, opts?: any) => string
  tc: (key: string) => string
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#707070]">{outcomes.length} outcomes recorded</p>
        <AppleButton size="sm" onClick={onAdd}>+ {tc('save')}</AppleButton>
      </div>

      {outcomes.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="text-sm text-[#858585]">{t('noData', { default: 'No outcomes recorded yet.' })}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {outcomes.map(o => (
            <div key={o.id} className="rounded-xl border border-[#e2e2e5] bg-white p-4 hover:border-[#d2d2d7] transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1d1d1f] truncate">
                    {getLabel(o.application_id, applications)}
                  </p>
                  <p className="text-[11px] text-[#858585] mt-0.5">
                    {new Date(o.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {o.date_resolved && ` · Resolved ${o.date_resolved}`}
                  </p>
                </div>
                <AppleBadge color={STATUS_BADGE_COLORS[o.status] || 'slate'} size="sm" className="shrink-0">
                  {STATUS_LABELS[o.status] || o.status}
                </AppleBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
