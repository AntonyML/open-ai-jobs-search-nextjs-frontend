'use client'

import { useTranslations } from 'next-intl'

interface ActiveProviderCardProps {
  activeProvider: string | null
}

export function ActiveProviderCard({ activeProvider }: ActiveProviderCardProps) {
  const t = useTranslations('providers')

  return (
    <div className="card">
      <p className="text-sm text-[#707070]">{t('activeProvider')}</p>
      <p className="mt-2 text-xl font-bold text-[#1d1d1f]">
        {activeProvider || t('notConfigured')}
      </p>
    </div>
  )
}
