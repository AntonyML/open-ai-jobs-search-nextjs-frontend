'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import PipelinePage from '@/components/PipelinePage'
import { isPremium, getCompletedSteps } from '@/lib/auth'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import UpgradeModal from '@/components/UpgradeModal'

export default function Apply() {
  const t = useTranslations('apply')
  const tp = useTranslations('pipeline.steps')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = isPremium()
  const { data: usage } = useUsageLimits()

  const atLimit = !premium && usage != null && usage.usage.applications >= usage.limits.max_apply_count
  const prevStepDone = getCompletedSteps().includes(3)

  return (
    <>
      {!premium && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: limited to 5 applications. Upgrade to Premium for unlimited.'}
          usage={usage ? `${usage.usage.applications}/${usage.limits.max_apply_count}` : undefined}
          upgradeLabel={t('upgrade') || 'Upgrade'}
          onUpgrade={() => setShowUpgrade(true)}
        />
      )}
      <PipelinePage
        title={t('title')}
        eyebrow="05 / APPLY"
        endpoint="/api/v1/apply/"
        listEndpoint="/api/v1/apply/available-jobs?limit=200"
        fields={[{ name: 'job_posting_id', label: t('selectJob'), type: 'select' }]}
        step={4}
        next="/pipeline/interview"
        actionLabel={t('generate')}
        actionDisabled={atLimit}
        actionDisabledTooltip={atLimit ? t('limitReached') || 'Upgrade para más aplicaciones' : ''}
        emptyTitle={t('emptyTitle')}
        emptyDesc={t('emptyDesc')}
        emptyAction={t('emptyAction')}
        emptyHref="/pipeline/rank"
        emptyPrevTitle={t('prevStepTitle')}
        emptyPrevDesc={t('prevStepDesc')}
        emptyPrevAction={t('prevStepAction')}
        emptyPrevHref="/pipeline/rank"
        emptyPrevLabel={tp('rank')}
        emptyPrevKey="rank"
        emptyPrevDone={prevStepDone}
        cardMode
        actionField="job_posting_id"
        statusEndpoint="/api/v1/apply"
        continueLabel={t('continueToInterview') || 'Continue to Interview'}
        continueTooltip={t('continueToInterviewTooltip')}
      />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  )
}
