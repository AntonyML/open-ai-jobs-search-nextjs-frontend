'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PipelineSection } from '@/components/landing/PipelineSection'
import { CTASection } from '@/components/landing/CTASection'

const STEP_COLORS = [
  'from-blue-400 to-cyan-300',
  'from-cyan-400 to-teal-300',
  'from-teal-400 to-emerald-300',
  'from-emerald-400 to-green-300',
  'from-green-400 to-yellow-300',
  'from-yellow-400 to-amber-300',
  'from-amber-400 to-rose-300',
]

const STEP_NUMS = ['01', '02', '03', '04', '05', '06', '07']

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const t = useTranslations('marketing')

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  const pipelineSteps = STEP_NUMS.map((num, i) => ({
    num,
    label: t(`step${num}Label`),
    desc: t(`step${num}Desc`),
    color: STEP_COLORS[i],
  }))

  return (
    <>
      <HeroSection loggedIn={loggedIn} pipelineSteps={pipelineSteps} t={t} />
      <FeaturesSection t={t} />
      <PipelineSection steps={pipelineSteps} t={t} />
      <CTASection loggedIn={loggedIn} t={t} />
    </>
  )
}
