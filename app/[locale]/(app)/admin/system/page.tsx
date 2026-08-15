'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { showSuccess, showError } from '@/lib/toasts'
import { Wrench, Save, RefreshCw, Trash } from 'lucide-react'
import { adminGetNotificationTtl, adminSetNotificationTtl } from '@/lib/billing'

export default function AdminSystemPage() {
  const t = useTranslations('adminSystem')
  const router = useRouter()
  const [ttlDays, setTtlDays] = useState(30)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    adminGetNotificationTtl()
      .then((ttl) => setTtlDays(ttl.days))
      .catch(() => setTtlDays(30))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setSaving(true)
    try {
      const next = await adminSetNotificationTtl(ttlDays)
      setTtlDays(next.days)
      showSuccess(t('ttlSaved'))
    } catch (x) {
      showError(x instanceof Error ? x.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Wrench className="h-6 w-6 text-[#0071e3]" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setLoading(true); adminGetNotificationTtl().then((ttl) => setTtlDays(ttl.days)).finally(() => setLoading(false)) }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
        </div>
      ) : (
        <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trash className="h-5 w-5 text-[#0071e3]" />
            <h2 className="text-sm font-bold text-[#1d1d1f]">{t('ttlTitle')}</h2>
          </div>
          <p className="mb-4 text-xs text-[#707070]">{t('ttlDesc')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block sm:max-w-xs sm:flex-1">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                {t('ttlDaysLabel')}
              </span>
              <div className="relative">
                <Trash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#858585]" />
                <input
                  type="number"
                  min={1}
                  value={ttlDays}
                  onChange={(e) => setTtlDays(Math.max(1, parseInt(e.target.value || '0', 10)))}
                  className="w-full rounded-xl border border-[#d2d2d7] bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                />
              </div>
            </label>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50 active:scale-[.98] sm:self-auto"
            >
              <Save className="h-3.5 w-3.5" />
              {t('saveTtl')}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
