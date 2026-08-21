import { getTranslations } from 'next-intl/server'
import {
  IconBarChart,
  IconCoins,
  IconFileText,
  IconRocket,
  IconShield,
  IconSparkles,
} from './MarketingIcons'

export async function FeaturesSection() {
  const t = await getTranslations('marketing')

  const features = [
    { icon: <IconFileText />, title: t('featureCvTitle'), description: t('featureCvDesc') },
    { icon: <IconBarChart />, title: t('featureRankTitle'), description: t('featureRankDesc') },
    { icon: <IconCoins />, title: t('featureCreditsTitle'), description: t('featureCreditsDesc') },
    { icon: <IconRocket />, title: t('featureApplyTitle'), description: t('featureApplyDesc') },
    { icon: <IconSparkles />, title: t('featureInterviewTitle'), description: t('featureInterviewDesc') },
    { icon: <IconShield />, title: t('featurePrivacyTitle'), description: t('featurePrivacyDesc') },
  ]

  return (
    <section id="features" className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-24">
        {/* Section header — compact: the list below speaks for itself */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-[#0071e3] sm:mb-3 sm:text-[11px]">
            {t('featuresLabel')}
          </p>
          <h2 className="text-balance text-[24px] font-semibold leading-[1.12] tracking-tight text-[#1d1d1f] sm:text-[32px] sm:leading-[1.08] md:text-[40px] lg:text-[48px]">
            {t('featuresHeading')}
          </h2>
        </div>

        {/* Editorial numbered list — no cards, hairline rows (Linear/Stripe style).
            On small screens the number sits inline with the title (compact), on
            md+ it becomes the left column and the arrow only appears on hover
            (touch devices have no hover, so it stays visible there). */}
        <div className="mx-auto max-w-5xl">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group grid gap-2.5 border-b border-[#d2d2d7]/60 py-4 transition-colors last:border-b-0 hover:bg-[#f4f8fb] sm:gap-3 sm:py-5 md:grid-cols-[80px_1fr] md:items-baseline md:gap-6 md:px-4 md:py-6"
            >
              {/* Number — own column on md+; inline with the title on mobile */}
              <span
                aria-hidden="true"
                className="hidden text-[26px] font-light leading-none tracking-tight text-[#c8c8cc] transition-colors group-hover:text-[#0071e3] md:block lg:text-[28px]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="md:col-start-2">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span
                    aria-hidden="true"
                    className="text-[18px] font-light leading-none tracking-tight text-[#c8c8cc] transition-colors group-hover:text-[#0071e3] sm:text-[20px] md:hidden"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f4f8fb] transition-colors group-hover:bg-[#e8f0fe] sm:h-8 sm:w-8">
                    {feature.icon}
                  </span>
                  <h3 className="text-[15px] font-semibold text-[#1d1d1f] transition-colors group-hover:text-[#0071e3] sm:text-[17px] md:text-[19px]">
                    {feature.title}
                  </h3>
                  <svg
                    aria-hidden="true"
                    className="ml-auto h-4 w-4 shrink-0 text-[#0071e3] transition-all duration-300 md:-translate-x-1 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
                <p className="mt-1.5 max-w-2xl text-pretty text-[13.5px] font-light leading-relaxed text-[#707070] sm:mt-2.5 sm:text-[14.5px] md:text-[15px]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
