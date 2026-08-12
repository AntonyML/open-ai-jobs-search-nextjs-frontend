'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import AuthCTAButton from './AuthCTAButton'
import { isLoggedIn } from '@/lib/auth'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { PricingGlow } from '@/components/three/PricingGlow'
import { useReducedMotion } from '@/components/three/useReducedMotion'

type Billing = 'monthly' | 'annual'

/** One-shot in-view hook: element fades/rises in when it enters the viewport. */
function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, shown }
}

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
      className={`inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-[14px] font-medium transition-all ${
        solid
          ? 'bg-[#0071e3] text-white shadow-[0_8px_24px_-8px_rgba(0,113,227,0.6)] hover:bg-[#0068d2] hover:shadow-[0_10px_28px_-8px_rgba(0,113,227,0.7)]'
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
  const reducedMotion = useReducedMotion()

  const featureCounts: Record<PlanKey, number> = { free: 4, pro: 5, max: 7 }
  const plans: PlanKey[] = ['free', 'pro', 'max']

  const planLabel = (key: PlanKey) => `plan${key.charAt(0).toUpperCase()}${key.slice(1)}`

  const { ref: cardsRef, shown } = useInViewOnce<HTMLDivElement>(0.08)

  return (
    <section id="pricing" className="relative overflow-hidden border-t border-[#d2d2d7] bg-white">
      {/* Ambient 3D background — pure visual layer, no pointer events.
          Transparent fallback: the blue gradient placeholder is for hero-style
          boxes, it must not wash the whole section when WebGL is missing. */}
      <SceneDynamic
        className="pointer-events-none absolute inset-0 z-0"
        activeFrameloop="always"
        fallback={<div aria-hidden="true" className="h-full w-full" />}
      >
        <PricingGlow />
      </SceneDynamic>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
        {/* Header — label + heading only; the subheading moved beside the toggle */}
        <div
          className={`mx-auto mb-10 max-w-2xl text-center transition-all duration-700 ${
            shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('pricingLabel')}
          </p>
          <h2 className="text-[34px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[42px]">
            {t('pricingHeading')}
          </h2>
        </div>

        {/* Billing toggle — sliding thumb */}
        <div className="mb-9 flex flex-col items-center gap-2.5">
          <div
            role="group"
            aria-label={t('pricingBillingLabel')}
            className="relative inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] p-1"
          >
            {/* Sliding thumb */}
            <span
              aria-hidden="true"
              className={`absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
                billing === 'annual' ? 'translate-x-full' : ''
              }`}
            />
            {(['monthly', 'annual'] as Billing[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={billing === option}
                onClick={() => setBilling(option)}
                className={`relative z-10 rounded-full px-5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 ${
                  billing === option ? 'text-[#1d1d1f]' : 'text-[#707070] hover:text-[#1d1d1f]'
                }`}
              >
                {t(option === 'monthly' ? 'pricingMonthly' : 'pricingAnnual')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {t('pricingAnnualSave')}
            </span>
            <span className="text-[12px] font-light text-[#858585]">{t('pricingSubheading')}</span>
          </div>
        </div>

        {/* Cards — each reveals with its own stagger delay; the delay is
            dropped once shown so hover transitions stay instant. */}
        <div ref={cardsRef} className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3">
          {plans.map((key, idx) => {
            const prefix = planLabel(key)
            const isMax = key === 'max'
            const isFree = key === 'free'
            const isAnnual = billing === 'annual'

            const hover = reducedMotion
              ? ''
              : isMax
                ? 'hover:-translate-y-1 hover:shadow-[0_28px_70px_-25px_rgba(0,113,227,0.5)]'
                : 'hover:-translate-y-1 hover:border-[#0071e3]/40 hover:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.25)]'

            return (
              <div
                key={key}
                style={{
                  // Reveal is a CSS animation (fill-mode: backwards) so each
                  // card holds its hidden state during its own delay; the
                  // delay is NOT a transition delay, so hover stays instant.
                  animationDelay: shown && !reducedMotion ? `${idx * 110}ms` : '0ms',
                }}
                className={`group relative flex flex-col rounded-2xl p-7 transition-[transform,box-shadow,border-color] duration-300 ${
                  shown && !reducedMotion ? 'pricing-card-reveal' : ''
                } ${
                  isMax
                    ? 'border-2 border-[#0071e3] bg-gradient-to-br from-[#f4f8fb] to-white shadow-[0_20px_60px_-25px_rgba(0,113,227,0.4)]'
                    : 'border border-[#d2d2d7] bg-white'
                } ${hover}`}
              >
                {isMax && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0071e3] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_14px_-4px_rgba(0,113,227,0.7)]">
                    {t('planPopularBadge')}
                  </div>
                )}
                {isMax && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                  >
                    <div className="pricing-shimmer absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  </div>
                )}

                {/* Name */}
                <h3 className="text-[16px] font-semibold text-[#1d1d1f]">{t(`${prefix}Name`)}</h3>
                <p className="mt-1 text-[12.5px] font-light text-[#707070]">{t(`${prefix}Desc`)}</p>

                {/* Price — key forces a crossfade when the billing changes */}
                <div className="mt-5 flex items-baseline gap-1.5">
                  {!isFree && isAnnual && (
                    <s className="text-[19px] font-light text-[#c8c8cc]">{t(`${prefix}Price`)}</s>
                  )}
                  <span
                    key={`${key}-${billing}`}
                    className={`animate-price-in text-[40px] font-semibold leading-none tracking-tight ${
                      isMax ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                    }`}
                  >
                    {isFree ? t(`${prefix}Price`) : isAnnual ? t(`${prefix}AnnualPrice`) : t(`${prefix}Price`)}
                  </span>
                  {!isFree && <span className="text-[14px] font-light text-[#707070]">{t(`${prefix}Period`)}</span>}
                </div>
                {!isFree && (
                  <p className="mt-1.5 text-[11.5px] font-light text-[#858585]">
                    {isAnnual ? t(`${prefix}AnnualNote`) : t(`${prefix}Yearly`)}
                  </p>
                )}

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {Array.from({ length: featureCounts[key] }, (_, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13.5px] text-[#474747] transition-colors duration-200 group-hover:text-[#3a3a3c]"
                    >
                      <span className={`mt-0.5 transition-transform duration-200 group-hover:scale-110 ${isFree ? 'text-emerald-500' : 'text-[#0071e3]'}`}>
                        <CheckIcon />
                      </span>
                      <span>{t(`${prefix}Feature${i + 1}`)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-7">
                  {isFree ? (
                    <AuthCTAButton
                      loggedInKey="ctaDashboard"
                      loggedOutKey="planCtaFree"
                      className="inline-flex w-full items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3]/40 hover:text-[#0071e3]"
                    />
                  ) : isMax ? (
                    <PlanCta ctaKey="planCtaMax" solid />
                  ) : (
                    <PlanCta ctaKey="planCtaPro" />
                  )}
                  <p className="mt-2.5 text-center text-[11px] text-[#858585]">{t(`${prefix}Note`)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Disclaimer — like Anthropic's pricing footer: honest, links to details */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-[12px] font-light leading-relaxed text-[#858585]">
          {t('pricingDisclaimer')}{' '}
          <Link
            href="/limits"
            className="font-medium text-[#0071e3] underline-offset-2 hover:underline"
          >
            {t('pricingDisclaimerLink')}
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes price-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-price-in {
          animation: price-in 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes pricing-shimmer {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(200% + 400px));
          }
        }
        .pricing-shimmer {
          animation: pricing-shimmer 4.5s ease-in-out infinite;
        }
        /* Card reveal: fill-mode backwards keeps each card hidden during its
           own animation-delay, so the stagger works and no transition delay
           leaks into the hover lift. */
        @keyframes card-in {
          from {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .pricing-card-reveal {
          animation: card-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-price-in {
            animation: none;
          }
          .pricing-shimmer {
            animation: none;
          }
          .pricing-card-reveal {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
