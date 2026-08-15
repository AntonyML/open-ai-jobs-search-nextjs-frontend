'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { showSuccess, showError } from '@/lib/toasts'
import { Crown, History, RefreshCw, Rocket, ShieldCheck, Zap } from 'lucide-react'
import {
  adminActivateSubscription,
  adminListSubscriptions,
  getBillingCatalog,
} from '@/lib/billing'
import type { SubscriptionAdmin } from '@/types/billing'

const PLAN_BADGES: Record<string, { icon: typeof Crown; cls: string }> = {
  free: { icon: Zap, cls: 'bg-[#f5f5f7] text-[#707070]' },
  pro: { icon: Zap, cls: 'bg-amber-50 text-amber-700' },
  max: { icon: Rocket, cls: 'bg-[#f4f8fb] text-[#0071e3]' },
}

export interface SubscriptionsPanelHandle {
  refresh: () => void
}

/**
 * Subscriptions management section — extracted verbatim from the original
 * admin/billing page so /admin/billing, /admin/subscriptions and any future
 * host render exactly the same UI and behavior.
 */
export const SubscriptionsPanel = forwardRef<SubscriptionsPanelHandle, object>(
  function SubscriptionsPanel(_props, ref) {
    const t = useTranslations('adminBilling')
    const tc = useTranslations('adminCredits')
    const router = useRouter()
    const pathname = usePathname()
    const locale = pathname.split('/')[1] || 'es'

    const [subs, setSubs] = useState<SubscriptionAdmin[]>([])
    const [subsLoading, setSubsLoading] = useState(true)
    const [plans, setPlans] = useState<Array<{ key: string; name: string }>>([])
    const [planFilter, setPlanFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [activating, setActivating] = useState<string | null>(null)

    useEffect(() => {
      getBillingCatalog()
        .then((c) => setPlans(c.plans.map((p) => ({ key: p.key, name: p.name }))))
        .catch(() => {})
    }, [])

    // Filters re-query the subscription list as soon as they change.
    useEffect(() => {
      void loadSubs()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planFilter, statusFilter])

    useImperativeHandle(ref, () => ({
      refresh: () => {
        void loadSubs()
      },
    }))

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
    )
  }
)

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">
      {children}
    </th>
  )
}
