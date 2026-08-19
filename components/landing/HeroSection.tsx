import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import AuthCTAButton from './AuthCTAButton'
import HeroSignInLink from './HeroSignInLink'
import HeroMockCv from './HeroMockCv'
import { StatsStrip } from './StatsStrip'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { HeroParticles } from '@/components/three/HeroParticles'

/**
 * Landing hero — the whole first screen: two-column copy + CV mockup centered,
 * with the product stats pinned to the bottom, so the next section starts
 * exactly at the fold (no peeking, no empty space).
 *
 * Height note: the marketing layout offsets its <main> by `pt-12` (48px, the
 * fixed navbar), so the hero fills `100dvh - 3rem` — otherwise it would extend
 * 48px past the fold.
 */
export async function HeroSection() {
  const t = await getTranslations('marketing')

  return (
    <section className="relative flex min-h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe]">
      {/* 3D background layer */}
      <SceneDynamic className="absolute inset-0" activeFrameloop="always">
        <HeroParticles />
      </SceneDynamic>

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-10 px-5 pt-14 pb-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16 lg:pb-8">
        {/* Copy */}
        <div className="text-center lg:text-left">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/70 px-3 py-1 text-[11px] font-medium text-[#707070] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            {t('heroBadge')}
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-2xl text-[38px] font-semibold leading-[1.06] tracking-tight text-[#1d1d1f] md:text-[46px] lg:mx-0">
            {t('heroTitle1')}{' '}
            <span className="bg-gradient-to-r from-[#0071e3] to-[#0a84ff] bg-clip-text text-transparent">
              {t('heroTitle2')}
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-4 max-w-xl text-[17px] font-light leading-snug text-[#707070] md:text-[20px] lg:mx-0">
            {t('heroSubtitle')}
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <AuthCTAButton
              loggedInKey="ctaDashboard"
              loggedOutKey="ctaTryFree"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0071e3] px-7 py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2] sm:w-auto"
            />
            <Link
              href="/#features"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] transition-colors hover:bg-[#e8f0fe] sm:w-auto"
            >
              {t('heroCtaSecondary')}
            </Link>
          </div>

          {/* Returning-user path: visible only to logged-out visitors */}
          <HeroSignInLink />

        </div>

        {/* CV mockup */}
        <HeroMockCv />
      </div>

      {/* Product stats — bottom of the first screen */}
      <StatsStrip />
    </section>
  )
}
