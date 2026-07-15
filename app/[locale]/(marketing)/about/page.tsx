'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { useEffect, useState } from 'react'

const TECH_STACK = [
  { category: 'Frontend', items: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'] },
  { category: 'Backend', items: ['FastAPI', 'Python 3.12+', 'SQLAlchemy', 'Alembic', 'Pydantic'] },
  { category: 'AI/LLM', items: ['LiteLLM', 'OpenAI API', 'Anthropic API', 'NVIDIA NIM', 'OpenRouter'] },
  { category: 'Infrastructure', items: ['PostgreSQL', 'Docker', 'Fly.io', 'JWT Auth', 'Encrypted Credentials'] },
]

export default function AboutPage() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">About</p>
          <h1 className="text-[40px] md:text-[52px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] max-w-3xl mx-auto">
            Enterprise-grade AI for your job search
          </h1>
          <p className="mt-4 text-[17px] md:text-[20px] text-[#707070] font-light max-w-2xl mx-auto">
            Career OS is a premium AI orchestration platform that automates your entire job search pipeline
            with multi-provider failover, deterministic scoring, and zero downtime.
          </p>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f]">
              The problem
            </h2>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              Applying for jobs is a full-time job. Between tailoring your CV, writing cover letters,
              tracking applications, and preparing for interviews, it&apos;s easy to burn out before you
              even land an interview.
            </p>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              Most AI job tools rely on a single provider. When that provider hits a rate limit or goes
              down, your job search stops. And free tools? Your data trains their models.
            </p>

            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f] pt-6">
              The solution
            </h2>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              Career OS is an orchestrated AI execution engine designed for resilience. Instead of
              relying on a single model, it automatically falls back across providers — from Anthropic
              to NVIDIA to OpenAI — so your job search never pauses.
            </p>
            <p className="text-[17px] text-[#707070] leading-relaxed">
              We use deterministic algorithms for what computers do best (keyword matching, scoring,
              filtering) and reserve AI for what it does best (writing, reasoning, qualitative assessment).
              Your data is encrypted at rest and never used for training.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-[#1d1d1f] text-center mb-12">
              Built with modern tools
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {TECH_STACK.map(category => (
                <div
                  key={category.category}
                  className="rounded-xl border border-[#d2d2d7] bg-white p-5 hover:border-[#0071e3]/30 transition-all duration-300"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">
                    {category.category}
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
              Ready to transform your job search?
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              Start with a free account. No credit card required. Premium plans start at $19/mo.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all"
              >
                {loggedIn ? 'Go to Dashboard' : 'Get started free'}
              </Link>
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
