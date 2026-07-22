'use client'

import { useTranslations } from 'next-intl'

interface ProviderEntry {
  provider: string
  is_active: boolean
}

interface ProviderListProps {
  providers: ProviderEntry[]
  premium: boolean
  maxFreeProviders: number
  onActivate: (p: string) => void
  onDelete: (p: string) => void
  onUpgrade: () => void
}

export function ProviderList({
  providers,
  premium,
  maxFreeProviders,
  onActivate,
  onDelete,
  onUpgrade,
}: ProviderListProps) {
  const t = useTranslations('providers')

  return (
    <div className="card">
      <p className="mb-3 text-sm text-slate-400">{t('yourProviders')}</p>

      {providers.length === 0 && (
        <p className="text-sm text-slate-500">{t('noneSaved')}</p>
      )}

      {providers.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between border-b border-slate-800 py-2 last:border-0"
        >
          <span className="text-sm text-slate-300">
            {p.provider}
            {p.is_active && (
              <span className="ml-2 text-xs text-emerald-400">({t('activeLabel')})</span>
            )}
          </span>
          <div className="flex gap-2">
            {!p.is_active && (
              <button
                onClick={() => onActivate(p.provider)}
                className="btn-secondary px-3 py-1 text-xs"
              >
                {t('setActive')}
              </button>
            )}
            <button
              onClick={() => onDelete(p.provider)}
              className="btn-secondary px-3 py-1 text-xs text-rose-400"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      ))}

      {!premium && providers.length >= maxFreeProviders && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-50/10 px-3 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="flex-1 text-xs text-amber-400/80">
            {t('maxProvidersReached') || 'Max 1 provider on Free. Upgrade for more.'}
          </span>
          <button
            onClick={onUpgrade}
            className="shrink-0 text-xs font-medium text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}
    </div>
  )
}
