'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface PrevStepInfo {
  key: string
  label: string
  href: string
  title: string
  description: string
  action: string
}

interface PipelineEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  steps?: { key: string; label: string; done: boolean }[]
  /** When the required previous step isn't done, show this alternative */
  prevStep?: PrevStepInfo
  /** Whether the required previous step is completed */
  prevStepDone?: boolean
}

export function PipelineEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  steps,
  prevStep,
  prevStepDone,
}: PipelineEmptyStateProps) {
  const showPrevStep = prevStep && !prevStepDone

  return (
    <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-8 md:p-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#f4f8fb] mb-4">
        <Icon className="size-6 text-[#0071e3]" />
      </div>

      {showPrevStep ? (
        <>
          {/* Previous step required — amber alert */}
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              {prevStep.label} required
            </span>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] mb-2">
            {prevStep.title}
          </h2>
          <p className="text-sm text-[#707070] max-w-sm mx-auto mb-5 leading-relaxed">
            {prevStep.description}
          </p>
          <Link
            href={prevStep.href}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0068d2] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            {prevStep.action}
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] mb-2">
            {title}
          </h2>
          <p className="text-sm text-[#707070] max-w-sm mx-auto mb-5 leading-relaxed">
            {description}
          </p>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0068d2] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
              {actionLabel}
            </Link>
          )}
        </>
      )}

      {steps && steps.length > 0 && (
        <div className="mt-7 pt-5 border-t border-[#e2e2e5]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585] mb-3">
            {prevStep ? 'Pipeline' : 'Pipeline'} progress
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {steps.map((step) => (
              <span
                key={step.key}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  step.done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-[#e2e2e5] bg-[#f5f5f7] text-[#707070]'
                }`}
              >
                {step.done && <span className="mr-0.5">✓</span>}
                {step.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
