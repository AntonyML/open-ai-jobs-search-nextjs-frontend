'use client'

import { useTranslations } from 'next-intl'

interface ActiveProviderCardProps {
  activeProvider: string | null
}

export function ActiveProviderCard({ activeProvider }: ActiveProviderCardProps) {
  const t = useTranslations('providers')

  return (
    <div className="card">
      <p className="text-sm text-slate-400">{t('activeProvider')}</p>
      <p className="mt-2 text-xl font-bold text-white">
        {activeProvider || t('notConfigured')}
      </p>
    </div>
  )
}
