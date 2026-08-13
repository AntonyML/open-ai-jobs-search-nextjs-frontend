'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { useBilling } from '@/hooks/useBilling'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import UpgradeModal from '@/components/UpgradeModal'

// ── Types ──────────────────────────────────────────────────────────

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

// ── Constants ──────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  Critical: { bg: 'bg-rose-50', text: 'text-rose-600', bar: '#f43f5e' },
  High: { bg: 'bg-amber-50', text: 'text-amber-600', bar: '#f59e0b' },
  Medium: { bg: 'bg-sky-50', text: 'text-sky-600', bar: '#0ea5e9' },
  Low: { bg: 'bg-gray-50', text: 'text-gray-500', bar: '#9ca3af' },
}

const RESOURCE_ICON: Record<string, string> = {
  course: '🎓',
  video: '▶️',
  article: '📄',
  certification: '🏅',
}

// ── Subcomponents ──────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
      {priority}
    </span>
  )
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-[#e2e2e5] bg-white p-4 text-center">
      <p className="text-2xl font-semibold text-[#1d1d1f]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#858585]">{label}</p>
    </div>
  )
}

function PriorityBar({ priority, count, total }: { priority: string; count: number; total: number }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className={`w-14 text-[11px] font-medium ${s.text}`}>{priority}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f5f5f7]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: s.bar, opacity: 0.6 }}
        />
      </div>
      <span className="w-8 text-right text-[11px] text-[#858585]">{count}</span>
    </div>
  )
}

function ResourceRow({ resource }: { resource: LearningResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f5f5f7]"
    >
      <span className="text-base">{RESOURCE_ICON[resource.format] || '🔗'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#1d1d1f]">{resource.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-[#858585]">
          <span className="capitalize">{resource.format}</span>
          <span>·</span>
          <span className="capitalize">{resource.cost}</span>
          {resource.duration_hours && <><span>·</span><span>~{resource.duration_hours}h</span></>}
          <span>·</span>
          <span className="flex items-center gap-0.5">
            {'★'.repeat(Math.round(resource.quality_score / 2))}
            <span className="text-[#b0b0b0]">/5</span>
          </span>
        </div>
      </div>
      <svg className="h-3.5 w-3.5 shrink-0 text-[#858585]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

function HistoryCard({
  record,
  onClick,
}: {
  record: UpskillSummary
  onClick: () => void
}) {
  return (
    <button
      className="w-full cursor-pointer rounded-xl border border-[#e2e2e5] bg-white p-4 text-left transition-colors hover:border-[#d2d2d7]"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            record.status === 'completed'
              ? 'bg-emerald-50 text-emerald-600'
              : record.status === 'failed'
                ? 'bg-rose-50 text-rose-500'
                : 'bg-amber-50 text-amber-600'
          }`}
        >
          {record.status}
        </span>
        <span className="text-[11px] text-[#858585]">
          {new Date(record.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-[#707070]">
        <span className="capitalize">{record.mode}</span>
        <span>·</span>
        <span>{record.gaps_found} gaps</span>
        <span>·</span>
        <span>{record.learning_plan_items} plan items</span>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export default function UpskillPage() {
  const t = useTranslations('upskill')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = useBilling().isPremium
  const [running, setRunning] = useState(false)
  const [pollId, setPollId] = useState<string | null>(null)
  const [current, setCurrent] = useState<UpskillResult | null>(null)
  const [history, setHistory] = useState<UpskillSummary[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'gaps' | 'heatmap' | 'plan'>('gaps')

  useEffect(() => {
    apiFetch<UpskillSummary[]>('/api/v1/upskill/')
      .then((x) => setHistory(Array.isArray(x) ? x : []))
      .catch(() => {})
  }, [])

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
            showSuccess(
              `Upskill complete — ${result.gap_heatmap.length} gaps identified, ${result.learning_plan.length} learning items`
            )
            addNotification({
              pipeline: 'upskill',
              description: `Identified ${result.gap_heatmap.length} skill gaps with ${result.learning_plan.length} learning plan items`,
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

  function getGapCount(prio: string): number {
    return (current?.gap_heatmap?.filter((g) => g.priority === prio) ?? []).length
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader eyebrow="EXTRAS" title={t('title')} subtitle={t('subtitle')} />

      {!premium && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Premium feature — analyze skill gaps. Upgrade to unlock.'}
          upgradeLabel={t('upgrade') || 'Upgrade'}
          onUpgrade={() => setShowUpgrade(true)}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        {/* Left: trigger + results */}
        <div className="space-y-4">
          {/* Trigger */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
            <AppleButton
              disabled={running}
              loading={running}
              className="w-full"
              onClick={triggerUpskill}
            >
              {running ? t('analyzing') : t('analyzeButton')}
            </AppleButton>

            {running && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#0066cc]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
                {t('analyzingHint')}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
          </div>

          {/* Results */}
          {current?.status === 'completed' && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard value={current.gap_heatmap.length} label={t('gapsFound')} />
                <StatCard value={current.learning_plan.length} label={t('planItems')} />
                <StatCard
                  value={current.learning_plan.reduce((t, i) => t + i.estimated_weeks, 0)}
                  label={t('estWeeks')}
                />
              </div>

              {/* Priority distribution */}
              {['Critical', 'High', 'Medium', 'Low'].some((p) => getGapCount(p) > 0) && (
                <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5">
                  <h3 className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">
                    {t('priorityDistribution')}
                  </h3>
                  <div className="space-y-2">
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => {
                      const count = getGapCount(p)
                      return count > 0 ? (
                        <PriorityBar key={p} priority={p} count={count} total={current.gap_heatmap.length} />
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Tabbed detail view */}
              <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white">
                <div className="flex border-b border-[#d2d2d7]">
                  {(['gaps', 'heatmap', 'plan'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-[12px] font-medium transition-colors ${
                        activeTab === tab
                          ? 'border-b-2 border-[#0071e3] text-[#1d1d1f]'
                          : 'text-[#858585] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {tab === 'gaps'
                        ? t('hardGaps', { count: current.hard_skill_gaps.length })
                        : tab === 'heatmap'
                          ? t('heatmap', { count: current.gap_heatmap.length })
                          : t('learningPlan', { count: current.learning_plan.length })}
                    </button>
                  ))}
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4">
                  {/* Gaps tab */}
                  {activeTab === 'gaps' && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#f0f0f2] text-[11px] uppercase tracking-wider text-[#858585]">
                          <th className="pb-2 font-medium">Skill</th>
                          <th className="pb-2 font-medium">Priority</th>
                          <th className="pb-2 text-right font-medium">Freq.</th>
                          <th className="pb-2 text-right font-medium">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f2]">
                        {current.hard_skill_gaps
                          .sort((a, b) => b.fit_weight - a.fit_weight || b.frequency - a.frequency)
                          .map((gap, i) => (
                            <tr key={i} className="text-[13px]">
                              <td className="py-2.5 font-medium text-[#1d1d1f]">{gap.skill}</td>
                              <td className="py-2.5">
                                <PriorityBadge priority={gap.priority} />
                              </td>
                              <td className="py-2.5 text-right text-[#707070]">{gap.frequency}</td>
                              <td className="py-2.5 font-mono text-right text-[#707070]">
                                {gap.fit_weight.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {/* Heatmap tab */}
                  {activeTab === 'heatmap' && (
                    <div className="space-y-2">
                      {current.gap_heatmap
                        .sort((a, b) => {
                          const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
                          return (order[a.priority] ?? 99) - (order[b.priority] ?? 99)
                        })
                        .map((item, i) => {
                          const s = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Low
                          return (
                            <div
                              key={i}
                              className={`rounded-xl border p-3.5 transition-all ${s.bg.replace('bg-', 'border-').replace('50', '200') || 'border-[#e2e2e5]'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-[#1d1d1f]">{item.skill}</p>
                                    <PriorityBadge priority={item.priority} />
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#858585]">
                                    {item.type} · {item.gap_source}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Learning plan tab */}
                  {activeTab === 'plan' && (
                    <div className="space-y-4">
                      {current.learning_plan
                        .sort((a, b) => a.study_order - b.study_order)
                        .map((item, i) => (
                          <div key={i} className="space-y-3 rounded-xl border border-[#e2e2e5] p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-[11px] font-bold text-white">
                                    {item.study_order}
                                  </span>
                                  <p className="text-sm font-semibold text-[#1d1d1f]">{item.skill}</p>
                                  <PriorityBadge priority={item.priority} />
                                </div>
                                {item.prerequisites.length > 0 && (
                                  <p className="mt-1 text-[11px] text-[#858585]">
                                    Prerequisites: {item.prerequisites.join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="whitespace-nowrap text-[11px] text-[#707070]">
                                ~{item.estimated_weeks} weeks
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {item.resources.map((res, j) => (
                                <ResourceRow key={j} resource={res} />
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {current?.status === 'completed' && current.gap_heatmap.length === 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <p className="text-sm text-[#707070]">{t('noGapsFound')}</p>
            </div>
          )}

          {current?.status === 'failed' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {current.error_message || t('failed')}
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">
            {t('history')}
          </h3>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center text-sm text-[#858585]">
              {t('noHistory')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                  onClick={async () => {
                    try {
                      const r = await apiFetch<UpskillResult>(`/api/v1/upskill/${record.id}`)
                      setCurrent(r)
                      setActiveTab('gaps')
                    } catch {}
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
