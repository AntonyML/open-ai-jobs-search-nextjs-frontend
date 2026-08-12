'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ActivityStats {
  jobs_scraped: number
  jobs_ranked: number
  applications: number
  interviews: number
  hired: number
  avg_rank_score: number | null
}

export function ActivityUsage({ stats }: { stats?: ActivityStats | null }) {
  const t = useTranslations('profile')
  const [usageData, setUsageData] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch<any>('/api/v1/users/usage')
      .catch(() => null)
      .then((data) => {
        if (!cancelled) setUsageData(data)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="card">
      <p className="eyebrow !text-[#0071e3] mb-5">{t('activityUsage')}</p>

      {/* Usage meters */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <UsageMeter
          label={t('applications')}
          used={usageData?.usage?.applications ?? 0}
          max={usageData?.limits?.max_apply_count ?? 5}
          icon={
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
          color="#0071e3"
        />
        <UsageMeter
          label={t('interviewPreps')}
          used={usageData?.usage?.interview_preps ?? 0}
          max={usageData?.limits?.max_prepare_count ?? 5}
          icon={
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          }
          color="#30d158"
        />
        <UsageMeter
          label={t('rankings')}
          used={usageData?.usage?.rank_iterations ?? 0}
          max={usageData?.limits?.max_rank_iterations ?? 3}
          icon={
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          }
          color="#ff9f0a"
        />
        <UsageMeter
          label={t('outcomesTracked')}
          used={usageData?.usage?.outcomes ?? 0}
          max={usageData?.limits?.max_track_count ?? 5}
          icon={
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
          color="#bf5af2"
        />
      </div>

      {/* Separator */}
      <hr className="border-t border-[#e2e2e5] mb-5" />

      {/* Pipeline funnel summary */}
      {stats ? (
        <div>
          <p className="text-[11px] text-[#858585] uppercase tracking-wider font-semibold mb-3">{t('pipelineOverview')}</p>
          <div className="grid grid-cols-5 gap-2">
            <FunnelStage
              label={t('scraped')}
              count={stats.jobs_scraped}
              color="#0071e3"
              isFirst
            />
            <FunnelStage
              label={t('ranked')}
              count={stats.jobs_ranked}
              color="#30d158"
            />
            <FunnelStage
              label={t('applied')}
              count={stats.applications}
              color="#ff9f0a"
            />
            <FunnelStage
              label={t('interviews')}
              count={stats.interviews}
              color="#bf5af2"
            />
            <FunnelStage
              label={t('hired')}
              count={stats.hired}
              color="#ff375f"
            />
          </div>
          {stats.avg_rank_score != null && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#858585]">
              <svg className="size-3 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              {t('avgRankScore')} <span className="font-medium text-[#1d1d1f]">{stats.avg_rank_score}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

/* ── Usage & Activity Sub-components ──────────────────────── */

function UsageMeter({ label, used, max, icon, color }: {
  label: string
  used: number
  max: number
  icon: React.ReactNode
  color: string
}) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const isNearLimit = pct >= 80

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#858585]">
          <span style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <span className={cn(
          'text-[12px] font-medium tabular-nums',
          isNearLimit ? 'text-[#ff9f0a]' : 'text-[#1d1d1f]'
        )}>
          {used}<span className="text-[#b0b0b0]">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: isNearLimit ? '#ff9f0a' : color,
          }}
        />
      </div>
    </div>
  )
}

/* ── Funnel Stage ─────────────────────────────────── */

function FunnelStage({
  label,
  count,
  color,
  isFirst,
}: {
  label: string
  count: number
  color: string
  isFirst?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {!isFirst && (
          <svg className="size-3 shrink-0 text-[#d2d2d7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
        <span className="text-[15px] font-semibold tabular-nums text-[#1d1d1f]" style={{ color }}>
          {count}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[10px] text-[#858585]">{label}</p>
    </div>
  )
}
