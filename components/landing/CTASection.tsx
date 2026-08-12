import { getTranslations } from 'next-intl/server'
import AuthCTAButton from './AuthCTAButton'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { CtaAurora } from '@/components/three/CtaAurora'

export async function CTASection() {
  const t = await getTranslations('marketing')

  return (
    <section className="relative overflow-hidden border-t border-[#d2d2d7] bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe]">
      {/* Low-density 3D background */}
      <SceneDynamic className="absolute inset-0" activeFrameloop="always">
        <CtaAurora />
      </SceneDynamic>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-20 text-center md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('ctaHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('ctaSubheading')}</p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <AuthCTAButton
              loggedInKey="ctaOpenDashboard"
              loggedOutKey="ctaGetStarted"
              className="inline-flex items-center rounded-full bg-[#0071e3] px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
