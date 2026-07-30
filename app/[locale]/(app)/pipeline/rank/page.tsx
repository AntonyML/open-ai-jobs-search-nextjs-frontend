'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { getCompletedSteps, setCompletedSteps, isPremium } from '@/lib/auth'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { PipelineEmptyState } from '@/components/PipelineEmptyState'
import { BarChart3 } from 'lucide-react'
import { FocusTags } from '@/components/rank/FocusTags'
import { RankSlider } from '@/components/rank/RankSlider'
import { ReRankToggle } from '@/components/rank/ReRankToggle'
import { RankProgress } from '@/components/rank/RankProgress'
import { JobCard } from '@/components/rank/JobCard'
import { Pagination } from '@/components/rank/Pagination'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import UpgradeModal from '@/components/UpgradeModal'

const ITEMS_PER_PAGE = 10

export default function Rank() {
  const t = useTranslations('rank')
  const tp = useTranslations('pipeline.steps')
  const tc = useTranslations('common')
  const router = useRouter()

  // Auth & limits
  const premium = isPremium()
  const { data: usage } = useUsageLimits()
  const atLimit = !premium && usage != null && usage.usage.rank_iterations >= usage.limits.max_rank_iterations
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Form state
  const [focusArea, setFocusArea] = useState('')
  const [customFocus, setCustomFocus] = useState('')
  const [topN, setTopN] = useState(5)
  const [reRank, setReRank] = useState(false)
  const [prevStepDone, setPrevStepDone] = useState(getCompletedSteps().includes(2))
  const [jobIds, setJobIds] = useState<string[] | null>(null)

  // Data state
  const [items, setItems] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalJobs, setTotalJobs] = useState(0)
  const [rankCounts, setRankCounts] = useState<{ total: number; ranked: number; unranked: number } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  const [runningJob, setRunningJob] = useState<any>(null)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // Load existing jobs + job_ids from search step on mount
  useEffect(() => {
    const stored = localStorage.getItem("rank_job_ids")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[]
        if (parsed.length > 0) setJobIds(parsed)
      } catch { /* ignore */ }
      localStorage.removeItem("rank_job_ids")
    }
    apiFetch<any>('/api/v1/rank/jobs')
      .then(x => {
        const loaded = Array.isArray(x) ? x : (x.items || x.jobs || [])
        setItems(loaded)
        if (loaded.length > 0) {
          setPrevStepDone(true)
          const steps = getCompletedSteps()
          if (!steps.includes(2)) setCompletedSteps([...steps, 2])
        }
      })
      .catch(() => {})
  }, [])

  // Poll a single job until it completes or fails
  async function pollJob(jobId: string, timeoutMs: number): Promise<any> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const job = await apiFetch<any>(`/api/v1/orchestrator/jobs/${jobId}`)
        if (!mountedRef.current) throw new Error('unmounted')
        setRunningJob(job)
        if (job?.status === 'completed') return job
        if (job?.status === 'failed') return { status: 'failed', error: job.last_error }
      } catch { /* retry */ }
    }
    throw new Error('Ranking timed out')
  }

  // Merge salary data
  useEffect(() => {
    if (!result?.shortlist) return
    setItems(prev => {
      const salaryMap = new Map<string, any>()
      for (const entry of result.shortlist) {
        if (entry.salary && entry.job?.id) salaryMap.set(entry.job.id, entry.salary)
      }
      if (salaryMap.size === 0) return prev
      return prev.map(item => {
        const salary = salaryMap.get(item.id)
        return salary ? { ...item, salary } : item
      })
    })
  }, [result])

  useEffect(() => { setCurrentPage(1) }, [items.length])
  useEffect(() => {
    if (!loading) return
    const started = Date.now()
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [loading])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    document.getElementById('rank-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleTag(tag: string) {
    setFocusArea(prev => prev === tag ? '' : tag)
    setCustomFocus('')
  }

  // Submit ranking
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setElapsed(0)
    setError('')
    setResult(null)
    try {
      const body: any = { top_n: topN, re_rank: reRank }
      if (jobIds) body.job_ids = jobIds
      const fa = customFocus.trim() || focusArea
      if (fa) body.focus_area = fa
      const data = await apiFetch<any>('/api/v1/rank/', { method: 'POST', body: JSON.stringify(body) })
      if (data.total_jobs != null) setTotalJobs(data.total_jobs)

      const completed = await pollJob(data.job_id, 10 * 60 * 1000)
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
      showSuccess(rankData?.ranked_count != null ? `Ranking complete! ${rankData.ranked_count} jobs evaluated` : 'Ranking complete!')
      addNotification({ pipeline: 'rank', description: `Evaluated jobs · focus=${focusArea || customFocus || 'all'}`, status: 'success' })

      const x = await apiFetch<any>('/api/v1/rank/jobs')
      const freshItems = Array.isArray(x) ? x : (x.items || x.jobs || [])
      if (rankData?.shortlist) {
        const salaryMap = new Map<string, any>()
        for (const entry of rankData.shortlist) {
          if (entry.salary && entry.job?.id) salaryMap.set(entry.job.id, entry.salary)
        }
        setItems(salaryMap.size > 0 ? freshItems.map((item: any) => {
          const salary = salaryMap.get(item.id)
          return salary ? { ...item, salary } : item
        }) : freshItems)
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
      if (mountedRef.current) { setLoading(false); setRunningJob(null) }
      submittingRef.current = false
    }
  }

  const complete = () => {
    const a = getCompletedSteps()
    if (!a.includes(3)) setCompletedSteps([...a, 3])
  }

  // Poll job counts during ranking
  const fetchCounts = useCallback(async () => {
    if (!loading) return
    try {
      const counts = await apiFetch<{ total: number; ranked: number; unranked: number }>('/api/v1/rank/jobs/count')
      if (mountedRef.current) {
        setRankCounts(counts)
        if (totalJobs === 0 && counts.total > 0) setTotalJobs(counts.total)
      }
    } catch { /* ignore */ }
  }, [loading, totalJobs])

  useEffect(() => {
    if (!loading) return
    fetchCounts()
    const timer = setInterval(fetchCounts, 4000)
    return () => clearInterval(timer)
  }, [loading, fetchCounts])

  // Derived progress values
  const rankedCount = rankCounts?.ranked ?? items.filter(x => x.rank_score != null).length
  const totalCount = totalJobs || rankCounts?.total || items.length || 0
  const progressPct = totalCount > 0 ? Math.min(100, Math.round((rankedCount / totalCount) * 100)) : 0
  const remaining = Math.max(0, totalCount - rankedCount)
  const etaSeconds = progressPct > 5 ? Math.round((elapsed / progressPct) * (100 - progressPct)) : null
  const activeProvider = runningJob?.provider ? { provider: runningJob.provider, health_score: 1, last_error_code: null } : null

  return (
    <section className="mx-auto max-w-4xl">
      <PipelineHeader eyebrow="04 / EVALUATE" title={t('title')} subtitle={t('subtitle')} />

      {!premium && usage && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: limited to 3 rank iterations. Upgrade to Premium for unlimited.'}
          usage={`${usage.usage.rank_iterations}/${usage.limits.max_rank_iterations}`}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t('upgrade') || 'Upgrade'}
        />
      )}

      {/* Form */}
      <form onSubmit={submit} className="card space-y-6 mb-8">
        <FocusTags
          focusArea={focusArea}
          customFocus={customFocus}
          onToggleTag={toggleTag}
          onCustomFocus={(v) => { setCustomFocus(v); setFocusArea('') }}
          tc={tc}
        />

        <RankSlider value={topN} onChange={setTopN} t={t} />

        <div className="flex items-center gap-4">
          <ReRankToggle value={reRank} onChange={setReRank} t={t} />
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <AppleButton disabled={loading || atLimit} loading={loading} className="shrink-0">
                {loading ? t('ranking') : t('rankJobs')}
              </AppleButton>
            </TooltipTrigger>
            {atLimit && (
              <TooltipContent side="top" align="center">
                {t('limitReached') || 'Upgrade para más evaluaciones'}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {loading && (
          <RankProgress
            rankedCount={rankedCount}
            totalCount={totalCount}
            remaining={remaining}
            progressPct={progressPct}
            elapsed={elapsed}
            etaSeconds={etaSeconds}
            runningJob={runningJob ? { description: runningJob.description, provider: runningJob.provider, model: runningJob.model } : null}
            activeProvider={activeProvider}
            recentEvals={items.filter(x => x.rank_score != null)}
            t={t}
          />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}
      </form>

      {/* Results */}
      <div id="rank-results" className="space-y-4">
        {result?.salary_data_available && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Salary benchmarks active · {result.salary_data_company_count} companies in your data
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-center justify-between gap-4">
            <div className="card flex-1">
              <div className="flex items-center gap-2 text-xs text-[#707070]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                {result.ranked_count != null && (
                  <span>
                    <strong className="text-[#1d1d1f]">{result.ranked_count}</strong> jobs evaluated
                    {result.below_threshold != null && <> · <strong className="text-[#1d1d1f]">{result.below_threshold}</strong> below threshold</>}
                  </span>
                )}
              </div>
              {result.message && <p className="mt-1.5 text-[11px] text-[#b0b0b0]">{result.message}</p>}
            </div>
            <AppleButton variant="secondary" onClick={() => { complete(); router.push('/apply') }}>
              Continue to Apply →
            </AppleButton>
          </div>
        )}

        {items.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-[#858585]">
              <span>Showing <strong className="text-[#474747]">{paginatedItems.length}</strong> of <strong className="text-[#474747]">{items.length}</strong> ranked jobs</span>
              {totalPages > 1 && <span>Page <strong className="text-[#474747]">{currentPage}</strong> of {totalPages}</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedItems.map((x, i) => <JobCard key={i} item={x} index={i} />)}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        ) : jobIds && jobIds.length > 0 ? (
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f7]">
              <BarChart3 className="h-6 w-6 text-[#707070]" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-[#1d1d1f]">
              {t('readyTitle', { count: jobIds.length })}
            </p>
            <p className="mt-1 text-sm text-[#6e6e73]">
              {t('readyDesc')}
            </p>
          </div>
        ) : (
          <PipelineEmptyState
            icon={BarChart3}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            actionLabel={t('emptyAction')}
            actionHref="/pipeline/search"            prevStep={{
                key: 'search',
                label: tp('search'),
              href: '/pipeline/search',
              title: t('prevStepTitle'),
              description: t('prevStepDesc'),
              action: t('prevStepAction'),
            }}
            prevStepDone={prevStepDone}
          />
        )}

        {!result && items.length > 0 && (
          <div className="flex justify-center pt-2">
            <AppleButton variant="secondary" onClick={() => { complete(); router.push('/apply') }}>
              Continue to Apply →
            </AppleButton>
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
