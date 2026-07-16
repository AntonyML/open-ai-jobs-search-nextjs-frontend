'use client'

import { useTranslations } from 'next-intl'

interface CatalogItem {
  name?: string
  provider?: string
  [key: string]: unknown
}

interface CatalogListProps {
  catalog: CatalogItem[]
}

export function CatalogList({ catalog }: CatalogListProps) {
  const t = useTranslations('providers')

  return (
    <div className="card">
      <p className="mb-3 text-sm text-slate-400">{t('availableCatalog')}</p>
      {catalog.map((x, i) => (
        <div
          key={i}
          className="border-b border-slate-800 py-2 text-sm text-slate-300 last:border-0"
        >
          {x.name || x.provider || String(x)}
        </div>
      ))}
    </div>
  )
}
