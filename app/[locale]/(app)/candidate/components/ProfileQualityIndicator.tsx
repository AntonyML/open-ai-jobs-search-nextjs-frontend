'use client'

import { useMemo } from 'react'

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
  const { score, tips } = useMemo(() => {
    let s = 0
    const t: string[] = []

    if (hasBasicInfo) s += 25
    else t.push('Complete basic contact info & location')

    if (hasExperience) s += 25
    else t.push('Add your work experience and technologies used')

    if (hasEducation) s += 15
    else t.push('Add your education history')

    if (hasSkills) s += 15
    else t.push('Categorize your core technical skills')

    if (hasCertifications) s += 10
    else t.push('Add certifications to boost credibility')

    if (hasLanguages) s += 10
    else t.push('Add spoken languages and proficiency')

    return { score: s, tips: t }
  }, [hasBasicInfo, hasExperience, hasEducation, hasSkills, hasCertifications, hasLanguages])

  const colorClass =
    score >= 80 ? 'bg-emerald-500 text-emerald-700' : score >= 50 ? 'bg-amber-500 text-amber-700' : 'bg-rose-500 text-rose-700'

  return (
    <div className="card space-y-3 bg-gradient-to-r from-[#fbfbfd] to-[#f5f5f7] border border-[#e5e5ea]">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Profile Strength</span>
          <p className="text-xs text-[#707070]">
            {score >= 90
              ? 'Excellent! Your profile contains comprehensive data for optimal CV generation.'
              : score >= 60
              ? 'Good progress. Adding certifications and languages will enrich your CVs.'
              : 'Add more details to ensure the AI generates high-impact CVs.'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold text-[#1d1d1f]">{score}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e5ea]">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {tips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tips.slice(0, 3).map((tip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[#505050] shadow-sm border border-[#e5e5ea]"
            >
              + {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
