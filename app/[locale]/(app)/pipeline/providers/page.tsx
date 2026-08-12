'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { setCompletedSteps, getCompletedSteps, isAdmin } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { AdminProviderSummary } from '@/components/admin/AdminProviderConfig'
import { Settings, ShieldCheck, Loader2 } from 'lucide-react'

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
        <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1d1d1f]">{t('globalProvider')}</p>
              <p className="text-xs text-[#707070]">{t('managedByAdmin')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[#858585]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : configured ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatusField label={t('provider')} value={status?.display_name || status?.provider || '—'} />
              <StatusField label={t('model')} value={status?.model || '—'} />
              <StatusField label={t('status')}>
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                  operational ? 'text-[#30d158]' : 'text-[#ff9f0a]'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${operational ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`} />
                  {operational ? t('healthy') : t('notTested')}
                </span>
              </StatusField>
              {status?.api_base && (
                <div className="sm:col-span-3">
                  <StatusField label={t('apiBase')} value={status.api_base} />
                </div>
              )}
              {status?.last_error && (
                <p className="sm:col-span-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {status.last_error}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d2d2d7] bg-[#f5f5f7]/60 px-4 py-6 text-center">
              <p className="text-sm text-[#707070]">{t('envFallback')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Admin: manage the global provider ── */}
      {admin && (
        <div className="mt-8 space-y-4 animate-fade-in-up">
          <AdminProviderSummary />
          <AppleButton
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/admin')}
          >
            <ShieldCheck className="h-4 w-4" />
            {t('goToAdmin')}
          </AppleButton>
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
    <div className="rounded-xl border border-[#d2d2d7]/40 bg-[#f5f5f7]/40 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">{label}</p>
      {children ?? <p className="mt-0.5 break-words text-sm font-medium text-[#1d1d1f]">{value || '—'}</p>}
    </div>
  )
}
