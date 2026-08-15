'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * Admin section layout: a tab bar over the admin pages (plan.md §3).
 * Each tab maps to one responsibility — Panel, Usuarios, Planes,
 * Créditos, Billing, Proveedor IA, Control LLM, Sistema.
 */
const ADMIN_TABS = [
  { href: '/admin', key: 'panel' },
  { href: '/admin/users', key: 'users' },
  { href: '/admin/plans', key: 'plans' },
  { href: '/admin/billing', key: 'billing' },
  { href: '/admin/providers', key: 'providers' },
  { href: '/admin/llm-control', key: 'llm' },
  { href: '/admin/system', key: 'system' },
] as const

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('adminTabs')
  const pathname = usePathname()
  // usePathname() (next/navigation) includes the locale prefix (/es/admin → /es/admin/users).
  const clean = pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/'

  return (
    <div className="space-y-6">
      <nav
        aria-label={t('label')}
        className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-[#d2d2d7]/60 bg-white p-1.5 shadow-sm"
      >
        {ADMIN_TABS.map((tab) => {
          const active =
            clean === tab.href ||
            (tab.href !== '/admin' && clean.startsWith(`${tab.href}/`))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'text-[#474747] hover:bg-[#f5f5f7]'
              }`}
            >
              {t(tab.key)}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
