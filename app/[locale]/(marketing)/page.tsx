import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { FAQ, getFaqItems } from '@/components/landing/FAQ'
import { constructMetadata } from '@/lib/seo'
import { StickyCtaDynamic as StickyCta } from '@/components/landing/StickyCtaDynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return constructMetadata({
    title:
      locale === 'es'
        ? 'Generador de CV con IA | CV listo para ATS'
        : 'AI Resume Builder | ATS-ready CVs',
    description:
      locale === 'es'
        ? 'Crea tu CV profesional con IA, adáptalo a cada oferta de trabajo y prepárate para tu próxima entrevista.'
        : 'Create a professional resume with AI, tailor it to each job offer, and prepare for your next interview.',
    locale,
    path: '',
    keywords:
      locale === 'es'
        ? ['generador de CV gratis', 'crear currículum gratis', 'CV para ATS', 'adaptar CV a oferta de trabajo', 'buscar trabajo en Costa Rica']
        : ['AI resume builder', 'free resume builder', 'ATS resume checker', 'tailor resume to job description', 'cover letter generator'],
  })
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const faq = getFaqItems(locale)
  const jsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <FAQ locale={locale} />
      <StickyCta />
    </>
  )
}

