import { getTranslations } from 'next-intl/server'
import { IconBrain, IconSearch, IconBarChart, IconRocket, IconShield, IconSparkles } from './MarketingIcons'

export async function FeaturesSection() {
  const t = await getTranslations('marketing')

  const features = [
    { icon: <IconBrain />, title: t('featureMultiProviderTitle'), description: t('featureMultiProviderDesc') },
    { icon: <IconSearch />, title: t('featureDiscoveryTitle'), description: t('featureDiscoveryDesc') },
    { icon: <IconBarChart />, title: t('featureRankingTitle'), description: t('featureRankingDesc') },
    { icon: <IconRocket />, title: t('featureApplyTitle'), description: t('featureApplyDesc') },
    { icon: <IconShield />, title: t('featurePrivacyTitle'), description: t('featurePrivacyDesc') },
    { icon: <IconSparkles />, title: t('featureInterviewTitle'), description: t('featureInterviewDesc') },
  ]

  return (
    <section id="features" className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('featuresLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('featuresHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">
            {t('featuresSubheading')}
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-[#d2d2d7] bg-white p-6 transition-all duration-300 hover:border-[#0071e3]/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f4f8fb] transition-colors group-hover:bg-[#e8f0fe]">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-[17px] font-semibold text-[#1d1d1f]">{feature.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#707070]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
