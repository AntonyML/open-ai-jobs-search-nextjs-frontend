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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        {certifications.map((cert, idx) => {
          const nameId = `cert-name-${cert._id}`
          const issuerId = `cert-issuer-${cert._id}`
          const dateId = `cert-date-${cert._id}`
          const urlId = `cert-url-${cert._id}`

          return (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('certName')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    <span className="sr-only"> ({t('required')})</span>
                  </label>
                  <input
                    id={nameId}
                    name={`certName_${cert._id}`}
                    required
                    aria-required="true"
                    className="field"
                    placeholder="e.g. AWS Solutions Architect, Scrum Foundation"
                    value={cert.name}
                    onChange={(e) => onUpdate(cert._id, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={issuerId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('certIssuer')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
                    <span className="sr-only"> ({t('required')})</span>
                  </label>
                  <input
                    id={issuerId}
                    name={`certIssuer_${cert._id}`}
                    required
                    aria-required="true"
                    className="field"
                    placeholder="e.g. Amazon, Cisco, CertiProf"
                    value={cert.issuer}
                    onChange={(e) => onUpdate(cert._id, 'issuer', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={dateId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('certYear')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                  </label>
                  <input
                    id={dateId}
                    className="field"
                    placeholder="e.g. 2023 or 2023-06"
                    value={cert.issue_date}
                    onChange={(e) => onUpdate(cert._id, 'issue_date', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={urlId} className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {t('certUrl')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
                  </label>
                  <input
                    id={urlId}
                    type="url"
                    className="field"
                    placeholder="https://..."
                    value={cert.credential_url}
                    onChange={(e) => onUpdate(cert._id, 'credential_url', e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleCard>
          )
        })}
      </CollapsibleCardListWrapper>
    </div>
  )
}
