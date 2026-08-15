'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { fetchNotifications, isRequestType, requestDeepLink, type ServerNotification } from '@/lib/notifications'
import { showError } from '@/lib/toasts'
import {
  Shield, Users, Crown, Bell, ArrowRight,
  CreditCard, Receipt, Server, Cpu, Wrench, RefreshCw,
} from 'lucide-react'
import type { AdminUserListStats } from '@/types/billing'

// Keys match the appSidebar namespace so labels + descriptions stay in sync
// with the sidebar (plan.md §3 — single source of truth).
const QUICK_LINKS = [
  { href: '/admin/users', icon: Users, key: 'adminUsers' },
  { href: '/admin/plans', icon: CreditCard, key: 'adminPlans' },
  { href: '/admin/billing', icon: Receipt, key: 'adminBilling' },
  { href: '/admin/providers', icon: Server, key: 'adminProviders' },
  { href: '/admin/llm-control', icon: Cpu, key: 'llmControl' },
  { href: '/admin/system', icon: Wrench, key: 'adminSystem' },
] as const

const EMPTY_STATS: AdminUserListStats = { total: 0, admins: 0, active_subs: 0 }

export default function AdminPage() {
  const t = useTranslations('admin')
  const tc = useTranslations('adminCredits')
  const ts = useTranslations('appSidebar')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'es'

  const [stats, setStats] = useState<AdminUserListStats>(EMPTY_STATS)
  const [pending, setPending] = useState<ServerNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, notifs] = await Promise.all([
        apiFetch<{ stats: AdminUserListStats }>('/api/v1/admin/users?page=1&page_size=1'),
        fetchNotifications(),
      ])
      setStats(list.stats)
      setPending(notifs.filter((n) => !n.is_read && isRequestType(n.type) && !!n.payload?.user_id))
    } catch {
      showError(t('toastLoadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void load()
    const onRefresh = () => void load()
    window.addEventListener('notifications:refresh', onRefresh)
    return () => window.removeEventListener('notifications:refresh', onRefresh)
  }, [router, load])

  const statCards = [
    { icon: Users, label: t('totalUsers'), value: stats.total, cls: 'bg-[#f4f8fb] text-[#0071e3]' },
    { icon: Shield, label: t('admins'), value: stats.admins, cls: 'bg-purple-50 text-purple-600' },
    { icon: Crown, label: t('activeSubs'), value: stats.active_subs, cls: 'bg-amber-50 text-amber-600' },
    { icon: Bell, label: tc('pendingRequestsTitle'), value: pending.length, cls: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Shield className="h-6 w-6 text-[#0071e3]" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.cls}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{s.value}</p>
                <p className="text-xs text-[#707070]">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending approval queue ── */}
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
        {pending.length === 0 ? (
          <p className="px-5 pb-6 pt-2 text-center text-xs text-[#858585]">{t('noPending')}</p>
        ) : (
          <div className="divide-y divide-[#d2d2d7]/40">
            {pending.slice(0, 6).map((n) => (
              <div key={n.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      {requestLabel(tc, n.type)}
                    </span>
                    <span className="truncate text-xs text-[#1d1d1f]">{n.title}</span>
                  </div>
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

      {/* ── Quick links ── */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-[#1d1d1f]">{t('quickTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group flex items-start gap-3 rounded-xl border border-[#d2d2d7]/60 bg-white p-4 transition-all hover:border-[#0071e3]/40 hover:bg-[#f4f8fb]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f8fb]">
                <q.icon className="h-5 w-5 text-[#0071e3]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1d1d1f]">{ts(q.key)}</p>
                <p className="truncate text-xs text-[#707070]">{ts(`${q.key}Desc`)}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#c0c0c0] transition-all group-hover:translate-x-0.5 group-hover:text-[#0071e3]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function requestLabel(tc: (key: string) => string, type: string): string {
  if (type === 'purchase_request') return tc('reqPurchase')
  if (type === 'topup_request') return tc('reqTopup')
  if (type === 'refund_request') return tc('reqRefund')
  return tc('reqUpgrade')
}
