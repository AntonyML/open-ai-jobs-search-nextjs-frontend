'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import AuthCTAButton from './AuthCTAButton'
import { isLoggedIn } from '@/lib/auth'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { PricingGlow } from '@/components/three/PricingGlow'
import { AmbientGlowFallback } from '@/components/three/WebGLFallback'
import { useReducedMotion } from '@/components/three/useReducedMotion'
import { useInViewOnce } from '@/hooks/use-in-view'
import { usePublicCatalog } from '@/hooks/useBilling'
import { DEFAULT_CATALOG } from '@/lib/constants/default-catalog'

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

/** A pricing plan — either from the public catalog or the i18n fallback. */
interface PricingPlan {
  key: string
  credits_per_period: number
  price_monthly_usd: number
  price_yearly_usd: number
  features: string[]
  daily_quota: number
  weekly_quota: number
  sort_order: number
}

const planBenefitKeys: Record<string, string[]> = {
  free: ['planFreeFeature1', 'planFreeFeature2', 'planFreeFeature3', 'planFreeFeature4', 'planFreeFeature5', 'planFreeFeature6'],
  pro: ['planProFeature1', 'planProFeature2', 'planProFeature3', 'planProFeature4', 'planProFeature5', 'planProFeature6', 'planProFeature7', 'planProFeature8'],
  max: ['planMaxFeature1', 'planMaxFeature2', 'planMaxFeature3', 'planMaxFeature4', 'planMaxFeature5', 'planMaxFeature6', 'planMaxFeature7', 'planMaxFeature8', 'planMaxFeature9', 'planMaxFeature10'],
}

const planLabel = (key: string) => `plan${key.charAt(0).toUpperCase()}${key.slice(1)}`

function formatPrice(usd: number, currency: string): string {
  const decimals = Math.abs(usd % 1) < 0.005 ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(usd)
}

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

interface PlanCardProps {
  plan: PricingPlan
  billing: Billing
  currency: string
  /** Stagger index used for the reveal animation delay. */
  idx: number
  /** True once the section has been revealed (drives the CSS reveal). */
  reveal: boolean
  reducedMotion: boolean
}

/** A single pricing card. Shared by the mobile (one active plan) and the
 *  desktop 3-column grid. */
function PlanCard({ plan, billing, currency, idx, reveal, reducedMotion }: PlanCardProps) {
  const t = useTranslations('marketing')

  const key = plan.key
  const prefix = planLabel(key)
  const isMax = key === 'max'
  const isFree = key === 'free'
  const isAnnual = billing === 'annual'
  const monthlyUsd = formatPrice(plan.price_monthly_usd, currency)
  const annualPerMonthUsd = formatPrice(plan.price_yearly_usd / 12, currency)
  const yearlyTotalUsd = formatPrice(plan.price_yearly_usd, currency)

  const hover = reducedMotion
    ? ''
    : isMax
      ? 'hover:-translate-y-1 hover:shadow-[0_28px_70px_-25px_rgba(0,113,227,0.5)]'
      : 'hover:-translate-y-1 hover:border-[#0071e3]/40 hover:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.25)]'

  return (
    <div
      style={{
        // Reveal is a CSS animation (fill-mode: backwards) so each card holds
        // its hidden state during its own delay; the delay is NOT a transition
        // delay, so hover stays instant.
        animationDelay: reveal ? `${idx * 110}ms` : '0ms',
      }}
      className={`group relative flex flex-col rounded-xl p-4 sm:rounded-2xl sm:p-6 lg:p-7 transition-[transform,box-shadow,border-color] duration-300 ${
        reveal ? 'pricing-card-reveal' : ''
      } ${
        isMax
          ? 'border-2 border-[#0071e3] bg-gradient-to-br from-[#f4f8fb] to-white shadow-[0_20px_60px_-25px_rgba(0,113,227,0.4)]'
          : 'border border-[#d2d2d7] bg-white'
      } ${hover}`}
    >
      {isMax && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0071e3] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_14px_-4px_rgba(0,113,227,0.7)]">
          {t('planPopularBadge')}
        </div>
      )}
      {isMax && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl"
        >
          <div className="pricing-shimmer absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      )}

      {/* Name */}
      <h3 className="text-[15px] font-semibold text-[#1d1d1f] sm:text-[16px]">{t(`${prefix}Name`)}</h3>
      <p className="mt-0.5 text-[12px] font-light text-[#707070] sm:mt-1 sm:text-[12.5px]">{t(`${prefix}Desc`)}</p>
      <p className="mt-2 text-[12.5px] font-medium text-[#1d1d1f] sm:mt-3 sm:text-[13px]">
        {t('planCredits', { credits: plan.credits_per_period, cadence: key === 'free' ? t('pricingWeekly') : t('pricingMonthlyCadence') })}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-[#5f6368] sm:mt-1 sm:text-[11.5px] sm:leading-5">
        {isMax
          ? t('planPipelineQuota', { daily: plan.daily_quota, weekly: plan.weekly_quota })
          : t('planCreditBasedQuota')}
      </p>

      <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-widest text-[#5f6368] sm:mt-5 sm:text-[11px]">{t('pricingPriceLabel')}</p>
      {/* Price — key forces a crossfade when the billing changes */}
      <div className="mt-2 flex items-baseline gap-1.5 sm:mt-4">
        {!isFree && isAnnual && (
          <s className="text-[16px] font-light text-[#c8c8cc] sm:text-[19px]">{monthlyUsd}</s>
        )}
        <span
          key={`${key}-${billing}`}
          className={`animate-price-in text-[30px] font-semibold leading-none tracking-tight sm:text-[36px] md:text-[40px] ${
            isMax ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
          }`}
        >
          {isFree ? monthlyUsd : isAnnual ? annualPerMonthUsd : monthlyUsd}
        </span>
        {!isFree && <span className="text-[13px] font-light text-[#707070] sm:text-[14px]">{t(`${prefix}Period`)}</span>}
      </div>
      {!isFree && (
        <p className="mt-1 text-[11px] font-light text-[#707070] sm:mt-1.5 sm:text-[11.5px]">
          {isAnnual
            ? t('pricingAnnualNote', { amount: yearlyTotalUsd })
            : t('pricingYearlyNote', { amount: yearlyTotalUsd })}
        </p>
      )}

      <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-widest text-[#5f6368] sm:mt-6 sm:text-[11px]">{t('pricingFeaturesLabel')}</p>
      {/* Features */}
      <ul className="mt-3 flex-1 space-y-2 sm:mt-5 sm:space-y-2.5">
        {(planBenefitKeys[key] ?? plan.features.map((_, i) => `${prefix}Feature${i + 1}`)).filter((benefitKey) => t.has(benefitKey)).map((benefitKey) => (
          <li
            key={benefitKey}
            className="flex items-start gap-2 text-[12.5px] text-[#474747] transition-colors duration-200 group-hover:text-[#3a3a3c] sm:gap-2.5 sm:text-[13.5px]"
          >
            <span className={`mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isFree ? 'text-emerald-500' : 'text-[#0071e3]'}`}>
              <CheckIcon />
            </span>
            <span>{t(benefitKey)}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-5 sm:mt-7">
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
        <p className="mt-2 text-center text-[10.5px] text-[#707070] sm:mt-2.5 sm:text-[11px]">{t(`${prefix}Note`)}</p>
      </div>
    </div>
  )
}

export default function PricingSection() {
  const t = useTranslations('marketing')
  const [billing, setBilling] = useState<Billing>('monthly')
  // Active plan on mobile (segmented selector). `null` = never switched, so
  // Active plan on mobile (segmented selector). `null` = never switched, so
  // the reveal animation plays once and tab switches don't replay it.
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()
  const { ref: cardsRef, shown } = useInViewOnce<HTMLDivElement>(0.08)
  const { data: rawCatalog } = usePublicCatalog()
  const catalog = rawCatalog ?? DEFAULT_CATALOG

  const currency = catalog.currency ?? 'USD'

  const activePlans = catalog.plans.filter((p) => p.is_active)
  const sourcePlans = activePlans.length > 0 ? activePlans : DEFAULT_CATALOG.plans

  const plans: PricingPlan[] = sourcePlans
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      key: p.key,
      credits_per_period: p.credits_per_period,
      price_monthly_usd: p.price_monthly_usd,
      price_yearly_usd: p.price_yearly_usd,
      features: p.features,
      daily_quota: p.daily_quota,
      weekly_quota: p.weekly_quota,
      sort_order: p.sort_order,
    }))

  // Mobile selector defaults to the "Popular" plan (max); falls back to the
  // first active plan if the catalog doesn't include one named `max`.
  const activePlan = plans.find((p) => p.key === activeKey) ?? plans.find((p) => p.key === 'max') ?? plans[0]
  const activeIdx = plans.findIndex((p) => p.key === activePlan.key)

  // Savings badge: derived from the first paid plan (1 − yearly/(monthly×12)).
  const paid = plans.find((p) => p.price_monthly_usd > 0)
  const savingsPct = paid ? Math.max(0, Math.round((1 - paid.price_yearly_usd / (paid.price_monthly_usd * 12)) * 100)) : 0

  return (
    <section id="pricing" className="relative overflow-hidden border-t border-[#d2d2d7] bg-white">
      {/* Ambient 3D background — pure visual layer, no pointer events.
          Without WebGL a soft radial glow keeps the section looking intentional
          instead of leaving an empty gap over the white background. */}
      <SceneDynamic
        className="pointer-events-none absolute inset-0 z-0"
        activeFrameloop="always"
        fallback={<AmbientGlowFallback />}
      >
        <PricingGlow />
      </SceneDynamic>

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-24">
        {/* Header — label + heading only; the subheading moved beside the toggle */}
        <div
          className={`mx-auto mb-6 max-w-2xl text-center transition-all duration-700 sm:mb-10 ${
            shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-[#0071e3] sm:mb-3 sm:text-[11px]">
            {t('pricingLabel')}
          </p>
          <h2 className="text-balance text-[24px] font-semibold leading-[1.12] tracking-tight text-[#1d1d1f] sm:text-[32px] sm:leading-[1.08] md:text-[36px] lg:text-[42px]">
            {t('pricingHeading')}
          </h2>
        </div>

        {/* Billing toggle — sliding thumb */}
        <div className="mb-6 flex flex-col items-center gap-2 sm:mb-9 sm:gap-2.5">
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
                className={`relative z-10 rounded-full px-4 py-1 text-[12px] sm:px-5 sm:py-1.5 sm:text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 ${
                  billing === option ? 'text-[#1d1d1f]' : 'text-[#707070] hover:text-[#1d1d1f]'
                }`}
              >
                {t(option === 'monthly' ? 'pricingMonthly' : 'pricingAnnual')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:gap-x-3">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 sm:px-3 sm:py-1 sm:text-[11px]">
              {t('pricingAnnualSave', { pct: savingsPct })}
            </span>
            <span className="text-[11.5px] font-light text-[#707070] sm:text-[12px]">{t('pricingSubheading')}</span>
          </div>
        </div>

        {/*
          Cards:
          - Mobile: a segmented plan selector + a single active card (compact).
          - Desktop (lg+): the full 3-column grid, each card revealing with its
            own stagger delay (the delay is dropped once shown so hover
            transitions stay instant).
        */}
        <div ref={cardsRef} className="mx-auto max-w-5xl">
          {/* Plan selector — mobile only */}
          <div
            role="group"
            aria-label={t('pricingPlanLabel')}
            className="relative mb-6 flex rounded-full border border-[#d2d2d7] bg-[#f5f5f7] p-1 lg:hidden"
          >
            {/* Sliding thumb */}
            <span
              aria-hidden="true"
              className="absolute left-1 top-1 h-[calc(100%-8px)] w-[calc((100%-8px)/3)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${activeIdx * 100}%)` }}
            />
            {plans.map((p) => {
              const prefix = planLabel(p.key)
              const selected = p.key === activePlan.key
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveKey(p.key)}
                  className={`relative z-10 flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 ${
                    selected ? 'text-[#1d1d1f]' : 'text-[#707070] hover:text-[#1d1d1f]'
                  }`}
                >
                  {t(`${prefix}Name`)}
                </button>
              )
            })}
          </div>

          {/* Mobile: single active card. The reveal plays only on first scroll
              into view (activeKey === null); switching tabs swaps content
              without replaying the blur reveal. */}
          <div className="lg:hidden">
            <PlanCard
              key={activePlan.key}
              plan={activePlan}
              billing={billing}
              currency={currency}
              idx={activeIdx}
              reveal={shown && !reducedMotion && activeKey === null}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Desktop: full 3-column grid */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-3 lg:gap-8">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                billing={billing}
                currency={currency}
                idx={idx}
                reveal={shown && !reducedMotion}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </div>

        {/* Disclaimer — like Anthropic's pricing footer: honest, links to details */}
        <p className="mx-auto mt-10 max-w-3xl text-pretty text-center text-[12px] font-light leading-relaxed text-[#707070]">
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
