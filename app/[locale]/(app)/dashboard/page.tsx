'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import {
  Search,
  User,
  BarChart3,
  FileText,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const QUICK_ACTIONS = [
  { labelKey: 'scrape', href: '/pipeline/scrape', icon: Search, descKey: 'scrapeDesc', requireStep: 'setup' },
  { labelKey: 'rank', href: '/pipeline/rank', icon: BarChart3, descKey: 'rankDesc', requireStep: 'scrape' },
  { labelKey: 'createCv', href: '/pipeline/apply', icon: FileText, descKey: 'createCvDesc', requireStep: 'rank' },
  { labelKey: 'prepare', href: '/pipeline/interview', icon: TrendingUp, descKey: 'prepareDesc', requireStep: 'apply' },
]

const PIPELINE_STEPS = [
  { key: 'providers', href: '/pipeline/providers', icon: User },
  { key: 'setup', href: '/pipeline/setup', icon: FileText },
  { key: 'scrape', href: '/pipeline/scrape', icon: Search },
  { key: 'rank', href: '/pipeline/rank', icon: BarChart3 },
  { key: 'apply', href: '/pipeline/apply', icon: FileText },
  { key: 'interview', href: '/pipeline/interview', icon: TrendingUp },
  { key: 'outcome', href: '/pipeline/outcome', icon: Briefcase },
]

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

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const tp = useTranslations('pipeline.steps')
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

  const doneStepsCount = pipeline.filter(s => s.done).length
  const pipelineProgress = pipeline.length
    ? Math.round((doneStepsCount / pipeline.length) * 100)
    : 0

  const hasProgress = doneStepsCount > 0

  const funnelColors = ['#e2e2e5', '#2997ff', '#0071e3', '#5856d6', '#34c759']

  const statCards = [
    { label: t('jobsScraped'), value: stats.jobs_scraped, icon: Globe, color: '#0071e3' },
    { label: t('jobsRanked'), value: stats.jobs_ranked, icon: BarChart3, color: '#34c759' },
    { label: t('applications'), value: stats.applications, icon: FileText, color: '#ff9500' },
    { label: t('interviews'), value: stats.interviews, icon: TrendingUp, color: '#5856d6' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[#707070]">{t('subtitle')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <stat.icon className="size-5" style={{ color: stat.color }} />
              </div>
              <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">
                {loading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-[#e2e2e5]" />
                ) : (
                  stat.value
                )}
              </CardTitle>
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-4" />
              <CardDescription>{t('hired')}</CardDescription>
            </div>
            <CardTitle className="text-lg font-semibold">
              {loading ? '...' : stats.hired}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-500">
              <XCircle className="size-4" />
              <CardDescription>{t('rejected')}</CardDescription>
            </div>
            <CardTitle className="text-lg font-semibold">
              {loading ? '...' : stats.rejected}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#0071e3]">
              <Clock className="size-4" />
              <CardDescription>{t('avgScore')}</CardDescription>
            </div>
            <CardTitle className="text-lg font-semibold">
              {loading ? '...' : stats.avg_rank_score ?? '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-violet-500">
              <Sparkles className="size-4" />
              <CardDescription>{t('scrapeRuns')}</CardDescription>
            </div>
            <CardTitle className="text-lg font-semibold">
              {loading ? '...' : stats.scrape_runs}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ── Empty state: no progress yet ──────────────────────── */}
      {!hasProgress && !loading && (
        <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-8 md:p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f4f8fb] mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f] mb-2">
            {t('emptyTitle')}
          </h2>
          <p className="text-sm text-[#707070] max-w-md mx-auto mb-6 leading-relaxed">
            {t('emptyDesc')}
          </p>
          <Link
            href="/pipeline/providers"
            className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white hover:bg-[#0068d2] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            {t('emptyCta')}
          </Link>
          <div className="mt-8 pt-6 border-t border-[#e2e2e5]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585] mb-3">{t('pipelineSteps')}</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { key: 'Providers', label: t('stepProviders') },
                { key: 'Setup', label: t('stepSetup') },
                { key: 'Scrape', label: t('stepScrape') },
                { key: 'Rank', label: t('stepRank') },
                { key: 'Apply', label: t('stepApply') },
                { key: 'Interview', label: t('stepInterview') },
                { key: 'Outcome', label: t('stepOutcome') },
              ].map((step) => (
                <span key={step.key} className="rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-1 text-[10px] text-[#707070]">
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content only shown once user has pipeline progress ─── */}
      {hasProgress && (
        <>
          {/* Pipeline progress bar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('pipelineProgress')}</CardTitle>
                  <CardDescription>
                    {t('stepsCompleted', {
                      done: doneStepsCount,
                      total: pipeline.length,
                    })}
                  </CardDescription>
                </div>
                <span className="text-sm font-semibold text-[#0071e3]">
                  {pipelineProgress}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-700 ease-out"
                  style={{ width: `${pipelineProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pipeline steps with completion status */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {PIPELINE_STEPS.map((step) => {
              const done = pipeline.find(s => s.key === step.key)?.done ?? false
              const isNext = !done && (step.key === 'providers' || pipeline.find(s => s.key === PIPELINE_STEPS[PIPELINE_STEPS.indexOf(step) - 1]?.key)?.done)
              return (
                <Link
                  key={step.key}
                  href={step.href}
                  className={`relative rounded-xl border p-3 pt-5 pb-3 text-center transition-all hover:shadow-sm ${
                    done
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : isNext
                        ? 'border-[#0071e3] bg-[#f4f8fb] ring-1 ring-[#0071e3]/20 animate-fade-in-up'
                        : 'border-[#d2d2d7]/60 bg-white hover:border-[#0071e3]/30'
                  }`}
                >
                  {/* Next step badge */}
                  {isNext && (
                    <>
                      {/* Arrow indicator above card */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1 rounded-full bg-[#0071e3] px-2 py-0.5 shadow-sm">
                          <svg
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                            className="animate-pulse"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <polyline points="19 12 12 19 5 12" />
                          </svg>
                          <span className="text-[9px] font-semibold text-white uppercase tracking-wider">
                            {t('nextStep')}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                    done ? 'bg-emerald-100 text-emerald-600' : isNext ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#f5f5f7] text-[#858585]'
                  }`}>
                    {done ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <step.icon className="size-4" />
                    )}
                  </div>
                  <p className={`mt-1.5 text-[11px] font-medium ${
                    done ? 'text-emerald-700' : isNext ? 'text-[#0071e3]' : 'text-[#474747]'
                  }`}>
                    {tp(step.key as any) || step.key}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Conversion funnel chart */}
          {funnelData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('conversionFunnel')}</CardTitle>
                <CardDescription>{t('fromScrapedToHired')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartContainer
                    config={{
                      scraped: { label: 'Scraped', color: '#e2e2e5' },
                      ranked: { label: 'Ranked', color: '#2997ff' },
                      applied: { label: 'Applied', color: '#0071e3' },
                      interviewed: { label: 'Interviewed', color: '#5856d6' },
                      hired: { label: 'Hired', color: '#34c759' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <XAxis
                          dataKey="stage"
                          tick={{ fontSize: 11, fill: '#858585' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#858585' }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-xs shadow-sm">
                                <p className="font-medium text-[#1d1d1f]">{payload[0].payload.stage}</p>
                                <p className="text-[#0071e3] font-semibold mt-0.5">
                                  {payload[0].value} {t('jobs')}
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                          {funnelData.map((_, idx) => (
                            <Cell key={idx} fill={funnelColors[idx % funnelColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions — only show unlocked steps */}
          {(() => {
            const available = QUICK_ACTIONS.filter(a =>
              pipeline.find(s => s.key === a.requireStep)?.done
            )
            if (available.length === 0) return null
            return (
              <div>
                <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">{t('quickActions')}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {available.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group rounded-xl border border-[#d2d2d7]/60 bg-white p-4 hover:border-[#0071e3]/30 hover:shadow-sm transition-all"
                    >
                      <action.icon className="size-5 text-[#0071e3] group-hover:scale-110 transition-transform" />
                      <p className="mt-2 text-sm font-medium text-[#1d1d1f]">{t(action.labelKey)}</p>
                      <p className="text-xs text-[#707070]">{t(action.descKey)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Pipeline overview list */}
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">{t('jobPipeline')}</h2>
            <div className="rounded-xl border border-[#d2d2d7]/60 bg-white divide-y divide-[#d2d2d7]/40">
              {PIPELINE_STEPS.map((item) => {
                const done = pipeline.find(s => s.key === item.key)?.done ?? false
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#f5f5f7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        done ? 'bg-emerald-100 text-emerald-600' : 'bg-[#f0f0f2] text-[#858585]'
                      }`}>
                        {done ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <item.icon className="size-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1d1d1f]">
                          {tp(item.key as any) || item.key}
                          {done && <span className="ml-1.5 text-[10px] text-emerald-500 font-medium">✓</span>}
                        </p>
                        <p className="text-xs text-[#707070]">
                          {tp(`${item.key}Desc` as any) || ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-[#b0b0b0]" />
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
