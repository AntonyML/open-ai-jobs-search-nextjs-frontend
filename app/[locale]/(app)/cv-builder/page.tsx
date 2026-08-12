'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AppleTabs } from '@/components/ui/apple-tabs'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { CvBuilderDatos } from '@/components/cv-builder/CvBuilderDatos'
import { CvBuilderBase } from '@/components/cv-builder/CvBuilderBase'
import { CvBuilderOferta } from '@/components/cv-builder/CvBuilderOferta'

export default function CvBuilderPage() {
  const t = useTranslations('cvBuilder')
  const [tab, setTab] = useState('datos')

  const tabs = [
    { key: 'datos', label: t('datosTab') },
    { key: 'base', label: t('baseTab') },
    { key: 'oferta', label: t('ofertaTab') },
  ]

  return (
    <section className="mx-auto max-w-3xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mb-6">
        <AppleTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'datos' && <CvBuilderDatos />}
      {tab === 'base' && <CvBuilderBase />}
      {tab === 'oferta' && <CvBuilderOferta />}
    </section>
  )
}