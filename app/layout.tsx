import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Career OS',
  description: 'AI-powered job search pipeline with multi-provider orchestration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
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
              fontSize: '14px',
              padding: '12px 16px',
              maxWidth: '400px',
            },
          }}
        />
      </body>
    </html>
  )
}
