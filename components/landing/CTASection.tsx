'use client'

import Link from 'next/link'

interface CTASectionProps {
  loggedIn: boolean
  t: (key: string) => string
}

export function CTASection({ loggedIn, t }: CTASectionProps) {
  return (
    <section className="border-t border-[#d2d2d7] bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1440px] px-5 py-20 text-center md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('ctaHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">
            {t('ctaSubheading')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href={loggedIn ? '/providers' : '/register'}
              className="inline-flex items-center rounded-full bg-[#0071e3] px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#0068d2]"
            >
              {loggedIn ? t('ctaOpenDashboard') : t('ctaGetStarted')}
              <svg className="ml-1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
