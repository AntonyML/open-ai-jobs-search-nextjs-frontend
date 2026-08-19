'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'

interface StarExample {
  id: string
  title: string
  skill_demonstrated?: string
  situation: string
  task: string
  action: string
  result: string
  use_for?: string[]
  created_at: string
}

interface StarExamplesSectionProps {
  initial: StarExample[]
}

export function StarExamplesSection({ initial }: StarExamplesSectionProps) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [stars, setStars] = useState<StarExample[]>(initial)

  // Sync when async data loads from parent
  useEffect(() => {
    setStars(initial)
  }, [initial])

  const [form, setForm] = useState({
    title: '',
    skill_demonstrated: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    use_for: '',
  })

  async function createStar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const useFor = form.use_for
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const created = await apiFetch<StarExample>('/api/v1/setup/star-examples', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          use_for: useFor.length ? useFor : undefined,
        }),
      })
      setStars((prev) => [...prev, created])
      setForm({
        title: '',
        skill_demonstrated: '',
        situation: '',
        task: '',
        action: '',
        result: '',
        use_for: '',
      })
      showSuccess(t('starCreated'))
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('error'))
    }
  }

  async function deleteStar(id: string) {
    try {
      await apiFetch(`/api/v1/setup/star-examples/${id}`, { method: 'DELETE' })
      setStars((prev) => prev.filter((s) => s.id !== id))
      showSuccess(t('starDeleted'))
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('error'))
    }
  }

  return (
    <div className="card overflow-hidden !p-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#f5f5f7]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">
              {t('starExamples')}
            </p>
            <p className="mt-0.5 text-[11px] text-[#858585]">
              {t('starCount', { count: stars.length })}
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-fade-in-up space-y-4 border-t border-[#f0f0f2] px-6 pb-6 pt-4">
          {/* Existing examples */}
          {stars.length > 0 && (
            <div className="scrollbar-thin max-h-64 space-y-2 overflow-y-auto">
              {stars.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-[#e2e2e5] p-3 transition-colors hover:border-[#d2d2d7]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1d1d1f]">{s.title}</p>
                    {s.skill_demonstrated && (
                      <span className="mt-0.5 inline-block rounded-full bg-[#f4f8fb] px-2 py-0.5 text-[10px] text-[#0066cc]">
                        {s.skill_demonstrated}
                      </span>
                    )}
                    <p className="mt-1 text-[11px] text-[#858585] line-clamp-2">
                      <strong>S:</strong> {s.situation.slice(0, 80)}
                      {s.situation.length > 80 ? '…' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteStar(s.id)}
                    className="mt-0.5 shrink-0 text-[#858585] hover:text-rose-400"
                    title={t('starDelete')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={createStar} className="space-y-3">
            <p className="text-xs font-semibold text-[#707070]">{t('starAddNew')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-[#1d1d1f]">
                {t('starTitle')} <span className="text-rose-400">*</span>
                <input
                  required
                  className="field mt-1.5"
                  placeholder="ML Pipeline Optimization"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                {t('starSkill')} <span className="text-[#858585]">{t('starSkillOpt')}</span>
                <input
                  className="field mt-1.5"
                  placeholder="Machine Learning, Leadership..."
                  value={form.skill_demonstrated}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, skill_demonstrated: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-[#1d1d1f]">
                {t('starSituation')} <span className="text-rose-400">*</span>
                <textarea
                  required
                  className="field mt-1.5 h-14 resize-none"
                  placeholder="What was the context?"
                  value={form.situation}
                  onChange={(e) => setForm((prev) => ({ ...prev, situation: e.target.value }))}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                {t('starTask')} <span className="text-rose-400">*</span>
                <textarea
                  required
                  className="field mt-1.5 h-14 resize-none"
                  placeholder="What was your responsibility?"
                  value={form.task}
                  onChange={(e) => setForm((prev) => ({ ...prev, task: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-[#1d1d1f]">
                {t('starAction')} <span className="text-rose-400">*</span>
                <textarea
                  required
                  className="field mt-1.5 h-14 resize-none"
                  placeholder="What steps did you take?"
                  value={form.action}
                  onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value }))}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                {t('starResult')} <span className="text-rose-400">*</span>
                <textarea
                  required
                  className="field mt-1.5 h-14 resize-none"
                  placeholder="What was the outcome?"
                  value={form.result}
                  onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
                />
              </label>
            </div>
            <label className="block text-sm text-[#1d1d1f]">
              {t('starUseFor')}{' '}
              <span className="text-[#858585]">{t('starUseForHint')}</span>
              <input
                className="field mt-1.5"
                placeholder="Teamwork, Python, System Design..."
                value={form.use_for}
                onChange={(e) => setForm((prev) => ({ ...prev, use_for: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn-primary w-full">
              {t('addStarExample')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
