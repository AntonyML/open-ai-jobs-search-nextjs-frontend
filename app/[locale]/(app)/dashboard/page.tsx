'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  Sparkles,
  ArrowRight,
  FolderOpen,
  UserRound,
  Wallet,
  Accessibility,
  Lock,
  Gem,
  Type,
  AlignLeft,
  ArrowLeftRight,
  Contrast,
  Wind,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBillingStatus } from '@/hooks/useBilling'
import { loadSettings, DEFAULT_SETTINGS, type AccessibilitySettings } from '@/lib/accessibility'
import type { CreditStatus } from '@/types/billing'
import { CountUp } from '@/components/dashboard/CountUp'
import { FunnelLineChart } from '@/components/dashboard/FunnelLineChart'
import { TrendSparkline } from '@/components/dashboard/TrendSparkline'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { QuickActions } from '@/components/dashboard/QuickActions'

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
  base_cv_ready: boolean
  adapted_cv_count: number
  total_cvs: number
}

interface FunnelItem {
  stage: string
  count: number
}

interface TrendItem {
  date: string
  scraped: number
  applications: number
  interviews: number
  ranked: number
  hired: number
}

/* ── Helpers ────────────────────────────────────────────────────── */

function sumWindow(series: number[], from: number, to: number): number {
  return series.slice(from, to).reduce((a, b) => a + b, 0)
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
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
    base_cv_ready: false, adapted_cv_count: 0, total_cvs: 0,
  })
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [access, setAccess] = useState<AccessibilitySettings | null>(null)
  const { data: billingStatus } = useBillingStatus()

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    setAccess(loadSettings())
    Promise.all([
      apiFetch<DashboardStats>('/api/v1/dashboard/stats').catch(() => null),
      apiFetch<{ funnel: FunnelItem[] }>('/api/v1/analytics/funnel').catch(() => null),
      apiFetch<{ days: number; trends: TrendItem[] }>('/api/v1/analytics/trends').catch(() => null),
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
    ]).then(([s, f, tr, p]) => {
      if (s) setStats(s)
      if (f?.funnel) setFunnelData(f.funnel)
      if (tr?.trends) setTrends(tr.trends)
      if (p) setProfile(p)
    }).finally(() => setLoading(false))
  }, [router])

  /* ── Derived state ─────────────────────────────────────────── */

  const seriesOf = (key: keyof TrendItem) => trends.map((d) => Number(d[key] ?? 0))

  const kpis = [
    { key: 'jobsScraped', value: stats.jobs_scraped, series: seriesOf('scraped'), icon: Globe, color: '#2997ff' },
    { key: 'jobsRanked', value: stats.jobs_ranked, series: seriesOf('ranked'), icon: BarChart3, color: '#34c759' },
    { key: 'applications', value: stats.applications, series: seriesOf('applications'), icon: FileText, color: '#ff9500' },
    { key: 'interviews', value: stats.interviews, series: seriesOf('interviews'), icon: Mic, color: '#5856d6' },
  ].map((kpi) => {
    const last = sumWindow(kpi.series, -7, kpi.series.length)
    const prev = sumWindow(kpi.series, -14, -7)
    return { ...kpi, delta: last - prev, hasDelta: last > 0 || prev > 0 }
  })

  const chartData = funnelData.map((d) => ({
    stage: STAGE_LABELS[d.stage]
      ? (tprofile(STAGE_LABELS[d.stage] as any) as string)
      : d.stage,
    count: d.count,
  }))

  // Stage-to-stage conversion percentages (e.g. Ranked → Applied)
  const conversions = chartData.slice(1).map((cur, i) => {
    const prev = chartData[i]
    return {
      from: prev.stage,
      to: cur.stage,
      pct: pct(cur.count, prev.count),
    }
  })

  const hireRate = pct(stats.hired, stats.applications)
  const interviewRate = pct(stats.interviews, stats.applications)
  const avgScore = stats.avg_rank_score ?? 0

  const hasData =
    stats.jobs_scraped + stats.jobs_ranked + stats.applications + stats.interviews + stats.hired > 0

  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const activityData = trends.map((d) => ({
    date: d.date,
    applications: d.applications,
    interviews: d.interviews,
  }))

  /* ── Render ─────────────────────────────────────────────────── */

  // En móvil el dashboard actúa como Home con una composición propia (misma
  // data, distinto orden): resumen → acciones rápidas → embudo → CV →
  // progreso → actividad. En desktop se conserva el orden original vía md:order-*.
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 md:gap-8">
      {/* Header (saludo) */}
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

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Resumen principal — KPIs (2 columnas en móvil) */}
          {!hasData ? null : (
            <div className="order-1 md:order-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {kpis.map((kpi, i) => (
                  <div
                    key={kpi.key}
                    className="group relative overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-5"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}66, transparent)` }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex size-9 items-center justify-center rounded-xl"
                        style={{ background: `${kpi.color}1a`, color: kpi.color }}
                      >
                        <kpi.icon className="size-4" />
                      </div>
                      {kpi.hasDelta && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1',
                            kpi.delta >= 0
                              ? 'bg-emerald-50 text-emerald-600 ring-emerald-200/60'
                              : 'bg-[#f5f5f7] text-[#858585] ring-[#e8e8ed]'
                          )}
                        >
                          {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta).toLocaleString()}
                          <span className="font-medium opacity-80">{t('thisWeek')}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[26px] font-semibold tracking-tight text-[#1d1d1f] tabular-nums">
                      <CountUp value={kpi.value} />
                    </p>
                    <p className="mt-0.5 text-xs text-[#707070]">{t(kpi.key)}</p>
                    <div className="mt-2">
                      <TrendSparkline data={kpi.series} color={kpi.color} id={`kpi-${i}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones rápidas — solo móvil */}
          <div className="order-2 md:hidden">
            <QuickActions />
          </div>

          {/* Aplicaciones / empleos — funnel + éxito */}
          {hasData && chartData.length > 0 && (
            <div className="order-3 md:order-4">
              <div className="grid gap-4 lg:grid-cols-5">
                {/* Conversion funnel — secondary now that documents are the focus */}
                <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5 lg:col-span-2">
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
                  {/* Conversion chips */}
                  {conversions.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {conversions.map((c, i) => (
                        <span
                          key={`${c.from}-${c.to}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e8ed] bg-[#fafafa] px-2.5 py-1 text-[10px] font-medium text-[#707070]"
                        >
                          <span className="capitalize">{c.from}</span>
                          <ArrowRight className="size-2.5 text-[#b0b0b0]" />
                          <span className="capitalize">{c.to}</span>
                          <span className="font-semibold text-[#0071e3] tabular-nums">{c.pct}%</span>
                          {i < conversions.length - 1 && (
                            <span className="ml-1 h-3 w-px bg-[#e8e8ed]" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Success panel */}
                <section className="flex flex-col rounded-2xl border border-[#d2d2d7]/60 bg-white p-5 lg:col-span-3">
                  <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('successTitle')}</h2>
                  <p className="mt-0.5 text-xs text-[#707070]">{t('successSubtitle')}</p>

                  <div className="mt-5 flex flex-1 items-center justify-center gap-5">
                    <Donut value={hireRate} color="#34c759" size={112} strokeWidth={11}>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] tabular-nums">
                          <CountUp value={hireRate} />
                          <span className="text-base font-medium text-[#34c759]">%</span>
                        </span>
                        <span className="mt-0.5 text-[10px] font-medium text-[#707070]">{t('hireRate')}</span>
                      </div>
                    </Donut>
                    <div className="flex-1 space-y-4">
                      <MiniBar
                        label={t('interviewRate')}
                        value={interviewRate}
                        color="#5856d6"
                      />
                      <MiniBar
                        label={t('avgScore')}
                        value={Math.round(avgScore)}
                        color="#0071e3"
                      />
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3" />
                          {t('hired')}: {stats.hired.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-500">
                          <TrendingUp className="size-3 rotate-180" />
                          {t('rejected')}: {stats.rejected.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* CV — el corazón de la app */}
          <div className="order-4 md:order-1">
            <DocumentsHero
              t={t}
              baseReady={stats.base_cv_ready}
              adaptedCount={stats.adapted_cv_count}
              totalCvs={stats.total_cvs}
            />
          </div>

          {/* Progreso — perfil, plan y accesibilidad */}
          <div className="order-5 md:order-2">
            <InsightsGrid t={t} profile={profile} billing={billingStatus} access={access} />
          </div>

          {!hasData && (
            <div className="order-3 md:order-3">
              <EmptyState t={t} />
            </div>
          )}

          {/* Actividad reciente */}
          {hasData && activityData.some((d) => d.applications > 0 || d.interviews > 0) && (
            <div className="order-6 md:order-5">
              <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('activityTitle')}</h2>
                    <p className="mt-0.5 text-xs text-[#707070]">{t('activitySubtitle')}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-[#707070]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#0071e3]" />
                      {t('activityApplications')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#5856d6]" />
                      {t('activityInterviews')}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <ActivityChart
                    data={activityData}
                    appsLabel={t('activityApplications')}
                    interviewsLabel={t('activityInterviews')}
                    locale={locale}
                  />
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

/** Documents hero — puts the CV builder flow at the center of the dashboard. */
function DocumentsHero({
  t,
  baseReady,
  adaptedCount,
  totalCvs,
}: {
  t: (key: string) => string
  baseReady: boolean
  adaptedCount: number
  totalCvs: number
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0056b8] p-6 text-white md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
            {t('documentsEyebrow')}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">{t('documentsTitle')}</h2>
          <p className="mt-1.5 text-sm leading-5 text-white/85">{t('documentsDesc')}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {baseReady ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 font-medium text-emerald-100 ring-1 ring-emerald-300/40">
                <CheckCircle2 className="size-3.5" />
                {t('baseCvReady')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium text-white ring-1 ring-white/25">
                <span className="size-1.5 rounded-full bg-amber-300" />
                {t('baseCvPending')}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium text-white ring-1 ring-white/25">
              <FileText className="size-3.5" />
              {adaptedCount} {t('adaptedCvs')}
            </span>
            {totalCvs > 0 && (
              <span className="inline-flex items-center gap-1.5 px-1 text-white/60">
                {totalCvs} {t('totalDocs')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 md:shrink-0">
          {baseReady ? (
            <>
              <Link
                href="/cv-builder/adapt"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0071e3] transition-all hover:bg-white/90 hover:shadow-lg"
              >
                {t('goAdapt')}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/cv-builder/documents"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                <FolderOpen className="size-4" />
                {t('goMyCvs')}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/cv-builder"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0071e3] transition-all hover:bg-white/90 hover:shadow-lg"
              >
                {t('goGenerateBase')}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/cv-builder/documents"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                <FolderOpen className="size-4" />
                {t('goMyCvs')}
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Insights grid — profile strength, plan/credits, accessibility ─ */

type InsightT = (key: string, vars?: Record<string, string | number | Date>) => string

const CARD_CLASS =
  'group relative overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'

function InsightsGrid({
  t,
  profile,
  billing,
  access,
}: {
  t: InsightT
  profile: any
  billing: CreditStatus | undefined
  access: AccessibilitySettings | null
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ProfileCard t={t} profile={profile} />
      <PlanCard t={t} billing={billing} />
      <AccessCard t={t} access={access} />
    </div>
  )
}

/* ── Profile strength ────────────────────────────────────────────── */

function profileCompleteness(p: any) {
  const skillsCount = [
    ...(p?.skills?.software_tools ?? []),
    ...(p?.skills?.programming_ml ?? []),
    ...(p?.skills?.domain_expertise ?? []),
  ].length
  const checks = [
    { key: 'checkFullName', done: !!p?.full_name },
    { key: 'checkLocation', done: !!p?.location },
    { key: 'checkLinkedin', done: !!p?.linkedin_url },
    { key: 'checkExperience', done: (p?.experience?.length ?? 0) > 0 },
    { key: 'checkEducation', done: (p?.education?.length ?? 0) > 0 },
    { key: 'checkSkills', done: skillsCount > 0 },
    { key: 'checkProjects', done: (p?.projects?.length ?? 0) > 0 },
    { key: 'checkLanguages', done: (p?.languages?.length ?? 0) > 0 },
    { key: 'checkStatement', done: !!p?.profile_statement },
    { key: 'checkJobTarget', done: (p?.job_target?.target_titles?.length ?? 0) > 0 },
  ]
  const doneCount = checks.filter((c) => c.done).length
  return {
    pct: Math.round((doneCount / checks.length) * 100),
    doneCount,
    total: checks.length,
    missing: checks.filter((c) => !c.done).slice(0, 3),
  }
}

function ProfileCard({ t, profile }: { t: InsightT; profile: any }) {
  const { pct, doneCount, total, missing } = profileCompleteness(profile)
  const complete = pct === 100
  const ringColor = complete ? '#34c759' : '#0071e3'

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
          <UserRound className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('profileTitle')}</h2>
          <p className="text-[11px] text-[#707070]">{t('profileDesc')}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Donut value={pct} color={ringColor} size={88} strokeWidth={9}>
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold tracking-tight text-[#1d1d1f] tabular-nums">
              {pct}
              <span className="text-xs font-medium" style={{ color: ringColor }}>%</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-[#707070]">
              {t('profileStrength')}
            </span>
          </div>
        </Donut>
        <div className="min-w-0 flex-1">
          {complete ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="size-3.5" />
              {t('profileFull')}
            </p>
          ) : (
            <>
              <p className="text-[11px] font-medium text-[#707070]">{t('profileMissingLabel')}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {missing.map((m) => (
                  <span
                    key={m.key}
                    className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-medium text-[#585858] ring-1 ring-[#e8e8ed]"
                  >
                    {t(m.key)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] text-[#858585] tabular-nums">
          {doneCount}/{total} {t('profileSections')}
        </span>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#0068d2]"
        >
          {t('profileGoFill')}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  )
}

/* ── Plan & credits ─────────────────────────────────────────────── */

function PlanCard({ t, billing }: { t: InsightT; billing: CreditStatus | undefined }) {
  const isPaid =
    !!billing?.has_active_subscription && !!billing?.plan_key && billing.plan_key !== 'free'
  const used = billing?.credits_used ?? 0
  const total = billing?.credits_total ?? 0
  const creditsPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const dayUsed = billing?.quota_day_used ?? 0
  const dayLimit = billing?.quota_day_limit ?? 0
  const dayPct = dayLimit > 0 ? Math.min(100, Math.round((dayUsed / dayLimit) * 100)) : 0
  const planName = billing?.plan_name ?? t('planFree')

  if (!billing) {
    return (
      <section className={CARD_CLASS}>
        <div className="flex items-center gap-2.5">
          <div className="skeleton size-9 rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-3.5 w-24 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
        <div className="skeleton mt-5 h-5 w-full rounded-lg" />
        <div className="skeleton mt-3 h-5 w-full rounded-lg" />
        <div className="skeleton mt-6 h-14 w-full rounded-xl" />
      </section>
    )
  }

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff9f0a]/10 text-[#ff9f0a]">
            <Wallet className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('planTitle')}</h2>
            <p className="text-[11px] capitalize text-[#707070]">{planName}</p>
          </div>
        </div>
        {isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200/60">
            <CheckCircle2 className="size-3" />
            {t('planActive')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-semibold text-[#707070] ring-1 ring-[#e8e8ed]">
            <Gem className="size-3 text-[#ff9f0a]" />
            {t('planFree')}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="font-medium text-[#707070]">{t('planCredits')}</span>
          <span className="font-semibold text-[#1d1d1f] tabular-nums">
            {used.toLocaleString()} / {total.toLocaleString()}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0f0f2]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${creditsPct}%`,
              background: isPaid
                ? 'linear-gradient(90deg, #34c75999, #34c759)'
                : 'linear-gradient(90deg, #2997ff99, #0071e3)',
            }}
          />
        </div>
      </div>

      {dayLimit > 0 && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="font-medium text-[#707070]">{t('planQuota')}</span>
            <span className="font-semibold text-[#1d1d1f] tabular-nums">
              {dayUsed.toLocaleString()} / {dayLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0f0f2]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${dayPct}%`,
                background: 'linear-gradient(90deg, #5856d699, #5856d6)',
              }}
            />
          </div>
        </div>
      )}

      {isPaid ? (
        <div className="mt-5 flex justify-end">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] transition-colors hover:underline"
          >
            {t('planGoManage')}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-[#ffd60a]/40 bg-gradient-to-br from-[#fffbe8] to-[#fff7d6] p-3">
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff9f0a]/15 text-[#ff9f0a]">
              <Lock className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1d1d1f]">{t('planUpsellTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#707070]">{t('planUpsellDesc')}</p>
              <Link
                href="/billing"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#b26a00] transition-colors hover:underline"
              >
                {t('planUpsellCta')}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ── Accessibility ──────────────────────────────────────────────── */

function accessAdjustments(
  a: AccessibilitySettings,
  t: InsightT,
): { label: string; icon: LucideIcon }[] {
  const list: { label: string; icon: LucideIcon }[] = []
  if (a.fontSize !== 1) list.push({ label: t('accessFontSize', { pct: Math.round(a.fontSize * 100) }), icon: Type })
  if (a.lineHeight !== 1.6) list.push({ label: t('accessLineHeight', { pct: Math.round(a.lineHeight * 100) }), icon: AlignLeft })
  if (a.letterSpacing !== 0) list.push({ label: t('accessLetterSpacing'), icon: ArrowLeftRight })
  if (a.highContrast) list.push({ label: t('accessHighContrast'), icon: Contrast })
  if (a.reducedMotion) list.push({ label: t('accessReducedMotion'), icon: Wind })
  if (a.dyslexiaFont) list.push({ label: t('accessDyslexia'), icon: Type })
  if (a.fontFamily !== 'system') list.push({ label: t('accessFontFamily', { family: a.fontFamily }), icon: Type })
  if (!a.soundEnabled) list.push({ label: t('accessSound'), icon: VolumeX })
  return list
}

function AccessCard({ t, access }: { t: InsightT; access: AccessibilitySettings | null }) {
  const a = access ?? DEFAULT_SETTINGS
  const active = accessAdjustments(a, t)

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#bf5af2]/10 text-[#bf5af2]">
          <Accessibility className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f]">{t('accessTitle')}</h2>
          <p className="text-[11px] text-[#707070]">{t('accessDesc')}</p>
        </div>
      </div>

      {/* Live preview rendered with the user's own settings */}
      <div
        className="mt-4 rounded-xl border border-[#e8e8ed] bg-gradient-to-br from-[#fafafa] to-white p-3.5"
        style={{
          fontSize: `${a.fontSize}rem`,
          lineHeight: a.lineHeight,
          letterSpacing: a.letterSpacing > 0 ? `${a.letterSpacing}em` : undefined,
          fontFamily: a.fontFamily === 'system' ? undefined : a.fontFamily,
        }}
      >
        <p className="text-[#1d1d1f]">{t('accessPreview')}</p>
        <p className="mt-1 text-[#858585]">{t('accessDesc')}</p>
      </div>

      <div className="mt-4 min-h-[24px]">
        {active.length === 0 ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#707070] ring-1 ring-[#e8e8ed]">
            <CheckCircle2 className="size-3.5 text-[#34c759]" />
            {t('accessStandard')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {active.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 rounded-full bg-[#bf5af2]/10 px-2 py-0.5 text-[10px] font-medium text-[#8a2fbf] ring-1 ring-[#bf5af2]/20"
              >
                <c.icon className="size-3" />
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-[#858585]">
          {active.length > 0 ? t('accessCustomized') : ''}
        </span>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#bf5af2]/10 px-4 py-1.5 text-xs font-medium text-[#8a2fbf] ring-1 ring-[#bf5af2]/25 transition-all hover:bg-[#bf5af2]/15"
        >
          {t('accessGo')}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  )
}

function Donut({
  value,
  color,
  size = 112,
  strokeWidth = 11,
  children,
}: {
  value: number
  color: string
  size?: number
  strokeWidth?: number
  children: React.ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const filled = (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f0f0f2"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-[#707070]">{label}</span>
        <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums">
          {value.toLocaleString()}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0f0f2]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        />
      </div>
    </div>
  )
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white p-8 text-center md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#2997ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2997ff] to-[#0071e3] text-white shadow-[0_8px_24px_rgba(0,113,227,0.35)]">
        <Sparkles className="size-7" />
      </div>
      <h2 className="relative mt-6 text-xl font-semibold tracking-tight text-[#1d1d1f]">
        {t('emptyTitle')}
      </h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#707070]">
        {t('emptyDesc')}
      </p>
      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/cv-builder"
          className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#0068d2] hover:shadow-md"
        >
          {t('emptyCv')}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition-all hover:border-[#2997ff]/50 hover:text-[#0071e3]"
        >
          {t('emptySearch')}
        </Link>
      </div>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="skeleton h-44 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
            <div className="flex items-center gap-2.5">
              <div className="skeleton size-9 rounded-xl" />
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-24 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            </div>
            <div className="skeleton mt-5 h-16 w-full rounded-xl" />
            <div className="skeleton mt-4 h-5 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-4 md:p-5">
            <div className="skeleton size-9 rounded-xl" />
            <div className="skeleton mt-3 h-7 w-20 rounded-lg" />
            <div className="skeleton mt-2 h-3 w-16 rounded" />
            <div className="skeleton mt-3 h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="skeleton h-80 rounded-2xl lg:col-span-3" />
        <div className="skeleton h-80 rounded-2xl lg:col-span-2" />
      </div>
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  )
}
