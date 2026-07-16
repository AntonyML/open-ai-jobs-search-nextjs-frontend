'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { AppleButton } from '@/components/ui/apple-button'

interface StatusPanelProps {
  saved: boolean
  exists: boolean
}

export function StatusPanel({ saved, exists }: StatusPanelProps) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')
  const router = useRouter()

  if (saved) {
    return (
      <div className="card space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-600"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">{t('saved')}</p>
            <p className="text-[11px] text-[#858585]">Your data is stored and ready</p>
          </div>
        </div>
        <AppleButton className="w-full" onClick={() => router.push('/scrape')}>
          {tc('continue')} to Scrape →
        </AppleButton>
      </div>
    )
  }

  return (
    <div className="card border-dashed">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0f2]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#858585]"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[#707070]">
            {exists ? 'Profile loaded' : 'No profile yet'}
          </p>
          <p className="text-[11px] text-[#b0b0b0]">
            {exists
              ? 'Edit and save to update.'
              : 'Fill the form and save to get started.'}
          </p>
        </div>
      </div>
    </div>
  )
}
