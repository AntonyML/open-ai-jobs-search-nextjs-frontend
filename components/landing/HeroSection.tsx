'use client'

import Link from 'next/link'

interface HeroSectionProps {
  loggedIn: boolean
  pipelineSteps: { num: string; label: string; desc: string; color: string }[]
  t: (key: string) => string
}

export function HeroSection({ loggedIn, pipelineSteps, t }: HeroSectionProps) {
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
          <Link
            href={loggedIn ? '/providers' : '/register'}
            className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2]"
          >
            {loggedIn ? t('ctaDashboard') : t('ctaTryFree')}
            <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* Pipeline visualization */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-[#d2d2d7]/60 bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe] p-8 md:p-12">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-7">
            {pipelineSteps.slice(0, 7).map((step, i) => (
              <div key={step.num} className="flex flex-col items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-sm md:h-12 md:w-12 ${step.color}`}>
                  {step.num}
                </div>
                <p className="text-center text-[10px] font-semibold text-[#1d1d1f] md:text-[11px]">{step.label}</p>
                {i < 6 && <div className="hidden h-px w-4 bg-[#d2d2d7] md:block" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
