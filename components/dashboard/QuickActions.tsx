'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Briefcase, Compass, FilePlus2, Lock, Mic, type LucideIcon } from 'lucide-react'
import { useResolvedNav } from '@/components/navigation/use-resolved-nav'
import { cn } from '@/lib/utils'

interface QuickActionConfig {
  href: string
  labelKey: string
  icon: LucideIcon
}

/** Acciones principales del Home móvil. Sus rutas/estados provienen de la misma
 *  configuración que el sidebar (fuente única), incluida la lógica de bloqueo. */
const ACTIONS: QuickActionConfig[] = [
  { href: '/cv-builder', labelKey: 'quickResume', icon: FilePlus2 },
  { href: '/search', labelKey: 'quickSearch', icon: Compass },
  { href: '/cv-builder/adapt', labelKey: 'quickAdapt', icon: Briefcase },
  { href: '/interview', labelKey: 'quickInterview', icon: Mic },
]

export function QuickActions() {
  const t = useTranslations('appNav')
  const { sections } = useResolvedNav()

  const items = ACTIONS.map((action) => ({
    ...action,
    item: sections.flatMap((section) => section.items).find((i) => i.href === action.href),
  }))

  return (
    <section aria-labelledby="quick-actions-title" className="md:hidden">
      <h2
        id="quick-actions-title"
        className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#707070]"
      >
        {t('quickActions')}
      </h2>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {items.map(({ href, labelKey, icon: Icon, item }) => {
          const locked = !!item?.locked
          const label = t(labelKey)
          const className = cn(
            'flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#d2d2d7]/60 bg-white px-1 py-2 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] active:scale-[0.97]',
            locked ? 'opacity-90' : 'hover:border-[#2997ff]/40',
          )

          if (locked) {
            return (
              <button
                key={href}
                type="button"
                onClick={item.onLockedClick}
                aria-label={`${label}, ${item.lockedTooltip}`}
                className={className}
              >
                <span className="relative">
                  <Icon className="size-6 text-[#b0b0b0]" />
                  <Lock
                    className="absolute -right-2.5 -top-2 size-3.5 text-[#858585]"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[11px] font-medium leading-tight text-[#707070]">{label}</span>
              </button>
            )
          }

          return (
            <Link key={href} href={href} className={className}>
              <Icon className="size-6 text-[#0071e3]" />
              <span className="text-[11px] font-medium leading-tight text-[#1d1d1f]">{label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}