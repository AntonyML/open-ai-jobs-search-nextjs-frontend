import { getTranslations } from 'next-intl/server'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { FeatureShowcase3D } from '@/components/three/FeatureShowcase3D'
import {
  IconBarChart,
  IconBrain,
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
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('featuresLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('featuresHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('featuresSubheading')}</p>
        </div>

        {/* 3D spotlight: resilient AI orchestration */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#d2d2d7] bg-gradient-to-br from-[#f4f8fb] to-[#e8f0fe] md:grid md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
              <IconBrain />
            </div>
            <h3 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] md:text-[28px]">
              {t('featureOrchTitle')}
            </h3>
            <p className="mt-3 max-w-md text-[15px] font-light leading-relaxed text-[#707070]">
              {t('featureOrchDesc')}
            </p>
          </div>
          <div className="relative min-h-[260px] md:min-h-[320px]">
            <SceneDynamic
              className="absolute inset-0"
              activeFrameloop="always"
              interactive
            >
              <FeatureShowcase3D />
            </SceneDynamic>
          </div>
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
