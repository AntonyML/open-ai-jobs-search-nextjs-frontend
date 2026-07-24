'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'

interface AuthCTAButtonProps {
  /** Translation key for logged-in state (e.g. 'ctaDashboard') */
  loggedInKey: string
  /** Translation key for logged-out state (e.g. 'ctaTryFree') */
  loggedOutKey: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Tiny client-component boundary that checks auth state client-side
 * and renders the appropriate CTA link. The rest of the landing page
 * stays as a Server Component.
 */
export default function AuthCTAButton({
  loggedInKey,
  loggedOutKey,
  className = '',
}: AuthCTAButtonProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const t = useTranslations('marketing')

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  return (
    <Link
      href={loggedIn ? '/providers' : '/register'}
      className={className}
    >
      {loggedIn ? t(loggedInKey) : t(loggedOutKey)}
      <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </Link>
  )
}
