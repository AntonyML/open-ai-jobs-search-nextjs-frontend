'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { ResolvedItem } from './sidebar-config'

interface SidebarLinkItemProps {
  item: ResolvedItem
  isActive: boolean
}

export function SidebarLinkItem({ item, isActive }: SidebarLinkItemProps) {
  const t = useTranslations('appSidebar')
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={item.locked ? undefined : <Link href={item.href} />}
        isActive={item.locked ? false : isActive}
        tooltip={item.locked ? item.lockedTooltip : t(item.labelKey)}
        onClick={item.locked ? item.onLockedClick : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm">{t(item.labelKey)}</span>
            {item.descKey && (
              <span className="truncate text-xs text-muted-foreground">{t(item.descKey)}</span>
            )}
          </div>
          {item.locked && (
            <Lock className="ml-auto size-3.5 shrink-0 text-[#b0b0b0]" aria-label={item.lockedTooltip} />
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
