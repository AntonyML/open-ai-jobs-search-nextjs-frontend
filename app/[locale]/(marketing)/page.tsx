import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { constructMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return constructMetadata({
    description:
      locale === 'es'
        ? 'Encuentra las mejores oportunidades laborales en IA, Machine Learning y Data Science con matching automatizado.'
        : 'Find top Artificial Intelligence, Machine Learning, and LLM Engineering careers powered by intelligent multi-provider matching.',
    locale,
    path: '',
  })
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </>
  )
}

