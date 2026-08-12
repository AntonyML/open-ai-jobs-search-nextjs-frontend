import { getTranslations } from 'next-intl/server'
import AuthCTAButton from './AuthCTAButton'

/**
 * Landing hero. The old 7-step pipeline visualization was removed in the
 * landing redesign (Fase 0); the Three.js particle hero replaces it in Fase 1.
 */
export async function HeroSection() {
  const t = await getTranslations('marketing')

  return (
    <section className="relative overflow-hidden bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1440px] px-5 pt-20 pb-24 text-center md:px-8 md:pt-28 md:pb-32">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/60 px-3 py-1 text-[11px] font-medium text-[#707070]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t('heroBadge')}
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-[44px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[56px]">
          {t('heroHeading1')}
          <br />
          <span className="text-[#0071e3]">{t('heroHeading2')}</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-5 max-w-2xl text-[20px] font-light leading-snug text-[#707070] md:text-[24px]">
          {t('heroDesc1')}
          <br className="hidden md:block" />
          {t('heroDesc2')}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <AuthCTAButton
            loggedInKey="ctaDashboard"
            loggedOutKey="ctaTryFree"
            className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2]"
          />
        </div>
      </div>
    </section>
  )
}
