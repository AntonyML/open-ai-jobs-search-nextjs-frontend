'use client'

import { useTranslations } from 'next-intl'
import PipelinePage from '@/components/PipelinePage'

export default function Apply() {
  const t = useTranslations('apply')

  return (
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
  )
}
