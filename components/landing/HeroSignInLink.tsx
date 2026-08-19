'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'

/**
 * "Already have an account? Sign in" link shown below the Hero CTAs.
 * Only renders for logged-out visitors so existing users always see the
 * returning-user path without hunting through menus.
 */
export default function HeroSignInLink() {
  const [loggedIn, setLoggedIn] = useState(true) // start hidden to avoid flash
  const t = useTranslations('auth')

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  if (loggedIn) return null

  return (
    <p className="mt-4 text-center text-[14px] text-[#707070] lg:text-left">
      {t('hasAccount')}{' '}
      <Link
        href="/login"
        className="font-medium text-[#0066cc] underline-offset-2 hover:underline"
      >
        {t('signInLink')}
      </Link>
    </p>
  )
}
