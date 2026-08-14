'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, FileText, Check, Lock, ArrowRight, Target } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess, showWarning } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'
import type { CVResponse } from '@/lib/cv'
import styles from './page.module.css'

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

/** Compact one-line status for each step of the flow (Perfil → CV base). */
function StatusStep({
  icon: Icon,
  label,
  sublabel,
  state,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel: string
  state: 'done' | 'active' | 'locked'
}) {
  return (
    <div className={styles.statusStep}>
      <span
        className={cn(
          styles.statusDot,
          state === 'done' && styles.statusDotDone,
          state === 'active' && styles.statusDotActive
        )}
      >
        {state === 'done' ? <Check className="size-3" /> : <Icon className="size-3" />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={styles.statusLabel}>{label}</span>
        <span className={styles.statusSub}>{sublabel}</span>
      </span>
    </div>
  )
}

export default function CvBuilderPage() {
  const t = useTranslations('cvBuilder')
  const tSidebar = useTranslations('appSidebar')
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
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={baseCv ? t('subtitleHasBase') : t('subtitleNoBase')} loading loadingLabel="Loading…" />
        <div className="mt-8 space-y-4">
          <div className="skeleton h-28 w-full rounded-2xl" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={baseCv ? t('subtitleHasBase') : t('subtitleNoBase')} />

      {/* ── Adapt CTA — hero card at the top (locked until the base CV exists) ── */}
      <div className={cn(styles.adaptHero, !baseCv && styles.adaptHeroLocked)}>
        <div className="flex items-start gap-4">
          <div className={styles.adaptHeroIcon}>
            {baseCv ? <Target className="size-5" /> : <Lock className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={styles.adaptHeroEyebrow}>{t('adaptEyebrow')}</p>
            <h3 className={styles.adaptHeroTitle}>{t('adaptNextTitle')}</h3>
            <p className={styles.adaptHeroDesc}>{t('adaptNextDesc')}</p>
            {baseCv ? (
              <Link href="/cv-builder/adapt" className={styles.adaptHeroBtn}>
                {t('adaptNextButton')}
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => showWarning(tSidebar('adaptLockedToast'))}
                className={styles.adaptHeroBtnLocked}
                aria-disabled="true"
                title={tSidebar('adaptCvLockedTooltip')}
              >
                <Lock className="size-3.5" />
                {tSidebar('adaptCvLockedTooltip')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress — compact status strip: Perfil → CV base ─────────── */}
      <div className={cn(styles.statusStrip, (complete || baseCv) ? 'mt-6' : 'mt-8')}>
        <StatusStep
          icon={User}
          label={t('statePerfil')}
          sublabel={complete ? t('stateProfileDone') : t('stateProfilePending')}
          state={complete ? 'done' : 'active'}
        />
        <span className={cn(styles.statusConnector, complete && styles.statusConnectorDone)} />
        <StatusStep
          icon={baseCv ? Check : complete ? FileText : Lock}
          label={t('stateBase')}
          sublabel={baseCv ? t('stateBaseDone') : t('stateBasePending')}
          state={baseCv ? 'done' : complete ? 'active' : 'locked'}
        />
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

      {/* ── Estado A — Perfil incompleto ─────────────────────────────── */}
      {!complete && (
        <div className={cn(styles.incompleteCard, 'mt-6')}>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f5f5f7]">
            <User className="size-5 text-[#b0b0b0]" />
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

      {/* ── Estado B — Perfil completo, sin CV base ─────────────────── */}
      {complete && !baseCv && (
        <div className={cn(styles.generateCard, 'mt-6')}>
          <span className={styles.successChip}>
            <Check className="size-3" />
            {t('profileReady')}
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-[#1d1d1f]">{t('baseInfoTitle')}</h3>
          <p className="mt-1 max-w-md text-[13px] leading-5 text-[#707070]">{t('baseInfoSubtitle')}</p>
          <div className="mt-4">
            <AppleButton loading={generating} disabled={generating} onClick={generateBase}>
              {generating ? t('baseGenerating') : t('baseGenerate')}
            </AppleButton>
          </div>
        </div>
      )}

      {/* ── Estado C — CV base generado ─────────────────────────────── */}
      {complete && baseCv && (
        <div className={cn(styles.cvCard, 'mt-6')}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={styles.readyBadge}>
                <Check className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1d1d1f]">{t('baseReady')}</p>
                <p className="mt-0.5 text-xs text-[#707070]">{t('baseReadyDesc')}</p>
              </div>
            </div>
            <AppleButton variant="secondary" size="sm" loading={generating} disabled={generating} onClick={generateBase} className="shrink-0">
              {t('regenerate')}
            </AppleButton>
          </div>
          <CvPdfPreview cv={baseCv} />
        </div>
      )}
    </section>
  )
}
