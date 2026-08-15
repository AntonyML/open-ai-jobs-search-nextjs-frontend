import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Briefcase,
  Compass,
  BarChart3,
  Send,
  Mic,
  Sparkles,
  GraduationCap,
  User,
  Settings,
  Shield,
  Server,
  Cpu,
  CreditCard,
  Coins,
  Wallet,
  Users,
  Receipt,
  Wrench,
} from 'lucide-react'

export type NavIcon = ComponentType<{ className?: string }>

export interface SidebarState {
  hasBaseCv: boolean
  isAdminUser: boolean
  tier: string
}

export interface NavItem {
  labelKey: string
  descKey?: string
  href: string
  icon: NavIcon
  /** Solo se muestra para administradores. */
  adminOnly?: boolean
  /** Tier requerido para poder navegar. Si no se cumple, se muestra bloqueado. */
  requiredTier?: 'max'
  /** Bloqueo condicional adicional (recibe el estado de la app). */
  locked?: (state: SidebarState) => boolean
  lockedTooltipKey?: string
  lockedToastKey?: string
}

export interface ResolvedItem extends Omit<NavItem, 'locked'> {
  locked: boolean
  lockedTooltip?: string
  onLockedClick?: () => void
}

export interface NavSection {
  labelKey?: string
  items: NavItem[]
  /** Dibuja un separador antes de la sección. */
  separatorBefore?: boolean
}

export const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'principal',
    items: [
      { labelKey: 'dashboard', descKey: 'dashboardDesc', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    labelKey: 'documents',
    separatorBefore: true,
    items: [
      { labelKey: 'cvBuilder', descKey: 'cvBuilderDesc', href: '/cv-builder', icon: FileText },
      {
        labelKey: 'adaptCv',
        descKey: 'adaptCvDesc',
        href: '/cv-builder/adapt',
        icon: Briefcase,
        locked: (state) => !state.hasBaseCv,
        lockedTooltipKey: 'adaptCvLockedTooltip',
        lockedToastKey: 'adaptLockedToast',
      },
      { labelKey: 'myCvs', href: '/cv-builder/documents', icon: FolderOpen },
    ],
  },
  {
    labelKey: 'jobSearch',
    separatorBefore: true,
    items: [
      { labelKey: 'offers', descKey: 'offersDesc', href: '/search', icon: Compass, requiredTier: 'max' },
      { labelKey: 'rankings', descKey: 'rankingsDesc', href: '/rank', icon: BarChart3, requiredTier: 'max' },
      { labelKey: 'applications', descKey: 'applicationsDesc', href: '/apply', icon: Send, requiredTier: 'max' },
      { labelKey: 'interviews', descKey: 'interviewsDesc', href: '/interview', icon: Mic, requiredTier: 'max' },
      { labelKey: 'expand', descKey: 'expandDesc', href: '/expand', icon: Sparkles, requiredTier: 'max' },
      { labelKey: 'upskill', descKey: 'upskillDesc', href: '/upskill', icon: GraduationCap, requiredTier: 'max' },
    ],
  },
  {
    labelKey: 'account',
    separatorBefore: true,
    items: [
      { labelKey: 'profile', descKey: 'profileDesc', href: '/profile', icon: User },
      { labelKey: 'billing', descKey: 'billingDesc', href: '/billing', icon: Wallet },
      { labelKey: 'settings', descKey: 'settingsDesc', href: '/settings', icon: Settings },
    ],
  },
  {
    labelKey: 'admin',
    separatorBefore: true,
    items: [
      { labelKey: 'admin', descKey: 'adminDesc', href: '/admin', icon: Shield, adminOnly: true },
      { labelKey: 'adminUsers', descKey: 'adminUsersDesc', href: '/admin/users', icon: Users, adminOnly: true },
      { labelKey: 'adminPlans', descKey: 'adminPlansDesc', href: '/admin/plans', icon: CreditCard, adminOnly: true },
      { labelKey: 'adminCredits', descKey: 'adminCreditsDesc', href: '/admin/credits', icon: Coins, adminOnly: true },
      { labelKey: 'adminBilling', descKey: 'adminBillingDesc', href: '/admin/billing', icon: Receipt, adminOnly: true },
      { labelKey: 'adminProviders', descKey: 'adminProvidersDesc', href: '/admin/providers', icon: Server, adminOnly: true },
      { labelKey: 'llmControl', descKey: 'llmControlDesc', href: '/admin/llm-control', icon: Cpu, adminOnly: true },
      { labelKey: 'adminSystem', descKey: 'adminSystemDesc', href: '/admin/system', icon: Wrench, adminOnly: true },
    ],
  },
]

export function isItemLocked(item: NavItem, state: SidebarState): boolean {
  if (item.requiredTier && state.tier !== item.requiredTier) return true
  return item.locked?.(state) ?? false
}

/**
 * Requisito de acceso de una ruta: qué plan (o rol) exige para navegarla.
 * Se deriva de la MISMA config del menú (fuente única de verdad), más las
 * rutas que existen pero no se listan en el sidebar.
 */
export interface RouteRequirement {
  tier?: 'max'
  adminOnly?: boolean
}

/** Rutas existentes que no aparecen en el menú lateral pero igual son del pipeline Max. */
const EXTRA_ROUTE_REQUIREMENTS: Record<string, RouteRequirement> = {
  '/outcome': { tier: 'max' },
  '/analytics': { tier: 'max' },
}

/** Quita el prefijo de locale (/es/search → /search) si usePathname lo incluye. */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/'
}

export function getRouteRequirement(pathname: string): RouteRequirement | null {
  const clean = stripLocale(pathname)
  // El match más específico (href más largo) gana, igual que en el sidebar.
  const match = NAV_SECTIONS
    .flatMap((section) => section.items)
    .filter((item) => isItemActive(item, clean))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (!match) return EXTRA_ROUTE_REQUIREMENTS[clean] ?? null
  const requirement: RouteRequirement = {
    ...(match.requiredTier ? { tier: match.requiredTier } : {}),
    ...(match.adminOnly ? { adminOnly: true } : {}),
  }
  // Sin requisito (p. ej. /cv-builder/adapt, /profile) → null, no un objeto vacío.
  return requirement.tier || requirement.adminOnly ? requirement : null
}

/** True si el pathname corresponde al ítem o a cualquiera de sus rutas hijas. */
export function isItemActive(item: Pick<NavItem, 'href'>, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
