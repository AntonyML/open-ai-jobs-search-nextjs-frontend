'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { Lock, LogOut, X } from 'lucide-react'
import { useResolvedNav } from './use-resolved-nav'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'
import Logo from '@/components/Logo'
import type { ResolvedItem } from './sidebar-config'
import { cn } from '@/lib/utils'

/**
 * App Launcher — "espacio de aplicaciones" flotante.
 *
 * Presentación tipo Floating App Grid (dock) en lugar de panel lateral: un panel
 * centrado que emerge desde la Bottom Navigation hacia arriba (scale + fade),
 * con backdrop sutil y un grid de aplicaciones agrupadas por sección.
 *
 * La lógica NO cambia: mismo estado del provider, mismas secciones resueltas por
 * `useResolvedNav`, mismos locks/upgrade, mismo cierre por navegación.
 * El botón central de la barra y este panel comparten vocabulario visual
 * (misma curva 28px, misma paleta) para sentirse un único sistema.
 */

export function MobileAppLauncher({
  open,
  sectionKey,
  onClose,
}: {
  open: boolean
  /** Sección solicitada desde la Bottom Navigation (scroll directo al grupo). */
  sectionKey?: string | null
  onClose: () => void
}) {
  const t = useTranslations('appSidebar')
  const tn = useTranslations('appNav')
  const { sections } = useResolvedNav()
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // La Bottom Navigation puede pedir abrir el launcher en una sección concreta.
  useEffect(() => {
    if (!open || !sectionKey) return
    const el = sectionRefs.current[sectionKey]
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [open, sectionKey])

  // El inicio ya vive en el tab Home de la Bottom Navigation: el launcher lista
  // el resto de aplicaciones y herramientas del producto.
  const gridSections = sections.filter((section) => section.labelKey !== 'principal')

  return (
    <SheetPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />

        <SheetPrimitive.Popup
          className={cn(
            'fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+140px)] z-50 mx-auto flex max-h-[min(62vh,560px)] w-[calc(100%-24px)] max-w-md flex-col overflow-hidden rounded-[28px] border border-[#d2d2d7]/70 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.28)]',
            'transition-[opacity,transform] duration-200 ease-out',
            'data-starting-style:translate-y-8 data-starting-style:scale-[0.98] data-starting-style:opacity-0',
            'data-ending-style:translate-y-8 data-ending-style:scale-[0.98] data-ending-style:opacity-0',
          )}
        >
          <SheetPrimitive.Title className="sr-only">{tn('title')}</SheetPrimitive.Title>
          <SheetPrimitive.Description className="sr-only">{tn('greeting')}</SheetPrimitive.Description>

          {/* Cabecera */}
          <div className="flex items-center justify-between gap-2 border-b border-[#d2d2d7]/60 px-4 py-3">
            <div className="flex min-h-11 items-center gap-2.5">
              <Logo size={28} showIconOnly={true} />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-[#1d1d1f]">CVMeld</p>
                <p className="mt-0.5 text-xs text-[#707070]">{tn('greeting')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tn('closeLauncher')}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Grid de aplicaciones */}
          <div className="overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
            <h2 className="px-1 pb-3 text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
              {tn('sections')}
            </h2>

            <div className="space-y-5">
              {gridSections.map((section, si) => (
                <section
                  key={section.labelKey ?? si}
                  ref={(node) => {
                    sectionRefs.current[section.labelKey ?? ''] = node
                  }}
                  aria-label={section.labelKey ? t(section.labelKey) : undefined}
                >
                  {section.labelKey && (
                    <h3
                      className={cn(
                        'mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                        section.labelKey === sectionKey ? 'text-[#0071e3]' : 'text-[#8e8e93]',
                      )}
                    >
                      {t(section.labelKey)}
                      {section.labelKey === sectionKey && (
                        <span className="inline-block size-1.5 rounded-full bg-[#0071e3]" aria-hidden="true" />
                      )}
                    </h3>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item, ii) => (
                      <AppTile key={item.href} item={item} delay={Math.min((si * 3 + ii) * 20, 240)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-5 border-t border-[#e8e8ed] pt-2">
              <SignOutRow />
            </div>
          </div>
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}

/**
 * Tile de aplicación. Bloqueado → respeta la lógica existente (onLockedClick,
 * badge Plan Max), solo cambia la presentación.
 */
function AppTile({ item, delay }: { item: ResolvedItem; delay: number }) {
  const t = useTranslations('appSidebar')
  const tn = useTranslations('appNav')
  const Icon = item.icon

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={item.onLockedClick}
        aria-label={`${t(item.labelKey)}, ${item.lockedTooltip}`}
        style={{ animationDelay: `${delay}ms` }}
        className="animate-stagger flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#e8e8ed] bg-[#fafafa] px-1.5 py-2 text-center transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
      >
        <span className="relative">
          <span className="flex size-11 items-center justify-center rounded-[13px] bg-[#f5f5f7] ring-1 ring-[#e8e8ed]/70">
            <Icon className="size-5 text-[#b0b0b0]" />
          </span>
          <Lock aria-hidden="true" className="absolute -right-1 -top-1 size-3.5 rounded-full bg-[#fafafa] px-px text-[#858585]" />
        </span>
        <span className="block w-full truncate text-[11px] font-medium leading-tight text-[#707070]">
          {t(item.labelKey)}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-1.5 py-px text-[9px] font-semibold text-[#707070] ring-1 ring-[#e8e8ed]">
          {tn('planRequired')}
        </span>
      </button>
    )
  }

  return (
    <Link
      href={item.href}
      style={{ animationDelay: `${delay}ms` }}
      className="animate-stagger flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#e8e8ed] bg-white px-1.5 py-2 text-center transition-[border-color,transform] duration-150 hover:border-[#2997ff]/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
    >
      <span className="flex size-11 items-center justify-center rounded-[13px] bg-[#0071e3]/10">
        <Icon className="size-5 text-[#0071e3]" />
      </span>
      <span className="block w-full truncate text-[11px] font-medium leading-tight text-[#1d1d1f]">
        {t(item.labelKey)}
      </span>
      {/* Reserva la altura del badge para tiles bloqueados (misma altura de grid) */}
      <span className="block h-[15px]" aria-hidden="true" />
    </Link>
  )
}

/** Cerrar sesión desde el launcher. */
function SignOutRow() {
  const t = useTranslations('nav')
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        clearToken()
        router.push('/')
      }}
      className="flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-medium text-[#858585] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e53e3e] hover:bg-rose-50 hover:text-rose-500 active:bg-rose-100"
    >
      <LogOut className="size-5 shrink-0" />
      {t('signOut')}
    </button>
  )
}