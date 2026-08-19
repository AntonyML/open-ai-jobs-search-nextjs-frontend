'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { useBilling } from '@/hooks/useBilling'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { PageHeader } from '@/components/ui/page-header'
import { AppleTabs } from '@/components/ui/apple-tabs'
import { AppleButton } from '@/components/ui/apple-button'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { SummaryCards } from '@/components/outcome/SummaryCards'
import { FunnelChart } from '@/components/outcome/FunnelChart'
import { ConversionRates } from '@/components/outcome/ConversionRates'
import { InsightCard } from '@/components/outcome/InsightCard'
import { KeywordList } from '@/components/outcome/KeywordList'
import { OutcomeModal } from '@/components/outcome/OutcomeModal'
import { OutcomeHistory } from '@/components/outcome/OutcomeHistory'
import UpgradeModal from '@/components/UpgradeModal'
import type { CalibrationReport, OutcomeSummary, Application } from '@/types/shared'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'history', label: 'History' },
  { key: 'calibration', label: 'Calibration' },
]

const INITIAL_FORM = {
  application_id: '', status: 'interview_invited', date_resolved: '',
  phone_screen_date: '', technical_date: '', case_date: '',
  final_round_date: '', offer_received_date: '', notes: '',
  lessons_learned: '', valued_signals: '',
}

export default function OutcomePage() {
  const t = useTranslations('outcome')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = useBilling().isPremium
  const { data: usage } = useUsageLimits()
  const atLimit = !premium && usage != null && usage.usage.outcomes >= usage.limits.max_track_count

  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<CalibrationReport | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeSummary[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

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
      const payload: Record<string, any> = { application_id: form.application_id, status: form.status }
      for (const key of ['phone_screen_date', 'technical_date', 'case_date', 'final_round_date', 'offer_received_date', 'date_resolved', 'notes', 'lessons_learned'] as const) {
        if ((form as any)[key]) payload[key] = (form as any)[key]
      }
      if (form.valued_signals) {
        payload.valued_signals = form.valued_signals.split(',').map(s => s.trim()).filter(Boolean)
      }

      await apiFetch('/api/v1/outcome/', { method: 'POST', body: JSON.stringify(payload) })
      showSuccess(t('saved', { default: 'Outcome recorded!' }))
      setShowModal(false)
      setForm(INITIAL_FORM)

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

  const funnel = report?.funnel

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="07 / TRACK"
        title={t('title')}
        subtitle={t('subtitle')}
        loading={loading}
        loadingLabel={tc('loading')}
      />

      {!premium && usage && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: limited to 5 tracked outcomes. Upgrade to Premium for unlimited.'}
          usage={`${usage.usage.outcomes}/${usage.limits.max_track_count}`}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t('upgrade') || 'Upgrade'}
        />
      )}

      {/* Tabs */}
      <div className="mt-8">
        <AppleTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── TAB: Dashboard ──────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="mt-6 space-y-6">
          <SummaryCards cards={[
            { label: 'Applications', value: funnel?.total_applications || 0, color: 'text-[#1d1d1f]' },
            { label: 'Interviews', value: funnel?.interviews || 0, color: 'text-[#2997ff]' },
            { label: 'Offers', value: funnel?.offers || 0, color: 'text-[#0071e3]' },
            { label: 'Hired', value: funnel?.hired || 0, color: 'text-emerald-500' },
          ]} />

          <FunnelChart funnel={funnel} />
          <ConversionRates funnel={funnel} />

          {(!funnel || funnel.total_applications === 0) && (
            <div className="card border-dashed p-12 text-center">
              <p className="text-sm text-[#858585]">
                No outcomes recorded yet. Start by saving an outcome for one of your applications.
              </p>
            </div>
          )}

          <AppleButton className="w-full" onClick={() => setShowModal(true)}>
            {tc('save')}
          </AppleButton>
        </div>
      )}

      {/* ── TAB: History ────────────────────────────────────── */}
      {activeTab === 'history' && (
        <OutcomeHistory
          outcomes={outcomes}
          applications={applications}
          onAdd={() => setShowModal(true)}
          t={t}
          tc={tc}
        />
      )}

      {/* ── TAB: Calibration ────────────────────────────────── */}
      {activeTab === 'calibration' && (
        <div className="mt-6 space-y-6">
          <p className="text-xs text-[#858585]">
            Based on {report?.data_points || 0} data points
            · Generated {report?.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}
          </p>

          {report?.insights && report.insights.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">Insights</h3>
              {report.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="card border-dashed p-8 text-center">
              <p className="text-sm text-[#858585]">
                {t('noData', { default: 'Not enough data for calibration insights. Record at least 5 outcomes.' })}
              </p>
            </div>
          )}

          <KeywordList
            title="Top performing keywords"
            keywords={report?.top_keywords || []}
            variant="top"
          />

          <KeywordList
            title="Low performing keywords"
            keywords={report?.bottom_keywords || []}
            variant="bottom"
          />

          <button
            onClick={async () => {
              try {
                const r = await apiFetch<CalibrationReport>('/api/v1/outcome/calibration')
                setReport(r)
                showSuccess(tc('done'))
              } catch {
                showError(tc('error'))
              }
            }}
            className="btn-secondary w-full"
          >
            Refresh calibration
          </button>
        </div>
      )}

      <OutcomeModal
        open={showModal}
        saving={saving}
        atLimit={atLimit}
        limitTooltip={t('limitReached') || 'Upgrade para más resultados'}
        form={form}
        applications={applications}
        onFormChange={setForm}
        onSubmit={submitOutcome}
        onClose={() => setShowModal(false)}
        tc={tc}
        t={t}
      />

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
