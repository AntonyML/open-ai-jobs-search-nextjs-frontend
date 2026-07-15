import './globals.css'
import type { Metadata } from 'next'
import AccessibilityProvider from '@/components/AccessibilityProvider'
import SoundProvider from '@/components/SoundProvider'

export const metadata: Metadata = {
  title: 'Career OS',
  description: 'AI-powered job search pipeline with multi-provider orchestration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          <SoundProvider>{children}</SoundProvider>
        </AccessibilityProvider>
      </body>
    </html>
  )
}
