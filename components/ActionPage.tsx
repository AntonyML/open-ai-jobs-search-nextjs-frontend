'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playActionSound, playErrorSound } from '@/lib/sounds'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { AppleButton } from '@/components/ui/apple-button'
import { FeatureEmptyState } from '@/components/FeatureEmptyState'
import { FileText, CheckCircle, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ActionPageProps } from '@/types/pipeline'

interface ProcessingState {
  applicationId: string
  stage: string
  progress: number
  action: string
  error?: string
}

function EmptyState({ title, description, actionLabel, actionHref, prevStep, prevStepDone }: {
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  prevStep?: { key: string; label: string; href: string; title: string; description: string; action: string }
  prevStepDone?: boolean
}) {
  if (title) {
    return (
      <FeatureEmptyState
        icon={FileText}
        title={title}
        description={description || ''}
        actionLabel={actionLabel || ''}
        actionHref={actionHref || '#'}
        prevStep={prevStep}
        prevStepDone={prevStepDone}
      />
    )
  }
  return (
    <div className="card border-dashed text-center">
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f0f2]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#858585]">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[#707070]">No items yet</p>
          <p className="text-xs text-[#b0b0b0] mt-0.5">Results will appear here after running.</p>
        </div>
      </div>
    </div>
  )
}

export default function ActionPage({
  title,
  eyebrow,
  subtitle,
  endpoint,
  listEndpoint,
  fields,
  step,
  next,
  actionLabel = 'Run',
  actionDisabled = false,
  actionDisabledTooltip = '',
  emptyTitle,
  emptyDesc,
  emptyAction,
  emptyHref,
  emptyPrevTitle,
  emptyPrevDesc,
  emptyPrevAction,
  emptyPrevHref,
  emptyPrevDone,
  emptyPrevLabel,
  emptyPrevKey,
  cardMode,
  actionField = 'job_posting_id',
  statusEndpoint,
  continueTooltip,
  continueLabel = 'Continue',
}: ActionPageProps) {
  const locale = useLocale()
  const [form, setForm] = useState<Record<string, string>>({})
  const [items, setItems] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<Record<string, ProcessingState>>({})
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})
  const router = useRouter()

  const normalize = (x: any) =>
    Array.isArray(x) ? x : x.items || x.jobs || x.applications || x.rows || []

  useEffect(() => {
    if (listEndpoint)
      apiFetch<any>(listEndpoint)
        .then((x) => setItems(normalize(x)))
        .catch(() => {})
    const intervals = intervalsRef.current
    return () => {
      Object.values(intervals).forEach(clearInterval)
    }
  }, [listEndpoint])

  const hasCompleted = results.length > 0

  const complete = () => {
    const a = getCompletedSteps()
    if (!a.includes(step)) {
      setCompletedSteps([...a, step])
      showSuccess('Completed!')
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const missing = fields.find((f) => !f.optional && !form[f.name])
    if (missing) {
      setError(`${missing.label} is required`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setResults((prev) => [data, ...prev])
      if (listEndpoint)
        setItems(normalize(await apiFetch<any>(listEndpoint)))
      const pipeline = endpoint.replace('/api/v1/', '').replace('/', '')
      playActionSound(pipeline)
      addNotification({
        pipeline,
        description: `${title} completed`,
        status: 'success',
      })
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Request failed'
      setError(msg)
      playErrorSound()
      showError(msg)
      const pipeline = endpoint.replace('/api/v1/', '').replace('/', '')
      addNotification({ pipeline, description: msg, status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(itemId: string) {
    if (!itemId || processing[itemId]) return
    setProcessing((prev) => ({ ...prev, [itemId]: { applicationId: '', stage: 'starting', progress: 0, action: 'Starting...' } }))
    try {
      const data = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ [actionField]: itemId }),
      })
      const applicationId = data.application_id || data.id || ''
      if (!applicationId) throw new Error('No application ID returned')

      setProcessing((prev) => ({ ...prev, [itemId]: { ...prev[itemId], applicationId, stage: 'submitted', progress: 5, action: 'Queued...' } }))

      if (statusEndpoint) {
        const poll = setInterval(async () => {
          try {
            const status = await apiFetch<any>(`${statusEndpoint}/${applicationId}/status`)
            const pct = status.progress_pct ?? 0
            setProcessing((prev) => ({
              ...prev,
              [itemId]: { ...prev[itemId], stage: status.pipeline_stage || 'processing', progress: pct, action: status.current_action || '' },
            }))
            if (pct >= 100) {
              clearInterval(poll)
              delete intervalsRef.current[itemId]
              setResults((prev) => {
                if (prev.some((r) => (r.job_posting_id || r.application_id) === itemId)) return prev
                return [{ job_posting_id: itemId, application_id: applicationId, ...status }, ...prev]
              })
              setProcessing((prev) => {
                const next = { ...prev }
                delete next[itemId]
                return next
              })
              playActionSound(endpoint.replace('/api/v1/', '').replace('/', ''))
            }
          } catch {
            clearInterval(poll)
            delete intervalsRef.current[itemId]
            setProcessing((prev) => ({ ...prev, [itemId]: { ...prev[itemId], error: 'Status check failed' } }))
          }
        }, 3000)
        intervalsRef.current[itemId] = poll
      } else {
        setResults((prev) => {
          if (prev.some((r) => (r.job_posting_id || r.application_id) === itemId)) return prev
          return [{ job_posting_id: itemId, application_id: applicationId, ...data }, ...prev]
        })
        setProcessing((prev) => {
          const next = { ...prev }
          delete next[itemId]
          return next
        })
      }
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Generation failed'
      setProcessing((prev) => ({ ...prev, [itemId]: { ...prev[itemId], error: msg } }))
      playErrorSound()
      showError(msg)
    }
  }

  function getItemId(item: any): string {
    return String(item.id || item.job_posting_id || item.uuid || '')
  }

  function getItemName(item: any, index: number): string {
    return item.title || item.job_title || item.name || `Item ${index + 1}`
  }

  if (cardMode) {
    return (
      <section className="mx-auto max-w-5xl">
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-8">
          {items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item, i) => {
                const id = getItemId(item)
                const name = getItemName(item, i)
                const company = item.company || ''
                const proc = processing[id]
                const isDone = results.some((r) => {
                  const rid = String(r.job_posting_id || r.application_id || '')
                  return rid === id
                })

                return (
                  <div key={id} className="card flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">{name}</h3>
                      {company && <p className="mt-0.5 text-xs text-[#707070]">{company}</p>}
                      {item.rank_score != null && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#e2e2e5]">
                              <div className="h-1.5 rounded-full bg-[#2997ff]" style={{ width: `${item.rank_score}%` }} />
                            </div>
                            <span className="text-[11px] text-[#707070]">{Math.round(item.rank_score)}%</span>
                          </div>
                        </div>
                      )}
                      {item.rank_verdict && (
                        <p className="mt-1 text-[11px] font-medium text-[#707070]">{item.rank_verdict}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#d2d2d7]">
                      {isDone ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle size={16} />
                          <span>Generated</span>
                        </div>
                      ) : proc?.error ? (
                        <div className="space-y-2">
                          <p className="text-xs text-red-500">{proc.error}</p>
                          <AppleButton onClick={() => handleGenerate(id)} size="sm" className="w-full">
                            Retry
                          </AppleButton>
                        </div>
                      ) : proc ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-[#707070]">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="truncate">{proc.action || 'Processing...'}</span>
                          </div>
                          <div className="h-1 rounded-full bg-[#e2e2e5]">
                            <div className="h-1 rounded-full bg-[#2997ff] transition-all duration-500" style={{ width: `${Math.max(5, Math.min(95, proc.progress))}%` }} />
                          </div>
                          <p className="text-[11px] text-[#707070]">{proc.stage} · {proc.progress}%</p>
                        </div>
                      ) : (
                        <AppleButton onClick={() => handleGenerate(id)} disabled={loading} size="sm" className="w-full">
                          {actionLabel}
                        </AppleButton>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title={emptyTitle}
              description={emptyDesc}
              actionLabel={emptyAction}
              actionHref={emptyHref}
              prevStep={emptyPrevTitle ? {
                key: emptyPrevKey || '',
                label: emptyPrevLabel || '',
                href: emptyPrevHref || '#',
                title: emptyPrevTitle,
                description: emptyPrevDesc || '',
                action: emptyPrevAction || '',
              } : undefined}
              prevStepDone={emptyPrevDone}
            />
          )}

          {hasCompleted && (
            <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-[#d2d2d7] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-0 sm:rounded-t-xl sm:border sm:border-b-0 sm:px-5 sm:py-4 sm:shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger render={
                    <AppleButton
                      variant="secondary"
                      onClick={() => { complete(); if (next) router.push(`/${locale}${next}`) }}
                    >
                      {continueLabel} →
                    </AppleButton>
                  } />
                  {continueTooltip && (
                    <TooltipContent side="top" className="px-3 py-1.5 text-xs">
                      {continueTooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        <form onSubmit={submit} className="card space-y-5">
          <div className="space-y-4">
            {fields.map((f) => (
              <label key={f.name} className="block text-sm text-[#1d1d1f]">
                {f.label}
                {f.optional && <span className="ml-2 text-[#b0b0b0]">optional</span>}
                {f.type === 'select' ? (
                  <Select
                    value={form[f.name] || ''}
                    onValueChange={(value) => setForm({ ...form, [f.name]: value ?? '' })}
                    items={items.map((x) => ({
                      value: getItemId(x),
                      label: getItemName(x, 0),
                    })).filter((x) => x.value)}
                  >
                    <SelectTrigger className="field mt-1.5 h-10 w-full text-left">
                      <SelectValue placeholder="Choose a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((x, i) => {
                        const id = getItemId(x)
                        const name = getItemName(x, i)
                        const company = x.company || x.company_name || x.location
                        return id ? (
                          <SelectItem key={id} value={id}>
                            <span className="truncate">{name}</span>
                            {company && <span className="text-muted-foreground"> · {company}</span>}
                          </SelectItem>
                        ) : null
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    required={!f.optional}
                    type={f.type || 'text'}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="field mt-1.5"
                  />
                )}
              </label>
            ))}
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0} />}>
                <AppleButton disabled={loading || actionDisabled} className="w-full">
                  {loading ? 'Working…' : actionLabel}
                </AppleButton>
              </TooltipTrigger>
              {actionDisabled && actionDisabledTooltip && (
                <TooltipContent side="top" align="center">
                  {actionDisabledTooltip}
                </TooltipContent>
              )}
            </Tooltip>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Generated applications</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {results.map((r, i) => (
                  <div key={i} className="card !p-4">
                    <p className="text-sm font-medium text-[#1d1d1f]">
                      {r.job_title || r.title || `Application ${i + 1}`}
                    </p>
                    {r.company && (
                      <p className="text-xs text-[#707070] mt-0.5">{r.company}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1">✓ Generated</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && results.length === 0 && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Available jobs</h3>
              {items.map((x, i) => (
                <article key={i} className="card hover:border-[#d2d2d7]/80 transition-colors">
                  <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">
                    {getItemName(x, i)}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#707070]">
                    {x.company || x.location || x.status || x.rank_verdict || ''}
                  </p>
                  {x.rank_score != null && (
                    <div className="mt-2 h-1.5 rounded-full bg-[#e2e2e5]">
                      <div className="h-1.5 rounded-full bg-[#2997ff]" style={{ width: `${x.rank_score}%` }} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {items.length === 0 && results.length === 0 && (
            <EmptyState
              title={emptyTitle}
              description={emptyDesc}
              actionLabel={emptyAction}
              actionHref={emptyHref}
              prevStep={emptyPrevTitle ? {
                key: emptyPrevKey || '',
                label: emptyPrevLabel || '',
                href: emptyPrevHref || '#',
                title: emptyPrevTitle,
                description: emptyPrevDesc || '',
                action: emptyPrevAction || '',
              } : undefined}
              prevStepDone={emptyPrevDone}
            />
          )}

          {hasCompleted && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { complete(); if (next) router.push(next) }}
                className="btn-secondary"
              >
                {next ? 'Continue' : 'Mark as complete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
