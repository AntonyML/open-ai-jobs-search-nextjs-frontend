'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react'

interface Props {
  hasBasicInfo: boolean
  hasExperience: boolean
  hasEducation: boolean
  hasSkills: boolean
  hasCertifications: boolean
  hasLanguages: boolean
}

export function ProfileQualityIndicator({
  hasBasicInfo,
  hasExperience,
  hasEducation,
  hasSkills,
  hasCertifications,
  hasLanguages,
}: Props) {
  const t = useTranslations('setup')

  const { isReady, tips } = useMemo(() => {
    const ready = hasBasicInfo && (hasExperience || hasEducation) && hasSkills
    const tipsList: string[] = []

    if (!hasBasicInfo) tipsList.push(t('tipBasicInfo'))
    if (!hasExperience && !hasEducation) tipsList.push(t('tipExperienceOrEducation'))
    if (!hasSkills) tipsList.push(t('tipSkills'))

    // Optional enrichment suggestions
    if (ready) {
      if (!hasCertifications) tipsList.push(t('tipOptionalCertifications'))
      if (!hasLanguages) tipsList.push(t('tipOptionalLanguages'))
    }

    return { isReady: ready, tips: tipsList }
  }, [hasBasicInfo, hasExperience, hasEducation, hasSkills, hasCertifications, hasLanguages, t])

  return (
    <div className="card space-y-2.5 bg-gradient-to-r from-[#fbfbfd] to-[#f4f8fb] border border-[#d2d2d7]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isReady ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                {isReady ? t('profileReadyTitle') : t('profilePendingTitle')}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isReady
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isReady ? t('profileReadyBadge') : t('profilePendingBadge')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#5f6368] leading-relaxed">
              {isReady
                ? t('profileReadyDescription')
                : t('profilePendingDescription')}
            </p>
          </div>
        </div>
      </div>

      {tips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#e5e5ea]">
          <span className="text-[11px] text-[#5f6368] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#0071e3]" aria-hidden="true" />
            {isReady ? t('optionalImprovements') : t('essentialRequirements')}:
          </span>
          {tips.slice(0, 3).map((tip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[#1d1d1f] border border-[#d2d2d7]"
            >
              {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
