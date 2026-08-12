'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { Server, Users } from 'lucide-react'
import { AdminProviderConfig } from '@/components/admin/AdminProviderConfig'

export default function AdminProvidersPage() {
  const t = useTranslations()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
  }, [router])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Server className="h-6 w-6 text-[#0071e3]" />
            {t('admin.providersTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('admin.providersSubtitle')}</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
        >
          <Users className="h-3.5 w-3.5" />
          {t('admin.backToUsers')}
        </Link>
      </div>

      {/* ── Global provider configuration (full form + model loading) ── */}
      <AdminProviderConfig />
    </div>
  )
}
