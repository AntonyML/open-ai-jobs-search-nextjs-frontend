'use client'

interface PipelineStep {
  num: string
  label: string
  desc: string
  color: string
}

export function PipelineSection({
  steps,
  t,
}: {
  steps: PipelineStep[]
  t: (key: string) => string
}) {
  return (
    <section id="pipeline" className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('pipelineLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('pipelineHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">
            {t('pipelineSubheadingShort')}
          </p>
        </div>

        {/* Steps list */}
        <div className="mx-auto max-w-4xl space-y-4">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="group flex items-start gap-5 rounded-xl border border-[#d2d2d7] bg-white p-5 transition-all duration-300 hover:border-[#0071e3]/30 hover:shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[13px] font-bold text-white ${step.color}`}
              >
                {step.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{step.label}</h3>
                  {i < steps.length - 1 && (
                    <span className="hidden text-[#d2d2d7] md:inline">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-[#858585]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
