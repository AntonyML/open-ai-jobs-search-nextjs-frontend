'use client'

// ── Funnel bar sub-component (must be at module level to avoid remount on every render) ──
function FunnelBar({ label, value, pct, max, color }: {
  label: string; value: number; pct: number; max: number; color: string
}) {
  const width = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-right text-[12px] font-medium text-[#1d1d1f] shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-20 text-[12px] font-semibold text-[#1d1d1f] tabular-nums">
        {value}
        {pct > 0 && <span className="text-[#858585] font-normal ml-1">({pct}%)</span>}
      </span>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'

// ── Types ───────────────────────────────────────────────────────────

interface FunnelMetrics {
  total_applications: number
  interviews: number
  offers: number
  hired: number
  rejected: number
  no_response: number
  withdrawn: number
  in_progress: number
  application_to_interview_pct: number
  interview_to_offer_pct: number
  offer_to_hired_pct: number
  overall_success_pct: number
}

interface CalibrationKeyword {
  keyword: string
  present_in_count: number
  interview_rate: number
  hire_rate: number
  avg_score: number
  correlation: string
}

interface CalibrationInsight {
  category: string
  insight: string
  recommendation: string
  impact: string
}

interface CalibrationReport {
  funnel: FunnelMetrics
  top_keywords: CalibrationKeyword[]
  bottom_keywords: CalibrationKeyword[]
  insights: CalibrationInsight[]
  data_points: number
  generated_at: string
}

interface OutcomeSummary {
  id: string
  application_id: string
  status: string
  date_resolved: string | null
  created_at: string
}

interface Application {
  id: string
  job_posting_id: string
  created_at: string
  job_posting?: {
    id: string
    company: string | null
    title: string
  } | null
}

// ── Status helpers ─────────────────────────────────────────────────

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

const STATUS_COLORS: Record<string, string> = {
  interview_invited: 'bg-blue-50 text-blue-600 border-blue-200',
  phone_screen_completed: 'bg-blue-50 text-blue-600 border-blue-200',
  technical_completed: 'bg-blue-50 text-blue-600 border-blue-200',
  case_completed: 'bg-blue-50 text-blue-600 border-blue-200',
  final_round_completed: 'bg-blue-50 text-blue-600 border-blue-200',
  offer_received: 'bg-amber-50 text-amber-600 border-amber-200',
  hired: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  offer_declined: 'bg-amber-50 text-amber-600 border-amber-200',
  rejected: 'bg-rose-50 text-rose-500 border-rose-200',
  no_response: 'bg-gray-50 text-gray-500 border-gray-200',
  interview_only: 'bg-purple-50 text-purple-600 border-purple-200',
  withdrawn: 'bg-gray-50 text-gray-500 border-gray-200',
}

const IMPACT_COLORS: Record<string, string> = {
  high: 'border-l-[#0071e3] bg-[#f4f8fb]',
  medium: 'border-l-[#2997ff] bg-white',
  low: 'border-l-[#e2e2e5] bg-white',
}

// ── Component ───────────────────────────────────────────────────────

export default function OutcomePage() {
  const t = useTranslations('outcome')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<CalibrationReport | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeSummary[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'calibration'>('dashboard')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    application_id: '',
    status: 'interview_invited',
    date_resolved: '',
    phone_screen_date: '',
    technical_date: '',
    case_date: '',
    final_round_date: '',
    offer_received_date: '',
    notes: '',
    lessons_learned: '',
    valued_signals: '',
  })

  // Load all data on mount
  useEffect(() => {
    Promise.all([
      apiFetch<CalibrationReport>('/api/v1/outcome/calibration').catch(() => null),
      apiFetch<OutcomeSummary[]>('/api/v1/outcome/').catch(() => []),
      apiFetch<Application[]>('/api/v1/apply/').catch(() => []),
      apiFetch<any[]>('/api/v1/rank/jobs?limit=200').catch(() => []),
    ]).then(([r, o, a, jobs]) => {
      setReport(r)
      setOutcomes(Array.isArray(o) ? o : [])

      // Attach company & title from job postings
      const jobMap = new Map((Array.isArray(jobs) ? jobs : []).map((j: any) => [j.id, j]))
      const appsWithJobs = (Array.isArray(a) ? a : []).map(app => {
        const job = jobMap.get(app.job_posting_id)
        return { ...app, job_posting: job || null }
      })
      setApplications(appsWithJobs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function submitOutcome(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        application_id: form.application_id,
        status: form.status,
      }
      if (form.phone_screen_date) payload.phone_screen_date = form.phone_screen_date
      if (form.technical_date) payload.technical_date = form.technical_date
      if (form.case_date) payload.case_date = form.case_date
      if (form.final_round_date) payload.final_round_date = form.final_round_date
      if (form.offer_received_date) payload.offer_received_date = form.offer_received_date
      if (form.date_resolved) payload.date_resolved = form.date_resolved
      if (form.notes) payload.notes = form.notes
      if (form.lessons_learned) payload.lessons_learned = form.lessons_learned
      if (form.valued_signals) {
        payload.valued_signals = form.valued_signals.split(',').map(s => s.trim()).filter(Boolean)
      }

      await apiFetch('/api/v1/outcome/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showSuccess(t('saved', { default: 'Outcome recorded!' }))
      setShowModal(false)
      setForm({
        application_id: '', status: 'interview_invited', date_resolved: '',
        phone_screen_date: '', technical_date: '', case_date: '',
        final_round_date: '', offer_received_date: '', notes: '',
        lessons_learned: '', valued_signals: '',
      })

      // Refresh data
      const [r, o] = await Promise.all([
        apiFetch<CalibrationReport>('/api/v1/outcome/calibration').catch(() => null),
        apiFetch<OutcomeSummary[]>('/api/v1/outcome/').catch(() => []),
      ])
      if (r) setReport(r)
      if (Array.isArray(o)) setOutcomes(o)
    } catch (x) {
      showError(x instanceof Error ? x.message : t('failed', { default: 'Failed to save outcome' }))
    } finally {
      setSaving(false)
    }
  }

  function getApplicationLabel(appId: string) {
    const app = applications.find(a => a.id === appId)
    if (!app) return appId.slice(0, 12) + '...'
    const company = (app as any).job_posting?.company || ''
    const title = (app as any).job_posting?.title || ''
    const parts = [company, title].filter(Boolean)
    return parts.length ? parts.join(' — ') : appId.slice(0, 12) + '...'
  }


  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">07 / TRACK</p>
        <h2 className="title">{t('title')}</h2>
        <div className="mt-10 flex items-center justify-center py-20">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
          <span className="ml-3 text-sm text-[#707070]">{tc('loading')}</span>
        </div>
      </section>
    )
  }

  const funnel = report?.funnel
  const maxFunnelValue = funnel
    ? Math.max(funnel.total_applications, funnel.interviews, funnel.offers, funnel.hired, 1)
    : 1

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">07 / TRACK</p>
      <h2 className="title">{t('title')}</h2>
      <p className="mt-2 text-sm text-[#707070] max-w-2xl">{t('subtitle')}</p>

      {!premium && (
        <div className="mb-4 mt-4 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs text-amber-400/80 flex-1">
            {t('freeLimitation') || 'Free plan: limited to 5 tracked outcomes. Upgrade to Premium for unlimited.'}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="mt-8 flex gap-1 rounded-full bg-[#e2e2e5] p-0.5 w-fit">
        {(['dashboard', 'history', 'calibration'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-[#707070] hover:text-[#1d1d1f]'
            }`}
          >
            {tab === 'dashboard' ? t('dashboardTab') : tab === 'history' ? t('historyTab') : t('calibrationTab')}
          </button>
        ))}
      </div>

      {/* ── TAB: Dashboard ──────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="mt-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Applications', value: funnel?.total_applications || 0, color: 'text-[#1d1d1f]' },
              { label: 'Interviews', value: funnel?.interviews || 0, color: 'text-[#2997ff]' },
              { label: 'Offers', value: funnel?.offers || 0, color: 'text-[#0071e3]' },
              { label: 'Hired', value: funnel?.hired || 0, color: 'text-emerald-500' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
                  {card.label}
                </p>
                <p className={`mt-1 text-[32px] font-semibold leading-none tabular-nums ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Funnel visualization */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
            <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Conversion funnel</h3>
            <div className="space-y-3">
              <FunnelBar
                label="Applications"
                value={funnel?.total_applications || 0}
                pct={100}
                max={maxFunnelValue}
                color="bg-[#e2e2e5]"
              />
              <FunnelBar
                label="→ Interviews"
                value={funnel?.interviews || 0}
                pct={funnel?.application_to_interview_pct || 0}
                max={maxFunnelValue}
                color="bg-[#2997ff]"
              />
              <FunnelBar
                label="→ Offers"
                value={funnel?.offers || 0}
                pct={funnel?.interview_to_offer_pct || 0}
                max={maxFunnelValue}
                color="bg-[#0071e3]"
              />
              <FunnelBar
                label="→ Hired"
                value={funnel?.hired || 0}
                pct={funnel?.overall_success_pct || 0}
                max={maxFunnelValue}
                color="bg-emerald-400"
              />
            </div>
          </div>

          {/* Conversion rate cards */}
          {funnel && funnel.total_applications > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'App → Interview', value: `${funnel.application_to_interview_pct}%`, desc: `${funnel.interviews} of ${funnel.total_applications}` },
                { label: 'Interview → Offer', value: `${funnel.interview_to_offer_pct}%`, desc: `${funnel.offers} of ${funnel.interviews}` },
                { label: 'Offer → Hired', value: `${funnel.offer_to_hired_pct}%`, desc: `${funnel.hired} of ${funnel.offers}` },
              ].map(card => (
                <div key={card.label} className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
                  <p className="text-[22px] font-semibold text-[#1d1d1f] tabular-nums">{card.value}</p>
                  <p className="mt-0.5 text-[11px] text-[#858585]">{card.label}</p>
                  <p className="text-[10px] text-[#858585]">{card.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {(!funnel || funnel.total_applications === 0) && (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-12 text-center">
              <p className="text-sm text-[#858585]">
                No outcomes recorded yet. Start by saving an outcome for one of your applications.
              </p>
            </div>
          )}

          {/* Quick action */}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary w-full"
          >
            {tc('save')}
          </button>
        </div>
      )}

      {/* ── TAB: History ────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#707070]">{outcomes.length} outcomes recorded</p>
            <button onClick={() => setShowModal(true)} className="rounded-full bg-[#0071e3] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#0068d2] transition-colors">
              + {tc('save')}
            </button>
          </div>

          {outcomes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-12 text-center">
              <p className="text-sm text-[#858585]">{t('noData', { default: 'No outcomes recorded yet.' })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outcomes.map(o => (
                <div key={o.id} className="rounded-xl border border-[#e2e2e5] bg-white p-4 hover:border-[#d2d2d7] transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1d1d1f] truncate">
                        {getApplicationLabel(o.application_id)}
                      </p>
                      <p className="text-[11px] text-[#858585] mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {o.date_resolved && ` · Resolved ${o.date_resolved}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[o.status] || 'bg-gray-50 text-gray-500'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Calibration ────────────────────────────────── */}
      {activeTab === 'calibration' && (
        <div className="mt-6 space-y-6">
          {/* Data points */}
          <p className="text-xs text-[#858585]">
            Based on {report?.data_points || 0} data points
            · Generated {report?.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}
          </p>

          {/* Insights */}
          {report?.insights && report.insights.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">Insights</h3>
              {report.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`rounded-xl border border-[#d2d2d7] border-l-[3px] p-4 ${IMPACT_COLORS[insight.impact] || 'border-l-[#e2e2e5] bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1d1d1f]">{insight.insight}</p>
                      <p className="mt-1 text-[12px] text-[#707070] leading-snug">{insight.recommendation}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      insight.impact === 'high'
                        ? 'bg-[#0071e3]/10 text-[#0071e3]'
                        : insight.impact === 'medium'
                        ? 'bg-[#2997ff]/10 text-[#2997ff]'
                        : 'bg-[#e2e2e5] text-[#707070]'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center text-sm text-[#858585]">
              {t('noData', { default: 'Not enough data for calibration insights. Record at least 5 outcomes.' })}
            </div>
          )}

          {/* Top keywords */}
          {report?.top_keywords && report.top_keywords.length > 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">
                Top performing keywords
              </h3>
              <div className="space-y-2">
                {report.top_keywords.slice(0, 8).map((kw, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-sm text-[#1d1d1f] min-w-[120px] capitalize">{kw.keyword}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${kw.interview_rate}%` }} />
                    </div>
                    <span className="w-12 text-right text-[11px] text-[#707070] tabular-nums">
                      {kw.interview_rate}%
                    </span>
                    <span className="w-16 text-right text-[11px] text-[#858585]">
                      in {kw.present_in_count} jobs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom keywords */}
          {report?.bottom_keywords && report.bottom_keywords.length > 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">
                Low performing keywords
              </h3>
              <div className="space-y-2">
                {report.bottom_keywords.slice(0, 5).map((kw, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-300 shrink-0" />
                    <span className="text-sm text-[#1d1d1f] min-w-[120px] capitalize">{kw.keyword}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
                      <div className="h-full rounded-full bg-rose-300" style={{ width: `${kw.interview_rate}%` }} />
                    </div>
                    <span className="w-12 text-right text-[11px] text-[#707070] tabular-nums">
                      {kw.interview_rate}%
                    </span>
                    <span className="w-16 text-right text-[11px] text-[#858585]">
                      in {kw.present_in_count} jobs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={async () => {
              try {
                const r = await apiFetch<CalibrationReport>('/api/v1/outcome/calibration')
                setReport(r)
                showSuccess('Calibration refreshed')
              } catch (x) {
                showError('Not enough data yet')
              }
            }}
            className="rounded-full border border-[#0066cc] px-5 py-2 text-[12px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-colors"
          >
            Refresh calibration
          </button>
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-[#d2d2d7] bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Record outcome</h3>
              <button onClick={() => setShowModal(false)} className="rounded-full p-1.5 text-[#858585] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={submitOutcome} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Application select */}
              <label className="block">
                <span className="text-[12px] font-medium text-[#1d1d1f]">Application</span>
                <select
                  required
                  value={form.application_id}
                  onChange={e => setForm(prev => ({ ...prev, application_id: e.target.value }))}
                  className="field mt-1"
                >
                  <option value="">Select application…</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {(app as any).job_posting?.company || 'Unknown'} — {(app as any).job_posting?.title || 'Unknown role'}
                    </option>
                  ))}
                </select>
              </label>

              {/* Status select */}
              <label className="block">
                <span className="text-[12px] font-medium text-[#1d1d1f]">Status</span>
                <select
                  required
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="field mt-1"
                >
                  <optgroup label="Progress updates">
                    <option value="interview_invited">Interview invited</option>
                    <option value="phone_screen_completed">Phone screen completed</option>
                    <option value="technical_completed">Technical completed</option>
                    <option value="case_completed">Case completed</option>
                    <option value="final_round_completed">Final round completed</option>
                    <option value="offer_received">Offer received</option>
                  </optgroup>
                  <optgroup label="Resolutions">
                    <option value="hired">Hired</option>
                    <option value="offer_declined">Offer declined</option>
                    <option value="rejected">Rejected</option>
                    <option value="no_response">No response</option>
                    <option value="interview_only">Interview only</option>
                    <option value="withdrawn">Withdrawn</option>
                  </optgroup>
                </select>
              </label>

              {/* Dates (collapsible) */}
              <details className="group">
                <summary className="cursor-pointer text-[12px] font-medium text-[#0066cc] hover:text-[#0071e3] transition-colors">
                  Interview dates
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { key: 'phone_screen_date', label: 'Phone screen' },
                    { key: 'technical_date', label: 'Technical' },
                    { key: 'case_date', label: 'Case' },
                    { key: 'final_round_date', label: 'Final round' },
                    { key: 'offer_received_date', label: 'Offer received' },
                    { key: 'date_resolved', label: 'Date resolved' },
                  ].map(field => (
                    <label key={field.key} className="block">
                      <span className="text-[10px] text-[#858585]">{field.label}</span>
                      <input
                        type="date"
                        value={(form as any)[field.key] || ''}
                        onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="field mt-0.5 text-[12px]"
                      />
                    </label>
                  ))}
                </div>
              </details>

              {/* Notes */}
              <label className="block">
                <span className="text-[12px] font-medium text-[#1d1d1f]">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="field mt-1 h-20 resize-none"
                  placeholder="Feedback, what to improve, what worked…"
                />
              </label>

              {/* Lessons learned */}
              <label className="block">
                <span className="text-[12px] font-medium text-[#1d1d1f]">Lessons learned</span>
                <textarea
                  value={form.lessons_learned}
                  onChange={e => setForm(prev => ({ ...prev, lessons_learned: e.target.value }))}
                  className="field mt-1 h-16 resize-none"
                  placeholder="What would you do differently?"
                />
              </label>

              {/* Valued signals */}
              <label className="block">
                <span className="text-[12px] font-medium text-[#1d1d1f]">Valued signals</span>
                <input
                  type="text"
                  value={form.valued_signals}
                  onChange={e => setForm(prev => ({ ...prev, valued_signals: e.target.value }))}
                  className="field mt-1"
                  placeholder="Comma-separated: Tailored CV, STAR answers, Company research"
                />
                <p className="mt-0.5 text-[10px] text-[#858585]">
                  What did the company seem to value most?
                </p>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2.5 text-[12px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-[#0071e3] px-4 py-2.5 text-[12px] font-medium text-white hover:bg-[#0068d2] transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
