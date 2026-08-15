'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { showSuccess, showError } from '@/lib/toasts'
import {
  Receipt, Coins, ShieldCheck, Save, RefreshCw,
} from 'lucide-react'
import {
  adminGetTopupPacks,
  adminSetTopupPacks,
  adminGetBillingPolicy,
  adminSetBillingPolicy,
} from '@/lib/billing'
import type { BillingPolicy, TopupPack } from '@/types/billing'

const DEFAULT_PACKS: TopupPack[] = [
  { price_usd: 9.99, credits: 50 },
  { price_usd: 19.99, credits: 120 },
]

export default function AdminBillingPage() {
  const t = useTranslations('adminBilling')
  const tc = useTranslations('adminCredits')
  const tp = useTranslations('adminPlans')
  const router = useRouter()

  // Config
  const [packs, setPacks] = useState<TopupPack[]>(DEFAULT_PACKS)
  const [policy, setPolicy] = useState<BillingPolicy>({ refund_credit_threshold: 16, annual_cooling_days: 14 })
  const [savingPacks, setSavingPacks] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadConfig() {
    try {
      setPacks(await adminGetTopupPacks())
    } catch {
      // keep defaults
    }
    try {
      setPolicy(await adminGetBillingPolicy())
    } catch {
      // keep defaults
    }
  }

  async function savePacks() {
    setSavingPacks(true)
    try {
      const next = await adminSetTopupPacks(packs)
      setPacks(next)
      showSuccess(tp('packsSaved'))
    } catch (x) {
      showError(x instanceof Error ? x.message : tp('saveError'))
    } finally {
      setSavingPacks(false)
    }
  }

  async function savePolicy() {
    setSavingPolicy(true)
    try {
      const next = await adminSetBillingPolicy(policy)
      setPolicy(next)
      showSuccess(tp('policySaved'))
    } catch (x) {
      showError(x instanceof Error ? x.message : tp('saveError'))
    } finally {
      setSavingPolicy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Receipt className="h-6 w-6 text-[#0071e3]" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('billingOnlySubtitle')}</p>
        </div>
        <button
          onClick={() => void loadConfig()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {tc('refresh')}
        </button>
      </div>

      {/* ── Top-up packs ── */}
      <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-[#1d1d1f]">{tp('packsTitle')}</h2>
        </div>
        <p className="mb-2 text-xs text-[#707070]">{tp('packsDesc')}</p>
        <p className="mb-4 rounded-xl bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-[#8a6d1f]">
          {t('packsNote')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {packs.map((p, i) => (
            <div key={i} className="rounded-xl border border-[#d2d2d7]/70 bg-white p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#858585]">
                {tp('packLabel', { n: i + 1 })}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#707070]">{tp('creditsLabel')}</span>
                  <input
                    type="number"
                    min={1}
                    value={p.credits}
                    onChange={(e) => {
                      const credits = Math.max(1, parseInt(e.target.value || '0', 10))
                      setPacks(packs.map((pk, j) => (j === i ? { ...pk, credits } : pk)))
                    }}
                    className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-1.5 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#707070]">{tp('priceLabel')}</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={p.price_usd}
                    onChange={(e) => {
                      const price = Math.max(0.01, parseFloat(e.target.value || '0'))
                      setPacks(packs.map((pk, j) => (j === i ? { ...pk, price_usd: price } : pk)))
                    }}
                    className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-1.5 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={savePacks}
            disabled={savingPacks}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {tp('savePacks')}
          </button>
        </div>
      </section>

      {/* ── Refund policy ── */}
      <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-rose-500" />
          <h2 className="text-sm font-bold text-[#1d1d1f]">{tp('policyTitle')}</h2>
        </div>
        <p className="mb-2 text-xs text-[#707070]">{tp('policyDesc')}</p>
        <p className="mb-4 rounded-xl bg-rose-50/70 px-3 py-2 text-[11px] leading-relaxed text-[#8a4a4a]">
          {t('policyNote')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
              {tp('policyThresholdLabel')}
            </span>
            <input
              type="number"
              min={0}
              value={policy.refund_credit_threshold}
              onChange={(e) => setPolicy({ ...policy, refund_credit_threshold: Math.max(0, parseInt(e.target.value || '0', 10)) })}
              className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
              {tp('policyCoolingLabel')}
            </span>
            <input
              type="number"
              min={0}
              value={policy.annual_cooling_days}
              onChange={(e) => setPolicy({ ...policy, annual_cooling_days: Math.max(0, parseInt(e.target.value || '0', 10)) })}
              className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={savePolicy}
            disabled={savingPolicy}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {tp('savePolicy')}
          </button>
        </div>
      </section>
    </div>
  )
}
