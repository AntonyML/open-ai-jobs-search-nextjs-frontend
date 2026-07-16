'use client'

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
        </div>
      </div>
    </section>
  )
}
