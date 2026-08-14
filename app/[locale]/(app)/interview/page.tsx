'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playActionSound, playErrorSound } from '@/lib/sounds'
import { useBilling } from '@/hooks/useBilling'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { PageHeader } from '@/components/ui/page-header'
import { AppleTabs } from '@/components/ui/apple-tabs'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { PrepForm } from '@/components/interview/PrepForm'
import { PrepPack } from '@/components/interview/PrepPack'
import { MockChat } from '@/components/interview/MockChat'
import { HistoryList } from '@/components/interview/HistoryList'
import UpgradeModal from '@/components/UpgradeModal'
import type { InterviewPrepSummary, InterviewPrep, MockResponse, Application } from '@/types/pipeline'

function NoPrepEmpty({ t }: { t: (key: string) => string }) {
  return (
    <div className="card border-dashed p-8 text-center">
      <p className="text-sm text-[#858585]">{t('noPrepSelected')}</p>
    </div>
  )
}

const stageLabels: Record<string, string> = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  case: 'Case Study',
  final_round: 'Final Round',
}

const TABS = [
  { key: 'prep', label: 'Prep Pack' },
  { key: 'mock', label: 'Mock Interview' },
  { key: 'history', label: 'History' },
]

export default function InterviewPage() {
  const t = useTranslations('interview')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = useBilling().isPremium
  const { data: usage } = useUsageLimits()
  const atLimit = !premium && usage != null && usage.usage.interview_preps >= usage.limits.max_prepare_count

  // Data state
  const [preps, setPreps] = useState<InterviewPrepSummary[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedPrep, setSelectedPrep] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('prep')

  // Form state
  const [form, setForm] = useState({
    application_id: '',
    stage: 'technical',
    interview_date: '',
    interview_format: 'video',
    interviewer_names: '',
  })

  // Mock interview state
  const [mockState, setMockState] = useState<MockResponse | null>(null)
  const [mockAnswer, setMockAnswer] = useState('')
  const [mockLoading, setMockLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load data on mount
  useEffect(() => {
    Promise.all([
      apiFetch<InterviewPrepSummary[]>('/api/v1/interview/').catch(() => []),
      apiFetch<Application[]>('/api/v1/apply/').catch(() => []),
    ]).then(([p, a]) => {
      setPreps(Array.isArray(p) ? p : [])
      setApplications(Array.isArray(a) ? a : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mockState?.transcript])

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function generatePrep(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    try {
      const payload: Record<string, any> = {
        application_id: form.application_id,
        stage: form.stage,
      }
      if (form.interview_date) payload.interview_date = form.interview_date
      if (form.interview_format) payload.interview_format = form.interview_format
      if (form.interviewer_names) {
        payload.interviewer_names = form.interviewer_names.split(',').map(s => s.trim()).filter(Boolean)
      }

      const prep = await apiFetch<InterviewPrep>('/api/v1/interview/', { method: 'POST', body: JSON.stringify(payload) })
      setSelectedPrep(prep)
      setActiveTab('prep')

      const p = await apiFetch<InterviewPrepSummary[]>('/api/v1/interview/').catch(() => [])
      if (Array.isArray(p)) setPreps(p)

      playActionSound('interview')
      showSuccess('Interview prep generated!')
      addNotification({ pipeline: 'interview', description: `Prep pack generated for ${form.stage} stage`, status: 'success' })
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Failed to generate prep'
      playErrorSound()
      addNotification({ pipeline: 'interview', description: msg, status: 'error' })
      showError(msg)
    } finally {
      setGenerating(false)
    }
  }

  async function loadPrep(prepId: string) {
    try {
      const prep = await apiFetch<InterviewPrep>(`/api/v1/interview/${prepId}`)
      setSelectedPrep(prep)
      setActiveTab('prep')
      setMockState(null)
    } catch {
      showError('Failed to load prep')
    }
  }

  async function startMock() {
    if (!selectedPrep) return
    setMockLoading(true)
    try {
      const result = await apiFetch<MockResponse>(
        `/api/v1/interview/${selectedPrep.id}/mock`,
        { method: 'POST', body: JSON.stringify({}) }
      )
      setMockState(result)
      setActiveTab('mock')
    } catch (x) {
      showError(x instanceof Error ? x.message : 'Failed to start mock interview')
    } finally {
      setMockLoading(false)
    }
  }

  async function submitMockAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!mockState || !mockAnswer.trim() || !selectedPrep) return
    setMockLoading(true)
    try {
      const result = await apiFetch<MockResponse>(
        `/api/v1/interview/${selectedPrep.id}/mock`,
        { method: 'POST', body: JSON.stringify({ user_answer: mockAnswer }) }
      )
      if (result.is_complete) {
        playActionSound('interview')
        addNotification({ pipeline: 'interview', description: `Mock interview complete — ${result.total_questions} questions answered`, status: 'success' })
      }
      setMockState(result)
      setMockAnswer('')
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Failed to submit answer'
      playErrorSound()
      addNotification({ pipeline: 'interview', description: msg, status: 'error' })
      showError(msg)
    } finally {
      setMockLoading(false)
    }
  }

  function endSession() {
    setMockState(null)
    setActiveTab('prep')
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="06 / PREP"
        title={t('title')}
        subtitle={t('subtitle')}
        loading={loading}
        loadingLabel={tc('loading')}
      />

      {!premium && usage && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: limited to 5 interview preps. Upgrade to Premium for unlimited.'}
          usage={`${usage.usage.interview_preps}/${usage.limits.max_prepare_count}`}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t('upgrade') || 'Upgrade'}
        />
      )}

      {/* Tabs */}
      <div className="mt-8">
        <AppleTabs
          tabs={TABS}
          active={activeTab}
          onChange={(key) => {
            setActiveTab(key)
            if (key !== 'mock' && mockState) {
              setMockState(null)
            }
          }}
        />
      </div>

      <div className={`mt-6 grid gap-6 ${activeTab === 'mock' ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_1fr]'}`}>
        {/* Left column */}
        <div className="space-y-4">
          {activeTab !== 'mock' && (
            <PrepForm
              form={form}
              applications={applications}
              generating={generating}
              atLimit={atLimit}
              limitTooltip={t('limitReached') || 'Upgrade para más entrevistas'}
              onChange={(field, value) => updateForm(field, value)}
              onSubmit={generatePrep}
              t={t}
            />
          )}

          {activeTab === 'prep' && selectedPrep ? (
            <PrepPack
              prep={selectedPrep}
              onStartMock={startMock}
              mockLoading={mockLoading}
              t={t}
            />
          ) : activeTab === 'prep' && !selectedPrep ? (
            <NoPrepEmpty t={t} />
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {activeTab === 'mock' && (
            <MockChat
              mockState={mockState}
              mockAnswer={mockAnswer}
              mockLoading={mockLoading}
              stageLabel={selectedPrep ? stageLabels[selectedPrep.stage] || selectedPrep.stage : ''}
              chatEndRef={chatEndRef}
              onMockAnswerChange={setMockAnswer}
              onSubmitAnswer={submitMockAnswer}
              onEndSession={endSession}
              t={t}
              tc={tc}
            />
          )}

          {activeTab !== 'mock' && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">History</h3>
              <HistoryList
                preps={preps}
                applications={applications}
                selectedPrepId={selectedPrep?.id}
                onSelect={loadPrep}
                t={t}
              />
            </>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
