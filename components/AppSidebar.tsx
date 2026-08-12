'use client'

import { useEffect, useState } from 'react'
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
  FolderOpen,
  Briefcase,
  Search,
  BarChart3,
  Send,
  Mic,
  TrendingUp,
  User,
  Settings,
  CreditCard,
  LogOut,
  Lock,
} from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { clearToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { showWarning } from '@/lib/toasts'

interface SidebarLink {
  labelKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const principal: SidebarLink[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
]

const documents: SidebarLink[] = [
  { labelKey: 'cvBuilder', href: '/cv-builder', icon: FileText },
  { labelKey: 'myCvs', href: '/cv-builder/documents', icon: FolderOpen },
]

const adaptCvLink: SidebarLink = {
  labelKey: 'adaptCv',
  href: '/cv-builder/adapt',
  icon: Briefcase,
}

const pipeline: SidebarLink[] = [
  { labelKey: 'offers', href: '/scrape', icon: Search },
  { labelKey: 'rankings', href: '/rank', icon: BarChart3 },
  { labelKey: 'applications', href: '/apply', icon: Send },
  { labelKey: 'interviews', href: '/interview', icon: Mic },
  { labelKey: 'upskill', href: '/upskill', icon: TrendingUp },
]

const account: SidebarLink[] = [
  { labelKey: 'profile', href: '/profile', icon: User },
  { labelKey: 'settings', href: '/settings', icon: Settings },
  { labelKey: 'providers', href: '/providers', icon: CreditCard },
]

function SidebarLinkItem({
  link,
  pathname,
  locked,
  onLockedClick,
}: {
  link: SidebarLink
  pathname: string
  locked?: boolean
  onLockedClick?: () => void
}) {
  const t = useTranslations('appSidebar')
  const isActive = pathname === link.href || pathname.endsWith(`${link.href}`)
  const Icon = link.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={locked ? undefined : <Link href={link.href} />}
        isActive={locked ? false : isActive}
        tooltip={locked ? t('adaptCvLockedTooltip') : t(link.labelKey)}
        onClick={locked ? onLockedClick : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <span className="text-sm">{t(link.labelKey)}</span>
          {locked && <Lock className="ml-auto size-3.5 text-[#b0b0b0]" aria-label={t('adaptCvLockedTooltip')} />}
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
  const t = useTranslations('appSidebar')
  const pathname = usePathname()
  const [hasBaseCv, setHasBaseCv] = useState<boolean | null>(null)

  // The "Adapt CV to a job offer" entry is only unlocked once a base CV
  // has been generated (Regla 4). Re-check on mount, on route change, and
  // when the window regains focus so it unlocks right after generation.
  useEffect(() => {
    let cancelled = false
    async function check() {
      const cvs = await apiFetch<Array<{ cv_type: string }>>('/api/v1/cv/').catch(() => [])
      if (!cancelled) setHasBaseCv(Array.isArray(cvs) && cvs.some((c) => c.cv_type === 'base'))
    }
    check()
    const onFocus = () => check()
    // Instant refresh: pages that generate a base CV dispatch this event
    // right after a successful generation, so we don't wait for focus/nav.
    const onBaseGenerated = () => check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('cv:base-generated', onBaseGenerated)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('cv:base-generated', onBaseGenerated)
    }
  }, [pathname])

  // Treat the unknown (still loading) state as locked so the item never
  // flashes as available before we know a base CV exists.
  const adaptLocked = hasBaseCv !== true
  const handleAdaptLocked = () => {
    if (adaptLocked) showWarning(t('adaptLockedToast'))
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
        <SidebarGroupSection labelKey="principal" links={principal} pathname={pathname} />
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>{t('documents')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documents.map((link) => (
                <SidebarLinkItem key={link.href} link={link} pathname={pathname} />
              ))}
              <SidebarLinkItem
                link={adaptCvLink}
                pathname={pathname}
                locked={adaptLocked}
                onLockedClick={handleAdaptLocked}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroupSection labelKey="pipeline" links={pipeline} pathname={pathname} />
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
