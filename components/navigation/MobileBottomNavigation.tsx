'use client'

import Link from 'next/link'
import { usePathname, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  Briefcase,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Lock,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useResolvedNav } from './use-resolved-nav'
import { useMobileNavigation } from './MobileNavigationProvider'
import { clearToken } from '@/lib/auth'
import { stripLocale } from './sidebar-config'
import { cn } from '@/lib/utils'

/**
 * Bottom Navigation Bar — navegación primaria móvil del layout autenticado.
 *
 * 7 celdas fijas (robustas, no dependen del estado resuelto para existir):
 *
 *   Panel | Tienda | Documentos | [● Apps] | Empleos | Cuenta | Salir
 *
 * - Panel navega al dashboard.
 * - Tienda navega a /billing (planes y créditos).
 * - Documentos / Empleos / Cuenta abren el App Launcher POSICIONADO en su
 *   sección (el launcher sigue siendo la casa de todas las aplicaciones).
 * - El botón central abre el launcher general.
 * - Salir cierra sesión directamente.
 *
 * Los rangos de "activo" derivan de las mismas secciones de NAV_SECTIONS
 * (no se duplican rutas: son prefijos de las secciones existentes) y la ola
 * se desliza a la celda actual, incluso en rutas sin tab propio. Desktop y
 * marketing no la ven (md:hidden, provider solo montado en el layout
 * autenticado).
 */

type TabKey = 'dashboard' | 'store' | 'documents' | 'jobSearch' | 'account' | 'signout'

interface TabConfig {
  key: TabKey
  labelKey: string
  /** Namespace i18n del label (appSidebar reusa los labels de sección). */
  ns: 'appSidebar' | 'appNav'
  icon: LucideIcon
  /** Para tabs de tipo "link": ruta destino. */
  href?: string
}

/**
 * Celdas de la barra en orden visual (la celda central 3 es el FAB).
 * 6 celdas de tabs + 1 FAB = 7 celdas totales.
 */
const TABS: TabConfig[] = [
  { key: 'dashboard', labelKey: 'dashboard', ns: 'appSidebar', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'store', labelKey: 'store', ns: 'appSidebar', icon: Store, href: '/billing' },
  { key: 'documents', labelKey: 'documents', ns: 'appSidebar', icon: FolderOpen },
  { key: 'jobSearch', labelKey: 'jobsShort', ns: 'appSidebar', icon: Briefcase },
  { key: 'account', labelKey: 'account', ns: 'appSidebar', icon: UserRound },
  { key: 'signout', labelKey: 'signOutTab', ns: 'appNav', icon: LogOut },
]

/** Secciones del launcher a las que llevan los tabs de la barra. */
const SECTION_KEYS: Partial<Record<TabKey, string>> = {
  documents: 'documents',
  jobSearch: 'jobSearch',
  account: 'account',
}

/** Prefijos de ruta (de NAV_SECTIONS) que marcan cada tab como activo. */
const ACTIVE_PREFIXES: Record<TabKey, string[]> = {
  dashboard: ['/dashboard'],
  store: ['/billing'],
  documents: ['/cv-builder'],
  jobSearch: ['/search', '/rank', '/apply', '/interview', '/expand', '/upskill', '/analytics', '/outcome'],
  account: ['/profile', '/settings'],
  signout: [],
}

function isTabActive(key: TabKey, pathname: string): boolean {
  return ACTIVE_PREFIXES[key].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function MobileBottomNavigation() {
  const tn = useTranslations('appNav')
  const router = useRouter()
  const { sections } = useResolvedNav()
  const { launcherOpen, openLauncher, closeLauncher } = useMobileNavigation()
  const pathname = stripLocale(usePathname())

  // Índice del FAB en el orden visual: 3 (después de dashboard, tienda, documents).
  const FAB_INDEX = 3

  // Celda visual (0..6; la celda 3 es el FAB) del tab activo, o -1.
  const activeIndex = TABS.findIndex((tab) => isTabActive(tab.key, pathname))
  const activeCell = activeIndex >= 0 ? (activeIndex < FAB_INDEX ? activeIndex : activeIndex + 1) : -1

  // Señal visual de la sección Empleos cuando está bloqueada por plan
  // (el tab sigue abriendo el launcher: los locks viven ahí).
  const jobSearchLocked = sections
    .find((section) => section.labelKey === 'jobSearch')
    ?.items.some((item) => item.locked)

  return (
    <nav
      aria-label={tn('bottomNav')}
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-3 mb-2 flex h-16 items-stretch rounded-[28px] border border-white/50 bg-[rgba(255,255,255,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150">
        {/* Ola del tab activo: se desliza entre celdas con spring-like. Al llegar
            a la celda re-remonta (key) el morph de llegada (wave-arrive). */}
        <div
          key={activeCell}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-3 bottom-0 left-0 w-1/7 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
            activeCell === -1 && 'opacity-0',
          )}
          style={{ transform: `translateX(${Math.max(activeCell, 0) * 100}%)` }}
        >
          <div className="wave-arrive mx-1 h-full">
            <div className="wave-blob h-full bg-gradient-to-b from-[#0071e3]/16 to-[#2997ff]/[0.06] shadow-[0_10px_28px_rgba(0,113,227,0.22)]" />
          </div>
        </div>

        <Tab
          config={TABS[0]}
          active={isTabActive('dashboard', pathname)}
          render="link"
        />
        <Tab
          config={TABS[1]}
          active={isTabActive('store', pathname)}
          render="link"
        />
        <Tab
          config={TABS[2]}
          active={isTabActive('documents', pathname)}
          render="section"
        />

        {/* Celda central: botón de aplicaciones */}
        <div className="relative z-10 flex w-1/7 items-center justify-center">
          <button
            type="button"
            onClick={launcherOpen ? closeLauncher : openLauncher}
            aria-expanded={launcherOpen}
            aria-haspopup="dialog"
            aria-label={tn('openApps')}
            className={cn(
              'absolute -top-6 isolate flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-[#0071e3] to-[#0057c2] text-white ring-4 ring-white/80 transition-[transform,box-shadow] duration-300 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]',
              launcherOpen
                ? 'shadow-[0_18px_40px_rgba(0,113,227,0.6)]'
                : 'shadow-[0_10px_24px_rgba(0,113,227,0.35)]',
            )}
          >
            {/* Halo del FAB: pulso del launcher abierto (continuidad visual FAB → launcher) */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute -inset-1.5 -z-10 rounded-full bg-[#0071e3]/35 blur-xl transition-opacity duration-300 ease-out',
                launcherOpen ? 'opacity-100' : 'opacity-0',
              )}
            />
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

        <Tab
          config={TABS[3]}
          active={isTabActive('jobSearch', pathname)}
          locked={jobSearchLocked}
          render="section"
        />
        <Tab
          config={TABS[4]}
          active={isTabActive('account', pathname)}
          render="section"
        />
        <Tab
          config={TABS[5]}
          active={false}
          render="signout"
          onSignOut={() => {
            clearToken()
            router.push('/')
          }}
        />
      </div>
    </nav>
  )
}

interface TabProps {
  config: TabConfig
  active: boolean
  locked?: boolean
  render: 'link' | 'section' | 'signout'
  onSignOut?: () => void
}

/** Una celda de la barra (siempre visible; el contenido varía por tipo). */
function Tab({ config, active, locked = false, render, onSignOut }: TabProps) {
  const tApp = useTranslations('appSidebar')
  const tn = useTranslations('appNav')
  const { openLauncherSection } = useMobileNavigation()
  const label = config.ns === 'appSidebar' ? tApp(config.labelKey) : tn(config.labelKey)
  const Icon = config.icon

  const cellClass =
    'relative z-10 flex w-1/7 flex-col items-center justify-center gap-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]'
  const iconClass = cn(
    'size-[22px] transition-[transform,filter,color] duration-300 ease-out',
    active
      ? '-translate-y-1 scale-110 text-[#0071e3] drop-shadow-[0_2px_6px_rgba(0,113,227,0.4)]'
      : 'text-[#8e8e93]',
    locked && 'text-[#b0b0b0]',
    render === 'signout' && 'text-[#8e8e93]',
  )
  const labelClass = cn(
    'block max-w-full truncate text-[10px] leading-none transition-colors duration-300',
    active ? 'font-semibold text-[#0071e3]' : 'font-medium text-[#8e8e93]',
    render === 'signout' && 'text-[#8e8e93]',
  )

  if (render === 'link') {
    return (
      <Link
        href={config.href ?? '/dashboard'}
        aria-current={active ? 'page' : undefined}
        className={cn(cellClass, 'transition-transform duration-150 active:scale-90')}
      >
        <Icon className={iconClass} />
        <span className={labelClass}>{label}</span>
      </Link>
    )
  }

  if (render === 'section') {
    const section = SECTION_KEYS[config.key]
    return (
      <button
        type="button"
        onClick={() => section && openLauncherSection(section)}
        aria-label={tn('openSection', { section: label })}
        aria-haspopup="dialog"
        aria-expanded={false}
        className={cn(cellClass, 'transition-transform duration-150 active:scale-90')}
      >
        <span className="relative flex items-center justify-center">
          <Icon className={iconClass} />
          {locked && (
            <Lock aria-hidden="true" className="absolute -right-2.5 -top-1 size-3 text-[#858585]" />
          )}
        </span>
        <span className={labelClass}>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      aria-label={label}
      className={cn(cellClass, 'transition-transform duration-150 active:scale-90')}
    >
      <Icon className={iconClass} />
      <span className={labelClass}>{label}</span>
    </button>
  )
}
