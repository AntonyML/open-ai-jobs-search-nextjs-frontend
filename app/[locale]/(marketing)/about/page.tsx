'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { HeroAbout } from '@/components/about/HeroAbout'
import { StorySection } from '@/components/about/StorySection'
import { TechStackSection } from '@/components/about/TechStackSection'
import { CTAAbout } from '@/components/about/CTAAbout'

export default function AboutPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const t = useTranslations('about')

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  return (
    <>
      <HeroAbout t={t} />
      <StorySection t={t} />
      <TechStackSection t={t} />
      <CTAAbout loggedIn={loggedIn} t={t} />
    </>
  )
}
