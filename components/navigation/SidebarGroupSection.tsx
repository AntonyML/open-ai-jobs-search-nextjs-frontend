'use client'

import { useTranslations } from 'next-intl'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { isItemActive, type ResolvedItem } from './sidebar-config'
import { SidebarLinkItem } from './SidebarLinkItem'

interface SidebarGroupSectionProps {
  labelKey?: string
  items: ResolvedItem[]
  pathname: string
  separatorBefore?: boolean
}

export function SidebarGroupSection({
  labelKey,
  items,
  pathname,
  separatorBefore = false,
}: SidebarGroupSectionProps) {
  const t = useTranslations('appSidebar')

  // El ítem activo es el match más específico dentro de la sección para
  // evitar que padre e hijo se iluminen a la vez (p. ej. /cv-builder).
  const active = items
    .filter((item) => !item.locked && isItemActive(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <>
      {separatorBefore && <SidebarSeparator />}
      <SidebarGroup>
        {labelKey && <SidebarGroupLabel>{t(labelKey)}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarLinkItem key={item.href} item={item} isActive={active?.href === item.href} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
