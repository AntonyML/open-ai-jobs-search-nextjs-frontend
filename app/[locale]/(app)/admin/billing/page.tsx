'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { showSuccess, showError } from '@/lib/toasts'
import {
  Receipt, Coins, ShieldCheck, Save, RefreshCw, Bell, ArrowRight, Crown, Zap, Rocket, History,
} from 'lucide-react'
import {
  adminGetTopupPacks,
  adminSetTopupPacks,
  adminGetBillingPolicy,
  adminSetBillingPolicy,
  adminListSubscriptions,
  adminActivateSubscription,
  getBillingCatalog,
} from '@/lib/billing'
import { fetchNotifications, isRequestType, requestDeepLink, type ServerNotification } from '@/lib/notifications'
import type { BillingPolicy, SubscriptionAdmin, TopupPack } from '@/types/billing'

const DEFAULT_PACKS: TopupPack[] = [
  { price_usd: 9.99, credits: 50 },
  { price_usd: 19.99, credits: 120 },
]

const PLAN_BADGES: Record<string, { icon: typeof Crown; cls: string }> = {
  free: { icon: Zap, cls: 'bg-[#f5f5f7] text-[#707070]' },
  pro: { icon: Zap, cls: 'bg-amber-50 text-amber-700' },
  max: { icon: Rocket, cls: 'bg-[#f4f8fb] text-[#0071e3]' },
}

export default function AdminBillingPage() {
  const t = useTranslations('adminBilling')
  const tc = useTranslations('adminCredits')
  const tp = useTranslations('adminPlans')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'es'

  // Config
  const [packs, setPacks] = useState<TopupPack[]>(DEFAULT_PACKS)
  const [policy, setPolicy] = useState<BillingPolicy>({ refund_credit_threshold: 16, annual_cooling_days: 14 })
  const [savingPacks, setSavingPacks] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Queue
  const [pending, setPending] = useState<ServerNotification[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)

  // Subscriptions
  const [subs, setSubs] = useState<SubscriptionAdmin[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [plans, setPlans] = useState<Array<{ key: string; name: string }>>([])
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void loadConfig()
    void loadPending()
    void loadSubs()
    getBillingCatalog()
      .then((c) => setPlans(c.plans.map((p) => ({ key: p.key, name: p.name }))))
      .catch(() => {})
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

  async function loadPending() {
    setPendingLoading(true)
    try {
      const notifs = await fetchNotifications()
      setPending(notifs.filter((n) => !n.is_read && isRequestType(n.type) && !!n.payload?.user_id))
    } catch {
      setPending([])
    } finally {
      setPendingLoading(false)
    }
  }

  async function loadSubs() {
    setSubsLoading(true)
    try {
      setSubs(await adminListSubscriptions({
        plan: planFilter || undefined,
        status: statusFilter || undefined,
        limit: 200,
      }))
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('loadError'))
    } finally {
      setSubsLoading(false)
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

  async function activate(sub: SubscriptionAdmin) {
    if (activating) return
    setActivating(sub.id)
    try {
      // plan.md §4.5 — the reactivation respects the subscription's real
      // billing cycle instead of hardcoding monthly.
      await adminActivateSubscription({
        user_id: sub.user_id,
        plan_key: sub.plan_key,
        billing_cycle: cycleOf(sub),
        auto_renew: sub.auto_renew,
        price_paid: sub.price_paid,
        note: tc('manualActivation'),
      })
      showSuccess(`${tc('activated')} · ${sub.plan_key.toUpperCase()}`)
      await loadSubs()
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('activateError'))
    } finally {
      setActivating(null)
    }
  }

  function cycleOf(sub: SubscriptionAdmin): 'monthly' | 'yearly' {
    if (!sub.period_start || !sub.period_end) return 'monthly'
    const days = (new Date(sub.period_end).getTime() - new Date(sub.period_start).getTime()) / 86_400_000
    return days >= 360 ? 'yearly' : 'monthly'
  }

  function planName(key: string): string {
    return plans.find((p) => p.key === key)?.name ?? key
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
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { void loadConfig(); void loadPending(); void loadSubs() }}
          disabled={subsLoading || pendingLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${subsLoading || pendingLoading ? 'animate-spin' : ''}`} />
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

      {/* ── Pending queue ── */}
      <section className="overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-[#1d1d1f]">{t('queueTitle')}</h2>
          </div>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              {pending.length}
            </span>
          )}
        </div>
        {pendingLoading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="h-5 w-5 animate-spin text-[#858585]" />
          </div>
        ) : pending.length === 0 ? (
          <p className="px-5 pb-6 pt-2 text-center text-xs text-[#858585]">{t('noPending')}</p>
        ) : (
          <div className="divide-y divide-[#d2d2d7]/40">
            {pending.map((n) => (
              <div key={n.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      {requestLabel(tc, n.type)}
                    </span>
                    {n.payload?.correlation_id && (
                      <code className="text-[9px] text-[#a0a0a0]">{n.payload.correlation_id.slice(0, 10)}…</code>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#1d1d1f]">{n.title}</p>
                  {n.payload?.user_email && (
                    <p className="truncate text-[10px] text-[#707070]">{n.payload.user_email}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/${locale}${requestDeepLink(n)}`)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110"
                >
                  {n.type === 'topup_request' || n.type === 'refund_request' ? tc('approve') : tc('review')}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Subscriptions ── */}
      <section className="overflow-hidden rounded-2xl border border-[#d2d2d7]/60 bg-white">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-[#1d1d1f]">{tc('subsTitle')}</h2>
          <div className="flex items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
            >
              <option value="">{t('allPlans')}</option>
              {plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="cancelled">{t('statusCancelled')}</option>
              <option value="expired">{t('statusExpired')}</option>
              <option value="refunded">{t('statusRefunded')}</option>
            </select>
            <button
              onClick={() => void loadSubs()}
              disabled={subsLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[11px] font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${subsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {subsLoading ? (
          <div className="flex items-center justify-center py-14">
            <RefreshCw className="h-5 w-5 animate-spin text-[#858585]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-[#d2d2d7]/60 bg-[#f5f5f7]/70 text-left">
                  <Th>{tc('user')}</Th>
                  <Th>{tc('plan')}</Th>
                  <Th>{tc('cycle')}</Th>
                  <Th>{tc('status')}</Th>
                  <Th>{tc('actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const badge = PLAN_BADGES[s.plan_key] ?? PLAN_BADGES.free
                  const BadgeIcon = badge.icon
                  const expired = s.is_expired || s.status !== 'active'
                  return (
                    <tr key={s.id} className="border-b border-[#d2d2d7]/40 transition-colors hover:bg-[#f5f5f7]/50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/${locale}/admin/users/${s.user_id}`)}
                          className="text-left font-medium text-[#0071e3] transition-all hover:underline"
                        >
                          {s.user_email || s.user_id}
                        </button>
                        <p className="text-[10px] text-[#858585]">{s.user_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {planName(s.plan_key)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#707070]">
                        {s.period_start && s.period_end ? (
                          <>
                            {new Date(s.period_start).toLocaleDateString()} → {new Date(s.period_end).toLocaleDateString()}
                            <span className="ml-1 text-[10px] text-[#a0a0a0]">({cycleOf(s) === 'yearly' ? tc('cycleYearly') : tc('cycleMonthly')})</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          expired ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {expired ? t(`statusLabel.${s.status}`) : tc('active')}
                        </span>
                        {s.auto_renew && <span className="ml-1 text-[10px] text-[#858585]">↻</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => activate(s)}
                            disabled={!expired || activating === s.id}
                            className="rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
                          >
                            {tc('activate')}
                          </button>
                          <button
                            onClick={() => router.push(`/${locale}/admin/users/${s.user_id}`)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[11px] font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
                          >
                            <History className="h-3 w-3" />
                            {t('viewUser')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {subs.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-[#858585]">{tc('noSubs')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">
      {children}
    </th>
  )
}

function requestLabel(tc: (key: string) => string, type: string): string {
  if (type === 'purchase_request') return tc('reqPurchase')
  if (type === 'topup_request') return tc('reqTopup')
  if (type === 'refund_request') return tc('reqRefund')
  return tc('reqUpgrade')
}
