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


import { Toaster } from 'react-hot-toast'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'

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
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <meta name="google" content="notranslate" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <TooltipProvider>
              <ClientProviders>
                {children}
              </ClientProviders>
            </TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
        <Toaster
          position="bottom-center"
          gutter={10}
          containerClassName="toast-container"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '14px',
              background: '#1d1d1f',
              color: '#f5f5f7',
              fontSize: '14px',
              padding: '14px 18px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            },
          }}
        />
      </body>
    </html>
  )
}
