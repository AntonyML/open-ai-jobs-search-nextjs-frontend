'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'

// ── Types ───────────────────────────────────────────────────────────

interface InterviewPrepSummary {
  id: string
  application_id: string
  stage: string
  interview_date: string | null
  interview_format: string | null
  created_at: string
}

interface InterviewPrep {
  id: string
  application_id: string
  stage: string
  interview_date: string | null
  interview_format: string | null
  interviewer_names: string[] | null
  company_research: {
    mission: string | null
    values: string[]
    recent_news: { title: string; url: string; date: string }[]
    products: string[]
    team_structure: string | null
    growth_signals: string[]
    red_flags: string[]
  } | null
  conversation_hooks: { topic: string; source_url: string; why_relevant: string }[]
  likely_questions: { question: string; source: string; priority: string }[]
  star_mapping: { question: string; star_example_id: string; star_example_title: string }[]
  new_star_drafts: { question: string; draft_situation: string; draft_task: string; draft_action: string; draft_result: string }[]
  consistency_brief: { claim: string; source: string; why_probed: string }[]
  tough_questions: { question: string; answer: string }[]
  questions_to_ask: { question: string; category: string; why_ask: string }[]
  logistics: { date: string | null; format: string | null; interviewer_names: string[]; phone_video_tips: string[] } | null
  mock_transcript: string | null
  created_at: string
}

interface MockResponse {
  prep_id: string
  question: string
  feedback: string | null
  question_number: number
  total_questions: number
  is_complete: boolean
  transcript: { role: string; content: string }[]
  message: string
}

interface Application {
  id: string
  job_posting_id: string
  created_at: string
}

// ── Component ───────────────────────────────────────────────────────

export default function InterviewPage() {
  const t = useTranslations('interview')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()
  // State
  const [preps, setPreps] = useState<InterviewPrepSummary[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedPrep, setSelectedPrep] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'prep' | 'mock' | 'history'>('prep')

  // Form state
  const [form, setForm] = useState({
    application_id: '',
    stage: 'technical',
    interview_date: '',
    interview_format: 'video',
    interviewer_names: '',
  })

  // Mock interview state
  const [mockActive, setMockActive] = useState(false)
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

      const prep = await apiFetch<InterviewPrep>('/api/v1/interview/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSelectedPrep(prep)
      setActiveTab('prep')

      // Refresh preps list
      const p = await apiFetch<InterviewPrepSummary[]>('/api/v1/interview/').catch(() => [])
      if (Array.isArray(p)) setPreps(p)

      playPipelineSound('interview')
      showSuccess('Interview prep generated!')
      addNotification({
        pipeline: 'interview',
        description: `Prep pack generated for ${form.stage} stage`,
        status: 'success',
      })
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
      setMockActive(false)
      setMockState(null)
    } catch (x) {
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
      setMockActive(true)
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
        {
          method: 'POST',
          body: JSON.stringify({ user_answer: mockAnswer }),
        }
      )
      // If this was the last question, notify
      if (result.is_complete) {
        playPipelineSound('interview')
        addNotification({
          pipeline: 'interview',
          description: `Mock interview complete — ${result.total_questions} questions answered`,
          status: 'success',
        })
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

  function getAppLabel(appId: string) {
    const app = applications.find(a => a.id === appId)
    if (!app) return appId.slice(0, 12) + '...'
    return appId.slice(0, 12) + '...'
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">06 / PREP</p>
        <h2 className="title">{t('title')}</h2>
        <div className="mt-10 flex items-center justify-center py-20">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
          <span className="ml-3 text-sm text-[#707070]">{tc('loading')}</span>
        </div>
      </section>
    )
  }

  // Determine stage display name
  const stageLabels: Record<string, string> = {
    phone_screen: 'Phone Screen',
    technical: 'Technical',
    case: 'Case Study',
    final_round: 'Final Round',
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">06 / PREP</p>
      <h2 className="title">{t('title')}</h2>
      <p className="mt-2 text-sm text-[#707070] max-w-2xl">{t('subtitle')}</p>

      {!premium && (
        <div className="mb-4 mt-4 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs text-amber-400/80 flex-1">
            {t('freeLimitation') || 'Free plan: limited to 5 interview preps. Upgrade to Premium for unlimited.'}
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
        {(['prep', 'mock', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-[#707070] hover:text-[#1d1d1f]'
            }`}
          >
            {tab === 'prep' ? t('prepPack') : tab === 'mock' ? t('mockInterview') : t('history')}
          </button>
        ))}
      </div>

      <div className={`mt-6 grid gap-6 ${activeTab === 'mock' ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_1fr]'}`}>
        {/* ── Left column ───────────────────────────────────── */}
        <div className="space-y-4">
          {/* Generate form */}
          {activeTab !== 'mock' && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">{t('generatePrep')}</h3>
              <form onSubmit={generatePrep} className="space-y-4">
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
                        {getAppLabel(app.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#1d1d1f]">Stage</span>
                    <select
                      value={form.stage}
                      onChange={e => setForm(prev => ({ ...prev, stage: e.target.value }))}
                      className="field mt-1"
                    >
                      <option value="phone_screen">Phone Screen</option>
                      <option value="technical">Technical</option>
                      <option value="case">Case Study</option>
                      <option value="final_round">Final Round</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#1d1d1f]">Format</span>
                    <select
                      value={form.interview_format}
                      onChange={e => setForm(prev => ({ ...prev, interview_format: e.target.value }))}
                      className="field mt-1"
                    >
                      <option value="">Any</option>
                      <option value="phone">Phone</option>
                      <option value="video">Video</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#1d1d1f]">Date</span>
                    <input
                      type="date"
                      value={form.interview_date}
                      onChange={e => setForm(prev => ({ ...prev, interview_date: e.target.value }))}
                      className="field mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#1d1d1f]">Interviewers</span>
                    <input
                      type="text"
                      value={form.interviewer_names}
                      onChange={e => setForm(prev => ({ ...prev, interviewer_names: e.target.value }))}
                      className="field mt-1"
                      placeholder="Comma-separated names"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="btn-primary w-full"
                >
                  {generating ? t('generating') : t('generatePrep')}
                </button>
              </form>
            </div>
          )}

          {/* Prep pack display */}
          {selectedPrep && activeTab === 'prep' && (
            <div className="space-y-4">
              {/* Company research */}
              {selectedPrep.company_research && (
                <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">{t('companyResearch')}</h3>
                  {selectedPrep.company_research.mission && (
                    <p className="text-sm text-[#1d1d1f] mb-2">{selectedPrep.company_research.mission}</p>
                  )}
                  {selectedPrep.company_research.values.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedPrep.company_research.values.map((v, i) => (
                        <span key={i} className="rounded-full bg-[#f4f8fb] px-2.5 py-0.5 text-[11px] text-[#0066cc]">{v}</span>
                      ))}
                    </div>
                  )}
                  {selectedPrep.company_research.recent_news.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] font-medium text-[#707070]">{t('recentNews')}</p>
                      {selectedPrep.company_research.recent_news.map((n, i) => (
                        <p key={i} className="text-[12px] text-[#1d1d1f]">• {n.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Likely questions */}
              {selectedPrep.likely_questions.length > 0 && (
                <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
                    {t('likelyQuestions', { count: selectedPrep.likely_questions.length })}
                  </h3>
                  <div className="space-y-2">
                    {selectedPrep.likely_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          q.priority === 'high' ? 'bg-rose-400' : q.priority === 'medium' ? 'bg-amber-400' : 'bg-[#e2e2e5]'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm text-[#1d1d1f]">{q.question}</p>
                          <p className="text-[11px] text-[#858585]">from {q.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tough questions */}
              {selectedPrep.tough_questions.length > 0 && (
                <details className="group rounded-2xl border border-[#d2d2d7] bg-white">
                  <summary className="cursor-pointer p-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors rounded-2xl">
                    {t('toughQuestions', { count: selectedPrep.tough_questions.length })}
                  </summary>
                  <div className="px-5 pb-5 space-y-4">
                    {selectedPrep.tough_questions.map((q, i) => (
                      <div key={i} className="border-t border-[#e2e2e5] pt-3">
                        <p className="text-[12px] font-medium text-[#1d1d1f]">Q: {q.question}</p>
                        <p className="mt-1 text-[12px] text-[#707070] leading-snug">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* STAR mapping */}
              {selectedPrep.star_mapping.length > 0 && (
                <details className="group rounded-2xl border border-[#d2d2d7] bg-white">
                  <summary className="cursor-pointer p-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors rounded-2xl">
                    {t('starExamples', { count: selectedPrep.star_mapping.length })}
                  </summary>
                  <div className="px-5 pb-5 space-y-3">
                    {selectedPrep.star_mapping.map((m, i) => (
                      <div key={i} className="border-t border-[#e2e2e5] pt-2">
                        <p className="text-[12px] text-[#1d1d1f]">{m.question}</p>
                        <p className="text-[11px] text-[#0066cc]">→ {m.star_example_title}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Questions to ask */}
              {selectedPrep.questions_to_ask.length > 0 && (
                <details className="group rounded-2xl border border-[#d2d2d7] bg-white">
                  <summary className="cursor-pointer p-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors rounded-2xl">
                    {t('questionsToAsk', { count: selectedPrep.questions_to_ask.length })}
                  </summary>
                  <div className="px-5 pb-5 space-y-3">
                    {selectedPrep.questions_to_ask.map((q, i) => (
                      <div key={i} className="border-t border-[#e2e2e5] pt-2">
                        <p className="text-[12px] text-[#1d1d1f]">{q.question}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded-full bg-[#f4f8fb] px-2 py-0.5 text-[10px] text-[#0066cc]">{q.category}</span>
                          <span className="text-[10px] text-[#858585]">{q.why_ask}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Consistency brief */}
              {selectedPrep.consistency_brief.length > 0 && (
                <details className="group rounded-2xl border border-[#d2d2d7] bg-white">
                  <summary className="cursor-pointer p-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors rounded-2xl">
                    {t('consistencyBrief')}
                  </summary>
                  <div className="px-5 pb-5 space-y-3">
                    {selectedPrep.consistency_brief.map((c, i) => (
                      <div key={i} className="border-t border-[#e2e2e5] pt-2">
                        <p className="text-[12px] text-[#1d1d1f]">{c.claim}</p>
                        <p className="text-[11px] text-[#707070]">{c.why_probed}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Logistics */}
              {selectedPrep.logistics && (
                <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">{t('logistics')}</h3>
                  {selectedPrep.logistics.phone_video_tips.length > 0 && (
                    <ul className="space-y-1">
                      {selectedPrep.logistics.phone_video_tips.map((tip, i) => (
                        <li key={i} className="text-[12px] text-[#707070]">• {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Mock interview button */}
              <button
                onClick={startMock}
                disabled={mockLoading}
                className="btn-primary w-full"
              >                  {mockLoading ? t('starting') : t('startMock')}
              </button>
            </div>
          )}

          {/* No prep selected */}
          {!selectedPrep && activeTab === 'prep' && (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center text-sm text-[#858585]">                  {t('noPrepSelected')}
            </div>
          )}
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-4">
          {/* Mock interview chat */}
          {activeTab === 'mock' && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden flex flex-col min-h-[500px]">
              {/* Header */}
              <div className="border-b border-[#d2d2d7] bg-[#fafafa] px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1d1d1f]">{t('mockInterview')}</h3>
                    {mockState && (
                      <p className="text-[11px] text-[#707070]">
                        Question {mockState.question_number} of {mockState.total_questions}
                        {selectedPrep && ` · ${stageLabels[selectedPrep.stage] || selectedPrep.stage}`}
                      </p>
                    )}
                  </div>
                  {mockActive && (
                    <button
                      onClick={() => { setMockActive(false); setMockState(null); setActiveTab('prep') }}
                      className="text-[11px] text-[#707070] hover:text-[#1d1d1f] transition-colors"
                    >
                      {t('endSession')}
                    </button>
                  )}
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {!mockState ? (
                  <div className="flex items-center justify-center h-full text-sm text-[#858585]">
                    {t('startMock')}
                  </div>
                ) : mockState.transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-[#858585]">
                    {tc('loading')}
                  </div>
                ) : (
                  <>
                    {mockState.transcript.map((turn, i) => (
                      <div key={i} className={`flex ${turn.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                          turn.role === 'candidate'
                            ? 'bg-[#0071e3] text-white rounded-br-sm'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-sm'
                        }`}>
                          <p className="text-[11px] font-medium opacity-60 mb-0.5">
                            {turn.role === 'interviewer' ? 'Interviewer' : 'You'}
                          </p>
                          <p className="text-sm leading-snug whitespace-pre-wrap">{turn.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Feedback display */}
                    {mockState.feedback && !mockState.is_complete && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl border border-[#2997ff]/30 bg-[#f4f8fb] px-4 py-2.5 rounded-bl-sm">
                          <p className="text-[11px] font-medium text-[#2997ff] mb-0.5">Feedback</p>
                          <p className="text-[12px] text-[#1d1d1f] leading-snug">{mockState.feedback}</p>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              {mockState && !mockState.is_complete && (
                <form onSubmit={submitMockAnswer} className="border-t border-[#d2d2d7] p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={mockAnswer}
                      onChange={e => setMockAnswer(e.target.value)}
                      placeholder="Type your answer…"
                      className="field flex-1 h-20 resize-none text-sm"
                      disabled={mockLoading}
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={mockLoading || !mockAnswer.trim()}
                      className="rounded-full bg-[#0071e3] px-5 py-1.5 text-[12px] font-medium text-white hover:bg-[#0068d2] transition-colors disabled:opacity-40"
                    >
                      {mockLoading ? t('submitting') : t('submitAnswer')}
                    </button>
                  </div>
                </form>
              )}

              {/* Complete state */}
              {mockState?.is_complete && (
                <div className="border-t border-[#d2d2d7] p-6 text-center">
                  <p className="text-sm font-semibold text-emerald-600">{t('mockComplete')}</p>
                  <p className="mt-1 text-[12px] text-[#707070]">
                    {t('mockCompleteDesc')}
                  </p>
                  <button
                    onClick={() => { setMockActive(false); setMockState(null); setActiveTab('prep') }}
                    className="mt-3 rounded-full border border-[#0066cc] px-4 py-1.5 text-[12px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-colors"
                  >
                    {t('backToPrep')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History sidebar */}
          {activeTab !== 'mock' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">History</h3>

              {preps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d2d2d7] p-6 text-center text-sm text-[#858585]">
                  {t('noPreps')}
                </div>
              ) : (
                preps.map(prep => (
                  <button
                    key={prep.id}
                    onClick={() => loadPrep(prep.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all hover:border-[#d2d2d7] ${
                      selectedPrep?.id === prep.id ? 'border-[#2997ff] bg-[#f4f8fb]' : 'border-[#e2e2e5] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#f4f8fb] px-2 py-0.5 text-[10px] font-medium text-[#0066cc]">
                        {stageLabels[prep.stage] || prep.stage}
                      </span>
                      <span className="text-[10px] text-[#858585]">
                        {new Date(prep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-[#707070]">
                      {getAppLabel(prep.application_id)}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
