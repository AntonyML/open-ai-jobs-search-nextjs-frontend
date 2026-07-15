'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { useEffect, useState } from 'react'

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

const FEATURES = [
  {
    icon: <IconBrain />,
    title: 'Multi-Provider AI',
    description: 'Automatically failover across OpenAI, Anthropic, NVIDIA, and more. Never let a rate limit stop your job search.',
  },
  {
    icon: <IconSearch />,
    title: 'Smart Job Discovery',
    description: 'Aggregate listings from LinkedIn, Jobbank, Jobindex, and other portals. Filter by relevance automatically.',
  },
  {
    icon: <IconBarChart />,
    title: 'Resilient Ranking',
    description: 'Deterministic keyword matching + AI-powered qualitative scoring. See exactly why each job fits your profile.',
  },
  {
    icon: <IconRocket />,
    title: 'Auto-Apply Pipeline',
    description: 'Generate tailored CVs and cover letters for every application. Track outcomes and improve over time.',
  },
  {
    icon: <IconShield />,
    title: 'Privacy First',
    description: 'Your data stays yours. API keys are encrypted at rest. No training on your profile or job matches.',
  },
  {
    icon: <IconSparkles />,
    title: 'Interview Preparation',
    description: 'AI-generated interview prep based on the job description and your profile. Walk in confident.',
  },
]

const PIPELINE_STEPS = [
  { num: '01', label: 'Configure', desc: 'Connect your preferred AI provider', color: 'from-blue-400 to-cyan-300' },
  { num: '02', label: 'Profile', desc: 'Build your candidate profile', color: 'from-cyan-400 to-teal-300' },
  { num: '03', label: 'Discover', desc: 'Find jobs across multiple portals', color: 'from-teal-400 to-emerald-300' },
  { num: '04', label: 'Evaluate', desc: 'AI-powered ranking against your profile', color: 'from-emerald-400 to-green-300' },
  { num: '05', label: 'Apply', desc: 'Generate CV + cover letter', color: 'from-green-400 to-yellow-300' },
  { num: '06', label: 'Prepare', desc: 'Interview prep tailored to each role', color: 'from-yellow-400 to-amber-300' },
  { num: '07', label: 'Track', desc: 'Monitor outcomes and iterate', color: 'from-amber-400 to-rose-300' },
]

export default function HomePage() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  return (
    <>
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f5f5f7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white/60 px-3 py-1 text-[11px] font-medium text-[#707070] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now with multi-provider failover
          </div>

          {/* Headline */}
          <h1 className="text-[44px] md:text-[56px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] max-w-4xl mx-auto">
            Your AI-powered
            <br />
            <span className="text-[#0071e3]">career accelerator</span>
          </h1>

          <p className="mt-5 text-[20px] md:text-[24px] font-light text-[#707070] leading-snug max-w-2xl mx-auto">
            Discover, evaluate, and apply to jobs with an orchestrated AI pipeline.
            <br className="hidden md:block" />
            No rate limits. No downtime. Just results.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href={loggedIn ? '/providers' : '/register'}
              className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all shadow-sm"
            >
              {loggedIn ? 'Go to Dashboard' : 'Start for free'}
              <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center rounded-full border border-[#0066cc] px-6 py-3 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
            >
              Learn more
            </Link>
          </div>

          {/* Hero visual - decorative gradient */}
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
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">Features</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              Everything you need to land your next role
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              An orchestrated AI pipeline that works while you sleep.
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

      {/* ── Pipeline Section ─────────────────────────────────────── */}
      <section id="pipeline" className="bg-[#f5f5f7] border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">Pipeline</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              From discovery to offer
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              Seven steps. One seamless flow.
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
      <section className="bg-white border-t border-[#d2d2d7]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-20 md:py-28 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
              Ready to accelerate your career?
            </h2>
            <p className="mt-4 text-[17px] text-[#707070] font-light">
              Join the waitlist or start ranking jobs in minutes. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link
                href={loggedIn ? '/providers' : '/register'}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#0068d2] transition-all shadow-sm"
              >
                {loggedIn ? 'Open Dashboard' : 'Get started free'}
                <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-[#0066cc] px-7 py-3.5 text-[15px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                About the project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
