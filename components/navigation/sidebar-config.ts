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
      { labelKey: 'cvBuilder', href: '/cv-builder', icon: FileText },
      { labelKey: 'myCvs', href: '/cv-builder/documents', icon: FolderOpen },
      {
        labelKey: 'adaptCv',
        descKey: 'adaptCvDesc',
        href: '/cv-builder/adapt',
        icon: Briefcase,
        locked: (state) => !state.hasBaseCv,
        lockedTooltipKey: 'adaptCvLockedTooltip',
        lockedToastKey: 'adaptLockedToast',
      },
    ],
  },
  {
    labelKey: 'jobSearch',
    separatorBefore: true,
    items: [
      { labelKey: 'offers', descKey: 'offersDesc', href: '/scrape', icon: Compass, requiredTier: 'max' },
      { labelKey: 'rankings', descKey: 'rankingsDesc', href: '/rank', icon: BarChart3, requiredTier: 'max' },
      { labelKey: 'applications', descKey: 'applicationsDesc', href: '/apply', icon: Send, requiredTier: 'max' },
      { labelKey: 'interviews', descKey: 'interviewsDesc', href: '/interview', icon: Mic, requiredTier: 'max' },
      { labelKey: 'expand', descKey: 'expandDesc', href: '/pipeline/expand', icon: Sparkles, requiredTier: 'max' },
      { labelKey: 'upskill', descKey: 'upskillDesc', href: '/pipeline/upskill', icon: GraduationCap, requiredTier: 'max' },
    ],
  },
  {
    labelKey: 'account',
    separatorBefore: true,
    items: [
      { labelKey: 'profile', href: '/profile', icon: User },
      { labelKey: 'settings', href: '/settings', icon: Settings },
    ],
  },
  {
    labelKey: 'admin',
    separatorBefore: true,
    items: [
      { labelKey: 'admin', href: '/admin', icon: Shield, adminOnly: true },
      { labelKey: 'adminPlans', descKey: 'adminPlansDesc', href: '/admin/plans', icon: CreditCard, adminOnly: true },
      { labelKey: 'adminCredits', descKey: 'adminCreditsDesc', href: '/admin/credits', icon: Coins, adminOnly: true },
      { labelKey: 'adminProviders', descKey: 'adminProvidersDesc', href: '/admin/providers', icon: Server, adminOnly: true },
      { labelKey: 'llmControl', descKey: 'llmControlDesc', href: '/admin/llm-control', icon: Cpu, adminOnly: true },
    ],
  },
]

export function isItemLocked(item: NavItem, state: SidebarState): boolean {
  if (item.requiredTier && state.tier !== item.requiredTier) return true
  return item.locked?.(state) ?? false
}

/** True si el pathname corresponde al ítem o a cualquiera de sus rutas hijas. */
export function isItemActive(item: Pick<NavItem, 'href'>, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
