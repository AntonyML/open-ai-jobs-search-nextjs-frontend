'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'

interface HardSkillGap {
  skill: string
  type: string
  priority: string
  source_jobs: string[]
  frequency: number
  fit_weight: number
}

interface SynthesizedGap {
  skill: string
  type: string
  priority: string
  source: string
  evidence: string
}

interface LearningResource {
  title: string
  url: string
  format: 'course' | 'video' | 'article' | 'certification'
  duration_hours?: number
  cost: string
  quality_score: number
}

interface LearningPlanItem {
  skill: string
  type: string
  priority: string
  resources: LearningResource[]
  study_order: number
  prerequisites: string[]
  estimated_weeks: number
}

interface GapHeatmapItem {
  skill: string
  type: string
  priority: string
  gap_source: string
}

interface UpskillResult {
  id: string
  user_id: string
  candidate_id: string
  mode: string
  target_job_posting_id?: string
  target_job_url?: string
  hard_skill_gaps: HardSkillGap[]
  synthesized_gaps: SynthesizedGap[]
  gap_heatmap: GapHeatmapItem[]
  learning_plan: LearningPlanItem[]
  status: string
  error_message?: string
  created_at: string
  updated_at: string
}

interface UpskillSummary {
  id: string
  candidate_id: string
  mode: string
  status: string
  gaps_found: number
  learning_plan_items: number
  created_at: string
}

// ── Priority badge colors ──────────────────────────────────────────

const priorityColors: Record<string, { bg: string; text: string; label: string }> & {
  [key: string]: { bg: string; text: string; label: string }
} = {
  Critical: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Critical' },
  High: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'High' },
  Medium: { bg: 'bg-sky-50', text: 'text-sky-600', label: 'Medium' },
  Low: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Low' },
}

// ── Utility: format date ───────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Format icon for learning resource ───────────────────────────────

function resourceIcon(format: string) {
  switch (format) {
    case 'course': return '🎓'
    case 'video': return '▶️'
    case 'article': return '📄'
    case 'certification': return '🏅'
    default: return '🔗'
  }
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export default function UpskillPage() {
  const t = useTranslations('upskill')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()
  const [running, setRunning] = useState(false)
  const [pollId, setPollId] = useState<string | null>(null)
  const [current, setCurrent] = useState<UpskillResult | null>(null)
  const [history, setHistory] = useState<UpskillSummary[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'gaps' | 'heatmap' | 'plan'>('gaps')

  // Load history on mount
  useEffect(() => {
    apiFetch<UpskillSummary[]>('/api/v1/upskill/')
      .then(x => setHistory(Array.isArray(x) ? x : []))
      .catch(() => {})
  }, [])

  // Poll for completion
  useEffect(() => {
    if (!pollId) return
    const interval = window.setInterval(async () => {
      try {
        const result = await apiFetch<UpskillResult>(`/api/v1/upskill/${pollId}`)
        if (result.status === 'completed' || result.status === 'failed') {
          setCurrent(result)
          setPollId(null)
          setRunning(false)
          const h = await apiFetch<UpskillSummary[]>('/api/v1/upskill/')
          setHistory(Array.isArray(h) ? h : [])
          if (result.status === 'completed') {
            playPipelineSound('upskill')
            const gaps = result.gap_heatmap.length
            const planItems = result.learning_plan.length
            showSuccess(`Upskill complete — ${gaps} gaps identified, ${planItems} learning items`)
            addNotification({
              pipeline: 'upskill',
              description: `Identified ${gaps} skill gaps with ${planItems} learning plan items`,
              status: 'success',
            })
          } else {
            playErrorSound()
            const errMsg = result.error_message || 'Upskill analysis failed'
            showError(errMsg)
            addNotification({ pipeline: 'upskill', description: errMsg, status: 'error' })
          }
        }
      } catch {
        setPollId(null)
        setRunning(false)
      }
    }, 2000)
    return () => window.clearInterval(interval)
  }, [pollId])

  async function triggerUpskill() {
    setRunning(true)
    setError('')
    setCurrent(null)
    try {
      const result = await apiFetch<UpskillResult>('/api/v1/upskill/', {
        method: 'POST',
        body: JSON.stringify({ mode: 'aggregate' }),
      })
      setPollId(result.id)
    } catch (x) {
      setRunning(false)
      const msg = x instanceof Error ? x.message : 'Request failed'
      playErrorSound()
      showError(msg)
      addNotification({ pipeline: 'upskill', description: msg, status: 'error' })
      setError(msg)
    }
  }

  // ── Priority count for summary ──────────────────────────────────

  function getGapCount(prio: string): number {
    return (current?.gap_heatmap?.filter(g => g.priority === prio) ?? []).length
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">EXTRAS</p>
      <h2 className="title">{t('title')}</h2>
      <p className="mt-2 text-sm text-[#707070] max-w-2xl">{t('subtitle')}</p>

      {!premium && (
        <div className="mb-4 mt-4 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs text-amber-400/80 flex-1">
            {t('freeLimitation') || 'Premium feature — analyze skill gaps and get a learning plan. Upgrade to unlock.'}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        {/* ── Left: trigger + results ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Trigger button */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
            <button
              onClick={triggerUpskill}
              disabled={running}
              className="btn-primary w-full"
            >
              {running ? t('analyzing') : t('analyzeButton')}
            </button>

            {running && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#0066cc]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
                {t('analyzingHint')}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
          </div>

          {/* ── Results ──────────────────────────────────────────── */}
          {current?.status === 'completed' && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1d1d1f]">{current.gap_heatmap.length}</p>
                  <p className="text-[11px] text-[#858585] mt-0.5">{t('gapsFound')}</p>
                </div>
                <div className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1d1d1f]">{current.learning_plan.length}</p>
                  <p className="text-[11px] text-[#858585] mt-0.5">{t('planItems')}</p>
                </div>
                <div className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1d1d1f]">
                    {current.learning_plan.reduce((t, i) => t + i.estimated_weeks, 0)}
                  </p>
                  <p className="text-[11px] text-[#858585] mt-0.5">{t('estWeeks')}</p>
                </div>
              </div>

              {/* Priority distribution */}
              {['Critical', 'High', 'Medium', 'Low'].some(p => getGapCount(p) > 0) && (
                <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                  <h3 className="text-[13px] font-semibold text-[#1d1d1f] mb-3">{t('priorityDistribution')}</h3>
                  <div className="space-y-2">
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map(p => {
                      const count = getGapCount(p)
                      if (count === 0) return null
                      const total = current.gap_heatmap.length
                      const pct = Math.round((count / total) * 100)
                      const color = priorityColors[p]
                      return (
                        <div key={p} className="flex items-center gap-3">
                          <span className={`text-[11px] font-medium w-14 ${color.text}`}>{p}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#f5f5f7] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${color.bg.replace('bg-', 'bg-')}`}
                              style={{
                                width: `${pct}%`,
                                backgroundColor: p === 'Critical' ? '#f43f5e' : p === 'High' ? '#f59e0b' : p === 'Medium' ? '#0ea5e9' : '#9ca3af',
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-[#858585] w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tabbed detail view */}
              <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-[#d2d2d7]">
                  {(['gaps', 'heatmap', 'plan'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-[12px] font-medium transition-colors ${
                        activeTab === tab
                          ? 'text-[#1d1d1f] border-b-2 border-[#0071e3]'
                          : 'text-[#858585] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {tab === 'gaps' ? t('hardGaps', { count: current.hard_skill_gaps.length }) :
                       tab === 'heatmap' ? t('heatmap', { count: current.gap_heatmap.length }) :
                       t('learningPlan', { count: current.learning_plan.length })}
                    </button>
                  ))}
                </div>

                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {/* Tab: Hard gaps */}
                  {activeTab === 'gaps' && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] text-[#858585] uppercase tracking-wider border-b border-[#f0f0f2]">
                          <th className="pb-2 font-medium">Skill</th>
                          <th className="pb-2 font-medium">Priority</th>
                          <th className="pb-2 font-medium text-right">Freq.</th>
                          <th className="pb-2 font-medium text-right">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f2]">
                        {current.hard_skill_gaps
                          .sort((a, b) => b.fit_weight - a.fit_weight || b.frequency - a.frequency)
                          .map((gap, i) => {
                            const pc = priorityColors[gap.priority] || priorityColors.Low
                            return (
                              <tr key={i} className="text-[13px]">
                                <td className="py-2.5 text-[#1d1d1f] font-medium">{gap.skill}</td>
                                <td className="py-2.5">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${pc.bg} ${pc.text}`}>
                                    {pc.label}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right text-[#707070]">{gap.frequency}</td>
                                <td className="py-2.5 text-right text-[#707070] font-mono">{gap.fit_weight.toFixed(1)}</td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  )}

                  {/* Tab: Heatmap */}
                  {activeTab === 'heatmap' && (
                    <div className="space-y-2">
                      {current.gap_heatmap
                        .sort((a, b) => {
                          const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
                          return (a.priority in order ? order[a.priority] : 99) - (b.priority in order ? order[b.priority] : 99)
                        })
                        .map((item, i) => {
                          const pc = priorityColors[item.priority] || priorityColors.Low
                          return (
                            <div
                              key={i}
                              className={`rounded-xl border p-3.5 transition-all ${
                                pc.bg.replace('bg-', 'border-').replace('50', '200') || 'border-[#e2e2e5]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-[#1d1d1f]">{item.skill}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${pc.bg} ${pc.text}`}>
                                      {pc.label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#858585] mt-1">
                                    {item.type} · {item.gap_source}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Tab: Learning plan */}
                  {activeTab === 'plan' && (
                    <div className="space-y-4">
                      {current.learning_plan
                        .sort((a, b) => a.study_order - b.study_order)
                        .map((item, i) => {
                          const pc = priorityColors[item.priority] || priorityColors.Low
                          return (
                            <div key={i} className="rounded-xl border border-[#e2e2e5] p-4 space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-[11px] font-bold text-white">
                                      {item.study_order}
                                    </span>
                                    <p className="text-sm font-semibold text-[#1d1d1f]">{item.skill}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${pc.bg} ${pc.text}`}>
                                      {pc.label}
                                    </span>
                                  </div>
                                  {item.prerequisites.length > 0 && (
                                    <p className="text-[11px] text-[#858585] mt-1">
                                      Prerequisites: {item.prerequisites.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#707070] whitespace-nowrap">
                                  ~{item.estimated_weeks} weeks
                                </span>
                              </div>

                              {/* Resources */}
                              <div className="space-y-1.5">
                                {item.resources.map((res, j) => (
                                  <a
                                    key={j}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f5f5f7]"
                                  >
                                    <span className="text-base">{resourceIcon(res.format)}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{res.title}</p>
                                      <div className="flex items-center gap-2 text-[11px] text-[#858585]">
                                        <span className="capitalize">{res.format}</span>
                                        <span>·</span>
                                        <span className="capitalize">{res.cost}</span>
                                        {res.duration_hours && (
                                          <>
                                            <span>·</span>
                                            <span>~{res.duration_hours}h</span>
                                          </>
                                        )}
                                        <span>·</span>
                                        <span className="flex items-center gap-0.5">
                                          {'★'.repeat(Math.round(res.quality_score / 2))}
                                          <span className="text-[#b0b0b0]">/5</span>
                                        </span>
                                      </div>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-[#858585] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No results */}
          {current?.status === 'completed' && current.gap_heatmap.length === 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <p className="text-sm text-[#707070]">{t('noGapsFound')}</p>
            </div>
          )}

          {/* Failed */}
          {current?.status === 'failed' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {current.error_message || t('failed')}
            </div>
          )}
        </div>

        {/* ── Right: history ──────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">{t('history')}</h3>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center text-sm text-[#858585]">
              {t('noHistory')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(record => (
                <button
                  key={record.id}
                  className="w-full text-left rounded-xl border border-[#e2e2e5] bg-white p-4 cursor-pointer hover:border-[#d2d2d7] transition-colors"
                  onClick={async () => {
                    try {
                      const r = await apiFetch<UpskillResult>(`/api/v1/upskill/${record.id}`)
                      setCurrent(r)
                      setActiveTab('gaps')
                    } catch {}
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      record.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : record.status === 'failed'
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {record.status}
                    </span>
                    <span className="text-[11px] text-[#858585]">{fmtDate(record.created_at)}</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-[11px] text-[#707070]">
                    <span className="capitalize">{record.mode}</span>
                    <span>·</span>
                    <span>{record.gaps_found} gaps</span>
                    <span>·</span>
                    <span>{record.learning_plan_items} plan items</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
