'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'
import type { CVResponse } from '@/lib/cv'

export default function CvDocumentsPage() {
  const t = useTranslations('cvDocuments')
  const [cvs, setCvs] = useState<CVResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<CVResponse[]>('/api/v1/cv/')
      setCvs(Array.isArray(res) ? res : [])
    } catch {
      setError(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const baseCv = cvs.find((c) => c.cv_type === 'base') || null
  const adaptedCvs = cvs.filter((c) => c.cv_type === 'personalized')

  async function regenerate(cv: CVResponse) {
    setBusyId(cv.cv_id)
    setError('')
    try {
      if (cv.cv_type === 'base') {
        const res = await apiFetch<CVResponse>('/api/v1/cv/base', {
          method: 'POST',
          body: JSON.stringify({}),
        })
        setCvs((prev) => [res, ...prev.filter((c) => c.cv_id !== cv.cv_id)])
        // Keep the sidebar "Adapt CV" entry unlocked/consistent.
        window.dispatchEvent(new CustomEvent('cv:base-generated'))
        showSuccess(t('regenerated'))
        return
      }
      // Adapted CV: rebuild from the current base CV + the same offer.
      const base = baseCv
      if (!base || !cv.job_posting_id) {
        setError(t('regenerateFailed'))
        return
      }
      const res = await apiFetch<CVResponse>('/api/v1/cv/personalize-job', {
        method: 'POST',
        body: JSON.stringify({ base_cv_id: base.cv_id, job_posting_id: cv.job_posting_id }),
      })
      setCvs((prev) => [res, ...prev.filter((c) => c.cv_id !== cv.cv_id)])
      showSuccess(t('regenerated'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('regenerateFailed')
      setError(msg)
      showError(msg)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(cv: CVResponse) {
    setBusyId(cv.cv_id)
    setError('')
    try {
      await apiFetch(`/api/v1/cv/${cv.cv_id}`, { method: 'DELETE' })
      setCvs((prev) => prev.filter((c) => c.cv_id !== cv.cv_id))
      if (openId === cv.cv_id) setOpenId(null)
      setConfirmDeleteId(null)
      showSuccess(t('deleted'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('deleteFailed')
      setError(msg)
      showError(msg)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} loading loadingLabel="Loading…" />
        <div className="mt-8 space-y-4">
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      {/* ── Summary chips ─────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-[980px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
          <Check className="size-3" />
          {t('summaryBase')} · {baseCv ? 1 : 0}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[980px] border border-[#0071e3]/20 bg-[#0071e3]/5 px-3 py-1 text-[11px] font-medium text-[#0071e3]">
          <Briefcase className="size-3" />
          {t('summaryAdapted')} · {adaptedCvs.length}
        </span>
        <Link
          href="/cv-builder"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
        >
          {t('createNew')} <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {cvs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#f5f5f7]">
            <FileText className="size-6 text-[#b0b0b0]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">{t('emptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-[#707070]">{t('emptyDesc')}</p>
          <Link
            href="/cv-builder"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0068d2]"
          >
            {t('goBuilder')}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {cvs.map((cv) => {
            const open = openId === cv.cv_id
            const busy = busyId === cv.cv_id
            const isBase = cv.cv_type === 'base'
            const confirming = confirmDeleteId === cv.cv_id
            return (
              <div key={cv.cv_id} className="overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  {/* Type badge + identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        isBase ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0071e3]/10 text-[#0071e3]'
                      )}
                    >
                      {isBase ? <FileText className="size-5" /> : <Briefcase className="size-5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            isBase ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0071e3]/10 text-[#0071e3]'
                          )}
                        >
                          {isBase ? t('baseLabel') : t('adaptedLabel')}
                        </span>
                        {cv.job?.title && (
                          <span className="truncate text-sm font-medium text-[#1d1d1f]">
                            {cv.job.title}
                            {cv.job.company ? <span className="font-normal text-[#707070]"> — {cv.job.company}</span> : null}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-[#858585]">
                        {cv.job?.location ? `${cv.job.location} · ` : ''}
                        {new Date(cv.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 sm:self-center">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {t('statusReady')}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : cv.cv_id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-[11px] font-medium text-[#0071e3] transition-colors hover:bg-[#f5f5f7]"
                    >
                      {t('view')}
                      <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
                    </button>
                    <button
                      type="button"
                      onClick={() => regenerate(cv)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] disabled:opacity-50"
                    >
                      <RefreshCw className={cn('size-3.5', busy && 'animate-spin')} />
                      {t('regenerate')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(confirming ? null : cv.cv_id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-[11px] font-medium text-rose-500 transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      {t('delete')}
                    </button>
                  </div>
                </div>

                {/* Delete confirmation inline */}
                {confirming && (
                  <div className="flex flex-col gap-3 border-t border-[#e2e2e5] bg-rose-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#1d1d1f]">{t('deleteConfirm')}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={busy}
                        className="rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-[11px] font-medium text-[#707070] transition-colors hover:bg-[#f5f5f7] disabled:opacity-50"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cv)}
                        disabled={busy}
                        className="rounded-full bg-rose-500 px-4 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF preview */}
                {open && (
                  <div className="border-t border-[#e2e2e5] bg-[#fafafa] p-4">
                    <CvPdfPreview cv={cv} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
