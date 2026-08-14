'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { PIPELINE_STEPS } from '@/types/pipeline'
import type { LucideIcon } from 'lucide-react'
import {
  Search,
  User,
  BarChart3,
  FileText,
  TrendingUp,
  Sparkles,
  Briefcase,
  Globe,
  Mic,
  CheckCircle2,
  ArrowRight,
  PartyPopper,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/dashboard/CountUp'
import { ProgressRing } from '@/components/dashboard/ProgressRing'
import { FunnelLineChart } from '@/components/dashboard/FunnelLineChart'

/* ── Static config ──────────────────────────────────────────────── */

const STEP_ICONS: Record<string, LucideIcon> = {
  providers: Sparkles,
  setup: User,
  search: Search,
  rank: BarChart3,
  apply: FileText,
  interview: Mic,
  outcome: Briefcase,
}

const QUICK_ACTIONS = [
  { key: 'search', icon: Search, requireStep: 'setup' },
  { key: 'rank', icon: BarChart3, requireStep: 'search' },
  { key: 'createCv', icon: FileText, requireStep: 'rank' },
  { key: 'prepare', icon: TrendingUp, requireStep: 'apply' },
]

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

interface PipelineStepStatus {
  key: string
  label: string
  done: boolean
}

interface FunnelItem {
  stage: string
  count: number
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const tp = useTranslations('pipeline.steps')
  const tprofile = useTranslations('profile')
  const locale = useLocale()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats>({
    jobs_scraped: 0, jobs_ranked: 0, applications: 0, interviews: 0,
    scrape_runs: 0, avg_rank_score: null, hired: 0, rejected: 0,
  })
  const [pipeline, setPipeline] = useState<PipelineStepStatus[]>([])
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    Promise.all([
      apiFetch<DashboardStats>('/api/v1/dashboard/stats').catch(() => null),
      apiFetch<{ steps: PipelineStepStatus[] }>('/api/v1/dashboard/pipeline').catch(() => null),
      apiFetch<{ funnel: FunnelItem[] }>('/api/v1/analytics/funnel').catch(() => null),
    ]).then(([s, p, f]) => {
      if (s) setStats(s)
      if (p?.steps) setPipeline(p.steps)
      if (f?.funnel) setFunnelData(f.funnel)
    }).finally(() => setLoading(false))
  }, [router])

  /* ── Derived state ─────────────────────────────────────────── */

  const totalSteps = PIPELINE_STEPS.length
  const doneKeys = new Set(
    pipeline.filter((s) => s.done).map((s) => s.key)
  )
  const doneStepsCount = doneKeys.size
  const pipelineProgress = totalSteps
    ? Math.round((doneStepsCount / totalSteps) * 100)
    : 0
  const hasProgress = doneStepsCount > 0

  const steps = PIPELINE_STEPS.map((step, i) => {
    const done = doneKeys.has(step.key)
    const prevDone = i === 0 ? true : doneKeys.has(PIPELINE_STEPS[i - 1].key)
    return { ...step, done, isNext: !done && prevDone }
  })
  const nextStep = steps.find((s) => s.isNext)

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

      {/* Hero — pipeline progress */}
      <section className="relative overflow-hidden rounded-xl border border-[#d2d2d7]/60 bg-white p-6 md:p-8">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#2997ff]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />

        {loading ? (
          <div className="relative flex flex-col items-center gap-8 md:flex-row">
            <div className="skeleton size-[196px] shrink-0 rounded-full" />
            <div className="w-full flex-1 space-y-4">
              <div className="skeleton h-16 w-full max-w-[420px] rounded-xl" />
              <div className="skeleton h-28 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
            {/* Progress ring */}
            <ProgressRing value={pipelineProgress} size={196} strokeWidth={14}>
              <div className="flex items-start">
                <CountUp
                  value={pipelineProgress}
                  className="text-[46px] font-semibold leading-none tracking-tight text-[#1d1d1f] tabular-nums"
                />
                <span className="mt-0.5 text-xl font-medium text-[#0071e3]">%</span>
              </div>
              <p className="mt-2 max-w-[140px] text-center text-[11px] leading-snug text-[#707070]">
                {t('stepsCompleted', { done: doneStepsCount, total: totalSteps })}
              </p>
            </ProgressRing>

            {/* Journey */}
            <div className="w-full min-w-0 flex-1">
              {/* Next step banner */}
              <div
                className={cn(
                  'mb-6 flex items-center gap-3 rounded-xl p-4',
                  nextStep
                    ? 'bg-[#f4f8fb] ring-1 ring-[#2997ff]/25'
                    : 'bg-emerald-50/70 ring-1 ring-emerald-200/70'
                )}
              >
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-white',
                    nextStep ? 'bg-[#0071e3]' : 'bg-emerald-500'
                  )}
                >
                  {nextStep ? (
                    <ArrowRight className="size-4" />
                  ) : (
                    <PartyPopper className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-[0.16em]',
                      nextStep ? 'text-[#0071e3]' : 'text-emerald-600'
                    )}
                  >
                    {nextStep ? t('nextStep') : t('pipelineComplete')}
                  </p>
                  <p className="truncate text-[15px] font-medium text-[#1d1d1f]">
                    {nextStep
                      ? (tp(nextStep.key as any) as string)
                      : t('pipelineCompleteDesc')}
                  </p>
                </div>
              </div>

              {/* Stepper — desktop (with progress track) */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute left-0 right-0 top-[18px] h-[3px] rounded-full bg-[#e8e8ed]" />
                  <div
                    className="absolute left-0 top-[18px] h-[3px] rounded-full bg-gradient-to-r from-[#2997ff] to-[#0071e3] transition-[width] duration-1000 ease-out"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                  <div className="relative grid grid-cols-7">
                    {steps.map((step, i) => {
                      const Icon = STEP_ICONS[step.key]
                      return (
                        <div
                          key={step.key}
                          className="flex animate-fade-in-up flex-col items-center text-center"
                          style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'both' }}
                        >
                          <div
                            className={cn(
                              'flex size-9 items-center justify-center rounded-full transition-all',
                              step.done && 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
                              step.isNext &&
                                'bg-white text-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.1)] ring-2 ring-[#0071e3]',
                              !step.done && !step.isNext &&
                                'bg-[#f5f5f7] text-[#b0b0b0] ring-1 ring-[#e8e8ed]'
                            )}
                          >
                            {step.done ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <Icon className="size-4" />
                            )}
                          </div>
                          <p
                            className={cn(
                              'mt-2 text-[11px] font-medium leading-tight',
                              step.done
                                ? 'text-emerald-700'
                                : step.isNext
                                  ? 'text-[#0071e3]'
                                  : 'text-[#707070]'
                            )}
                          >
                            {tp(step.key as any) as string}
                          </p>
                          <span
                            className={cn(
                              'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                              step.done && 'bg-emerald-50 text-emerald-600',
                              step.isNext && 'animate-pulse bg-[#0071e3] text-white',
                              !step.done && !step.isNext && 'bg-[#f0f0f2] text-[#b0b0b0]'
                            )}
                          >
                            {step.done ? t('completed') : step.isNext ? t('nextStep') : t('pending')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Stepper — mobile / tablet cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
                {steps.map((step) => {
                  const Icon = STEP_ICONS[step.key]
                  return (
                    <div
                      key={step.key}
                      className={cn(
                        'rounded-xl border p-3 text-center',
                        step.done && 'border-emerald-200/70 bg-emerald-50/40',
                        step.isNext && 'border-[#2997ff]/40 bg-[#f4f8fb] ring-1 ring-[#2997ff]/20',
                        !step.done && !step.isNext && 'border-[#d2d2d7]/60 bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'mx-auto flex size-8 items-center justify-center rounded-full',
                          step.done && 'bg-emerald-100 text-emerald-600',
                          step.isNext && 'bg-[#0071e3]/10 text-[#0071e3]',
                          !step.done && !step.isNext && 'bg-[#f5f5f7] text-[#b0b0b0]'
                        )}
                      >
                        {step.done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                      </div>
                      <p
                        className={cn(
                          'mt-1.5 text-[11px] font-medium',
                          step.done
                            ? 'text-emerald-700'
                            : step.isNext
                              ? 'text-[#0071e3]'
                              : 'text-[#707070]'
                        )}
                      >
                        {tp(step.key as any) as string}
                      </p>
                      {step.isNext && (
                        <span className="mt-1 inline-block rounded-full bg-[#0071e3] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white">
                          {t('nextStep')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Info banner — no progress yet (no navigation, just guidance) */}
      {!hasProgress && !loading && (
        <div className="flex items-start gap-3.5 rounded-xl border border-[#d2d2d7]/60 bg-[#f4f8fb] p-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1d1d1f]">{t('emptyTitle')}</p>
            <p className="mt-0.5 text-sm text-[#707070]">{t('emptyDesc')}</p>
          </div>
        </div>
      )}

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

      {/* Quick actions + funnel chart */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Quick actions — display only */}
        <section className="rounded-xl border border-[#d2d2d7]/60 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('quickActions')}</h2>
          <p className="mt-0.5 text-xs text-[#707070]">{t('quickActionsDesc')}</p>
          <div className="mt-4 space-y-2.5">
            {QUICK_ACTIONS.map((action) => {
              const available = doneKeys.has(action.requireStep)
              const Icon = action.icon
              return (
                <div
                  key={action.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3.5 transition-all',
                    available
                      ? 'border-[#d2d2d7]/60 bg-white hover:border-[#2997ff]/40'
                      : 'border-[#e8e8ed] bg-[#fafafa]'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      available
                        ? 'bg-[#f4f8fb] text-[#0071e3]'
                        : 'bg-[#f0f0f2] text-[#b0b0b0]'
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', available ? 'text-[#1d1d1f]' : 'text-[#858585]')}>
                      {t(action.key)}
                    </p>
                    <p className="text-xs text-[#858585]">{t(`${action.key}Desc`)}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                      available
                        ? 'bg-[#f4f8fb] text-[#0071e3] ring-1 ring-[#2997ff]/30'
                        : 'bg-[#f0f0f2] text-[#a0a0a0]'
                    )}
                  >
                    {available
                      ? t('available')
                      : t('requiresStep', { step: tp(action.requireStep as any) as string })}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Conversion funnel — echarts-style line chart */}
        {funnelData.length > 0 && (
          <section className="rounded-xl border border-[#d2d2d7]/60 bg-white p-5 lg:col-span-3">
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

      {/* Pipeline overview — display only */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('jobPipeline')}</h2>
          <span className="shrink-0 text-xs text-[#858585]">
            {t('stepsCompleted', { done: doneStepsCount, total: totalSteps })}
          </span>
        </div>
        <div className="divide-y divide-[#e8e8ed]/80 overflow-hidden rounded-xl border border-[#d2d2d7]/60 bg-white">
          {steps.map((step) => {
            const Icon = STEP_ICONS[step.key]
            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3.5 transition-colors',
                  step.isNext && 'bg-[#f4f8fb]/60'
                )}
              >
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    step.done && 'bg-emerald-100 text-emerald-600',
                    step.isNext && 'bg-[#0071e3]/10 text-[#0071e3]',
                    !step.done && !step.isNext && 'bg-[#f5f5f7] text-[#b0b0b0]'
                  )}
                >
                  {step.done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1d1d1f]">
                    {tp(step.key as any) as string}
                  </p>
                  <p className="text-xs text-[#707070]">
                    {tp(`${step.key}Desc` as any) as string}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                    step.done && 'bg-emerald-50 text-emerald-600',
                    step.isNext && 'bg-[#f4f8fb] text-[#0071e3] ring-1 ring-[#2997ff]/30',
                    !step.done && !step.isNext && 'bg-[#f0f0f2] text-[#a0a0a0]'
                  )}
                >
                  {step.done ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {t('completed')}
                    </span>
                  ) : step.isNext ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-1.5 animate-pulse-dot rounded-full bg-[#0071e3]" />
                      {t('nextStep')}
                    </span>
                  ) : (
                    t('pending')
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </section>
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
