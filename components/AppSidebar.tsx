'use client'

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
import { LogOut } from 'lucide-react'
import Logo from '@/components/Logo'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'
import { stripLocale } from '@/components/navigation/sidebar-config'
import { useResolvedNav } from '@/components/navigation/use-resolved-nav'
import { SidebarGroupSection } from '@/components/navigation/SidebarGroupSection'
import CreditWidget from '@/components/CreditWidget'

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
  const pathname = stripLocale(usePathname())
  const { sections } = useResolvedNav()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-sidebar-foreground transition-opacity hover:opacity-80"
        >
          <Logo size={28} showIconOnly={false} showBackground={false} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <CreditWidget />
        {sections.map((section) => (
          <SidebarGroupSection
            key={section.labelKey ?? section.items[0].href}
            labelKey={section.labelKey}
            items={section.items}
            pathname={pathname}
            separatorBefore={section.separatorBefore}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SignOutButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
