'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { showSuccess, showError } from '@/lib/toasts'
import {
  Coins, Search, Plus, Minus, RefreshCw, X, Crown, Zap, Rocket, ShieldCheck, History,
} from 'lucide-react'
import {
  adminSearchUsers,
  adminGetUser,
  adminAdjustCredits,
  adminListSubscriptions,
  adminActivateSubscription,
  adminUserTransactions,
} from '@/lib/billing'
import { getBillingCatalog } from '@/lib/billing'
import type { CreditTransaction, SubscriptionAdmin } from '@/types/billing'
import styles from './CreditsAdmin.module.css'

const PLAN_BADGES: Record<string, { icon: typeof Crown; cls: string }> = {
  free: { icon: Zap, cls: 'bg-[#f5f5f7] text-[#707070]' },
  pro: { icon: Zap, cls: 'bg-amber-50 text-amber-700' },
  max: { icon: Rocket, cls: 'bg-[#f4f8fb] text-[#0071e3]' },
}

export default function AdminCreditsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-[#858585]">…</div>}>
      <AdminCreditsInner />
    </Suspense>
  )
}

function AdminCreditsInner() {
  const t = useTranslations('adminCredits')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name: string | null; tier: string }>>([])
  const [selected, setSelected] = useState<{ id: string; email: string; full_name: string | null; tier: string } | null>(null)
  const [delta, setDelta] = useState(10)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [txns, setTxns] = useState<CreditTransaction[]>([])
  const [showTxns, setShowTxns] = useState(false)

  const [subs, setSubs] = useState<SubscriptionAdmin[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)

  // ── Quick-activation form (pre-filled from purchase-request deep-link) ──
  const [plans, setPlans] = useState<Array<{ key: string; name: string }>>([])
  const [quickPlan, setQuickPlan] = useState('pro')
  const [quickCycle, setQuickCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [quickCorrelation, setQuickCorrelation] = useState('')
  const [quickPending, setQuickPending] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void loadSubs()
    // Load plans for the quick-activation form.
    getBillingCatalog()
      .then((c) => setPlans(c.plans.filter((p) => p.key !== 'free').map((p) => ({ key: p.key, name: p.name }))))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Deep-link from the notification bell: ?user=<id>&plan=<key>&cycle=&cid=
  // Re-runs when the query changes (even navigating from the same route).
  const searchParams = useSearchParams()
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId) {
      void adminGetUser(userId)
        .then((u) => setSelected({ id: u.id, email: u.email, full_name: u.full_name, tier: u.tier }))
        .catch(() => {})
      setQuickPlan(searchParams.get('plan') || 'pro')
      if (searchParams.get('cycle') === 'yearly') setQuickCycle('yearly')
      setQuickCorrelation(searchParams.get('cid') || '')
    }
  }, [searchParams])

  // Debounced user search
  useEffect(() => {
    if (!search.trim()) { setUsers([]); return }
    const id = setTimeout(async () => {
      try {
        setUsers(await adminSearchUsers(search.trim()))
      } catch {
        setUsers([])
      }
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  async function loadSubs() {
    setSubsLoading(true)
    try {
      setSubs(await adminListSubscriptions({ limit: 100 }))
    } catch (x) {
      showError(x instanceof Error ? x.message : t('loadError'))
    } finally {
      setSubsLoading(false)
    }
  }

  async function applyAdjust() {
    if (!selected || delta === 0) return
    setBusy(true)
    try {
      const res = await adminAdjustCredits({ user_id: selected.id, delta, reason: reason || null })
      showSuccess(`${t('adjusted')} → ${res.balance} ${t('credits')}`)
      setReason('')
      if (showTxns) await loadTxns(selected.id)
    } catch (x) {
      showError(x instanceof Error ? x.message : t('adjustError'))
    } finally {
      setBusy(false)
    }
  }

  async function loadTxns(userId: string) {
    try {
      setTxns(await adminUserTransactions(userId))
    } catch {
      setTxns([])
    }
  }

  async function activate(sub: SubscriptionAdmin) {
    if (activating) return
    setActivating(sub.id)
    try {
      await adminActivateSubscription({
        user_id: sub.user_id,
        plan_key: sub.plan_key,
        billing_cycle: 'monthly',
        auto_renew: sub.plan_key === 'max',
        note: t('manualActivation'),
      })
      showSuccess(t('activated'))
      await loadSubs()
    } catch (x) {
      showError(x instanceof Error ? x.message : t('activateError'))
    } finally {
      setActivating(null)
    }
  }

  async function quickActivate() {
    if (!selected || !quickPlan) return
    setQuickPending(true)
    try {
      await adminActivateSubscription({
        user_id: selected.id,
        plan_key: quickPlan,
        billing_cycle: quickCycle,
        auto_renew: quickPlan === 'max',
        note: quickCorrelation
          ? `${t('manualActivation')} — ${t('correlation')}: ${quickCorrelation}`
          : t('manualActivation'),
      })
      showSuccess(`${t('activated')} · ${quickPlan.toUpperCase()}`)
      setQuickCorrelation('')
      await loadSubs()
      window.dispatchEvent(new Event('notifications:refresh'))
      // Clean the deep-link query so a refresh doesn't re-select the user.
      router.replace('/admin/credits')
    } catch (x) {
      showError(x instanceof Error ? x.message : t('activateError'))
    } finally {
      setQuickPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Coins className="h-6 w-6 text-amber-500" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => loadSubs()}
          disabled={subsLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${subsLoading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* ── Adjust credits ── */}
      <section className={`${styles.glassCard} rounded-2xl p-5`}>
        <h2 className="mb-3 text-sm font-bold text-[#1d1d1f]">{t('adjustTitle')}</h2>

        {/* User search */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border border-[#d2d2d7] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1d1d1f] outline-none transition-all placeholder:text-[#858585] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {users.length > 0 && !selected && (
          <div className="mb-3 space-y-1">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelected(u)}
                className="flex w-full items-center justify-between rounded-xl border border-[#d2d2d7]/60 bg-white px-3 py-2 text-left transition-all hover:border-[#0071e3]/40 hover:bg-[#f4f8fb]"
              >
                <span className="truncate text-sm text-[#1d1d1f]">{u.full_name || u.email}</span>
                <span className="text-xs text-[#858585]">{u.email} · {u.tier}</span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="rounded-xl border border-[#0071e3]/20 bg-[#f4f8fb] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1d1d1f]">{selected.full_name || selected.email}</p>
                <p className="text-xs text-[#707070]">{selected.email} · {selected.tier}</p>
              </div>
              <button onClick={() => { setSelected(null); setTxns([]); setShowTxns(false) }} className="rounded-full p-1.5 text-[#858585] hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
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
                className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-sm outline-none transition-all focus:border-[#0071e3]"
              />
              <button
                onClick={applyAdjust}
                disabled={busy || delta === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {delta > 0 ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {t('apply')}
              </button>
              <button
                onClick={async () => { setShowTxns(true); await loadTxns(selected.id) }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                <History className="h-3.5 w-3.5" />
                {t('history')}
              </button>
            </div>

            {showTxns && (
              <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-white p-2 ring-1 ring-[#d2d2d7]/50">
                {txns.length === 0 && <p className="p-2 text-xs text-[#858585]">{t('noTxns')}</p>}
                {txns.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-[#f5f5f7]">
                    <div>
                      <span className="font-medium text-[#1d1d1f]">{tx.action}</span>
                      {tx.description && <span className="ml-1.5 text-[#858585]">{tx.description}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.correlation_id && <code className="text-[9px] text-[#a0a0a0]">{tx.correlation_id.slice(0, 8)}</code>}
                      <span className={`font-bold ${tx.credits_delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {tx.credits_delta >= 0 ? '+' : ''}{tx.credits_delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Quick activation (pre-filled from purchase-request deep-link) ── */}
            <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t('quickTitle')}</p>
              </div>
              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={quickPlan}
                  onChange={(e) => setQuickPlan(e.target.value)}
                  className="rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
                >
                  {plans.map((p) => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={quickCycle}
                  onChange={(e) => setQuickCycle(e.target.value as 'monthly' | 'yearly')}
                  className="rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
                >
                  <option value="monthly">{t('cycleMonthly')}</option>
                  <option value="yearly">{t('cycleYearly')}</option>
                </select>
                {quickCorrelation && (
                  <code className="truncate rounded-md bg-white px-2 py-1 text-[10px] text-[#474747] ring-1 ring-emerald-200" title={quickCorrelation}>
                    {quickCorrelation.slice(0, 16)}…
                  </code>
                )}
                <button
                  onClick={quickActivate}
                  disabled={quickPending || !quickPlan}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {quickPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {t('activate')}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Subscriptions ── */}
      <section className={`${styles.tableCard} overflow-hidden rounded-2xl`}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-sm font-bold text-[#1d1d1f]">{t('subsTitle')}</h2>
          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#707070]">{subs.length}</span>
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
                  <Th>{t('user')}</Th>
                  <Th>{t('plan')}</Th>
                  <Th>{t('cycle')}</Th>
                  <Th>{t('status')}</Th>
                  <Th>{t('correlation')}</Th>
                  <Th>{t('actions')}</Th>
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
                        <p className="font-medium text-[#1d1d1f]">{s.user_email || s.user_id}</p>
                        <p className="text-[10px] text-[#858585]">{s.user_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {s.plan_key}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#707070]">
                        {s.period_start && s.period_end ? (
                          <>
                            {new Date(s.period_start).toLocaleDateString()} → {new Date(s.period_end).toLocaleDateString()}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          expired ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {expired ? s.status : t('active')}
                        </span>
                        {s.auto_renew && <span className="ml-1 text-[10px] text-[#858585]">↻</span>}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-[10px] text-[#a0a0a0]">{s.correlation_id.slice(0, 12)}…</code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => activate(s)}
                          disabled={!expired || activating === s.id}
                          className="rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
                        >
                          {t('activate')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {subs.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#858585]">{t('noSubs')}</td></tr>
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
