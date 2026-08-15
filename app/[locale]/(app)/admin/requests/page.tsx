'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bell, RefreshCw } from 'lucide-react'
import { isAdmin, isLoggedIn } from '@/lib/auth'
import { PendingRequestsPanel, type PendingRequestsPanelHandle } from '@/components/admin/PendingRequestsPanel'

export default function AdminRequestsPage() {
  const t = useTranslations('adminBilling')
  const tc = useTranslations('adminCredits')
  const router = useRouter()
  const panelRef = useRef<PendingRequestsPanelHandle>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
  }, [router])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Bell className="h-6 w-6 text-amber-500" />
            {t('requestsTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('requestsSubtitle')}</p>
        </div>
        <button
          onClick={() => panelRef.current?.refresh()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {tc('refresh')}
        </button>
      </header>
      <PendingRequestsPanel ref={panelRef} />
    </div>
  )
}
