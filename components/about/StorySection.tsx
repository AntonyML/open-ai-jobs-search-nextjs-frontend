'use client'

const SOCIAL_LINKS = [
  {
    href: 'https://github.com/AntonyML',
    labelKey: 'builtByGithub',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
      </svg>
    ),
  },
  {
    href: 'https://www.linkedin.com/in/antony-monge-lopez/',
    labelKey: 'builtByLinkedin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
]

export function StorySection({ t }: { t: (key: string) => string }) {
  return (
    <section className="border-b border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[36px]">
            {t('problemHeading')}
          </h2>
          <p className="text-[17px] leading-relaxed text-[#707070]">{t('problemP1')}</p>
          <p className="text-[17px] leading-relaxed text-[#707070]">{t('problemP2')}</p>

          <h2 className="pt-6 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[36px]">
            {t('solutionHeading')}
          </h2>
          <p className="text-[17px] leading-relaxed text-[#707070]">{t('solutionP1')}</p>
          <p className="text-[17px] leading-relaxed text-[#707070]">{t('solutionP2')}</p>

          <div className="pt-10">
            <div className="rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] p-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
                {t('builtByHeading')}
              </p>
              <h3 className="mt-2 text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
                {t('builtByName')}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-[15px] font-light leading-relaxed text-[#707070]">
                {t('builtByRole')}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {SOCIAL_LINKS.map(({ href, labelKey, icon }) => (
                  <a
                    key={labelKey}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-5 py-2 text-[14px] font-medium text-[#1d1d1f] transition-all hover:border-[#0071e3] hover:text-[#0071e3]"
                  >
                    {icon}
                    {t(labelKey)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
