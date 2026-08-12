'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { setCompletedSteps, getCompletedSteps, isAdmin } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AdminProviderSummary } from '@/components/admin/AdminProviderConfig'
import { Settings, ShieldCheck, Sparkles } from 'lucide-react'
import styles from './providers.module.css'

interface GlobalProviderStatus {
  provider: string | null
  display_name: string | null
  model: string | null
  api_base: string | null
  has_key: boolean
  last_status: string | null
  last_error: string | null
}

export default function Providers() {
  const t = useTranslations('providers')
  const router = useRouter()
  const [status, setStatus] = useState<GlobalProviderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const admin = isAdmin()

  useEffect(() => {
    apiFetch<GlobalProviderStatus>('/api/v1/providers/active')
      .then((x) => {
        setStatus(x)
        if (x?.provider) {
          // Legacy pipeline marker — providers step is satisfied by the global config.
          const steps = getCompletedSteps()
          if (!steps.includes(0)) setCompletedSteps([...steps, 0])
        }
      })
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [])

  const configured = status?.provider ? true : false
  // last_status is only reset (never persisted as "ok" by the test endpoint),
  // so the honest signal of a ready provider is a stored global API key.
  const operational = !!status?.has_key

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* ── Global provider status card ── */}
      <div className="mt-8 animate-fade-in-up">
        <div className={styles.card}>
          <div className="flex items-start gap-3 p-6 pb-0 sm:items-center">
            <span className={styles.iconWrap}>
              <Settings size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={styles.cardTitle}>{t('globalProvider')}</p>
              <p className={styles.cardSubtitle}>{t('managedByAdmin')}</p>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={`${styles.shimmer} h-[72px]`} />
                <div className={`${styles.shimmer} h-[72px]`} />
                <div className={`${styles.shimmer} h-[72px]`} />
              </div>
            ) : configured ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatusField label={t('provider')} value={status?.display_name || status?.provider || '—'} />
                <StatusField label={t('model')} value={status?.model || '—'} />
                <StatusField label={t('status')}>
                  <span className={`mt-0.5 inline-flex items-center gap-2 text-sm font-medium ${operational ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`}>
                    <span className={`${styles.statusDot} ${operational ? styles.statusOk : styles.statusWarn}`} />
                    {operational ? t('healthy') : t('notTested')}
                  </span>
                </StatusField>
                {status?.api_base && (
                  <div className="sm:col-span-3">
                    <StatusField label={t('apiBase')} value={status.api_base} />
                  </div>
                )}
                {status?.last_error && (
                  <div className="sm:col-span-3">
                    <p className={styles.errorStrip}>{status.last_error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.fallback}>
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-[#b0b0b0]" />
                <p className="mx-auto max-w-md text-sm leading-relaxed text-[#707070]">{t('envFallback')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin: manage the global provider ── */}
      {admin && (
        <div className="mt-8 space-y-4 animate-fade-in-up">
          <AdminProviderSummary />
          <button
            type="button"
            className={styles.adminBtn}
            onClick={() => router.push('/admin/providers')}
          >
            <ShieldCheck size={16} />
            <span className="min-w-0">{t('goToAdmin')}</span>
          </button>
        </div>
      )}
    </section>
  )
}

function StatusField({ label, value, children }: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>{label}</p>
      {children ?? <p className={styles.fieldValue}>{value || '—'}</p>}
    </div>
  )
}
