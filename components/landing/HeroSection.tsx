import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import AuthCTAButton from './AuthCTAButton'
import HeroMockCv from './HeroMockCv'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { HeroParticles } from '@/components/three/HeroParticles'

/**
 * Landing hero — two columns on desktop (copy + CV mockup) so the whole first
 * screen reads without scrolling, over the 3D "orchestration constellation".
 */
export async function HeroSection() {
  const t = await getTranslations('marketing')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe]">
      {/* 3D background layer */}
      <SceneDynamic className="absolute inset-0" activeFrameloop="always">
        <HeroParticles />
      </SceneDynamic>

      <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-10 px-5 pt-14 pb-14 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-20 lg:pb-20">
        {/* Copy */}
        <div className="text-center lg:text-left">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/70 px-3 py-1 text-[11px] font-medium text-[#707070] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            {t('heroBadge')}
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-2xl text-[40px] font-semibold leading-[1.06] tracking-tight text-[#1d1d1f] md:text-[52px] lg:mx-0">
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
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <AuthCTAButton
              loggedInKey="ctaDashboard"
              loggedOutKey="ctaTryFree"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0071e3] px-7 py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2] sm:w-auto"
            />
            <Link
              href="/#how-it-works"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] transition-colors hover:bg-[#e8f0fe] sm:w-auto"
            >
              {t('heroCtaSecondary')}
            </Link>
          </div>

        </div>

        {/* CV mockup */}
        <HeroMockCv />
      </div>
    </section>
  )
}
