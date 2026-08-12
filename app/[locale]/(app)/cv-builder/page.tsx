'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, FileText, Briefcase, Check, Lock, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'
import { CvAnalysisPanel } from '@/components/cv-builder/CvAnalysisPanel'
import type { CVResponse, JobOption } from '@/lib/cv'

/** Minimum data required to generate a CV from the profile (Regla 1). */
function isProfileComplete(profile: any): boolean {
  if (!profile) return false
  const hasName = !!(profile.full_name || '').trim()
  const hasEmail = !!(profile.email || '').trim()
  const hasLocation = !!(profile.location || '').trim()
  const hasExperience = Array.isArray(profile.experience) && profile.experience.length > 0
  const skills = profile.skills || {}
  const hasSkills =
    (Array.isArray(skills.software_tools) && skills.software_tools.length > 0) ||
    (Array.isArray(skills.programming_ml) && skills.programming_ml.length > 0)
  const hasTarget =
    Array.isArray(profile.job_target?.target_titles) && profile.job_target.target_titles.length > 0
  return hasName && hasEmail && hasLocation && hasExperience && hasSkills && hasTarget
}

function StepIcon({ state }: { state: 'done' | 'active' | 'locked' | 'pending' }) {
  if (state === 'done') return <Check className="size-4" />
  if (state === 'locked') return <Lock className="size-4" />
  return <span className="size-4" />
}

function PipelineStep({
  icon: Icon,
  label,
  sublabel,
  state,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel?: string
  state: 'done' | 'active' | 'locked' | 'pending'
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-2xl border transition-all',
          state === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-600',
          state === 'active' && 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3] shadow-sm',
          state === 'locked' && 'border-[#e2e2e5] bg-[#f5f5f7] text-[#b0b0b0]',
          state === 'pending' && 'border-[#e2e2e5] bg-white text-[#b0b0b0]'
        )}
      >
        {state === 'done' ? <StepIcon state="done" /> : <Icon className="size-5" />}
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            'text-[12px] font-semibold tracking-wide',
            state === 'locked' ? 'text-[#b0b0b0]' : 'text-[#1d1d1f]'
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className={cn('text-[10px]', state === 'locked' ? 'text-[#c7c7cc]' : 'text-[#858585]')}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

export default function CvBuilderPage() {
  const t = useTranslations('cvBuilder')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [cvs, setCvs] = useState<CVResponse[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [generating, setGenerating] = useState(false)
  const [adapting, setAdapting] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [lastAdapted, setLastAdapted] = useState<CVResponse | null>(null)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    const [p, c, j] = await Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<CVResponse[]>('/api/v1/cv/').catch(() => []),
      apiFetch<any[]>('/api/v1/rank/jobs?limit=200').catch(() => []),
    ])
    setProfile(p)
    setCvs(Array.isArray(c) ? c : [])
    setJobs(Array.isArray(j) ? j : [])
  }, [])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const baseCv = cvs.find((c) => c.cv_type === 'base') || null
  const adaptedCvs = cvs.filter((c) => c.cv_type === 'personalized')
  const complete = isProfileComplete(profile)

  async function generateBase() {
    setGenerating(true)
    setError('')
    try {
      const res = await apiFetch<CVResponse>('/api/v1/cv/base', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setCvs((prev) => [res, ...prev.filter((c) => c.cv_type !== 'base')])
      showSuccess(t('baseGenerated'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('baseFailed')
      setError(msg)
      showError(msg)
    } finally {
      setGenerating(false)
    }
  }

  async function adapt() {
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

  const stepState = (step: 'profile' | 'base' | 'adapted') => {
    if (step === 'profile') return complete ? 'done' : 'active'
    if (step === 'base') return baseCv ? 'done' : complete ? 'active' : 'locked'
    return adaptedCvs.length > 0 ? 'done' : baseCv ? 'active' : 'locked'
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} loading loadingLabel="Loading…" />
        <div className="mt-8 space-y-4">
          <div className="skeleton h-28 w-full rounded-2xl" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      {/* ── Progressive pipeline: Perfil → CV base → CV adaptado ── */}
      <div className="mt-8 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <PipelineStep
            icon={User}
            label={t('statePerfil')}
            sublabel={complete ? t('stateProfileDone') : t('stateProfilePending')}
            state={stepState('profile')}
          />
          <ArrowRight className="size-4 shrink-0 text-[#c7c7cc]" />
          <PipelineStep
            icon={FileText}
            label={t('stateBase')}
            sublabel={baseCv ? t('stateBaseDone') : t('stateBasePending')}
            state={stepState('base')}
          />
          <ArrowRight className="size-4 shrink-0 text-[#c7c7cc]" />
          <PipelineStep
            icon={Briefcase}
            label={t('stateAdapted')}
            sublabel={adaptedCvs.length > 0 ? t('stateAdaptedDone') : t('stateAdaptedPending')}
            state={stepState('adapted')}
          />
        </div>
      </div>

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

      {/* ── Estado A — Perfil incompleto ─────────────────────── */}
      {!complete && (
        <div className="mt-6 rounded-2xl border border-[#d2d2d7]/60 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#f5f5f7]">
            <User className="size-6 text-[#b0b0b0]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">{t('profileIncompleteTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#707070]">{t('profileIncompleteDesc')}</p>
          <Link
            href="/profile"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0068d2]"
          >
            {t('completeProfile')}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* ── Estado B — Perfil completo, sin CV base ──────────── */}
      {complete && !baseCv && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Check className="size-4" />
            <span className="font-medium">{t('profileReady')}</span>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-[#1d1d1f]">{t('baseInfoTitle')}</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-[#707070]">{t('baseInfoSubtitle')}</p>
            </div>
            <AppleButton loading={generating} disabled={generating} onClick={generateBase} className="w-full sm:w-auto">
              {generating ? t('baseGenerating') : t('baseGenerate')}
            </AppleButton>
          </div>
        </div>
      )}

      {/* ── Estado C — CV base generado ──────────────────────── */}
      {complete && baseCv && (
        <div className="mt-6 space-y-6">
          {/* CV base document */}
          <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-sm font-medium text-[#1d1d1f]">{t('baseReady')}</p>
                </div>
                <p className="mt-1 text-xs text-[#707070]">{t('baseReadyDesc')}</p>
              </div>
              <AppleButton variant="secondary" size="sm" loading={generating} disabled={generating} onClick={generateBase}>
                {t('regenerate')}
              </AppleButton>
            </div>
            <CvPdfPreview cv={baseCv} />
          </div>

          {/* Adaptar a una oferta (Regla 4: requiere CV base) */}
          <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                <Briefcase className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1d1d1f]">{t('adaptTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-[#707070]">{t('adaptDesc')}</p>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#d2d2d7] bg-[#fafafa] p-5 text-center">
                <p className="text-sm text-[#858585]">{t('noOffers')}</p>
                <Link href="/scrape" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline">
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
                    onClick={adapt}
                    className="w-full sm:w-auto"
                  >
                    {adapting ? t('adapting') : t('adaptButton')}
                  </AppleButton>
                </div>
              </>
            )}
          </div>

          {lastAdapted && lastAdapted.analysis && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#858585]">{t('adaptAnalysis')}</p>
              <CvAnalysisPanel analysis={lastAdapted.analysis} />
            </div>
          )}

          {/* ── Estado D — Lista de CV adaptados ──────────────── */}
          {(lastAdapted || adaptedCvs.length > 0) && (
            <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
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
                {lastAdapted && (
                  <div className="overflow-hidden rounded-xl border border-[#0071e3]/30 bg-[#fafafa]">
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#1d1d1f]">
                          {lastAdapted.job?.title || t('adaptedDoc')}
                          {lastAdapted.job?.company ? <span className="font-normal text-[#707070]"> — {lastAdapted.job.company}</span> : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#858585]">
                          {lastAdapted.job?.location ? `${lastAdapted.job.location} · ` : ''}
                          {new Date(lastAdapted.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        href="/cv-builder/documents"
                        className="shrink-0 rounded-full border border-[#d2d2d7] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#0071e3] transition-colors hover:bg-[#f5f5f7]"
                      >
                        {t('viewDocument')}
                      </Link>
                    </div>
                    <div className="border-t border-[#e2e2e5] bg-white p-4">
                      <CvPdfPreview cv={lastAdapted} />
                    </div>
                  </div>
                )}
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
        </div>
      )}
    </section>
  )
}
