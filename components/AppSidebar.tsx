'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  FileText,
  Search,
  BarChart3,
  Mic,
  TrendingUp,
  User,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'

interface SidebarLink {
  labelKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const principal: SidebarLink[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'cvBuilder', href: '/cv-builder', icon: FileText },
]

const optional: SidebarLink[] = [
  { labelKey: 'search', href: '/scrape', icon: Search },
  { labelKey: 'rank', href: '/rank', icon: BarChart3 },
  { labelKey: 'interview', href: '/interview', icon: Mic },
  { labelKey: 'upskill', href: '/upskill', icon: TrendingUp },
]

const account: SidebarLink[] = [
  { labelKey: 'profile', href: '/profile', icon: User },
  { labelKey: 'settings', href: '/settings', icon: Settings },
  { labelKey: 'providers', href: '/providers', icon: CreditCard },
]

function SidebarLinkItem({ link, pathname }: { link: SidebarLink; pathname: string }) {
  const t = useTranslations('appSidebar')
  const isActive = pathname === link.href || pathname.endsWith(`${link.href}`)
  const Icon = link.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={link.href} />}
        isActive={isActive}
        tooltip={t(link.labelKey)}
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <span className="text-sm">{t(link.labelKey)}</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarGroupSection({
  labelKey,
  links,
  pathname,
}: {
  labelKey: string
  links: SidebarLink[]
  pathname: string
}) {
  const t = useTranslations('appSidebar')
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t(labelKey)}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarLinkItem key={link.href} link={link} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

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
  const pathname = usePathname()

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
        <SidebarGroupSection labelKey="principal" links={principal} pathname={pathname} />
        <SidebarSeparator />
        <SidebarGroupSection labelKey="optional" links={optional} pathname={pathname} />
        <SidebarSeparator />
        <SidebarGroupSection labelKey="account" links={account} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SignOutButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
