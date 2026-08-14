'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import {
  BarChart3,
  FileText,
  TrendingUp,
  Globe,
  Mic,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/dashboard/CountUp'
import { FunnelLineChart } from '@/components/dashboard/FunnelLineChart'

/* ── Static config ──────────────────────────────────────────────── */

const STAGE_LABELS: Record<string, string> = {
  Scraped: 'scraped',
  Ranked: 'ranked',
  Applied: 'applied',
  Interviewed: 'interviews',
  Hired: 'hired',
}

/* ── Types ──────────────────────────────────────────────────────── */

interface DashboardStats {
  jobs_scraped: number
  jobs_ranked: number
  applications: number
  interviews: number
  scrape_runs: number
  avg_rank_score: number | null
  hired: number
  rejected: number
}

interface FunnelItem {
  stage: string
  count: number
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const tprofile = useTranslations('profile')
  const locale = useLocale()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats>({
    jobs_scraped: 0, jobs_ranked: 0, applications: 0, interviews: 0,
    scrape_runs: 0, avg_rank_score: null, hired: 0, rejected: 0,
  })
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    Promise.all([
      apiFetch<DashboardStats>('/api/v1/dashboard/stats').catch(() => null),
      apiFetch<{ funnel: FunnelItem[] }>('/api/v1/analytics/funnel').catch(() => null),
    ]).then(([s, f]) => {
      if (s) setStats(s)
      if (f?.funnel) setFunnelData(f.funnel)
    }).finally(() => setLoading(false))
  }, [router])

  /* ── Derived state ─────────────────────────────────────────── */

  const statCards = [
    { label: t('jobsScraped'), value: stats.jobs_scraped, icon: Globe, color: '#2997ff' },
    { label: t('jobsRanked'), value: stats.jobs_ranked, icon: BarChart3, color: '#34c759' },
    { label: t('applications'), value: stats.applications, icon: FileText, color: '#ff9500' },
    { label: t('interviews'), value: stats.interviews, icon: Mic, color: '#5856d6' },
  ]

  const chartData = funnelData.map((d) => ({
    stage: STAGE_LABELS[d.stage]
      ? (tprofile(STAGE_LABELS[d.stage] as any) as string)
      : d.stage,
    count: d.count,
  }))

  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-[#d2d2d7]/60 bg-white px-3.5 py-1.5 text-xs capitalize text-[#707070] sm:inline-flex">
          <CalendarDays className="size-3.5 text-[#0071e3]" />
          {dateLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-[#d2d2d7]/60 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm md:p-5"
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.color}66, transparent)` }}
            />
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: `${stat.color}1a`, color: stat.color }}
            >
              <stat.icon className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#1d1d1f] tabular-nums md:text-[26px]">
              {loading ? (
                <span className="skeleton inline-block h-7 w-14 align-middle" />
              ) : (
                <CountUp value={stat.value} />
              )}
            </p>
            <p className="mt-0.5 text-xs text-[#707070]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion funnel — echarts-style line chart */}
      {funnelData.length > 0 && (
        <section className="rounded-xl border border-[#d2d2d7]/60 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('conversionFunnel')}</h2>
              <p className="mt-0.5 text-xs text-[#707070]">{t('fromScrapedToHired')}</p>
            </div>
            <span className="hidden rounded-full bg-[#f4f8fb] px-2.5 py-1 text-[10px] font-semibold text-[#0071e3] ring-1 ring-[#2997ff]/20 sm:inline-flex">
              {t('conversionFunnelTag')}
            </span>
          </div>
          <div className="mt-4">
            <FunnelLineChart data={chartData} jobsLabel={t('jobs')} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniKpi
              label={t('hired')}
              value={stats.hired}
              icon={<CheckCircle2 className="size-3.5" />}
              valueClass="text-emerald-600"
            />
            <MiniKpi
              label={t('rejected')}
              value={stats.rejected}
              icon={<TrendingUp className="size-3.5 rotate-180" />}
              valueClass="text-rose-500"
            />
            <MiniKpi
              label={t('avgScore')}
              value={stats.avg_rank_score ?? '—'}
              icon={<BarChart3 className="size-3.5" />}
              valueClass="text-[#5856d6]"
            />
          </div>
        </section>
      )}

    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

function MiniKpi({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  valueClass: string
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-[#fafafa] px-2 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#858585]">
        <span className={valueClass}>{icon}</span>
        <span>{label}</span>
      </div>
      <span className={cn('mt-0.5 text-lg font-semibold tabular-nums text-[#1d1d1f]', valueClass)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}
