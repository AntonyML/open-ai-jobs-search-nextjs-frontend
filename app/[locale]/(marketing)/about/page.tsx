'use client'

import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

const TECH_STACK_KEYS = [
  { categoryKey: 'techFrontend', items: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'] },
  { categoryKey: 'techBackend', items: ['FastAPI', 'Python 3.12+', 'SQLAlchemy', 'Alembic', 'Pydantic'] },
  { categoryKey: 'techAI', items: ['LiteLLM', 'OpenAI API', 'Anthropic API', 'NVIDIA NIM', 'OpenRouter'] },
  { categoryKey: 'techInfra', items: ['PostgreSQL', 'Docker', 'Fly.io', 'JWT Auth', 'Encrypted Credentials'] },
]

export default function AboutPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const t = useTranslations('about')
  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">{t('label')}</p>
          <h1 className="text-[40px] md:text-[52px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] max-w-3xl mx-auto">
            {t('heroHeading')}
          </h1>
          <p className="mt-4 text-[17px] md:text-[20px] text-[#707070] font-light max-w-2xl mx-auto">
            {t('heroDesc')}
          </p>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f]">
              {t('problemHeading')}
            </h2>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              {t('problemP1')}
            </p>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              {t('problemP2')}
            </p>

            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f] pt-6">
              {t('solutionHeading')}
            </h2>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              {t('solutionP1')}
            </p>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              {t('solutionP2')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f] text-center mb-12">
              {t('techHeading')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {TECH_STACK_KEYS.map(category => (
                <div
                  key={category.categoryKey}
                  className="rounded-xl border border-[#d2d2d7] bg-white p-5 hover:border-[#0071e3]/30 transition-all duration-300"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">
                    {t(category.categoryKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map(item => (
                      <span
                        key={item}
                        className="rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-1 text-[12px] font-medium text-[#474747]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f]">
              {t('ctaHeading')}
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              {t('ctaDesc')}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all"
              >
                {loggedIn ? t('ctaDashboard') : t('ctaGetStarted')}
              </Link>
              {/* ── Se deja para un feature future ──────────────────────────────────────── 
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                View pricing
              </Link>
              */}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
