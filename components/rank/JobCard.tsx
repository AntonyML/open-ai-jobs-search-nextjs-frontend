'use client'

import { ExternalLink } from 'lucide-react'
import { scoreColor, scoreTextColor } from '@/lib/rank-utils'

export function JobCard({
  item,
  index,
  t,
}: {
  item: any
  index: number
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const salary = item.salary
  const hasSalary = !!salary
  const deltaPct = salary?.salary_delta_pct
  const title = item.title || item.job_title || t('jobFallback', { number: index + 1 })
  const url = item.url

  return (
    <article className="card hover:border-[#d2d2d7]/80 transition-all hover:shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">
            {title}
          </h3>
          <p className="mt-0.5 text-[12px] text-[#707070]">
            {item.company || ''}{item.location ? ` · ${item.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasSalary && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                deltaPct != null && deltaPct > 5
                  ? 'bg-emerald-100 text-emerald-700'
                  : deltaPct != null && deltaPct < -5
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[#f5f5f7] text-[#858585]'
              }`}
              title={salary?.company_name != null && salary?.match_confidence != null
                ? t('salaryMatch', { company: salary.company_name, pct: salary.match_confidence })
                : undefined}
            >
              {deltaPct != null
                ? `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)}%`
                : '~'}
            </span>
          )}
          {item.rank_score != null && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreTextColor(item.rank_score)}`}>
              {item.rank_score}
            </span>
          )}
        </div>
      </div>

      {item.rank_verdict && (
        <p className="mt-2 text-[11px] text-[#858585]">{item.rank_verdict}</p>
      )}

      {item.rank_score != null && (
        <div className="mt-3 h-1.5 rounded-full bg-[#e2e2e5]">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${scoreColor(item.rank_score)}`}
            style={{ width: `${item.rank_score}%` }}
          />
        </div>
      )}

      {url && (
        <div className="mt-3 pt-3 border-t border-[#e2e2e5] flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#b0b0b0]">
            {item.portal}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0071e3] hover:text-[#0068d2] transition-colors"
          >
            {t('viewJob')}
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </article>
  )
}
