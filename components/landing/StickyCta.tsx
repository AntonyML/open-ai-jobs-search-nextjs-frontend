'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, X } from 'lucide-react'
import { isLoggedIn } from '@/lib/auth'

/**
 * Sticky bottom CTA for phones and tablets: appears once the visitor scrolls
 * past the hero, hides while the final CTA section is on screen, and can be
 * dismissed. Keeps the primary conversion action reachable without scrolling
 * on small screens (44px touch targets, iOS safe-area aware). Desktop (lg+)
 * never sees it.
 */
export function StickyCta() {
  const t = useTranslations('marketing')
  const tCommon = useTranslations('common')
  const [loggedIn, setLoggedIn] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [show, setShow] = useState(false)
  const [atFinalCta, setAtFinalCta] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  // Appear after the visitor scrolls past the hero (the hero already has CTAs).
  useEffect(() => {
    if (loggedIn) return
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.15)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loggedIn])

  // Hide while the final CTA section is on screen so the bar never doubles it.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const el = document.getElementById('cta')
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setAtFinalCta(entry.isIntersecting), {
      threshold: 0.3,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (loggedIn || dismissed || !show || atFinalCta) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d2d2d7]/70 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden"
      role="complementary"
      aria-label={t('stickyCtaLabel')}
    >
      {/* Centered content: full-width on phones, a compact pill on tablets. */}
      <div className="mx-auto w-full max-w-md">
        <p className="mb-2 text-center text-[11px] font-light text-[#707070]">{t('stickyCtaHint')}</p>
        <div className="flex items-center gap-2.5">
          <Link
            href="/register"
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#0068d2] active:bg-[#005fc0]"
          >
            {t('ctaTryFree')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={tCommon('close')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d2d2d7] text-[#707070] transition-colors hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
