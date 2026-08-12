import { HeroSection } from '@/components/landing/HeroSection'
import { StatsStrip } from '@/components/landing/StatsStrip'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import PricingSection from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
    </>
  )
}
