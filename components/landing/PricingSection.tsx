'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import AuthCTAButton from './AuthCTAButton'
import { isLoggedIn } from '@/lib/auth'

type Billing = 'monthly' | 'annual'

/** Paid-plan CTA: logged-in users open the purchase modal, visitors go to /register. */
function PlanCta({ ctaKey, solid = false }: { ctaKey: string; solid?: boolean }) {
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
      className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[14px] font-medium transition-all ${
        solid
          ? 'bg-[#0071e3] text-white hover:bg-[#0068d2]'
          : 'border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#0071e3]/40 hover:text-[#0071e3]'
      }`}
    >
      {t(ctaKey)}
    </button>
  )
}

type PlanKey = 'free' | 'pro' | 'max'

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 shrink-0 ${className}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function PricingSection() {
  const t = useTranslations('marketing')
  const [billing, setBilling] = useState<Billing>('monthly')

  const featureCounts: Record<PlanKey, number> = { free: 4, pro: 5, max: 7 }
  const plans: PlanKey[] = ['free', 'pro', 'max']

  const planLabel = (key: PlanKey) => `plan${key.charAt(0).toUpperCase()}${key.slice(1)}`

  return (
    <section id="pricing" className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('pricingLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('pricingHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('pricingSubheading')}</p>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <div
            role="group"
            aria-label={t('pricingBillingLabel')}
            className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] p-1"
          >
            {(['monthly', 'annual'] as Billing[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={billing === option}
                onClick={() => setBilling(option)}
                className={`rounded-full px-5 py-1.5 text-[13px] font-medium transition-all ${
                  billing === option
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#707070] hover:text-[#1d1d1f]'
                }`}
              >
                {t(option === 'monthly' ? 'pricingMonthly' : 'pricingAnnual')}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            {t('pricingAnnualSave')}
          </span>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((key) => {
            const prefix = planLabel(key)
            const isMax = key === 'max'
            const isFree = key === 'free'
            const isAnnual = billing === 'annual'

            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-2xl p-8 ${
                  isMax
                    ? 'border-2 border-[#0071e3] bg-gradient-to-br from-[#f4f8fb] to-white shadow-[0_20px_60px_-25px_rgba(0,113,227,0.4)]'
                    : 'border border-[#d2d2d7] bg-white'
                }`}
              >
                {isMax && (
                  <div className="absolute right-5 top-5 rounded-full bg-[#0071e3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t('planPopularBadge')}
                  </div>
                )}

                {/* Name */}
                <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{t(`${prefix}Name`)}</h3>
                <p className="mt-1 text-[13px] font-light text-[#707070]">{t(`${prefix}Desc`)}</p>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className={`text-[44px] font-semibold leading-none tracking-tight ${isMax ? 'text-[#0071e3]' : 'text-[#1d1d1f]'}`}>
                    {isFree ? t(`${prefix}Price`) : isAnnual ? t(`${prefix}AnnualPrice`) : t(`${prefix}Price`)}
                  </span>
                  {!isFree && <span className="text-[15px] font-light text-[#707070]">{t(`${prefix}Period`)}</span>}
                </div>
                {!isFree && (
                  <p className="mt-1.5 text-[12px] font-light text-[#858585]">
                    {isAnnual ? t(`${prefix}AnnualNote`) : t(`${prefix}Yearly`)}
                  </p>
                )}

                {/* Features */}
                <ul className="mt-7 flex-1 space-y-3">
                  {Array.from({ length: featureCounts[key] }, (_, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#474747]">
                      <CheckIcon className={isFree ? 'text-emerald-500' : 'text-[#0071e3]'} />
                      <span>{t(`${prefix}Feature${i + 1}`)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {isFree ? (
                    <AuthCTAButton
                      loggedInKey="ctaDashboard"
                      loggedOutKey="planCtaFree"
                      className="inline-flex w-full items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-5 py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3]/40 hover:text-[#0071e3]"
                    />
                  ) : isMax ? (
                    <PlanCta ctaKey="planCtaMax" solid />
                  ) : (
                    <PlanCta ctaKey="planCtaPro" />
                  )}
                  <p className="mt-3 text-center text-[11px] text-[#858585]">{t(`${prefix}Note`)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Disclaimer — like Anthropic's pricing footer: honest, links to details */}
        <p className="mx-auto mt-12 max-w-3xl text-center text-[12px] font-light leading-relaxed text-[#858585]">
          {t('pricingDisclaimer')}{' '}
          <Link
            href="/limits"
            className="font-medium text-[#0071e3] underline-offset-2 hover:underline"
          >
            {t('pricingDisclaimerLink')}
          </Link>
        </p>
      </div>
    </section>
  )
}
