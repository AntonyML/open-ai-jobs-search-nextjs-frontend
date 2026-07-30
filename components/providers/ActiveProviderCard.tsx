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
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('activeProvider')}</p>
          <p className="mt-1 text-base font-semibold text-[#0071e3]">
            {name || t('notConfigured')}
          </p>
          {activeModel && (
            <p className="mt-0.5 text-[11px] text-[#707070]">{t('model')}: {activeModel}</p>
          )}
        </div>
      </div>
    </div>
  )
}
