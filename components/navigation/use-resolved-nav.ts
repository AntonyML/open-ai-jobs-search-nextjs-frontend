'use client'

import { useTranslations } from 'next-intl'
import { showWarning } from '@/lib/toasts'
import {
  NAV_SECTIONS,
  isItemLocked,
  type NavItem,
  type ResolvedItem,
  type SidebarState,
} from './sidebar-config'
import { useSidebarState } from './sidebar-state'

/** Sección de navegación ya resuelta (filtrada por rol y con estado de bloqueo). */
export interface ResolvedSection {
  labelKey?: string
  separatorBefore?: boolean
  items: ResolvedItem[]
}

/**
 * Fuente única para la navegación autenticada: aplica permisos/plan/rol sobre
 * `NAV_SECTIONS` y produce los mismos ítems resueltos (con `locked`,
 * `lockedTooltip` y `onLockedClick`) que consumen el sidebar de escritorio y el
 * launcher móvil. La UI nunca implementa reglas de negocio: solo consume el estado.
 */
export function useResolvedNav(): { sections: ResolvedSection[]; state: SidebarState } {
  const t = useTranslations('appSidebar')
  const state = useSidebarState()

  const resolveItem = (item: NavItem): ResolvedItem => {
    if (!isItemLocked(item, state)) return { ...item, locked: false }
    if (item.requiredTier) {
      return {
        ...item,
        locked: true,
        lockedTooltip: t('maxLockedTooltip'),
        onLockedClick: () =>
          window.dispatchEvent(new CustomEvent('purchase:required', { detail: { status: 403 } })),
      }
    }
    return {
      ...item,
      locked: true,
      lockedTooltip: item.lockedTooltipKey ? t(item.lockedTooltipKey) : t(item.labelKey),
      onLockedClick: item.lockedToastKey
        ? () => showWarning(t(item.lockedToastKey!))
        : undefined,
    }
  }

  const sections: ResolvedSection[] = NAV_SECTIONS.map((section) => {
    const items = section.items
      .filter((item) => !item.adminOnly || state.isAdminUser)
      .map(resolveItem)
    return {
      labelKey: section.labelKey,
      separatorBefore: section.separatorBefore,
      items,
    }
  }).filter((section) => section.items.length > 0)

  return { sections, state }
}