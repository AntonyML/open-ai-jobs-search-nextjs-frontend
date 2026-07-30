'use client'

import { useTranslations } from 'next-intl'

const PROVIDER_DISPLAY: Record<string, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  nvidia_nim: 'NVIDIA NIM',
}

interface ActiveProviderCardProps {
  activeProvider: string | null
  activeModel?: string | null
  displayName?: string | null
}

export function ActiveProviderCard({ activeProvider, activeModel, displayName }: ActiveProviderCardProps) {
  const t = useTranslations('providers')

  const name = displayName || (activeProvider ? PROVIDER_DISPLAY[activeProvider] : null) || activeProvider

  return (
    <div className="card">
      <p className="text-sm text-[#707070]">{t('activeProvider')}</p>
      <p className="mt-2 text-xl font-bold text-[#1d1d1f]">
        {name || t('notConfigured')}
      </p>
      {activeModel && (
        <p className="mt-1 text-xs text-[#707070]">{t('model')}: {activeModel}</p>
      )}
    </div>
  )
}
