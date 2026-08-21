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
  // Necesario para que env(safe-area-inset-bottom) funcione en móvil (Home Indicator).
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

