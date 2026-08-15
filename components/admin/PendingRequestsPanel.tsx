'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight, Bell, RefreshCw } from 'lucide-react'
import { fetchNotifications, isRequestType, requestDeepLink, type ServerNotification } from '@/lib/notifications'

export interface PendingRequestsPanelHandle {
  refresh: () => void
}

/**
 * Pending requests queue section — extracted verbatim from the original
 * admin/billing page so /admin/billing, /admin/requests and any future host
 * render exactly the same UI and behavior.
 */
export const PendingRequestsPanel = forwardRef<PendingRequestsPanelHandle, object>(
  function PendingRequestsPanel(_props, ref) {
    const t = useTranslations('adminBilling')
    const tc = useTranslations('adminCredits')
    const router = useRouter()
    const pathname = usePathname()
    const locale = pathname.split('/')[1] || 'es'

    const [pending, setPending] = useState<ServerNotification[]>([])
    const [pendingLoading, setPendingLoading] = useState(true)

    useEffect(() => {
      void loadPending()
    }, [])

    useImperativeHandle(ref, () => ({
      refresh: () => {
        void loadPending()
      },
    }))

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

    function requestLabel(type: string): string {
      if (type === 'purchase_request') return tc('reqPurchase')
      if (type === 'topup_request') return tc('reqTopup')
      if (type === 'refund_request') return tc('reqRefund')
      return tc('reqUpgrade')
    }

    return (
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
                      {requestLabel(n.type)}
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
    )
  }
)
