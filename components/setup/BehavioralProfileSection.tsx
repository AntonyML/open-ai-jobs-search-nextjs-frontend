'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'

interface Drive {
  drive: string
  level?: string
  meaning?: string
}

interface Behavior {
  behavior: string
  description?: string
}

interface GrowthArea {
  area: string
  positive_frame?: string
}

interface BehavioralProfile {
  id?: string
  profile_type?: string
  summary?: string
  drives?: Drive[]
  behaviors?: Behavior[]
  work_preferences?: string[]
  growth_areas?: GrowthArea[]
  strong_fit_keywords?: string[]
  friction_keywords?: string[]
  management_preferences?: {
    works_with: string[]
    doesnt_work: string[]
  }
}

export function BehavioralProfileSection({ initial }: { initial: BehavioralProfile }) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [bp, setBp] = useState<BehavioralProfile>(initial)
  const [saving, setSaving] = useState(false)

  // Sync when async data loads from parent
  useEffect(() => {
    setBp(initial)
  }, [initial])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      await apiFetch<BehavioralProfile>('/api/v1/setup/behavioral-profile', {
        method: 'PUT',
        body: JSON.stringify(bp),
      })
      showSuccess(t('saved'))
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('error'))
    } finally {
      setSaving(false)
    }
  }

  const updateBpDrive = useCallback((i: number, key: string, value: string) => {
    setBp((prev) => {
      const drives = [...(prev.drives || [])]
      drives[i] = { ...drives[i], [key]: value }
      return { ...prev, drives }
    })
  }, [])

  const updateBpBehavior = useCallback((i: number, key: string, value: string) => {
    setBp((prev) => {
      const behaviors = [...(prev.behaviors || [])]
      behaviors[i] = { ...behaviors[i], [key]: value }
      return { ...prev, behaviors }
    })
  }, [])

  const updateBpGrowth = useCallback((i: number, key: string, value: string) => {
    setBp((prev) => {
      const areas = [...(prev.growth_areas || [])]
      areas[i] = { ...areas[i], [key]: value }
      return { ...prev, growth_areas: areas }
    })
  }, [])

  return (
    <div className="card overflow-hidden !p-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#f5f5f7]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">
              {t('behavioralProfile')}
            </p>
            <p className="mt-0.5 text-[11px] text-[#858585]">
              {bp.profile_type || bp.drives?.length ? t('bpProfileDefined') : t('bpDesc')}
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
          <label className="block text-sm text-[#1d1d1f]">
            {t('bpProfileType')}{' '}
            <span className="text-[#858585]">{t('bpProfileTypeHint')}</span>
            <input
              className="field mt-1.5"
              placeholder={t('bpProfileTypePlaceholder')}
              value={bp.profile_type || ''}
              onChange={(e) => setBp((prev) => ({ ...prev, profile_type: e.target.value }))}
            />
          </label>

          <label className="block text-sm text-[#1d1d1f]">
            {t('bpSummary')}
            <textarea
              className="field mt-1.5 h-16 resize-none"
              value={bp.summary || ''}
              onChange={(e) => setBp((prev) => ({ ...prev, summary: e.target.value }))}
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#707070]">{t('bpCoreDrives')}</p>
              <button
                onClick={() =>
                  setBp((prev) => ({
                    ...prev,
                    drives: [...(prev.drives || []), { drive: '', level: '', meaning: '' }],
                  }))
                }
                className="text-[11px] text-[#0066cc] hover:underline"
              >
                {t('bpAddDrive')}
              </button>
            </div>
            {(bp.drives || []).map((d, i) => (
              <div key={i} className="mb-2 flex items-start gap-2">
                <input
                  className="field flex-1 text-sm"
                  placeholder={t('bpDriveName')}
                  value={d.drive}
                  onChange={(e) => updateBpDrive(i, 'drive', e.target.value)}
                />
                <input
                  className="field w-20 text-sm"
                  placeholder={t('bpLevel')}
                  value={d.level || ''}
                  onChange={(e) => updateBpDrive(i, 'level', e.target.value)}
                />
                <button
                  onClick={() =>
                    setBp((prev) => ({
                      ...prev,
                      drives: (prev.drives || []).filter((_, j) => j !== i),
                    }))
                  }
                  className="mt-1.5 shrink-0 text-[#858585] hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#707070]">{t('bpBehaviors')}</p>
              <button
                onClick={() =>
                  setBp((prev) => ({
                    ...prev,
                    behaviors: [...(prev.behaviors || []), { behavior: '', description: '' }],
                  }))
                }
                className="text-[11px] text-[#0066cc] hover:underline"
              >
                {t('bpAddBehavior')}
              </button>
            </div>
            {(bp.behaviors || []).map((b, i) => (
              <div key={i} className="mb-2 flex items-start gap-2">
                <input
                  className="field flex-1 text-sm"
                  placeholder={t('bpBehavior')}
                  value={b.behavior}
                  onChange={(e) => updateBpBehavior(i, 'behavior', e.target.value)}
                />
                <input
                  className="field flex-1 text-sm"
                  placeholder={t('bpDescription')}
                  value={b.description || ''}
                  onChange={(e) => updateBpBehavior(i, 'description', e.target.value)}
                />
                <button
                  onClick={() =>
                    setBp((prev) => ({
                      ...prev,
                      behaviors: (prev.behaviors || []).filter((_, j) => j !== i),
                    }))
                  }
                  className="mt-1.5 shrink-0 text-[#858585] hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label className="block text-sm text-[#1d1d1f]">
            {t('bpWorkPreferences')}{' '}
            <span className="text-[#858585]">{t('bpCommaSeparated')}</span>
            <input
              className="field mt-1.5"
              placeholder="Autonomous, Fast-paced, Collaborative..."
              value={(bp.work_preferences || []).join(', ')}
              onChange={(e) =>
                setBp((prev) => ({
                  ...prev,
                  work_preferences: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#707070]">{t('bpGrowthAreas')}</p>
              <button
                onClick={() =>
                  setBp((prev) => ({
                    ...prev,
                    growth_areas: [...(prev.growth_areas || []), { area: '', positive_frame: '' }],
                  }))
                }
                className="text-[11px] text-[#0066cc] hover:underline"
              >
                {t('bpAddArea')}
              </button>
            </div>
            {(bp.growth_areas || []).map((g, i) => (
              <div key={i} className="mb-2 flex items-start gap-2">
                <input
                  className="field flex-1 text-sm"
                  placeholder={t('bpArea')}
                  value={g.area}
                  onChange={(e) => updateBpGrowth(i, 'area', e.target.value)}
                />
                <input
                  className="field flex-1 text-sm"
                  placeholder={t('bpPositiveReframe')}
                  value={g.positive_frame || ''}
                  onChange={(e) => updateBpGrowth(i, 'positive_frame', e.target.value)}
                />
                <button
                  onClick={() =>
                    setBp((prev) => ({
                      ...prev,
                      growth_areas: (prev.growth_areas || []).filter((_, j) => j !== i),
                    }))
                  }
                  className="mt-1.5 shrink-0 text-[#858585] hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-[#1d1d1f]">
              {t('bpStrongFitKeywords')}{' '}
              <span className="text-[#858585]">{t('bpCommaSeparated')}</span>
              <input
                className="field mt-1.5"
                placeholder="Autonomy, Innovation..."
                value={(bp.strong_fit_keywords || []).join(', ')}
                onChange={(e) =>
                  setBp((prev) => ({
                    ...prev,
                    strong_fit_keywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              {t('bpFrictionKeywords')}{' '}
              <span className="text-[#858585]">{t('bpCommaSeparated')}</span>
              <input
                className="field mt-1.5"
                placeholder="Micromanagement..."
                value={(bp.friction_keywords || []).join(', ')}
                onChange={(e) =>
                  setBp((prev) => ({
                    ...prev,
                    friction_keywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-[#707070]">
              {t('bpManagementPrefs')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#1d1d1f]">
                {t('bpWorksWith')}
                <input
                  className="field mt-1.5"
                  placeholder="Delegators, Mentors..."
                  value={(bp.management_preferences?.works_with || []).join(', ')}
                  onChange={(e) =>
                    setBp((prev) => {
                      const mp = prev.management_preferences || {
                        works_with: [],
                        doesnt_work: [],
                      }
                      return {
                        ...prev,
                        management_preferences: {
                          ...mp,
                          works_with: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      }
                    })
                  }
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                {t('bpDoesntWork')}
                <input
                  className="field mt-1.5"
                  placeholder="Micromanagers..."
                  value={(bp.management_preferences?.doesnt_work || []).join(', ')}
                  onChange={(e) =>
                    setBp((prev) => {
                      const mp = prev.management_preferences || {
                        works_with: [],
                        doesnt_work: [],
                      }
                      return {
                        ...prev,
                        management_preferences: {
                          ...mp,
                          doesnt_work: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      }
                    })
                  }
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-secondary w-full disabled:opacity-40"
          >
            {saving
              ? tc('loading')
              : `${tc('save')} ${t('behavioralProfile').toLowerCase()}`}
          </button>
        </div>
      )}
    </div>
  )
}
