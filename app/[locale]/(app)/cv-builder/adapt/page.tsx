'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Briefcase, Lock, ArrowRight, Link2, Globe, Crown } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'
import { CvAnalysisPanel } from '@/components/cv-builder/CvAnalysisPanel'
import { useBilling } from '@/hooks/useBilling'
import type { CVResponse, JobOption } from '@/lib/cv'

/**
 * Adapt the base CV to a job offer.
 *
 * Two methods:
 * - By URL (all plans): paste a public job link (LinkedIn, Indeed, company
 *   career page, ...) and the backend reads the page, then the LLM adapts
 *   the base CV to its content.
 * - Saved offers (Max only): pick one of the offers stored in the internal
 *   job database (the search pipeline), and adapt to it.
 *
 * Precondition (Regla 4): a base CV must exist. If it doesn't, the page
 * shows a locked state with a CTA back to the generator.
 */
export default function AdaptCvPage() {
  const t = useTranslations('cvBuilder')
  const { isMax } = useBilling()
  const [loading, setLoading] = useState(true)
  const [cvs, setCvs] = useState<CVResponse[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [adapting, setAdapting] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [method, setMethod] = useState<'url' | 'offers'>('url')
  const [url, setUrl] = useState('')
  const [lastAdapted, setLastAdapted] = useState<CVResponse | null>(null)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    const [c, j] = await Promise.all([
      apiFetch<CVResponse[]>('/api/v1/cv/').catch(() => []),
      apiFetch<any[]>('/api/v1/rank/jobs?limit=200').catch(() => []),
    ])
    setCvs(Array.isArray(c) ? c : [])
    setJobs(Array.isArray(j) ? j : [])
  }, [])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const baseCv = cvs.find((c) => c.cv_type === 'base' && c.base_status === 'active') || null
  const adaptedCvs = cvs.filter((c) => c.cv_type === 'personalized')

  async function adaptFromUrl() {
    if (!baseCv || !url.trim()) return
    setAdapting(true)
    setError('')
    try {
      const res = await apiFetch<CVResponse>('/api/v1/cv/adapt-url', {
        method: 'POST',
        body: JSON.stringify({ base_cv_id: baseCv.cv_id, url: url.trim() }),
      })
      setLastAdapted(res)
      setCvs((prev) => [res, ...prev])
      showSuccess(t('adaptedGenerated'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('adaptedFailed')
      setError(msg)
      showError(msg)
    } finally {
      setAdapting(false)
    }
  }

  async function adaptFromSavedJob() {
    if (!baseCv || !selectedJobId) return
    setAdapting(true)
    setError('')
    try {
      const res = await apiFetch<CVResponse>('/api/v1/cv/personalize-job', {
        method: 'POST',
        body: JSON.stringify({ base_cv_id: baseCv.cv_id, job_posting_id: selectedJobId }),
      })
      setLastAdapted(res)
      setCvs((prev) => [res, ...prev])
      showSuccess(t('adaptedGenerated'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('adaptedFailed')
      setError(msg)
      showError(msg)
    } finally {
      setAdapting(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <PageHeader eyebrow={t('adaptEyebrow')} title={t('adaptTitle')} subtitle={t('adaptDesc')} loading loadingLabel="Loading…" />
        <div className="mt-8 space-y-4">
          <div className="skeleton h-12 w-full rounded-full" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </section>
    )
  }

  // ── Locked state: base CV required (Regla 4) ──────────────────
  if (!baseCv) {
    return (
      <section className="mx-auto max-w-3xl">
        <PageHeader eyebrow={t('adaptEyebrow')} title={t('adaptTitle')} subtitle={t('adaptDesc')} />
        <div className="mt-6 rounded-2xl border border-[#d2d2d7]/60 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#f5f5f7]">
            <Lock className="size-6 text-[#b0b0b0]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">{t('adaptLockedTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#707070]">{t('adaptLockedDesc')}</p>
          <Link
            href="/cv-builder"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0068d2]"
          >
            {t('adaptGoBuilder')}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t('adaptEyebrow')} title={t('adaptTitle')} subtitle={t('adaptDesc')} />

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Method selector ──────────────────────────────────── */}
      <div className="mt-6 flex rounded-full border border-[#d2d2d7]/60 bg-[#f5f5f7] p-1">
        <button
          type="button"
          onClick={() => setMethod('url')}
          className={cn(
            'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all',
            method === 'url'
              ? 'bg-white text-[#1d1d1f] shadow-sm ring-1 ring-[#d2d2d7]/60'
              : 'text-[#707070] hover:text-[#1d1d1f]',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5" />
            {t('adaptMethodUrl')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMethod('offers')}
          className={cn(
            'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all',
            method === 'offers'
              ? 'bg-white text-[#1d1d1f] shadow-sm ring-1 ring-[#d2d2d7]/60'
              : 'text-[#707070] hover:text-[#1d1d1f]',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            {t('adaptMethodOffers')}
            {!isMax && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#1d1d1f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                <Crown className="size-2" />
                {t('adaptMaxOnlyBadge')}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ── Method: by URL (all plans) ───────────────────────── */}
      {method === 'url' && (
        <div className="mt-4 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
              <Link2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[#1d1d1f]">{t('adaptMethodUrlTitle')}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200/60">
                  <Globe className="size-2.5" />
                  {t('adaptAllPlansBadge')}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#707070]">{t('adaptMethodUrlDesc')}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim() && !adapting) adaptFromUrl()
              }}
              placeholder={t('adaptUrlPlaceholder')}
              className="field h-11 min-w-0 flex-1"
            />
            <AppleButton
              loading={adapting}
              disabled={adapting || !url.trim()}
              onClick={adaptFromUrl}
              className="w-full sm:w-auto"
            >
              {adapting ? t('adaptUrlReading') : t('adaptUrlButton')}
            </AppleButton>
          </div>
          <p className="mt-2 text-[11px] text-[#858585]">{t('adaptUrlHint')}</p>
        </div>
      )}

      {/* ── Method: saved offers (Max only) ──────────────────── */}
      {method === 'offers' &&
        (isMax ? (
          <div className="mt-4 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                <Briefcase className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1d1d1f]">{t('adaptSelectTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-[#707070]">{t('adaptSelectDesc')}</p>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#d2d2d7] bg-[#fafafa] p-5 text-center">
                <p className="text-sm text-[#858585]">{t('noOffers')}</p>
                <Link href="/search" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline">
                  {t('goSearch')} →
                </Link>
              </div>
            ) : (
              <>
                <label htmlFor="cv-offer-select" className="mt-4 block text-xs font-medium text-[#707070]">
                  {t('selectOffer')}
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    id="cv-offer-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="field h-10 flex-1"
                  >
                    <option value="">{t('selectOfferPlaceholder')}</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                        {job.company ? ` — ${job.company}` : ''}
                        {job.location ? ` · ${job.location}` : ''}
                      </option>
                    ))}
                  </select>
                  <AppleButton
                    loading={adapting}
                    disabled={adapting || !selectedJobId}
                    onClick={adaptFromSavedJob}
                    className="w-full sm:w-auto"
                  >
                    {adapting ? t('adapting') : t('adaptButton')}
                  </AppleButton>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#ffd60a]/40 bg-gradient-to-br from-[#fffbe8] to-[#fff7d6] p-5">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#ff9f0a]/10 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a]">
                <Lock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#1d1d1f]">{t('adaptMaxOnlyTitle')}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1d1d1f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    <Crown className="size-2.5" />
                    {t('adaptMaxOnlyBadge')}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#707070]">{t('adaptMaxOnlyDesc')}</p>
                <Link
                  href="/billing"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#b26a00] transition-colors hover:underline"
                >
                  {t('adaptGoMax')}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}

      {/* ── Analysis of the latest adaptation ────────────────── */}
      {lastAdapted && lastAdapted.analysis && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#858585]">{t('adaptAnalysis')}</p>
          <CvAnalysisPanel analysis={lastAdapted.analysis} />
        </div>
      )}

      {/* ── Latest adapted document ──────────────────────────── */}
      {lastAdapted && (
        <div className="mt-6 rounded-2xl border border-[#0071e3]/30 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-[#1d1d1f]">
              {lastAdapted.job?.title || t('adaptedDoc')}
              {lastAdapted.job?.company ? ` — ${lastAdapted.job.company}` : ''}
            </p>
            {lastAdapted.job_url && (
              <a
                href={lastAdapted.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#0071e3] hover:underline"
              >
                <Link2 className="size-3" />
                {t('viewSource')}
              </a>
            )}
          </div>
          <CvPdfPreview cv={lastAdapted} />
        </div>
      )}

      {/* ── All adapted documents ────────────────────────────── */}
      {adaptedCvs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-[#1d1d1f]">{t('adaptedList')}</p>
              <p className="mt-0.5 text-xs text-[#707070]">{t('adaptedListDesc')}</p>
            </div>
            <Link href="/cv-builder/documents" className="text-xs font-medium text-[#0071e3] hover:underline">
              {t('viewAllDocuments')} →
            </Link>
          </div>
          <div className="space-y-3">
            {adaptedCvs
              .filter((c) => c.cv_id !== lastAdapted?.cv_id)
              .map((cv) => (
                <div key={cv.cv_id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e2e5] bg-[#fafafa] p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1d1d1f]">
                      {cv.job?.title || t('adaptedDoc')}
                      {cv.job?.company ? <span className="font-normal text-[#707070]"> — {cv.job.company}</span> : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#858585]">
                      {cv.job?.location ? `${cv.job.location} · ` : ''}
                      {new Date(cv.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href="/cv-builder/documents"
                    className="shrink-0 rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-[11px] font-medium text-[#0071e3] transition-colors hover:bg-white"
                  >
                    {t('viewDocument')}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
