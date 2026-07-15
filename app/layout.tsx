import './globals.css'
import type { Metadata } from 'next'
import AccessibilityProvider from '@/components/AccessibilityProvider'

export const metadata: Metadata = {
  title: 'Career OS',
  description: 'AI-powered job search pipeline with multi-provider orchestration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>{children}</AccessibilityProvider>
      </body>
    </html>
  )
}
