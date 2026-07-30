'use client'

import { AppleButton } from '@/components/ui/apple-button'
import { useTranslations } from 'next-intl'

interface ProviderEntry {
  provider: string
  display_name?: string | null
  api_base?: string | null
  model?: string | null
  has_key?: boolean
  is_active: boolean
}

interface ProviderListProps {
  providers: ProviderEntry[]
  premium: boolean
  maxFreeProviders: number
  onActivate: (p: string) => void
  onDelete: (p: string) => void
  onEdit: (p: ProviderEntry) => void
  onUpgrade: () => void
}

export function ProviderList({
  providers,
  premium,
  maxFreeProviders,
  onActivate,
  onDelete,
  onEdit,
  onUpgrade,
}: ProviderListProps) {
  const t = useTranslations('providers')

  return (
    <div className="card">
      <p className="mb-3 text-sm text-[#707070]">{t('yourProviders')}</p>

      {providers.length === 0 && (
        <div>
          <p className="text-sm text-[#474747]">{t('noneSaved')}</p>
          <p className="mt-1 text-xs text-[#707070]">{t('addProviderHint') || 'Completa el formulario de la izquierda y guarda tu primer proveedor.'}</p>
        </div>
      )}

      {providers.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between border-b border-[#e2e2e5] py-2 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-[#1d1d1f]">
              {p.display_name || p.provider}
              {p.is_active && (
                <span className="ml-2 text-xs text-emerald-400">({t('activeLabel')})</span>
              )}
            </span>
            {(p.model || p.api_base) && (
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#707070]">
                {p.model && <span>{t('model')}: {p.model}</span>}
                {p.api_base && <span>API: {p.api_base}</span>}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2 ml-3">
            <button
              onClick={() => onEdit(p)}
              className="btn-secondary px-3 py-1 text-xs"
            >
              {t('modify')}
            </button>
            {!p.is_active && (
              <button
                onClick={() => onActivate(p.provider)}
                className="btn-secondary px-3 py-1 text-xs"
              >
                {t('setActive')}
              </button>
            )}
            <AppleButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(p.provider)}
            >
              {t('delete')}
            </AppleButton>
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
