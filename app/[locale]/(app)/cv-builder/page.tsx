'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, FileText, Check, Lock, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'
import type { CVResponse } from '@/lib/cv'

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

function StepIcon({ state }: { state: 'done' | 'active' | 'locked' }) {
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
  state: 'done' | 'active' | 'locked'
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-2xl border transition-all',
          state === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-600',
          state === 'active' && 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3] shadow-sm',
          state === 'locked' && 'border-[#e2e2e5] bg-[#f5f5f7] text-[#b0b0b0]'
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
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    const [p, c] = await Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<CVResponse[]>('/api/v1/cv/').catch(() => []),
    ])
    setProfile(p)
    setCvs(Array.isArray(c) ? c : [])
  }, [])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const baseCv = cvs.find((c) => c.cv_type === 'base') || null
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
      // Unlock the sidebar "Adapt CV" entry immediately (AppSidebar listens).
      window.dispatchEvent(new CustomEvent('cv:base-generated'))
      showSuccess(t('baseGenerated'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('baseFailed')
      setError(msg)
      showError(msg)
    } finally {
      setGenerating(false)
    }
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

      {/* ── Progress: Perfil → CV base ───────────────────────── */}
      <div className="mt-8 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <PipelineStep
            icon={User}
            label={t('statePerfil')}
            sublabel={complete ? t('stateProfileDone') : t('stateProfilePending')}
            state={complete ? 'done' : 'active'}
          />
          <ArrowRight className="size-4 shrink-0 text-[#c7c7cc]" />
          <PipelineStep
            icon={FileText}
            label={t('stateBase')}
            sublabel={baseCv ? t('stateBaseDone') : t('stateBasePending')}
            state={baseCv ? 'done' : complete ? 'active' : 'locked'}
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

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#0071e3]/20 bg-[#0071e3]/5 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="7" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1d1d1f]">{t('adaptNextTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-[#707070]">{t('adaptNextDesc')}</p>
              </div>
            </div>
            <Link
              href="/cv-builder/adapt"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0068d2]"
            >
              {t('adaptNextButton')}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
