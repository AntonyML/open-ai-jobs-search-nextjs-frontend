'use client'

interface RankProgressProps {
  rankedCount: number
  totalCount: number
  remaining: number
  progressPct: number
  elapsed: number
  etaSeconds: number | null
  runningJob: { description?: string | null; provider?: string | null; model?: string | null } | null
  activeProvider: { provider: string; health_score: number; last_error_code?: string | null } | null
  recentEvals: { rank_score: number; title?: string; job_title?: string }[]
  t: (key: string) => string
}

import { scoreColor, scoreTextColor } from '@/lib/rank-utils'

export function RankProgress({
  rankedCount, totalCount, remaining, progressPct, elapsed, etaSeconds,
  runningJob, activeProvider, recentEvals, t,
}: RankProgressProps) {
  return (
    <div className="rounded-xl border border-[#d2d2d7] bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-[#1d1d1f]">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0071e3]/40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0071e3]" />
          </span>
          <span className="font-medium">{t('evaluating')}</span>
        </div>
        <span className="text-xs font-semibold text-[#0071e3]">{progressPct}%</span>
      </div>

      <div className="h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div className="h-full rounded-full bg-[#0071e3] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
          <p className="text-lg font-bold text-[#0071e3]">{rankedCount}</p>
          <p className="text-[10px] text-[#858585]">{t('ranked')}</p>
        </div>
        <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
          <p className="text-lg font-bold text-[#474747]">{remaining}</p>
          <p className="text-[10px] text-[#858585]">{t('remaining')}</p>
        </div>
        <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
          <p className="text-lg font-bold text-[#474747]">{totalCount}</p>
          <p className="text-[10px] text-[#858585]">{t('totalJobs')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#858585]">
          {t('elapsed')}: <strong className="text-[#474747]">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</strong>
        </span>
        {etaSeconds != null && (
          <span className="text-[#858585]">
            {t('eta')}: <strong className="text-[#474747]">~{Math.floor(etaSeconds / 60)}:{String(etaSeconds % 60).padStart(2, '0')}</strong>
          </span>
        )}
      </div>

      {runningJob && runningJob.provider && (
        <div className="flex items-center gap-2 text-[11px] text-[#0066cc] border-t border-[#e2e2e5] pt-3">
          <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
          <span className="font-medium">{runningJob.provider}</span>
          <span className="text-[#b0b0b0]">·</span>
          <span className="text-[#707070]">{runningJob.model || 'processing'}</span>
          <span className="text-[#b0b0b0]">·</span>
          <span className="text-[#707070]">~{rankedCount > 0 ? Math.round(elapsed / rankedCount) : '—'}s/job avg</span>
        </div>
      )}

      {activeProvider && activeProvider.health_score < 0.8 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          {activeProvider.provider} health: {Math.round(activeProvider.health_score * 100)}%
          {activeProvider.last_error_code === 'rate_limit' && ' · Rate limited, switching model'}
        </div>
      )}

      {recentEvals.length > 0 && (
        <div className="border-t border-[#e2e2e5] pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-[#858585]">{t('recentEvals')}</p>
            <span className="text-[9px] text-[#b0b0b0]">Last {Math.min(5, recentEvals.length)}</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
            {recentEvals.slice(-5).reverse().map((x, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-[#707070] group hover:bg-[#f5f5f7] rounded-md px-1.5 py-1 -mx-1.5 transition-colors">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${scoreColor(x.rank_score)}`} />
                <span className="truncate flex-1">{x.title || x.job_title}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${scoreTextColor(x.rank_score)}`}>
                  {x.rank_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
