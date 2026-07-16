'use client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useOrchestrator } from '@/lib/orchestrator'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { getCompletedSteps, setCompletedSteps, isPremium } from '@/lib/auth'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import UpgradeModal from '@/components/UpgradeModal'

const FOCUS_TAGS = [
  'AI Engineering',
  'Full-Stack Development',
  'Backend Engineering',
  'Data Science',
  'DevOps / Platform',
  'Mobile Development',
  'Frontend Development',
  'Machine Learning',
]

const ITEMS_PER_PAGE = 10

export default function Rank() {
  const t = useTranslations('rank')
  const tc = useTranslations('common')
  const [focusArea, setFocusArea] = useState('')
  const [customFocus, setCustomFocus] = useState('')
  const [topN, setTopN] = useState(5)
  const [reRank, setReRank] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalJobs, setTotalJobs] = useState(0)
  const [rankCounts, setRankCounts] = useState<{ total: number; ranked: number; unranked: number } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()
  const { data: usage } = useUsageLimits()

  const atLimit = !premium && usage != null && usage.usage.rank_iterations >= usage.limits.max_rank_iterations
  const router = useRouter()

  // Orchestrator hook for real-time progress
  const { queue, providers } = useOrchestrator()
  const jobIdRef = useRef<string | null>(null)
  /** Resolve/reject for the Promise that waits for job completion via WebSocket */
  const resolveJobRef = useRef<((status: any) => void) | null>(null)
  const rejectJobRef = useRef<((err: Error) => void) | null>(null)

  // Load existing jobs on mount
  useEffect(() => {
    apiFetch<any>('/api/v1/rank/jobs')
      .then(x => setItems(Array.isArray(x) ? x : (x.items || x.jobs || [])))
      .catch(() => {})
  }, [])

  // Re-fetch ranked jobs & resolve the submit Promise when job completes
  // (triggered by WebSocket queue updates — no polling needed)
  useEffect(() => {
    if (!jobIdRef.current || !queue) return

    const completedJob = queue.recent_completed.find(j => j.id === jobIdRef.current)
    if (completedJob) {
      const resolve = resolveJobRef.current
      resolveJobRef.current = null
      if (resolve) {
        fetch(`/api/v1/rank/status/${jobIdRef.current}`)
          .then(r => r.json())
          .then(resolve)
          .catch(() => {
            apiFetch<any>('/api/v1/rank/jobs').then(x => {
              const items = Array.isArray(x) ? x : (x.items || x.jobs || [])
              resolve({ status: 'completed', result: { ranked_count: items.filter((i: any) => i.rank_score != null).length } })
            }).catch(() => resolve({ status: 'completed' }))
          })
      }
      return
    }

    // Check if job failed
    const failedJob = [...queue.recent_completed, ...queue.pending_jobs]
      .find(j => j.id === jobIdRef.current && j.status === 'failed')
    if (failedJob) {
      const reject = rejectJobRef.current
      rejectJobRef.current = null
      if (reject) reject(new Error(failedJob.last_error || 'Ranking failed'))
    }
  }, [queue])

  // Merge salary data from result.shortlist into items
  useEffect(() => {
    if (!result?.shortlist) return
    setItems(prev => {
      const salaryMap = new Map<string, any>()
      for (const entry of result.shortlist) {
        if (entry.salary && entry.job?.id) {
          salaryMap.set(entry.job.id, entry.salary)
        }
      }
      if (salaryMap.size === 0) return prev
      return prev.map(item => {
        const salary = salaryMap.get(item.id)
        return salary ? { ...item, salary } : item
      })
    })
  }, [result])

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1)
  }, [items.length])

  // Elapsed timer
  useEffect(() => {
    if (!loading) return
    const started = Date.now()
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [loading])

  const toggleTag = (tag: string) => {
    setFocusArea(prev => prev === tag ? '' : tag)
    setCustomFocus('')
  }

  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Reject any pending job completion Promise
      if (rejectJobRef.current) {
        rejectJobRef.current(new Error('Component unmounted'))
        resolveJobRef.current = null
        rejectJobRef.current = null
      }
    }
  }, [])

  // ── Pagination ─────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    document.getElementById('rank-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (submittingRef.current) return // Guard against double-submit
    submittingRef.current = true
    setLoading(true)
    setElapsed(0)
    setError('')
    setResult(null)
    try {
      const body: any = { top_n: topN, re_rank: reRank }
      const fa = customFocus.trim() || focusArea
      if (fa) body.focus_area = fa
      const data = await apiFetch<any>('/api/v1/rank/', { method: 'POST', body: JSON.stringify(body) })
      jobIdRef.current = data.job_id
      if (data.total_jobs != null) {
        setTotalJobs(data.total_jobs)
      }

      // Wait for completion via WebSocket-driven queue updates
      // The useEffect above watches queue and resolves this Promise
      const completed = await new Promise<any>((resolve, reject) => {
        resolveJobRef.current = resolve
        rejectJobRef.current = reject
        // Safety timeout
        setTimeout(() => {
          if (resolveJobRef.current) {
            resolveJobRef.current = null
            rejectJobRef.current = null
            reject(new Error('Ranking timed out'))
          }
        }, 10 * 60 * 1000)
      })

      if (!mountedRef.current) return

      if (completed?.status === 'failed') {
        playErrorSound()
        const errMsg = completed.error || 'Ranking failed'
        showError('Ranking failed: ' + errMsg)
        addNotification({ pipeline: 'rank', description: errMsg, status: 'error' })
        setError(errMsg)
        return
      }

      playPipelineSound('rank')
      const rankData = completed?.result || completed
      setResult(rankData)

      // Show success toast
      const rankedCount = rankData?.ranked_count
      showSuccess(
        rankedCount != null
          ? `Ranking complete! ${rankedCount} jobs evaluated`
          : 'Ranking complete!'
      )

      // Persist notification
      addNotification({
        pipeline: 'rank',
        description: rankedCount != null
          ? `Evaluated ${rankedCount} jobs · focus=${focusArea || customFocus || 'all'}`
          : 'Ranking completed',
        status: 'success',
      })

      const x = await apiFetch<any>('/api/v1/rank/jobs')
      const freshItems = Array.isArray(x) ? x : (x.items || x.jobs || [])

      if (rankData?.shortlist) {
        const salaryMap = new Map<string, any>()
        for (const entry of rankData.shortlist) {
          if (entry.salary && entry.job?.id) {
            salaryMap.set(entry.job.id, entry.salary)
          }
        }
        if (salaryMap.size > 0) {
          setItems(freshItems.map((item: any) => {
            const salary = salaryMap.get(item.id)
            return salary ? { ...item, salary } : item
          }))
        } else {
          setItems(freshItems)
        }
      } else {
        setItems(freshItems)
      }

    } catch (x) {
      if (!mountedRef.current) return
      playErrorSound()
      const msg = x instanceof Error ? x.message : 'Request failed'
      showError(msg)
      addNotification({ pipeline: 'rank', description: msg, status: 'error' })
      setError(msg)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      jobIdRef.current = null
      submittingRef.current = false
    }
  }

  const complete = () => {
    const a = getCompletedSteps()
    if (!a.includes(3)) setCompletedSteps([...a, 3])
  }

  const scoreColor = (s: number) =>
    s >= 75 ? 'bg-emerald-400' : s >= 50 ? 'bg-[#2997ff]' : s >= 25 ? 'bg-amber-400' : 'bg-rose-400'

  const scoreTextColor = (s: number) =>
    s >= 75 ? 'text-emerald-700 bg-emerald-100' : s >= 50 ? 'text-[#0066cc] bg-[#f4f8fb]' : s >= 25 ? 'text-amber-700 bg-amber-100' : 'text-rose-700 bg-rose-100'

  // ── Poll job counts during ranking ──────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!loading) return
    try {
      const counts = await apiFetch<{ total: number; ranked: number; unranked: number }>('/api/v1/rank/jobs/count')
      if (mountedRef.current) {
        setRankCounts(counts)
        if (totalJobs === 0 && counts.total > 0) {
          setTotalJobs(counts.total)
        }
      }
    } catch {
      // Silently ignore
    }
  }, [loading, totalJobs])

  useEffect(() => {
    if (!loading) return
    fetchCounts()
    const timer = setInterval(fetchCounts, 4000)
    return () => clearInterval(timer)
  }, [loading, fetchCounts])

  // ── Derived progress values ──────────────────────────────────
  const rankedCount = rankCounts?.ranked ?? items.filter(x => x.rank_score != null).length
  const totalCount = totalJobs || rankCounts?.total || items.length || 0
  const progressPct = totalCount > 0 ? Math.min(100, Math.round((rankedCount / totalCount) * 100)) : 0
  const remaining = Math.max(0, totalCount - rankedCount)
  const etaSeconds = progressPct > 5
    ? Math.round((elapsed / progressPct) * (100 - progressPct))
    : null

  const runningJob = queue?.running_jobs[0]
  const activeProvider = providers.find(p => p.provider === runningJob?.provider)

  return (
    <section className="mx-auto max-w-4xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="eyebrow">04 / EVALUATE</p>
        <h2 className="title">{t('title')}</h2>
        <p className="mt-2 text-sm text-[#858585]">
          {t('subtitle')}
        </p>
      </div>

      {!premium && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs text-amber-400/80 flex-1">
            {t('freeLimitation') || 'Free plan: limited to 3 rank iterations. Upgrade to Premium for unlimited.'}
            {usage && ` (${usage.usage.rank_iterations}/${usage.limits.max_rank_iterations})`}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FORM
      ═══════════════════════════════════════════════════════════ */}
      <form onSubmit={submit} className="card space-y-6 mb-8">
        {/* Focus area tags */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
            Focus area <span className="text-[#b0b0b0] font-normal normal-case">{tc('optional')}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                  focusArea === tag
                    ? 'bg-[#0071e3] text-white'
                    : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type a custom focus area…"
            value={customFocus}
            onChange={e => { setCustomFocus(e.target.value); setFocusArea('') }}
            className="field mt-3 text-sm"
          />
        </div>

        {/* Top N slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#1d1d1f] font-medium">{t('topResults')}</p>
            <span className="text-sm font-bold text-[#0071e3]">{topN}</span>
          </div>
          <input
            type="range"
            min={1} max={50} value={topN}
            onChange={e => setTopN(Number(e.target.value))}
            className="w-full accent-[#0071e3]"
          />
          <div className="flex justify-between text-[11px] text-[#b0b0b0] mt-1">
            <span>1</span><span>25</span><span>50</span>
          </div>
        </div>

        {/* Top row: re-rank + button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 flex-1">
            <div>
              <p className="text-sm text-[#1d1d1f] font-medium">{t('reRank')}</p>
              <p className="text-xs text-[#858585] mt-0.5">{t('reRankDesc')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reRank}
              onClick={() => setReRank(r => !r)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                reRank ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
              }`}
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                reRank ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <button disabled={loading || atLimit} className="btn-primary shrink-0">
                  {loading ? t('ranking') : t('rankJobs')}
                </button>
              </span>
            </TooltipTrigger>
            {atLimit && (
              <TooltipContent side="top" align="center">
                {t('limitReached') || 'Upgrade para más evaluaciones'}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Progress display */}
        {loading && (
          <div className="rounded-xl border border-[#d2d2d7] bg-white p-5 space-y-4">
            {/* ── Progress header ───────────────────────────────── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-[#1d1d1f]">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0071e3]/40" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0071e3]" />
                </span>
                <span className="font-medium">
                  {runningJob?.description || t('evaluating')}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#0071e3]">
                {progressPct}%
              </span>
            </div>

            {/* ── Progress bar ─────────────────────────────────── */}
            <div className="h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0071e3] transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* ── Stats row ────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                <p className="text-lg font-bold text-[#0071e3]">{rankedCount}</p>
                <p className="text-[10px] text-[#858585]">{t('ranked')}</p>
              </div>
              <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                <p className="text-lg font-bold text-[#474747]">{remaining}</p>
                <p className="text-[10px] text-[#858585]">{t('remaining')}</p>
              </div>
              <div className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                <p className="text-lg font-bold text-[#474747]">{totalCount}</p>
                <p className="text-[10px] text-[#858585]">{t('totalJobs')}</p>
              </div>
            </div>

            {/* ── Info row: elapsed + ETA ──────────────────────── */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#858585]">
                {t('elapsed')}:{' '}
                <strong className="text-[#474747]">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                </strong>
              </span>
              {etaSeconds != null && (
                <span className="text-[#858585]">
                  {t('eta')}:{' '}
                  <strong className="text-[#474747]">
                    ~{Math.floor(etaSeconds / 60)}:{String(etaSeconds % 60).padStart(2, '0')}
                  </strong>
                </span>
              )}
            </div>

            {/* ── Provider info ────────────────────────────────── */}
            {runningJob && runningJob.provider && (
              <div className="flex items-center gap-2 text-[11px] text-[#0066cc] border-t border-[#e2e2e5] pt-3">
                <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
                <span className="font-medium">{runningJob.provider}</span>
                <span className="text-[#b0b0b0]">·</span>
                <span className="text-[#707070]">{runningJob.model || 'processing'}</span>
                <span className="text-[#b0b0b0]">·</span>
                <span className="text-[#707070]">~{rankedCount > 0 ? Math.round(elapsed / rankedCount) : '—'}s/job avg</span>
              </div>
            )}

            {/* ── Provider health warning ──────────────────────── */}
            {activeProvider && activeProvider.health_score < 0.8 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                {activeProvider.provider} health: {Math.round(activeProvider.health_score * 100)}%
                {activeProvider.last_error_code === 'rate_limit' && ' · Rate limited, switching model'}
              </div>
            )}

            {/* ── Recent evaluations ───────────────────────────── */}
            {items.filter(x => x.rank_score != null).length > 0 && (
              <div className="border-t border-[#e2e2e5] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-[#858585]">
                    {t('recentEvals')}
                  </p>
                  <span className="text-[9px] text-[#b0b0b0]">
                    Last {Math.min(5, items.filter(x => x.rank_score != null).length)}
                  </span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                  {items
                    .filter(x => x.rank_score != null)
                    .slice(-5)
                    .reverse()
                    .map((x, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-[#707070] group hover:bg-[#f5f5f7] rounded-md px-1.5 py-1 -mx-1.5 transition-colors">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${scoreColor(x.rank_score)}`} />
                        <span className="truncate flex-1">{x.title || x.job_title}</span>
                        <span className="shrink-0">
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${scoreTextColor(x.rank_score)}`}>
                            {x.rank_score}
                          </span>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}
      </form>

      {/* ═══════════════════════════════════════════════════════════
          RESULTS SECTION (below form)
      ═══════════════════════════════════════════════════════════ */}
      <div id="rank-results" className="space-y-4">
        {/* Salary data status */}
        {result?.salary_data_available && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Salary benchmarks active · {result.salary_data_company_count} companies in your data
            </div>
          </div>
        )}

        {/* Summary + Continue row */}
        {result && (
          <div className="flex items-center justify-between gap-4">
            <div className="card flex-1">
              <div className="flex items-center gap-2 text-xs text-[#707070]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                {result.ranked_count != null && (
                  <span>
                    <strong className="text-[#1d1d1f]">{result.ranked_count}</strong> jobs evaluated
                    {result.below_threshold != null && (
                      <> · <strong className="text-[#1d1d1f]">{result.below_threshold}</strong> below threshold</>
                    )}
                  </span>
                )}
              </div>
              {result.message && (
                <p className="mt-1.5 text-[11px] text-[#b0b0b0]">{result.message}</p>
              )}
            </div>
            <button
              onClick={() => { complete(); router.push('/apply') }}
              className="btn-secondary shrink-0"
            >
              Continue to Apply →
            </button>
          </div>
        )}

        {/* Job cards grid with pagination */}
        {items.length > 0 ? (
          <div className="space-y-4">
            {/* Results count + pagination info */}
            <div className="flex items-center justify-between text-[11px] text-[#858585]">
              <span>
                Showing <strong className="text-[#474747]">{paginatedItems.length}</strong> of{' '}
                <strong className="text-[#474747]">{items.length}</strong> ranked jobs
              </span>
              {totalPages > 1 && (
                <span>
                  Page <strong className="text-[#474747]">{currentPage}</strong> of {totalPages}
                </span>
              )}
            </div>

            {/* Job cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedItems.map((x, i) => (
                <article key={i} className="card hover:border-[#d2d2d7]/80 transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">
                        {x.title || x.job_title || `Job ${i + 1}`}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-[#707070]">
                        {x.company || ''}{x.location ? ` · ${x.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(x as any).salary && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            (x as any).salary.salary_delta_pct != null && (x as any).salary.salary_delta_pct > 5
                              ? 'bg-emerald-100 text-emerald-700'
                              : (x as any).salary.salary_delta_pct != null && (x as any).salary.salary_delta_pct < -5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-[#f5f5f7] text-[#858585]'
                          }`}
                          title={`${(x as any).salary.company_name}: ${(x as any).salary.match_confidence}% match`}
                        >
                          {(x as any).salary.salary_delta_pct != null
                            ? `${(x as any).salary.salary_delta_pct > 0 ? '+' : ''}${(x as any).salary.salary_delta_pct.toFixed(0)}%`
                            : '~'
                          }
                        </span>
                      )}
                      {x.rank_score != null && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreTextColor(x.rank_score)}`}>
                          {x.rank_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {x.rank_verdict && (
                    <p className="mt-2 text-[11px] text-[#858585]">{x.rank_verdict}</p>
                  )}

                  {x.rank_score != null && (
                    <div className="mt-3 h-1.5 rounded-full bg-[#e2e2e5]">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${scoreColor(x.rank_score)}`}
                        style={{ width: `${x.rank_score}%` }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-medium text-[#474747] hover:bg-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      // Show first, last, and pages around current
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - currentPage) <= 1) return true
                      return false
                    })
                    .map((p, idx, arr) => {
                      // Insert ellipsis gaps
                      const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1
                      return (
                        <span key={p} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="px-1 text-[11px] text-[#b0b0b0]">…</span>
                          )}
                          <button
                            type="button"
                            onClick={() => goToPage(p)}
                            className={`min-w-[32px] rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                              p === currentPage
                                ? 'bg-[#0071e3] text-white'
                                : 'text-[#474747] hover:bg-[#f5f5f7]'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      )
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-medium text-[#474747] hover:bg-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card border-dashed text-center">
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f0f2]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#858585]">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#707070]">{t('noJobsRanked')}</p>
                <p className="text-xs text-[#b0b0b0] mt-0.5">
                  {t('noJobsHint')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue button (shown when no result yet but items exist) */}
        {!result && items.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => { complete(); router.push('/apply') }}
              className="btn-secondary"
            >
              Continue to Apply →
            </button>
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
