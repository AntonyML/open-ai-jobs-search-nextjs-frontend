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
          gutter={10}
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

