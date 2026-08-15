'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import {
  ArrowLeft, Shield, Crown, Coins, RefreshCw,
  Plus, Minus, AlertTriangle, ShieldCheck, Bell, Rocket, Zap, Wrench,
} from 'lucide-react'
import {
  adminGetUser,
  adminListSubscriptions,
  adminUserTransactions,
  adminAdjustCredits,
  adminActivateSubscription,
  adminApproveTopup,
  adminApproveRefund,
  adminGetTopupPacks,
  getBillingCatalog,
} from '@/lib/billing'
import { fetchNotifications, isRequestType, type ServerNotification } from '@/lib/notifications'
import type {
  AdminUserSearchResult,
  CreditTransaction,
  Plan,
  SubscriptionAdmin,
  TopupPack,
} from '@/types/billing'

const PAID_TIERS = ['pro', 'max']

const TIER_BADGES: Record<string, { icon: typeof Zap; cls: string }> = {
  free: { icon: Zap, cls: 'bg-[#f5f5f7] text-[#707070]' },
  pro: { icon: Zap, cls: 'bg-amber-50 text-amber-700' },
  max: { icon: Rocket, cls: 'bg-[#f4f8fb] text-[#0071e3]' },
}

export default function AdminUserDetailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-[#858585]">…</div>}>
      <AdminUserDetailInner />
    </Suspense>
  )
}

function AdminUserDetailInner() {
  const t = useTranslations('adminUserDetail')
  const ta = useTranslations('admin')
  const tc = useTranslations('adminCredits')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'es'
  const params = useParams<{ id: string }>()
  const userId = params?.id ?? ''

  const [user, setUser] = useState<AdminUserSearchResult | null>(null)
  const [subs, setSubs] = useState<SubscriptionAdmin[]>([])
  const [txns, setTxns] = useState<CreditTransaction[]>([])
  const [pending, setPending] = useState<ServerNotification[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [topupPacks, setTopupPacks] = useState<TopupPack[]>([])
  const [loading, setLoading] = useState(true)
  const prefillApplied = useRef(false)

  // Activation form
  const [formPlan, setFormPlan] = useState('pro')
  const [formCycle, setFormCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [formAutoRenew, setFormAutoRenew] = useState(false)
  const [formPrice, setFormPrice] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formCid, setFormCid] = useState('')

  // Actions
  const [busy, setBusy] = useState<string | null>(null) // 'activate' | 'repair' | 'adjust' | 'topup' | 'refund'
  const [delta, setDelta] = useState(10)
  const [reason, setReason] = useState('')
  const [confirmSupersede, setConfirmSupersede] = useState(false)
  // Amount the admin confirms receiving per top-up request (plan.md §2.8).
  const [topupAmounts, setTopupAmounts] = useState<Record<string, string>>({})

  const activeSub = subs.find((s) => s.status === 'active') ?? null
  const balance = txns.reduce((acc, tx) => acc + tx.credits_delta, 0)

  // Inconsistency detection (plan.md §4.3 — nobody loses access).
  const paidTierWithoutSub = !!user && PAID_TIERS.includes(user.tier) && !activeSub
  const tierMismatch = !!user && !!activeSub && user.tier !== activeSub.plan_key
  const inconsistency = paidTierWithoutSub || tierMismatch

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s, txn, notifs] = await Promise.all([
        adminGetUser(userId),
        adminListSubscriptions({ user_id: userId, limit: 50 }),
        adminUserTransactions(userId),
        fetchNotifications(),
      ])
      setUser(u)
      setSubs(s)
      setTxns(txn)
      setPending(notifs.filter((n) => !n.is_read && isRequestType(n.type) && n.payload?.user_id === userId))
    } catch {
      showError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void load()
    getBillingCatalog()
      .then((c) => setPlans(c.plans.filter((p) => p.key !== 'free')))
      .catch(() => {})
    adminGetTopupPacks()
      .then(setTopupPacks)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function planName(key: string): string {
    return plans.find((p) => p.key === key)?.name ?? key
  }

  function cycleOf(sub: SubscriptionAdmin): 'monthly' | 'yearly' {
    if (!sub.period_start || !sub.period_end) return 'monthly'
    const days = (new Date(sub.period_end).getTime() - new Date(sub.period_start).getTime()) / 86_400_000
    return days >= 360 ? 'yearly' : 'monthly'
  }

  async function repair() {
    if (!user) return
    setBusy('repair')
    try {
      if (paidTierWithoutSub) {
        await adminActivateSubscription({
          user_id: user.id,
          plan_key: user.tier,
          billing_cycle: 'monthly',
          auto_renew: false,
          note: t('repairNote'),
        })
      } else if (tierMismatch && activeSub) {
        await apiFetch(`/api/v1/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ tier: activeSub.plan_key }),
        })
      }
      showSuccess(t('repairDone'))
      await load()
    } catch {
      showError(t('repairError'))
    } finally {
      setBusy(null)
    }
  }

  async function activate() {
    if (!user || !formPlan) return
    if (activeSub && !confirmSupersede) { setConfirmSupersede(true); return }
    setBusy('activate')
    try {
      await adminActivateSubscription({
        user_id: user.id,
        plan_key: formPlan,
        billing_cycle: formCycle,
        auto_renew: formAutoRenew,
        price_paid: formPrice ? parseFloat(formPrice) : undefined,
        note: formNote || (formCid ? `${tc('manualActivation')} — ${tc('correlation')}: ${formCid}` : tc('manualActivation')),
      })
      showSuccess(`${t('activated')} · ${planName(formPlan).toUpperCase()}`)
      setConfirmSupersede(false)
      setFormCid('')
      setFormPrice('')
      setFormNote('')
      window.dispatchEvent(new Event('notifications:refresh'))
      await load()
    } catch {
      showError(t('activateError'))
    } finally {
      setBusy(null)
    }
  }

  async function adjust() {
    if (!user || delta === 0) return
    if (delta < 0 && !window.confirm(t('negativeConfirm', { delta: Math.abs(delta) }))) return
    setBusy('adjust')
    try {
      const res = await adminAdjustCredits({ user_id: user.id, delta, reason: reason || null })
      showSuccess(`${t('adjusted')} → ${res.balance} ${t('credits')}`)
      setReason('')
      await load()
    } catch {
      showError(t('adjustError'))
    } finally {
      setBusy(null)
    }
  }

  async function approveTopup(n: ServerNotification) {
    // plan.md §2.8 — the admin must confirm the amount actually received.
    const price = parseFloat(topupAmounts[n.id] ?? '')
    if (!price || price <= 0) { showError(t('approveError')); return }
    setBusy('topup')
    try {
      const res = await adminApproveTopup({
        user_id: userId,
        pack_credits: n.payload?.credits ?? 0,
        price_paid: price,
        correlation_id: n.payload?.correlation_id ?? null,
      })
      showSuccess(`${t('topupApproved')} → +${res.credits} ${t('credits')} · ${t('balance')}: ${res.balance}`)
      window.dispatchEvent(new Event('notifications:refresh'))
      await load()
    } catch {
      showError(t('approveError'))
    } finally {
      setBusy(null)
    }
  }

  async function approveRefund(n: ServerNotification) {
    setBusy('refund')
    try {
      const res = await adminApproveRefund({
        user_id: userId,
        correlation_id: n.payload?.correlation_id ?? null,
      })
      showSuccess(`${t('refundApproved')} · ${res.revoked_credits} ${t('credits')}`)
      window.dispatchEvent(new Event('notifications:refresh'))
      await load()
    } catch {
      showError(t('approveError'))
    } finally {
      setBusy(null)
    }
  }

  function reviewRequest(n: ServerNotification) {
    const p = n.payload ?? {}
    if (n.type === 'purchase_request') {
      if (p.plan_key) setFormPlan(p.plan_key)
      if (p.billing_cycle === 'yearly') setFormCycle('yearly')
      setFormCid(p.correlation_id ?? '')
    } else if (n.type === 'upgrade_prorate') {
      if (p.plan_to) setFormPlan(p.plan_to)
      if (p.billing_cycle === 'yearly') setFormCycle('yearly')
      if (typeof p.amount_due === 'number') setFormPrice(String(p.amount_due))
      setFormCid(p.correlation_id ?? '')
    }
    document.getElementById('activation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Deep-link prefill (requestDeepLink): ?plan=&cycle=&amount=&cid= prefills
  // the activation form; ?approve=topup|refund scrolls to the approvals.
  const searchParams = useSearchParams()
  useEffect(() => {
    if (prefillApplied.current || !user) return
    prefillApplied.current = true
    const plan = searchParams.get('plan')
    if (plan) setFormPlan(plan)
    if (searchParams.get('cycle') === 'yearly') setFormCycle('yearly')
    const amount = searchParams.get('amount')
    if (amount) setFormPrice(amount)
    const cid = searchParams.get('cid')
    if (cid) setFormCid(cid)
    const approve = searchParams.get('approve')
    if (plan || approve) {
      setTimeout(() => {
        const target = approve ? document.getElementById('approvals') : document.getElementById('activation-form')
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }, [user, searchParams])

  // Prefill top-up amounts with the pack price once both are loaded.
  useEffect(() => {
    if (topupPacks.length === 0) return
    setTopupAmounts((prev) => {
      const next = { ...prev }
      let changed = false
      for (const n of pending) {
        if (n.type === 'topup_request' && !next[n.id]) {
          const price = topupPacks.find((p) => p.credits === n.payload?.credits)?.price_usd
          if (price) { next[n.id] = String(price); changed = true }
        }
      }
      return changed ? next : prev
    })
  }, [topupPacks, pending])

  if (loading && !user) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#858585]">
        {t('notFound')}
      </div>
    )
  }

  const TierBadgeIcon = (TIER_BADGES[user.tier] ?? TIER_BADGES.free).icon

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/${locale}/admin/users`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#707070] transition-colors hover:text-[#0071e3]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToUsers')}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f8fb]">
              <Shield className="h-6 w-6 text-[#0071e3]" />
            </div>
            <div>
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
                {user.full_name || user.email}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TIER_BADGES[user.tier]?.cls ?? TIER_BADGES.free.cls}`}>
                  <TierBadgeIcon className="h-3 w-3" />
                  {user.tier}
                </span>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                )}
              </h1>
              <p className="mt-0.5 text-sm text-[#707070]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {ta('refresh')}
          </button>
        </div>
      </div>

      {/* ── Inconsistency banner + Reparar ── */}
      {inconsistency && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{t('inconsistencyTitle')}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#7a6a3c]">
                  {paidTierWithoutSub
                    ? t('inconsistencyNoSub', { tier: user.tier })
                    : t('inconsistencyMismatch', { tier: user.tier, plan: activeSub?.plan_key ?? '' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => void repair()}
              disabled={busy === 'repair'}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {busy === 'repair' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
              {t('repair')}
            </button>
          </div>
        </div>
      )}

      {/* ── Plan & subscriptions ── */}
      <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-[#1d1d1f]">{t('subsTitle')}</h2>
        </div>

        {activeSub ? (
          <div className="mb-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                {t('statusActive')}
              </span>
              <span className="text-sm font-bold text-[#1d1d1f]">{planName(activeSub.plan_key)}</span>
              <span className="text-xs text-[#707070]">{cycleOf(activeSub) === 'yearly' ? t('cycleYearly') : t('cycleMonthly')}</span>
              {activeSub.auto_renew && <span className="text-[10px] text-[#858585]">↻ {t('autoRenew')}</span>}
            </div>
            <p className="mt-2 text-xs text-[#707070]">
              {formatDate(activeSub.period_start, locale)} → {formatDate(activeSub.period_end, locale)}
              {activeSub.price_paid > 0 && <> · {t('paid')}: ${activeSub.price_paid.toFixed(2)}</>}
            </p>
          </div>
        ) : (
          <p className="mb-4 rounded-xl border border-[#d2d2d7]/60 bg-[#f5f5f7]/60 p-4 text-xs text-[#707070]">
            {t('noActiveSub')}
          </p>
        )}

        {/* ── Explicit activation form (plan.md §4.3) ── */}
        <div id="activation-form" className="rounded-xl border border-[#d2d2d7]/60 bg-[#fafafa] p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t('activationTitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">{t('planLabel')}</span>
              <select
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#0071e3]"
              >
                {plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">{t('cycleLabel')}</span>
              <select
                value={formCycle}
                onChange={(e) => setFormCycle(e.target.value as 'monthly' | 'yearly')}
                className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#0071e3]"
              >
                <option value="monthly">{t('cycleMonthly')}</option>
                <option value="yearly">{t('cycleYearly')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">{t('priceLabel')}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#858585]">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#d2d2d7] bg-white py-2 pl-7 pr-3 text-sm outline-none transition-all focus:border-[#0071e3]"
                />
              </div>
            </label>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-xs text-[#474747]">
              <input
                type="checkbox"
                checked={formAutoRenew}
                onChange={(e) => setFormAutoRenew(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0071e3]"
              />
              {t('autoRenew')}
            </label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs outline-none transition-all focus:border-[#0071e3]"
            />
            {formCid && (
              <code className="truncate rounded-md bg-white px-2 py-1 text-[10px] text-[#474747] ring-1 ring-emerald-200" title={formCid}>
                {formCid.slice(0, 16)}…
              </code>
            )}
            <button
              onClick={() => void activate()}
              disabled={busy === 'activate' || !formPlan}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {busy === 'activate' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {t('activate')}
            </button>
          </div>
        </div>

        {/* ── Subscription history ── */}
        {subs.length > 0 && (
          <div className="mt-4 divide-y divide-[#d2d2d7]/40">
            {subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
                <span className="font-semibold text-[#1d1d1f]">{planName(s.plan_key)}</span>
                <StatusBadge s={s} t={t} locale={locale} />
                <span className="text-[#858585]">
                  {formatDate(s.period_start, locale)} → {formatDate(s.period_end, locale)}
                </span>
                {s.auto_renew && <span className="text-[10px] text-[#858585]">↻</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Credits ── */}
      <section className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-[#1d1d1f]">{t('creditsTitle')}</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {t('balance')}: {balance}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white p-1">
            <button
              onClick={() => setDelta((d) => Math.max(-1000, d - 5))}
              className="rounded-full p-1.5 text-[#707070] transition-all hover:bg-[#f5f5f7]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value || '0', 10))}
              className="w-16 bg-transparent text-center text-sm font-bold text-[#1d1d1f] outline-none"
            />
            <button
              onClick={() => setDelta((d) => Math.min(1000, d + 5))}
              className="rounded-full p-1.5 text-[#707070] transition-all hover:bg-[#f5f5f7]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
            className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs outline-none transition-all focus:border-[#0071e3]"
          />
          <button
            onClick={() => void adjust()}
            disabled={busy === 'adjust' || delta === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            {busy === 'adjust' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : delta > 0 ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {t('apply')}
          </button>
        </div>

        {/* Ledger */}
        <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-xl bg-[#fafafa] p-2 ring-1 ring-[#d2d2d7]/50">
          {txns.length === 0 && <p className="p-2 text-xs text-[#858585]">{t('noTxns')}</p>}
          {txns.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-white">
              <div className="min-w-0">
                <span className="font-medium text-[#1d1d1f]">{tx.action}</span>
                {tx.description && <span className="ml-1.5 text-[#858585]">{tx.description}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {tx.correlation_id && <code className="text-[9px] text-[#a0a0a0]">{tx.correlation_id.slice(0, 8)}</code>}
                <span className={`font-bold ${tx.credits_delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {tx.credits_delta >= 0 ? '+' : ''}{tx.credits_delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pending approvals for this user ── */}
      <section id="approvals" className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-[#1d1d1f]">{t('pendingTitle')}</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="py-3 text-center text-xs text-[#858585]">{t('noPending')}</p>
        ) : (
          <div className="divide-y divide-[#d2d2d7]/40">
            {pending.map((n) => (
              <div key={n.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    {requestLabel(t, n.type)}
                  </span>
                  <p className="truncate text-xs text-[#1d1d1f]">{n.title}</p>
                  {n.body && n.body !== n.title && <p className="truncate text-[10px] text-[#707070]">{n.body}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {(n.type === 'topup_request' || n.type === 'refund_request') ? (
                    <>
                      {n.type === 'topup_request' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#858585]">$</span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={topupAmounts[n.id] ?? ''}
                            onChange={(e) => setTopupAmounts((prev) => ({ ...prev, [n.id]: e.target.value }))}
                            placeholder="0.00"
                            title={t('amountReceived')}
                            className="w-20 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-[11px] outline-none transition-all focus:border-[#0071e3]"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => void (n.type === 'topup_request' ? approveTopup(n) : approveRefund(n))}
                        disabled={busy === 'topup' || busy === 'refund' || (n.type === 'topup_request' && (!topupAmounts[n.id] || parseFloat(topupAmounts[n.id]) <= 0))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 ${
                          n.type === 'topup_request'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-rose-500 to-red-500'
                        }`}
                      >
                        {n.type === 'topup_request' ? t('approveTopup', { credits: n.payload?.credits ?? 0 }) : t('approveRefund')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => reviewRequest(n)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110"
                    >
                      {t('review')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Supersede confirmation ── */}
      {confirmSupersede && activeSub && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setConfirmSupersede(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <AlertTriangle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">{t('supersedeTitle')}</h3>
                <p className="text-xs text-[#707070]">{t('supersedeDesc', { from: planName(activeSub.plan_key), to: planName(formPlan) })}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSupersede(false)}
                className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {ta('cancel')}
              </button>
              <button
                onClick={() => void activate()}
                disabled={busy === 'activate'}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {t('supersedeConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function StatusBadge({ s, t, locale }: { s: SubscriptionAdmin; t: (k: string, values?: Record<string, string>) => string; locale: string }) {
  if (s.status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
        <ShieldCheck className="h-3 w-3" />
        {t('statusActive')}
      </span>
    )
  }
  if (s.status === 'cancelled') {
    // is_expired comes from the backend (period_end in the past) — no Date.now() in render.
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
        {!s.is_expired ? t('statusCancelledUntil', { date: formatDate(s.period_end, locale) }) : t('statusCancelled')}
      </span>
    )
  }
  if (s.status === 'refunded') {
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">{t('statusRefunded')}</span>
  }
  return <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#707070]">{t('statusExpired')}</span>
}

function requestLabel(t: (k: string) => string, type: string): string {
  if (type === 'purchase_request') return t('reqPurchase')
  if (type === 'topup_request') return t('reqTopup')
  if (type === 'refund_request') return t('reqRefund')
  return t('reqUpgrade')
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
