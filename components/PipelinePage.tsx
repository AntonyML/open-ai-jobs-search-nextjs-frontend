'use client'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  title: string
  eyebrow: string
  subtitle?: string
  endpoint: string
  listEndpoint?: string
  fields: { name: string; label: string; type?: string; optional?: boolean }[]
  step: number
  next?: string
  actionLabel?: string
}

export default function PipelinePage({
  title,
  eyebrow,
  subtitle,
  endpoint,
  listEndpoint,
  fields,
  step,
  next,
  actionLabel = 'Run',
}: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [items, setItems] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const normalize = (x: any) =>
    Array.isArray(x) ? x : x.items || x.jobs || x.applications || x.rows || []

  useEffect(() => {
    if (listEndpoint)
      apiFetch<any>(listEndpoint)
        .then((x) => setItems(normalize(x)))
        .catch(() => {})
  }, [listEndpoint])

  const complete = () => {
    const a = getCompletedSteps()
    if (!a.includes(step)) {
      setCompletedSteps([...a, step])
      showSuccess('Step completed!')
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
      setResult(data)
      if (listEndpoint)
        setItems(normalize(await apiFetch<any>(listEndpoint)))
      const pipeline = endpoint.replace('/api/v1/', '').replace('/', '')
      playPipelineSound(pipeline)
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

  return (
    <section className="mx-auto max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="title">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-sm text-[#858585]">{subtitle}</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        {/* ═══════════════════════════════════════════════════════════
            LEFT: Form
        ═══════════════════════════════════════════════════════════ */}
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
                  >
                    <SelectTrigger className="field mt-1.5 h-10 w-full bg-white text-left">
                      <SelectValue placeholder="Choose a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((x, i) => {
                        const id = String(x.id || x.job_posting_id || x.uuid || '')
                        const title = x.title || x.job_title || x.name || `Item ${i + 1}`
                        const company = x.company || x.company_name || x.location
                        return id ? (
                          <SelectItem key={id} value={id}>
                            <span className="truncate">{title}</span>
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
            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Working…' : actionLabel}
            </button>

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

        {/* ═══════════════════════════════════════════════════════════
            RIGHT: Results
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {items.map((x, i) => (
                <article key={i} className="card hover:border-[#d2d2d7]/80 transition-colors">
                  <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">
                    {x.title || x.job_title || x.name || `Item ${i + 1}`}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#707070]">
                    {x.company || x.location || x.status || x.rank_verdict || ''}
                  </p>
                  {x.rank_score != null && (
                    <div className="mt-2 h-1.5 rounded-full bg-[#e2e2e5]">
                      <div
                        className="h-1.5 rounded-full bg-[#2997ff]"
                        style={{ width: `${x.rank_score}%` }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
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
          )}

          {/* Raw result */}
          {result && (
            <details className="card">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-[#858585] hover:text-[#707070] transition-colors">
                Raw response
              </summary>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-[#f5f5f7] border border-[#e2e2e5] p-4 text-[11px] text-[#474747]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}

          {/* Continue button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                complete()
                if (next) router.push(next)
              }}
              className="btn-secondary"
            >
              {next ? 'Continue' : 'Mark as complete'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
