import { getTranslations } from 'next-intl/server'
import AuthCTAButton from './AuthCTAButton'
import HeroMockCv from './HeroMockCv'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { HeroParticles } from '@/components/three/HeroParticles'

/**
 * Landing hero — "AI constellation": a Three.js particle field as a decorative
 * background, with the semantic copy and the CV mockup on top.
 */
export async function HeroSection() {
  const t = await getTranslations('marketing')

  return (
    <section className="relative overflow-hidden bg-[#f5f5f7]">
      {/* 3D background layer */}
      <SceneDynamic className="absolute inset-0" activeFrameloop="always">
        <HeroParticles />
      </SceneDynamic>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-20 pb-24 text-center md:px-8 md:pt-28 md:pb-32">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/70 px-3 py-1 text-[11px] font-medium text-[#707070] backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t('heroBadge')}
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-[44px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[56px]">
          {t('heroTitle1')} <span className="text-[#0071e3]">{t('heroTitle2')}</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-5 max-w-2xl text-[19px] font-light leading-snug text-[#707070] md:text-[22px]">
          {t('heroSubtitle')}
        </p>

        {/* CTA */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <AuthCTAButton
            loggedInKey="ctaDashboard"
            loggedOutKey="ctaTryFree"
            className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2]"
          />
        </div>

        {/* CV mockup */}
        <HeroMockCv />
      </div>
    </section>
  )
}
