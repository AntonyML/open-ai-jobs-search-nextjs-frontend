'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { FileText, LogOut } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'
import { showWarning } from '@/lib/toasts'
import {
  NAV_SECTIONS,
  isItemLocked,
  type NavItem,
  type ResolvedItem,
} from '@/components/navigation/sidebar-config'
import { useSidebarState } from '@/components/navigation/sidebar-state'
import { SidebarGroupSection } from '@/components/navigation/SidebarGroupSection'
import CreditWidget from '@/components/CreditWidget'
import PurchaseModal from '@/components/PurchaseModal'

function SignOutButton() {
  const t = useTranslations('nav')
  const router = useRouter()
  return (
    <SidebarMenuButton
      onClick={() => {
        clearToken()
        router.push('/')
      }}
      tooltip={t('signOut')}
      className="text-[#858585] hover:text-rose-500"
    >
      <div className="flex items-center gap-2">
        <LogOut className="size-4" />
        <span className="text-sm">{t('signOut')}</span>
      </div>
    </SidebarMenuButton>
  )
}

export default function AppSidebar() {
  const t = useTranslations('appSidebar')
  const pathname = usePathname()
  const state = useSidebarState()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const resolveItem = (item: NavItem): ResolvedItem => {
    if (!isItemLocked(item, state)) return { ...item, locked: false }
    if (item.requiredTier) {
      return {
        ...item,
        locked: true,
        lockedTooltip: t('premiumLockedTooltip'),
        onLockedClick: () => setShowUpgrade(true),
      }
    }
    return {
      ...item,
      locked: true,
      lockedTooltip: item.lockedTooltipKey ? t(item.lockedTooltipKey) : t(item.labelKey),
      onLockedClick: item.lockedToastKey ? () => showWarning(t(item.lockedToastKey!)) : undefined,
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-sidebar-foreground transition-opacity hover:opacity-70"
        >
          <FileText className="size-4 text-[#0071e3]" />
          Open Ai Jobs Search
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <CreditWidget />
        {NAV_SECTIONS.map((section) => {
          const items = section.items
            .filter((item) => !item.adminOnly || state.isAdminUser)
            .map(resolveItem)
          if (items.length === 0) return null
          return (
            <SidebarGroupSection
              key={section.labelKey ?? section.items[0].href}
              labelKey={section.labelKey}
              items={items}
              pathname={pathname}
              separatorBefore={section.separatorBefore}
            />
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SignOutButton />
        </SidebarMenu>
      </SidebarFooter>

      <PurchaseModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </Sidebar>
  )
}
