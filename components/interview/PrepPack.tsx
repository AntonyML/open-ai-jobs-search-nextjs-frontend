'use client'

import { useTranslations } from 'next-intl'
import type { InterviewPrep } from '@/types/pipeline'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group card">
      <summary className="cursor-pointer p-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors rounded-[8px] -m-[1px]">
        {title}
      </summary>
      <div className="px-5 pb-5 space-y-3">
        {children}
      </div>
    </details>
  )
}

export function PrepPack({ prep, onStartMock, mockLoading, t }: {
  prep: InterviewPrep
  onStartMock: () => void
  mockLoading: boolean
  t: (key: string, opts?: any) => string
}) {
  return (
    <div className="space-y-4">
      {/* Company research */}
      {prep.company_research && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">{t('companyResearch')}</h3>
          {prep.company_research.mission && (
            <p className="text-sm text-[#1d1d1f] mb-2">{prep.company_research.mission}</p>
          )}
          {prep.company_research.values.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {prep.company_research.values.map((v, i) => (
                <span key={i} className="tag-filled bg-[#f4f8fb] text-[#0066cc]">{v}</span>
              ))}
            </div>
          )}
          {prep.company_research.recent_news.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] font-medium text-[#707070]">{t('recentNews')}</p>
              {prep.company_research.recent_news.map((n, i) => (
                <p key={i} className="text-[12px] text-[#1d1d1f]">• {n.title}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Likely questions */}
      {prep.likely_questions.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
            {t('likelyQuestions', { count: prep.likely_questions.length })}
          </h3>
          <div className="space-y-2">
            {prep.likely_questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  q.priority === 'high' ? 'bg-rose-400' : q.priority === 'medium' ? 'bg-amber-400' : 'bg-[#e2e2e5]'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm text-[#1d1d1f]">{q.question}</p>
                  <p className="text-[11px] text-[#858585]">from {q.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tough questions */}
      {prep.tough_questions.length > 0 && (
        <Section title={t('toughQuestions', { count: prep.tough_questions.length })}>
          {prep.tough_questions.map((q, i) => (
            <div key={i} className="border-t border-[#e2e2e5] pt-3">
              <p className="text-[12px] font-medium text-[#1d1d1f]">Q: {q.question}</p>
              <p className="mt-1 text-[12px] text-[#707070] leading-snug">{q.answer}</p>
            </div>
          ))}
        </Section>
      )}

      {/* STAR mapping */}
      {prep.star_mapping.length > 0 && (
        <Section title={t('starExamples', { count: prep.star_mapping.length })}>
          {prep.star_mapping.map((m, i) => (
            <div key={i} className="border-t border-[#e2e2e5] pt-2">
              <p className="text-[12px] text-[#1d1d1f]">{m.question}</p>
              <p className="text-[11px] text-[#0066cc]">→ {m.star_example_title}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Questions to ask */}
      {prep.questions_to_ask.length > 0 && (
        <Section title={t('questionsToAsk', { count: prep.questions_to_ask.length })}>
          {prep.questions_to_ask.map((q, i) => (
            <div key={i} className="border-t border-[#e2e2e5] pt-2">
              <p className="text-[12px] text-[#1d1d1f]">{q.question}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="tag-filled bg-[#f4f8fb] text-[#0066cc]">{q.category}</span>
                <span className="text-[10px] text-[#858585]">{q.why_ask}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Consistency brief */}
      {prep.consistency_brief.length > 0 && (
        <Section title={t('consistencyBrief')}>
          {prep.consistency_brief.map((c, i) => (
            <div key={i} className="border-t border-[#e2e2e5] pt-2">
              <p className="text-[12px] text-[#1d1d1f]">{c.claim}</p>
              <p className="text-[11px] text-[#707070]">{c.why_probed}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Logistics */}
      {prep.logistics && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">{t('logistics')}</h3>
          {prep.logistics.phone_video_tips.length > 0 && (
            <ul className="space-y-1">
              {prep.logistics.phone_video_tips.map((tip, i) => (
                <li key={i} className="text-[12px] text-[#707070]">• {tip}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Mock interview button */}
      <button
        onClick={onStartMock}
        disabled={mockLoading}
        className="btn-primary w-full"
      >
        {mockLoading ? t('starting') : t('startMock')}
      </button>
    </div>
  )
}
