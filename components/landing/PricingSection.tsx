'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import AuthCTAButton from './AuthCTAButton'
import { isLoggedIn } from '@/lib/auth'

/** Max CTA: logged-in users open the purchase modal, visitors go to /register. */
function MaxCta() {
  const t = useTranslations('marketing')
  const router = useRouter()

  const onClick = () => {
    if (isLoggedIn()) {
      window.dispatchEvent(new CustomEvent('purchase:required', { detail: { status: 402 } }))
    } else {
      router.push('/register')
    }
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-[#0068d2]"
    >
      {t('planCtaMax')}
    </button>
  )
}

export default function PricingSection() {
  const t = useTranslations('marketing')

  return (
    <section id="pricing" className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('pricingLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('pricingHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('pricingSubheading')}</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-[#d2d2d7] bg-white p-8">
            <h3 className="text-[20px] font-semibold text-[#1d1d1f]">{t('planFreeName')}</h3>
            <p className="mt-1 text-[13px] font-light text-[#707070]">{t('planFreeDesc')}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-[#474747]">
                  <svg className="mt-0.5 shrink-0 text-emerald-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t(`planFreeFeature${i}`)}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <AuthCTAButton
                loggedInKey="ctaDashboard"
                loggedOutKey="planCtaFree"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-5 py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3]/40 hover:text-[#0071e3]"
              />
              <p className="mt-3 text-center text-[11px] text-[#858585]">{t('planFreeNote')}</p>
            </div>
          </div>

          {/* Max */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#0071e3] bg-gradient-to-br from-[#f4f8fb] to-white p-8 shadow-[0_20px_60px_-25px_rgba(0,113,227,0.4)]">
            <div className="absolute right-4 top-4 rounded-full bg-[#0071e3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Popular
            </div>
            <h3 className="text-[20px] font-semibold text-[#1d1d1f]">{t('planMaxName')}</h3>
            <p className="mt-1 text-[13px] font-light text-[#707070]">{t('planMaxDesc')}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-[#1d1d1f]">
                  <svg className="mt-0.5 shrink-0 text-[#0071e3]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t(`planMaxFeature${i}`)}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <MaxCta />
              <p className="mt-3 text-center text-[11px] text-[#858585]">{t('planMaxNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
