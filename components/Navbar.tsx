'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { isLoggedIn, clearToken, isAdmin } from '@/lib/auth'
import NotificationBell from '@/components/NotificationBell'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const t = useTranslations()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isMarketing = pathname === '/' || pathname === '/about'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 overflow-hidden transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/60'
          : 'bg-white/60 backdrop-blur-md border-b border-[#d2d2d7]/40'
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-5 md:px-8">
        {/* Left: Logo */}
        <Link
          href={loggedIn ? '/dashboard' : '/'}
          className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-[#1d1d1f] hover:opacity-70 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Open Ai Jobs Search
        </Link>

        {/* Center: Nav links (marketing pages only) */}          {isMarketing && (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: t('footer.features'), href: '/#features' },
              { label: t('footer.pipeline'), href: '/#pipeline' },
              { label: t('footer.about'), href: '/about' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Auth / Profile */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {loggedIn ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href="/pipeline/providers"
                className="hidden md:inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
              >
                {t('nav.pipeline')}
              </Link>
              {isAdmin() && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {t('nav.admin')}
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:border-[#0071e3]/30 hover:text-[#0071e3] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {t('nav.profile')}
              </Link>
              <button
                onClick={() => { clearToken(); router.push('/') }}
                data-cuelume-press
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#858585] hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-full px-3 py-1.5 text-[12px] font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/register"
                data-cuelume-press
                className="inline-flex items-center rounded-full bg-[#0071e3] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#0068d2] transition-all"
              >
                {t('nav.getStarted')}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="ml-1 md:hidden rounded-full p-1.5 text-[#707070] hover:bg-[#f5f5f7] transition-all"
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
        <div className="md:hidden border-t border-[#d2d2d7]/60 bg-white/95 backdrop-blur-xl">
          <div className="px-5 py-3 space-y-1">
            {isMarketing && [
              { label: t('footer.features'), href: '/#features' },
              { label: t('footer.pipeline'), href: '/#pipeline' },
              { label: t('footer.about'), href: '/about' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <>
                <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]">{t('nav.dashboard')}</Link>
                <Link href="/pipeline/providers" className="block rounded-lg px-3 py-2 text-sm text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]">{t('nav.pipeline')}</Link>
                {isAdmin() && (
                  <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">{t('nav.admin')}</Link>
                )}
                <button onClick={() => { clearToken(); router.push('/') }} className="block w-full text-left rounded-lg px-3 py-2 text-sm text-rose-500 hover:bg-rose-50">{t('nav.signOut')}</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]">{t('nav.signIn')}</Link>
                <Link href="/register" className="block rounded-lg px-3 py-2 text-sm text-[#0071e3] font-medium hover:bg-[#f4f8fb]">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
