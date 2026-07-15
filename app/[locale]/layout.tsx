import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import AccessibilityProvider from '@/components/AccessibilityProvider'
import SoundProvider from '@/components/SoundProvider'

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
      <AccessibilityProvider>
        <SoundProvider>
          {children}
        </SoundProvider>
      </AccessibilityProvider>
    </NextIntlClientProvider>
  )
}
