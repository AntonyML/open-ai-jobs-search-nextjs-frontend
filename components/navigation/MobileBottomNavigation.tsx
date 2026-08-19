'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutGrid, Lock, X } from 'lucide-react'
import { useResolvedNav } from './use-resolved-nav'
import { useMobileNavigation } from './MobileNavigationProvider'
import { isItemActive, stripLocale, type ResolvedItem } from './sidebar-config'
import { cn } from '@/lib/utils'

/**
 * Bottom Navigation Bar — navegación primaria móvil del layout autenticado.
 *
 * Inspirada conceptualmente en una bottom bar estilo app nativa (referencia de
 * UX: rn-wave-bottom-bar): un indicador "wave" que se desliza y se eleva sobre
 * la barra en el destino activo, y un botón central flotante que abre el App
 * Launcher existente. No copia código ni dependencias; solo el lenguaje visual.
 *
 * Fuente de verdad única: `useResolvedNav()` (misma NAV_SECTIONS que el
 * sidebar y el launcher), por lo que rutas, labels, traducciones, locks y
 * planes se derivan del mismo sistema sin duplicar lógica.
 *
 * Desktop y marketing no la ven: el provider solo se monta en el layout
 * autenticado y la barra es `md:hidden`.
 */

interface Destination {
  href: string
  /** Columna visual dentro de la barra (0..4; la 2 es el botón central). */
  slot: number
}

const DESTINATIONS: Destination[] = [
  { href: '/dashboard', slot: 0 },
  { href: '/search', slot: 1 },
  { href: '/cv-builder', slot: 3 },
  { href: '/profile', slot: 4 },
]

export function MobileBottomNavigation() {
  const tn = useTranslations('appNav')
  const { sections } = useResolvedNav()
  const { launcherOpen, openLauncher, closeLauncher } = useMobileNavigation()
  const pathname = stripLocale(usePathname())

  const itemByHref = new Map(sections.flatMap((section) => section.items).map((item) => [item.href, item]))
  const items = DESTINATIONS.map((d) => ({ ...d, item: itemByHref.get(d.href) }))
  const activeSlot =
    items.find(({ item }) => item && isItemActive(item, pathname))?.slot ?? -1

  return (
    <nav
      aria-label={tn('bottomNav')}
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-3 mb-2 h-16 rounded-[26px] border border-[#d2d2d7]/60 bg-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        {/* Ola del destino activo: se desliza entre columnas y se eleva sobre la barra */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-3 bottom-0 left-0 w-1/5 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
            activeSlot === -1 && 'opacity-0',
          )}
          style={{ transform: `translateX(${Math.max(activeSlot, 0) * 100}%)` }}
        >
          <div className="wave-blob mx-1.5 h-full bg-gradient-to-b from-[#0071e3]/12 to-[#2997ff]/[0.06]" />
        </div>

        {[0, 1, 3, 4].map((slot, i) => {
          const { item, href } = items[i]
          if (!item) return <div key={slot} className="w-1/5" aria-hidden="true" />
          return (
            <Slot
              key={slot}
              item={item}
              href={href}
              active={activeSlot === slot}
            />
          )
        })}

        {/* Botón central: abre el App Launcher existente */}
        <button
          type="button"
          onClick={launcherOpen ? closeLauncher : openLauncher}
          aria-expanded={launcherOpen}
          aria-haspopup="dialog"
          aria-label={tn('openApps')}
          className="absolute -top-5 left-1/2 z-20 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#0071e3] to-[#0057c2] text-white shadow-[0_10px_24px_rgba(0,113,227,0.35)] ring-4 ring-[#f5f5f7] transition-transform duration-300 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
        >
          <span className="relative size-6">
            <LayoutGrid
              aria-hidden="true"
              className={cn(
                'absolute inset-0 size-6 transition-all duration-300 ease-out',
                launcherOpen ? 'rotate-90 scale-50 opacity-0' : 'opacity-100',
              )}
            />
            <X
              aria-hidden="true"
              className={cn(
                'absolute inset-0 size-6 transition-all duration-300 ease-out',
                launcherOpen ? 'opacity-100' : '-rotate-90 scale-50 opacity-0',
              )}
            />
          </span>
        </button>
      </div>
    </nav>
  )
}

/** Destino de la barra. Bloqueado → respeta onLockedClick del sistema existente. */
function Slot({ item, href, active }: { item: ResolvedItem; href: string; active: boolean }) {
  const t = useTranslations('appSidebar')
  const Icon = item.icon
  const label = t(item.labelKey)

  const iconClass = cn(
    'size-[22px] transition-[transform,color] duration-300 ease-out',
    active
      ? '-translate-y-0.5 text-[#0071e3]'
      : 'text-[#707070]',
    item.locked && 'text-[#b0b0b0]',
  )
  const labelClass = cn(
    'block max-w-full truncate text-[10px] font-medium leading-none transition-colors duration-300',
    active ? 'text-[#0071e3]' : item.locked ? 'text-[#a0a0a0]' : 'text-[#707070]',
  )

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={item.onLockedClick}
        aria-label={`${label}, ${item.lockedTooltip}`}
        className="relative z-10 flex h-full w-1/5 flex-col items-center justify-center gap-1 py-1 transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
      >
        <span className="relative flex items-center justify-center">
          <Icon className={iconClass} />
          <Lock aria-hidden="true" className="absolute -right-2.5 -top-1 size-3 text-[#858585]" />
        </span>
        <span className={labelClass}>{label}</span>
      </button>
    )
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="relative z-10 flex h-full w-1/5 flex-col items-center justify-center gap-1 py-1 transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
    >
      <Icon className={iconClass} />
      <span className={labelClass}>{label}</span>
    </Link>
  )
}