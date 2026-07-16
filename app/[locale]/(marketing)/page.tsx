'use client'

import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

// ── Icon Components ────────────────────────────────────────────────

function IconSparkles() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 6 6 0 1 0-9-9Z" /><path d="M20 13v4" /><path d="M20 21v.01" /><path d="M9 12h4" /><path d="M11 10v4" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1.1 2.8" /><path d="M8 6a4 4 0 0 1 4-4" /><path d="M4 10a4 4 0 0 1 4-4" /><path d="M4 18a4 4 0 0 0 4 4" /><path d="M20 18a4 4 0 0 1-4 4" /><path d="M16 22a4 4 0 0 1-4-4V4" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconRocket() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

function IconBarChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}



// ── Data ───────────────────────────────────────────────────────────

const STEP_COLORS = [
  'from-blue-400 to-cyan-300',
  'from-cyan-400 to-teal-300',
  'from-teal-400 to-emerald-300',
  'from-emerald-400 to-green-300',
  'from-green-400 to-yellow-300',
  'from-yellow-400 to-amber-300',
  'from-amber-400 to-rose-300',
]

const STEP_NUMS = ['01', '02', '03', '04', '05', '06', '07']



export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const t = useTranslations('marketing')

  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  const FEATURES = [
    {
      icon: <IconBrain />,
      title: t('featureMultiProviderTitle'),
      description: t('featureMultiProviderDesc'),
    },
    {
      icon: <IconSearch />,
      title: t('featureDiscoveryTitle'),
      description: t('featureDiscoveryDesc'),
    },
    {
      icon: <IconBarChart />,
      title: t('featureRankingTitle'),
      description: t('featureRankingDesc'),
    },
    {
      icon: <IconRocket />,
      title: t('featureApplyTitle'),
      description: t('featureApplyDesc'),
    },
    {
      icon: <IconShield />,
      title: t('featurePrivacyTitle'),
      description: t('featurePrivacyDesc'),
    },
    {
      icon: <IconSparkles />,
      title: t('featureInterviewTitle'),
      description: t('featureInterviewDesc'),
    },
  ]

  const PIPELINE_STEPS = STEP_NUMS.map((num, i) => ({
    num,
    label: t(`step${num}Label`),
    desc: t(`step${num}Desc`),
    color: STEP_COLORS[i],
  }))

  return (
    <>
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f5f5f7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/60 px-3 py-1 text-[11px] font-medium text-[#707070] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('heroBadge')}
          </div>

          <h1 className="text-[44px] md:text-[56px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] max-w-4xl mx-auto">
            {t('heroHeading1')}
            <br />
            <span className="text-[#0071e3]">{t('heroHeading2')}</span>
          </h1>

          <p className="mt-5 text-[20px] md:text-[24px] font-light text-[#707070] leading-snug max-w-2xl mx-auto">
            {t('heroDesc1')}
            <br className="hidden md:block" />
            {t('heroDesc2')}
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href={loggedIn ? '/providers' : '/register'}
              className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all shadow-sm"
            >
              {loggedIn ? t('ctaDashboard') : t('ctaTryFree')}
              <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

             {/* ── Se deja para un feature future ──────────────────────────────────────── 
            <Link
              href="/#pricing"
              className="inline-flex items-center rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
            >
              View pricing
            </Link>
            */}
          </div>

          <div className="mt-16 mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe] border border-[#d2d2d7]/60 p-8 md:p-12">
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {PIPELINE_STEPS.slice(0, 7).map((step, i) => (
                <div key={step.num} className="flex flex-col items-center gap-2">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-[11px] font-bold shadow-sm`}>
                    {step.num}
                  </div>
                  <p className="text-[10px] md:text-[11px] font-semibold text-[#1d1d1f] text-center">{step.label}</p>
                  {i < 6 && <div className="hidden md:block w-4 h-px bg-[#d2d2d7]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────── */}
      <section id="features" className="bg-white border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">{t('featuresLabel')}</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              {t('featuresHeading')}
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              {t('featuresSubheading')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[#d2d2d7] bg-white p-6 hover:border-[#0071e3]/30 hover:shadow-sm transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-[#f4f8fb] flex items-center justify-center group-hover:bg-[#e8f0fe] transition-colors">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1d1d1f]">{feature.title}</h3>
                <p className="mt-2 text-[14px] text-[#707070] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────────────── */}
       {/* ── Se deja para un feature ──────────────────────────────────────── */}
      {/*
      <section id="pricing" className="bg-[#f5f5f7] border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">Pricing</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              No hidden fees. No long-term contracts. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-[#0071e3] bg-white shadow-md relative'
                    : 'border-[#d2d2d7] bg-white hover:border-[#0071e3]/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0071e3] px-3 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-[32px] font-bold text-[#1d1d1f]">{plan.price}</span>
                    <span className="text-[13px] text-[#858585]">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#707070]">{plan.description}</p>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#474747]">
                      <span className="mt-0.5 shrink-0"><Check /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Enterprise' ? '#' : loggedIn ? '/providers' : '/register'}
                  className={`block text-center rounded-full px-4 py-2.5 text-[13px] font-medium transition-all ${
                    plan.highlighted
                      ? 'bg-[#0071e3] text-white hover:bg-[#0068d2]'
                      : 'border border-[#0066cc] text-[#0066cc] hover:bg-[#f4f8fb]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-[#858585]">
            All plans include encrypted data storage and multi-provider AI orchestration.
            Billing features coming soon — currently in early access.
          </p>
        </div>
      </section>
      */}
      {/* ── Pipeline Section ─────────────────────────────────────── */}
      <section id="pipeline" className="bg-white border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">{t('pipelineLabel')}</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              {t('pipelineHeading')}
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              {t('pipelineSubheadingShort')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={step.num}
                className="group flex items-start gap-5 rounded-xl border border-[#d2d2d7] bg-white p-5 hover:border-[#0071e3]/30 hover:shadow-sm transition-all duration-300"
              >
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-[13px] font-bold shrink-0`}>
                  {step.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{step.label}</h3>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <span className="hidden md:inline text-[#d2d2d7]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] text-[#858585]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              {t('ctaHeading')}
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              {t('ctaSubheading')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all shadow-sm"
              >
                {loggedIn ? t('ctaOpenDashboard') : t('ctaGetStarted')}
                <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              {/* ── Se deja para un feature future ──────────────────────────────────────── 
              <Link
                href="/#pricing"
                className="inline-flex items-center rounded-full border border-[#0066cc] px-7 py-3.5 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                See plans
              </Link>
              */}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
