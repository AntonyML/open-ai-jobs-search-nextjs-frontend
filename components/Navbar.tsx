'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { isLoggedIn, clearToken, isAdmin, AUTH_CHANGED } from '@/lib/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getBillingStatus } from '@/lib/billing'

const NotificationBell = dynamic(
  () => import('@/components/NotificationBell'),
  {
    ssr: false,
    loading: () => <div className="h-8 w-8" />,
  },
)

// ── Credit chip (plan + balance) ───────────────────────────────────

function NavbarCreditChip() {
  const [info, setInfo] = useState<{ plan: string; credits: number } | null>(null)

  useEffect(() => {
    const load = () =>
      getBillingStatus()
        .then((s) => setInfo({ plan: s.plan_name ?? s.plan_key ?? 'Free', credits: s.credits_balance }))
        .catch(() => {})
    load()
    window.addEventListener('billing:updated', load)
    return () => window.removeEventListener('billing:updated', load)
  }, [])

  if (!info) return null
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('purchase:required', { detail: { status: 402 } }))}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3]/30 hover:text-[#0071e3]"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
      </svg>
      <span className="max-w-[110px] truncate">{info.plan}</span>
      <span className="text-[#858585]">·</span>
      <span className="text-[#707070]">{info.credits}</span>
    </button>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────

function NavLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-[#707070] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] ${className}`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition-all text-[#707070] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] ${className}`}
    >
      {children}
    </Link>
  )
}

function MarketingLinks({ t }: { t: (key: string) => string }) {
  const links = [
    { label: t('footer.features'), href: '/#features' },
    { label: t('footer.about'), href: '/about' },
    { label: t('footer.limits'), href: '/limits' },
  ]
  return (
    <>
      {links.map((link) => (
        <NavLink key={link.href} href={link.href}>
          {link.label}
        </NavLink>
      ))}
    </>
  )
}

function MobileMarketingLinks({ t }: { t: (key: string) => string }) {
  const links = [
    { label: t('footer.features'), href: '/#features' },
    { label: t('footer.about'), href: '/about' },
    { label: t('footer.limits'), href: '/limits' },
  ]
  return (
    <>
      {links.map((link) => (
        <MobileNavLink key={link.href} href={link.href}>
          {link.label}
        </MobileNavLink>
      ))}
    </>
  )
}

function LoggedInNav({ t }: { t: (key: string) => string }) {
  const router = useRouter()

  return (            <>
              <NotificationBell />
              <NavLink href="/dashboard">{t('nav.dashboard')}</NavLink>
      {isAdmin() && (
        <NavLink href="/admin" className="text-amber-600 hover:bg-amber-50 hover:text-amber-700">
          <span className="mr-1 inline-flex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          {t('nav.admin')}
        </NavLink>
      )}
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3]/30 hover:text-[#0071e3]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {t('nav.profile')}
      </Link>
      <button
        onClick={() => { clearToken(); router.push('/') }}
        data-cuelume-press
        className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#858585] transition-all hover:bg-rose-50 hover:text-rose-500"
      >
        {t('nav.signOut')}
      </button>
    </>
  )
}

function LoggedInMobile({ t }: { t: (key: string) => string }) {
  const router = useRouter()

  return (
    <>
      <MobileNavLink href="/dashboard">{t('nav.dashboard')}</MobileNavLink>
      {isAdmin() && (
        <MobileNavLink href="/admin" className="text-amber-600 hover:bg-amber-50">
          {t('nav.admin')}
        </MobileNavLink>
      )}
      <button
        onClick={() => { clearToken(); router.push('/') }}
        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50"
      >
        {t('nav.signOut')}
      </button>
    </>
  )
}

function LoggedOutNav({ t }: { t: (key: string) => string }) {
  return (
    <>
      <NavLink href="/login">{t('nav.signIn')}</NavLink>
      <Link
        href="/register"
        data-cuelume-press
        className="inline-flex items-center rounded-full bg-[#0071e3] px-4 py-1.5 text-[12px] font-medium text-white transition-all hover:bg-[#0068d2]"
      >
        {t('nav.getStarted')}
      </Link>
    </>
  )
}

function LoggedOutMobile({ t }: { t: (key: string) => string }) {
  return (
    <>
      <MobileNavLink href="/login">{t('nav.signIn')}</MobileNavLink>
      <MobileNavLink href="/register" className="text-[#0071e3] font-medium hover:bg-[#f4f8fb]">
        {t('nav.getStarted')}
      </MobileNavLink>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const t = useTranslations()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    const onAuthChanged = () => setLoggedIn(isLoggedIn())
    window.addEventListener(AUTH_CHANGED, onAuthChanged)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener(AUTH_CHANGED, onAuthChanged)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Routes that render the marketing navbar (product links) instead of the app one
  const MARKETING_ROUTES = ['/', '/about', '/limits', '/terms', '/privacy']
  const isMarketing = MARKETING_ROUTES.includes(pathname)

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 overflow-hidden transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#d2d2d7]/60 bg-white/80 backdrop-blur-xl'
          : 'border-b border-[#d2d2d7]/40 bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-5 md:px-8">
        {/* Left: Logo */}
        <Link
          href={loggedIn ? '/dashboard' : '/'}
          className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-[#1d1d1f] transition-opacity hover:opacity-70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Open Ai Jobs Search
        </Link>

        {/* Center: Nav links (marketing pages only) */}
        {isMarketing && (
          <nav className="hidden items-center gap-1 md:flex">
            <MarketingLinks t={t} />
          </nav>
        )}

        {/* Right: Auth / Profile */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {loggedIn ? (
            <>
              <div className="hidden items-center gap-1.5 md:flex">
                <NavbarCreditChip />
                <LoggedInNav t={t} />
              </div>
              <div className="flex md:hidden">
                <NotificationBell />
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <LoggedOutNav t={t} />
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="ml-1 rounded-full p-1.5 text-[#707070] transition-all hover:bg-[#f5f5f7] md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#d2d2d7]/60 bg-white/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-5 py-3">
            {isMarketing && <MobileMarketingLinks t={t} />}
            {loggedIn ? <LoggedInMobile t={t} /> : <LoggedOutMobile t={t} />}
          </div>
        </div>
      )}
    </header>
  )
}
