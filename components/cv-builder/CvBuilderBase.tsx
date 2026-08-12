'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch, ApiError } from '@/lib/api'
import type { CVResponse } from '@/lib/cv'
import { showError, showSuccess } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'
import { CvPdfPreview } from '@/components/cv-builder/CvPdfPreview'

export function CvBuilderBase() {
  const t = useTranslations('cvBuilder')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [cv, setCv] = useState<CVResponse | null>(null)

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await apiFetch<CVResponse>('/api/v1/cv/base', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setCv(res)
      showSuccess(t('baseGenerated'))
    } catch (x: any) {
      if (x instanceof ApiError && x.status === 400) {
        setError(t('profileRequired'))
        showError(t('profileRequired'))
      } else {
        const msg = x instanceof Error ? x.message : t('baseFailed')
        setError(msg)
        showError(msg)
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#d2d2d7]/60 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-[#1d1d1f]">{t('baseInfoTitle')}</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-[#707070]">{t('baseInfoSubtitle')}</p>
        </div>
        <AppleButton loading={generating} disabled={generating} onClick={generate} className="w-full sm:w-auto">
          {generating ? t('baseGenerating') : t('baseGenerate')}
        </AppleButton>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {cv && <CvPdfPreview cv={cv} />}
    </div>
  )
}