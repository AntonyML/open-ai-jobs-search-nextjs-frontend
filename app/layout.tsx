import './globals.css'
import type { Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { constructMetadata } from '@/lib/seo'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'

export const metadata = constructMetadata()

export const viewport: Viewport = {
  themeColor: '#0071e3',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="google" content="notranslate" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1d1d1f',
              color: '#f5f5f7',
              fontSize: '15px',
              padding: '16px 20px',
              maxWidth: '480px',
            },
          }}
        />
      </body>
    </html>
  )
}

