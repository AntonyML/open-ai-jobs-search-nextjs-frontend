import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { TooltipProvider } from '@/components/ui/tooltip'
import ClientProviders from './ClientProviders'
import QueryProvider from '@/components/QueryProvider'
import { constructMetadata } from '@/lib/seo'

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return constructMetadata({
    locale,
  })
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
      <QueryProvider>
        <TooltipProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </TooltipProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  )
}
