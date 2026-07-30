'use client'

import { usePathname } from 'next/navigation'
import { Progress, ProgressIndicator, ProgressLabel } from '@/components/ui/progress'

const PIPELINE_ORDER = ['providers', 'setup', 'search', 'rank', 'apply', 'interview', 'outcome']

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0]
  const pipelineSegments = segments.filter(s => s !== locale && s !== 'pipeline')

  const currentStep = pipelineSegments[0] || ''
  const stepIndex = PIPELINE_ORDER.indexOf(currentStep)
  const totalSteps = PIPELINE_ORDER.length
  const progressPct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar for pipeline steps */}
      {stepIndex >= 0 && (
        <Progress value={progressPct} className="w-full">
          <ProgressLabel>Pipeline progress</ProgressLabel>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {stepIndex + 1} / {totalSteps}
          </span>
        </Progress>
      )}

      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
