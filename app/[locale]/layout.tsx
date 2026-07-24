import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import dynamic from 'next/dynamic'
import { TooltipProvider } from '@/components/ui/tooltip'

const AccessibilityProvider = dynamic(
  () => import('@/components/AccessibilityProvider'),
  { ssr: false },
)
const SoundProvider = dynamic(
  () => import('@/components/SoundProvider'),
  { ssr: false },
)

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TooltipProvider>
        <AccessibilityProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </AccessibilityProvider>
      </TooltipProvider>
    </NextIntlClientProvider>
  )
}
