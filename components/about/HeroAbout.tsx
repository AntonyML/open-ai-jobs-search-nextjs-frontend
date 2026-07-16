'use client'

export function HeroAbout({ t }: { t: (key: string) => string }) {
  return (
    <section className="border-b border-[#d2d2d7] bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 text-center md:px-8 md:py-24">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
          {t('label')}
        </p>
        <h1 className="mx-auto max-w-3xl text-[40px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[52px]">
          {t('heroHeading')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[17px] font-light text-[#707070] md:text-[20px]">
          {t('heroDesc')}
        </p>
      </div>
    </section>
  )
}
