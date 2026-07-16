'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import PipelinePage from '@/components/PipelinePage'
import { isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'

export default function Apply() {
  const t = useTranslations('apply')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()

  return (
    <>
      {!premium && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs text-amber-400/80 flex-1">
            {t('freeLimitation') || 'Free plan: limited to 5 applications. Upgrade to Premium for unlimited.'}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}
      <PipelinePage
        title={t('title')}
        eyebrow="05 / APPLY"
        endpoint="/api/v1/apply/"
        listEndpoint="/api/v1/apply/available-jobs?limit=200"
        fields={[{ name: 'job_posting_id', label: t('selectJob'), type: 'select' }]}
        step={4}
        next="/interview"
        actionLabel={t('generate')}
      />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  )
}
