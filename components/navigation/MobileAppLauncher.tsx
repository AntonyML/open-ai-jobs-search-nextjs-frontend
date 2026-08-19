'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderOpen,
  LayoutDashboard,
  Lock,
  LogOut,
  Shield,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useResolvedNav, type ResolvedSection } from './use-resolved-nav'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'
import Logo from '@/components/Logo'
import type { ResolvedItem } from './sidebar-config'

/** Secciones que se presentan como "carpeta" (agrupación de funcionalidades). */
const FOLDER_SECTIONS: Record<string, LucideIcon> = {
  documents: FolderOpen,
  jobSearch: Compass,
  account: UserRound,
  admin: Shield,
}

export function MobileAppLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('appSidebar')
  const tn = useTranslations('appNav')
  const { sections } = useResolvedNav()

  const [folderLabelKey, setFolderLabelKey] = useState<string | null>(null)
  const [folderItems, setFolderItems] = useState<ResolvedItem[]>([])
  const folderTriggerRef = useRef<HTMLButtonElement | null>(null)
  const backRef = useRef<HTMLButtonElement | null>(null)

  // Al cerrar el launcher se vuelve a la raíz de aplicaciones.
  useEffect(() => {
    if (!open) {
      setFolderLabelKey(null)
      setFolderItems([])
    }
  }, [open])

  // Al abrir una carpeta el foco va al botón "volver"; al cerrarla regresa al trigger.
  useEffect(() => {
    if (folderLabelKey) backRef.current?.focus()
  }, [folderLabelKey])

  const openFolder = (section: ResolvedSection) => {
    setFolderItems(section.items)
    setFolderLabelKey(section.labelKey ?? null)
  }

  const closeFolder = () => {
    setFolderItems([])
    setFolderLabelKey(null)
    folderTriggerRef.current?.focus()
  }

  const folderSections = sections.filter((section) => section.labelKey && FOLDER_SECTIONS[section.labelKey])
  const dashboardItem = sections.find((section) => section.labelKey === 'principal')?.items[0]

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 bg-white p-0 text-[#1d1d1f] sm:max-w-sm"
      >
        <SheetTitle className="sr-only">{tn('title')}</SheetTitle>
        <SheetDescription className="sr-only">{tn('greeting')}</SheetDescription>

        {/* Cabecera contextual: launcher ⇄ carpeta */}
        <div className="flex items-center justify-between gap-2 border-b border-[#d2d2d7]/60 px-4 py-3">
          {folderLabelKey ? (
            <button
              ref={backRef}
              type="button"
              onClick={closeFolder}
              className="inline-flex min-h-11 items-center gap-0.5 rounded-full px-1 text-[15px] font-medium text-[#0071e3] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
            >
              <ChevronLeft className="size-5" />
              {t(folderLabelKey)}
            </button>
          ) : (
            <div className="flex min-h-11 items-center gap-2.5 py-1">
              <Logo size={28} showIconOnly={true} />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[#1d1d1f]">CVMeld</p>
                <p className="mt-0.5 text-xs text-[#707070]">{tn('greeting')}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={tn('closeLauncher')}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Contenido: carpetas o panel de la carpeta abierta */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {folderLabelKey ? (
            <div key={folderLabelKey} className="animate-launcher-enter space-y-1">
              <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#707070]">
                {t(folderLabelKey)}
              </h2>
              {folderItems.map((item) => (
                <FolderRow key={item.href} item={item} />
              ))}
            </div>
          ) : (
            <div className="animate-launcher-enter space-y-6">
              {dashboardItem && (
                <Link
                  href={dashboardItem.href}
                  className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0056b8] p-5 text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] active:scale-[0.98]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <LayoutDashboard className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold tracking-tight">
                      {t('dashboard')}
                    </span>
                    <span className="mt-0.5 block text-sm text-white/80">{t('dashboardDesc')}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-white/70" />
                </Link>
              )}

              <section aria-labelledby="launcher-apps-heading">
                <h2
                  id="launcher-apps-heading"
                  className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#707070]"
                >
                  {tn('sections')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {folderSections.map((section) => {
                    const Icon = FOLDER_SECTIONS[section.labelKey!]
                    return (
                      <button
                        key={section.labelKey}
                        type="button"
                        ref={section.labelKey === folderLabelKey ? folderTriggerRef : undefined}
                        onClick={() => openFolder(section)}
                        aria-haspopup="dialog"
                        aria-expanded="false"
                        className="group flex min-h-24 flex-col items-start justify-between rounded-2xl border border-[#d2d2d7]/60 bg-white p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:border-[#2997ff]/40 active:scale-[0.98]"
                      >
                        <span className="flex w-full items-center justify-between">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                            <Icon className="size-4.5" />
                          </span>
                          <ChevronRight className="size-4 text-[#b0b0b0] transition-transform group-hover:translate-x-0.5" />
                        </span>
                        <span className="mt-3 min-w-0">
                          <span className="block text-[15px] font-medium text-[#1d1d1f] leading-tight">
                            {t(section.labelKey!)}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#707070]">
                            {tn('itemCount', { count: section.items.length })}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#d2d2d7]/60 px-4 py-3">
          <SignOutRow />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Fila de una funcionalidad dentro de una carpeta. */
function FolderRow({ item }: { item: ResolvedItem }) {
  const t = useTranslations('appSidebar')
  const tn = useTranslations('appNav')
  const Icon = item.icon

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={item.onLockedClick}
        aria-label={`${t(item.labelKey)}, ${item.lockedTooltip}`}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
      >
        <Icon className="size-5 shrink-0 text-[#b0b0b0]" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[15px] font-medium text-[#707070]">{t(item.labelKey)}</span>
          {item.descKey && (
            <span className="mt-0.5 block truncate text-xs text-[#a0a0a0]">{t(item.descKey)}</span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] font-semibold text-[#707070] ring-1 ring-[#e8e8ed]">
          <Lock className="size-3" />
          {tn('planRequired')}
        </span>
      </button>
    )
  }

  return (
    <Link
      href={item.href}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
    >
      <Icon className="size-5 shrink-0 text-[#0071e3]" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[15px] font-medium text-[#1d1d1f]">{t(item.labelKey)}</span>
        {item.descKey && (
          <span className="mt-0.5 block truncate text-xs text-[#707070]">{t(item.descKey)}</span>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-[#b0b0b0]" />
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