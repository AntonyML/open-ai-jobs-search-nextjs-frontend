'use client'

import Link from 'next/link'

export function CTAAbout({ loggedIn, t }: { loggedIn: boolean; t: (key: string) => string }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[36px]">
            {t('ctaHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('ctaDesc')}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={loggedIn ? '/providers' : '/register'}
              className="inline-flex items-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-medium text-white transition-all hover:bg-[#0068d2]"
            >
              {loggedIn ? t('ctaDashboard') : t('ctaGetStarted')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
