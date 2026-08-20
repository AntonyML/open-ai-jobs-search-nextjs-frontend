'use client'

import dynamic from 'next/dynamic'

const AccessibilityProvider = dynamic(
  () => import('@/components/AccessibilityProvider'),
  { ssr: false },
)
const SoundProvider = dynamic(
  () => import('@/components/SoundProvider'),
  { ssr: false },
)
const ReconnectionLayer = dynamic(
  () => import('@/components/ReconnectionLayer'),
  { ssr: false },
)

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <SoundProvider>
        {children}
        <ReconnectionLayer />
      </SoundProvider>
    </AccessibilityProvider>
  )
}