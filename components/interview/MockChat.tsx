'use client'

import type { MockResponse } from '@/types/shared'

function ChatBubble({ role, content }: { role: string; content: string }) {
  const isCandidate = role === 'candidate'
  return (
    <div className={`flex ${isCandidate ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
        isCandidate
          ? 'bg-[#0071e3] text-white rounded-br-sm'
          : 'bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-sm'
      }`}>
        <p className="text-[11px] font-medium opacity-60 mb-0.5">
          {isCandidate ? 'You' : 'Interviewer'}
        </p>
        <p className="text-sm leading-snug whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function FeedbackBubble({ feedback }: { feedback: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-xl border border-[#2997ff]/30 bg-[#f4f8fb] px-4 py-2.5 rounded-bl-sm">
        <p className="text-[11px] font-medium text-[#2997ff] mb-0.5">Feedback</p>
        <p className="text-[12px] text-[#1d1d1f] leading-snug">{feedback}</p>
      </div>
    </div>
  )
}

export function MockChat({
  mockState,
  mockAnswer,
  mockLoading,
  stageLabel,
  chatEndRef,
  onMockAnswerChange,
  onSubmitAnswer,
  onEndSession,
  t,
  tc,
}: {
  mockState: MockResponse | null
  mockAnswer: string
  mockLoading: boolean
  stageLabel: string
  chatEndRef: React.RefObject<HTMLDivElement | null>
  onMockAnswerChange: (value: string) => void
  onSubmitAnswer: (e: React.FormEvent) => void
  onEndSession: () => void
  t: (key: string, opts?: any) => string
  tc: (key: string) => string
}) {
  const mockActive = mockState != null

  return (
    <div className="card overflow-hidden flex flex-col min-h-[500px] p-0">
      {/* Header */}
      <div className="border-b border-[#d2d2d7] bg-[#fafafa] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">{t('mockInterview')}</h3>
            {mockState && (
              <p className="text-[11px] text-[#707070]">
                Question {mockState.question_number} of {mockState.total_questions}
                {stageLabel && ` · ${stageLabel}`}
              </p>
            )}
          </div>
          {mockActive && (
            <button
              onClick={onEndSession}
              className="text-[11px] text-[#707070] hover:text-[#1d1d1f] transition-colors"
            >
              {t('endSession')}
            </button>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {!mockState ? (
          <div className="flex items-center justify-center h-full text-sm text-[#858585]">
            {t('startMock')}
          </div>
        ) : mockState.transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[#858585]">
            {tc('loading')}
          </div>
        ) : (
          <>
            {mockState.transcript.map((turn, i) => (
              <ChatBubble key={i} role={turn.role} content={turn.content} />
            ))}
            {mockState.feedback && !mockState.is_complete && (
              <FeedbackBubble feedback={mockState.feedback} />
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {mockState && !mockState.is_complete && (
        <form onSubmit={onSubmitAnswer} className="border-t border-[#d2d2d7] p-4">
          <div className="flex gap-2">
            <textarea
              value={mockAnswer}
              onChange={(e) => onMockAnswerChange(e.target.value)}
              placeholder="Type your answer…"
              className="field flex-1 h-20 resize-none text-sm"
              disabled={mockLoading}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={mockLoading || !mockAnswer.trim()}
              className="rounded-full bg-[#0071e3] px-5 py-1.5 text-[12px] font-medium text-white hover:bg-[#0068d2] transition-colors disabled:opacity-40"
            >
              {mockLoading ? t('submitting') : t('submitAnswer')}
            </button>
          </div>
        </form>
      )}

      {/* Complete state */}
      {mockState?.is_complete && (
        <div className="border-t border-[#d2d2d7] p-6 text-center">
          <p className="text-sm font-semibold text-emerald-600">{t('mockComplete')}</p>
          <p className="mt-1 text-[12px] text-[#707070]">{t('mockCompleteDesc')}</p>
          <button
            onClick={onEndSession}
            className="btn-secondary mt-3 !px-4 !py-1.5 text-[12px]"
          >
            {t('backToPrep')}
          </button>
        </div>
      )}
    </div>
  )
}
