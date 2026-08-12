'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { showError } from '@/lib/toasts'
import {
  Crown, Coins, RefreshCw, ShieldCheck, Clock, Copy, Zap, Rocket,
  Sparkles, Layers, ArrowUpRight, Receipt, Wallet,
} from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import { getCreditTransactions } from '@/lib/billing'
import type { CreditTransaction } from '@/types/billing'
import styles from './BillingPage.module.css'

const ACTION_ICONS: Record<string, { icon: typeof Coins; cls: string }> = {
  refill: { icon: RefreshCw, cls: 'text-emerald-600 bg-emerald-50' },
  expiry: { icon: Clock, cls: 'text-rose-500 bg-rose-50' },
  purchase: { icon: Wallet, cls: 'text-[#0071e3] bg-[#f4f8fb]' },
  topup: { icon: Coins, cls: 'text-amber-500 bg-amber-50' },
  adjust: { icon: Coins, cls: 'text-purple-500 bg-purple-50' },
}

function PlanBadge({ planKey }: { planKey: string | null }) {
  const t = useTranslations('billingPage')
  const isMax = planKey === 'max' || planKey === 'premium'
  const icon = isMax ? Rocket : planKey === 'pro' ? Zap : Sparkles
  const Icon = icon
  const cls = isMax
    ? 'bg-gradient-to-r from-[#0071e3] to-[#0060c0] text-white shadow-sm'
    : planKey === 'pro'
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
      : 'bg-[#f5f5f7] text-[#707070] ring-1 ring-[#d2d2d7]/60'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {isMax ? t('planMax') : planKey === 'pro' ? t('planPro') : t('planFree')}
    </span>
  )
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export default function BillingPage() {
  const t = useTranslations('billingPage')
  const router = useRouter()
  const { status, catalog, loading, error, refresh } = useBilling()
  const [txns, setTxns] = useState<CreditTransaction[]>([])
  const [txnsLoading, setTxnsLoading] = useState(true)
  const [txnsError, setTxnsError] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadTxns() {
      setTxnsLoading(true)
      try {
        const rows = await getCreditTransactions()
        if (!cancelled) { setTxns(rows); setTxnsError(false) }
      } catch {
        if (!cancelled) setTxnsError(true)
      } finally {
        if (!cancelled) setTxnsLoading(false)
      }
    }
    void loadTxns()
    const onRefresh = () => { void refresh(); void loadTxns() }
    const onFocus = () => { void refresh(); void loadTxns() }
    window.addEventListener('billing:updated', onRefresh)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('billing:updated', onRefresh)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showError(t('copyFailed'))
    }
  }

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
      </div>
    )
  }

  if (error && !status) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-[#707070]">{t('loadError')}</p>
      </div>
    )
  }

  const planKey = status?.plan_key ?? null
  const plan = catalog?.plans.find((p) => p.key === planKey)
  const daysLeft = daysUntil(status?.period_end ?? null)
  const balance = status?.credits_balance ?? 0
  const total = status?.credits_total ?? 0
  const used = status?.credits_used ?? 0
  const hasQuotas = !!status && (status.quota_day_limit > 0 || status.quota_week_limit > 0)
  const features = status?.features ?? plan?.features ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`flex items-center gap-2.5 text-xl font-bold text-[#1d1d1f] sm:text-2xl ${styles.gradientText}`}>
            <span className={styles.titleIcon}>
              <Crown className="h-5 w-5 text-white" />
            </span>
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/70 px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* ── Current plan + balance ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Plan card */}
        <section className={`${styles.glassCard} rounded-2xl p-5 lg:col-span-2`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <PlanBadge planKey={planKey} />
                {status?.has_active_subscription && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    <ShieldCheck className="h-3 w-3" />
                    {t('active')}
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-[17px] font-bold text-[#1d1d1f]">
                {plan?.name ?? status?.plan_name ?? t('planFree')}
              </h2>
              {plan?.description && (
                <p className="mt-1 max-w-md text-xs leading-relaxed text-[#707070]">{plan.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('purchase:required', { detail: { status: 402 } }))}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[.98]"
            >
              {planKey === 'free' ? t('upgrade') : t('getMore')}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Period + correlation */}
          {status?.period_end && (() => {
            const sub = status.subscription
            return (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={styles.infoChip}>
                  <Clock className="h-4 w-4 text-[#0071e3]" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#858585]">{t('period')}</p>
                    <p className="text-xs font-medium text-[#1d1d1f]">
                      {status.period_start ? new Date(status.period_start).toLocaleDateString() : '—'}
                      {' → '}
                      {new Date(status.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  {daysLeft !== null && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      daysLeft <= 3 ? 'bg-rose-50 text-rose-600' : 'bg-[#f4f8fb] text-[#0071e3]'
                    }`}>
                      {daysLeft} {t('daysLeft')}
                    </span>
                  )}
                </div>
                {sub?.correlation_id && (
                  <div className={styles.infoChip}>
                    <Receipt className="h-4 w-4 text-purple-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#858585]">{t('correlationId')}</p>
                      <code className="block truncate text-xs font-medium text-[#1d1d1f]">
                        {sub.correlation_id}
                      </code>
                    </div>
                    <button
                      onClick={() => copyId(sub.correlation_id)}
                      className="ml-auto rounded-full p-1.5 text-[#858585] transition-all hover:bg-white hover:text-[#0071e3]"
                      title={t('copy')}
                      aria-label={t('copy')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Features */}
          {features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {features.map((f) => (
                <span key={f} className={styles.featureChip}>
                  <Layers className="h-3 w-3" />
                  {t(`feature.${f}`, { defaultValue: f })}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Balance card */}
        <section className={`${styles.glassCard} rounded-2xl p-5`}>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f]">{t('balance')}</h3>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-4xl font-bold tracking-tight ${balance > 0 ? 'text-[#1d1d1f]' : 'text-[#a0a0a0]'}`}>
              {balance}
            </span>
            <span className="text-sm text-[#707070]">{t('credits')}</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-[#858585]">
              <span>{t('used')}: {used}</span>
              <span>{t('total')}: {total}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9e9ec]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  total > 0 && balance / total < 0.2 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                }`}
                style={{ width: total > 0 ? `${Math.min(100, (used / total) * 100)}%` : '0%' }}
              />
            </div>
          </div>
          {hasQuotas && (
            <div className="mt-4 space-y-2 border-t border-[#e2e2e5]/80 pt-3">
              {status!.quota_day_limit > 0 && (
                <QuotaBar
                  label={t('dailyQuota')}
                  used={status!.quota_day_used}
                  limit={status!.quota_day_limit}
                />
              )}
              {status!.quota_week_limit > 0 && (
                <QuotaBar
                  label={t('weeklyQuota')}
                  used={status!.quota_week_used}
                  limit={status!.quota_week_limit}
                />
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Transaction history ── */}
      <section className={`${styles.tableCard} overflow-hidden rounded-2xl`}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#0071e3]" />
            <h2 className="text-sm font-bold text-[#1d1d1f]">{t('historyTitle')}</h2>
          </div>
          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#707070]">
            {txns.length}
          </span>
        </div>
        {txnsLoading ? (
          <div className="flex items-center justify-center py-14">
            <RefreshCw className="h-5 w-5 animate-spin text-[#858585]" />
          </div>
        ) : txnsError ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-[#707070]">{t('loadError')}</p>
          </div>
        ) : txns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Coins className="h-8 w-8 text-[#d2d2d7]" />
            <p className="text-sm text-[#858585]">{t('noTxns')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-[#d2d2d7]/60 bg-[#f5f5f7]/70 text-left">
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">{t('thType')}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">{t('thDetail')}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">{t('thCode')}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#707070]">{t('thDate')}</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#707070]">{t('thAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((tx) => {
                  const meta = ACTION_ICONS[tx.action] ?? { icon: Coins, cls: 'text-[#707070] bg-[#f5f5f7]' }
                  const ActionIcon = meta.icon
                  const isCredit = (tx.credits_delta ?? 0) >= 0
                  return (
                    <tr key={tx.id} className="border-b border-[#d2d2d7]/40 transition-colors hover:bg-[#f5f5f7]/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                            <ActionIcon className="h-4 w-4" />
                          </span>
                          <span className="font-medium capitalize text-[#1d1d1f]">
                            {t(`action.${tx.action}`, { defaultValue: tx.action })}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate text-xs text-[#707070]">{tx.description ?? '—'}</p>
                        {tx.model_used && <p className="text-[10px] text-[#a0a0a0]">{tx.model_used}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {tx.correlation_id ? (
                          <button
                            onClick={() => copyId(tx.correlation_id!)}
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] px-2 py-1 font-mono text-[10px] text-[#474747] transition-all hover:bg-[#e9e9ec]"
                            title={t('copy')}
                            aria-label={t('copy')}
                          >
                            <code>{tx.correlation_id.slice(0, 12)}…</code>
                            {copiedId === tx.correlation_id ? (
                              <Copy className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-[#a0a0a0] transition-colors group-hover:text-[#0071e3]" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#c0c0c0]">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#858585]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isCredit ? '+' : ''}{tx.credits_delta}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100)
  const nearLimit = pct >= 80
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-[#707070]">
        <span>{label}</span>
        <span className={nearLimit ? 'font-semibold text-rose-500' : ''}>{used} / {limit}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e9e9ec]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            nearLimit ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-[#0071e3] to-[#5ac8fa]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
