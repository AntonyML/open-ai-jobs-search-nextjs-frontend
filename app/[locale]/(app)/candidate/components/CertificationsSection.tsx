'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleCard, CollapsibleCardListWrapper } from '@/components/setup/CollapsibleCard'

export interface CertificationEntry {
  _id: string
  name: string
  issuer: string
  issue_date: string
  credential_url: string
}

interface Props {
  certifications: CertificationEntry[]
  openCards: Set<string>
  onToggle: (id: string) => void
  onUpdate: (id: string, key: keyof CertificationEntry, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function CertificationsSection({
  certifications,
  openCards,
  onToggle,
  onUpdate,
  onAdd,
  onRemove,
}: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const filled = certifications.filter((c) => c.name.trim())

  return (
    <div id="section-certifications">
      <CollapsibleCardListWrapper
      title={t('certifications')}
      countLabel={t('certificationsAdded', { count: filled.length })}
      icon={
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        </div>
      }
      count={filled.length}
      emptyMessage={t('noCertifications')}
      addLabel={t('addCertification')}
      onAdd={onAdd}
      isEmpty={certifications.length === 0}
    >
      {certifications.map((cert, idx) => (
        <CollapsibleCard
          key={cert._id}
          id={cert._id}
          index={idx}
          title={cert.name || t('certFallback', { n: idx + 1 })}
          isFilled={!!cert.name.trim()}
          isOpen={openCards.has(cert._id)}
          onToggle={onToggle}
          onRemove={onRemove}
          badgeColor="bg-amber-100"
          badgeTextColor="text-amber-700"
          placeholder="certification"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-[#1d1d1f]">
              {t('certName')} <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder="e.g. AWS Solutions Architect, Scrum Foundation"
                value={cert.name}
                onChange={(e) => onUpdate(cert._id, 'name', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('certIssuer')} <span className="text-rose-400">*</span>
              <input
                required
                className="field mt-1.5"
                placeholder="e.g. Amazon, Cisco, CertiProf"
                value={cert.issuer}
                onChange={(e) => onUpdate(cert._id, 'issuer', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('certYear')} <span className="text-[#858585]">{tc('optional')}</span>
              <input
                className="field mt-1.5"
                placeholder="e.g. 2023 or 2023-06"
                value={cert.issue_date}
                onChange={(e) => onUpdate(cert._id, 'issue_date', e.target.value)}
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('certUrl')} <span className="text-[#858585]">{tc('optional')}</span>
              <input
                type="url"
                className="field mt-1.5"
                placeholder="https://..."
                value={cert.credential_url}
                onChange={(e) => onUpdate(cert._id, 'credential_url', e.target.value)}
              />
            </label>
          </div>
        </CollapsibleCard>
      ))}
      </CollapsibleCardListWrapper>
    </div>
  )
}
