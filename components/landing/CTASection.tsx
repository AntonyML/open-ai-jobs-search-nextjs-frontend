'use client'

import { useTranslations } from 'next-intl'
import AuthCTAButton from './AuthCTAButton'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { CtaAurora } from '@/components/three/CtaAurora'
import { AmbientGlowFallback } from '@/components/three/WebGLFallback'
import { useReducedMotion } from '@/components/three/useReducedMotion'
import { useInViewOnce } from '@/hooks/use-in-view'

export function CTASection() {
  const t = useTranslations('marketing')
  const reducedMotion = useReducedMotion()
  const { ref, shown } = useInViewOnce<HTMLDivElement>(0.2)

  return (
    <section id="cta" className="relative overflow-hidden border-t border-[#d2d2d7] bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe]">
      {/* Calibrated 3D background — same constellation language as pricing.
          Without WebGL a soft radial glow keeps the section looking intentional. */}
      <SceneDynamic
        className="pointer-events-none absolute inset-0 z-0"
        activeFrameloop="always"
        fallback={<AmbientGlowFallback />}
      >
        <CtaAurora />
      </SceneDynamic>

      <div ref={ref} className="relative z-10 mx-auto max-w-[1440px] px-4 py-10 text-center sm:px-6 sm:py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p
            className={`mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-[#0071e3] transition-all duration-700 sm:mb-4 sm:text-[11px] ${
              shown && !reducedMotion ? 'cta-reveal cta-reveal-1' : ''
            }`}
          >
            {t('ctaLabel')}
          </p>
          <h2
            className={`text-balance text-[24px] font-semibold leading-[1.12] tracking-tight text-[#1d1d1f] sm:text-[32px] sm:leading-[1.08] md:text-[40px] lg:text-[48px] transition-all duration-700 ${
              shown && !reducedMotion ? 'cta-reveal cta-reveal-2' : ''
            }`}
          >
            {t('ctaHeading')}
          </h2>
          <p
            className={`mt-2.5 max-w-xl mx-auto text-pretty text-[14px] font-light text-[#707070] transition-all duration-700 sm:mt-4 sm:text-[16px] md:text-[17px] ${
              shown && !reducedMotion ? 'cta-reveal cta-reveal-3' : ''
            }`}
          >
            {t('ctaSubheading')}
          </p>
          <div
            className={`mt-6 flex items-center justify-center gap-3 transition-all duration-700 sm:mt-8 md:mt-10 ${
              shown && !reducedMotion ? 'cta-reveal cta-reveal-4' : ''
            }`}
          >
            <AuthCTAButton
              loggedInKey="ctaOpenDashboard"
              loggedOutKey="ctaGetStarted"
              className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-2.5 sm:px-7 sm:py-3.5 text-[14px] sm:text-[15px] font-medium text-white shadow-[0_10px_30px_-12px_rgba(0,113,227,0.6)] transition-all hover:-translate-y-0.5 hover:bg-[#0068d2] hover:shadow-[0_14px_36px_-12px_rgba(0,113,227,0.7)]"
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cta-in {
          from {
            opacity: 0;
            transform: translateY(14px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .cta-reveal {
          animation: cta-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
        .cta-reveal-1 {
          animation-delay: 0ms;
        }
        .cta-reveal-2 {
          animation-delay: 90ms;
        }
        .cta-reveal-3 {
          animation-delay: 180ms;
        }
        .cta-reveal-4 {
          animation-delay: 270ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-reveal {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
