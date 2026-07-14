'use client'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const FOCUS_TAGS = [
  'AI Engineering',
  'Full-Stack Development',
  'Backend Engineering',
  'Data Science',
  'DevOps / Platform',
  'Mobile Development',
  'Frontend Development',
  'Machine Learning',
]

export default function Rank() {
  const [focusArea, setFocusArea] = useState('')
  const [customFocus, setCustomFocus] = useState('')
  const [topN, setTopN] = useState(5)
  const [reRank, setReRank] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Preparing the evaluation')
  const router = useRouter()

  useEffect(() => {
    apiFetch<any>('/api/v1/rank/jobs')
      .then(x => setItems(Array.isArray(x) ? x : (x.items || x.jobs || [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading) return
    const started = Date.now()
    const messages = ['Preparing the evaluation', 'Reading your candidate profile', 'Comparing jobs against your experience', 'Calculating fit scores', 'Saving the ranking results']
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
      setProgressMessage(messages[Math.floor((Date.now() - started) / 7000) % messages.length])
    }, 1000)
    return () => window.clearInterval(timer)
  }, [loading])

  const toggleTag = (tag: string) => {
    setFocusArea(prev => prev === tag ? '' : tag)
    setCustomFocus('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setElapsed(0)
    setProgressMessage('Preparing the evaluation')
    setError('')
    try {
      const body: any = { top_n: topN, re_rank: reRank }
      const fa = customFocus.trim() || focusArea
      if (fa) body.focus_area = fa
      const data = await apiFetch<any>('/api/v1/rank/', { method: 'POST', body: JSON.stringify(body) })
      setResult(data)
      const x = await apiFetch<any>('/api/v1/rank/jobs')
      setItems(Array.isArray(x) ? x : (x.items || x.jobs || []))
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const complete = () => {
    const a = JSON.parse(localStorage.getItem('completed_steps') || '[]')
    if (!a.includes(3)) localStorage.setItem('completed_steps', JSON.stringify([...a, 3]))
  }

  const scoreColor = (s: number) =>
    s >= 75 ? 'bg-emerald-400' : s >= 50 ? 'bg-cyan-400' : s >= 25 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-400">04 / EVALUATE</p>
      <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">Prioritize the best fits</h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        {/* Form */}
        <form onSubmit={submit} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-6">

          {/* Focus area tags */}
          <div>
            <p className="text-sm text-slate-300 mb-3">Focus area <span className="text-slate-600 ml-1">optional</span></p>
            <div className="flex flex-wrap gap-2">
              {FOCUS_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    focusArea === tag
                      ? 'bg-cyan-400 text-slate-900'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom focus…"
              value={customFocus}
              onChange={e => { setCustomFocus(e.target.value); setFocusArea('') }}
              className="field mt-3 text-sm"
            />
          </div>

          {/* Top N slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-300">Top results</p>
              <span className="text-sm font-bold text-cyan-400">{topN}</span>
            </div>
            <input
              type="range"
              min={1} max={50} value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>1</span><span>25</span><span>50</span>
            </div>
          </div>

          {/* Re-rank toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/40 px-4 py-3">
            <div>
              <p className="text-sm text-slate-300">Re-rank already evaluated jobs</p>
              <p className="text-xs text-slate-500 mt-0.5">Useful after updating your profile</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reRank}
              onClick={() => setReRank(r => !r)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                reRank ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                reRank ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Working…' : 'Rank jobs'}
          </button>
          {loading && (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4" role="status" aria-live="polite">
              <div className="flex items-center gap-3 text-sm text-cyan-200">
                <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
                <span>{progressMessage}<span className="inline-block w-6 text-left animate-pulse">...</span></span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Elapsed time: {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-slate-600">The model is working through the selected jobs. You can leave this tab open.</p>
            </div>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>

        {/* Results */}
        <div className="space-y-3">
          {items.length ? items.map((x, i) => (
            <article key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{x.title || x.job_title || `Job ${i + 1}`}</h3>
                  <p className="mt-0.5 text-sm text-slate-400">{x.company || ''}{x.location ? ` · ${x.location}` : ''}</p>
                </div>
                {x.rank_score != null && (
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-slate-900 ${
                    scoreColor(x.rank_score)
                  }`}>
                    {x.rank_score}
                  </span>
                )}
              </div>
              {x.rank_verdict && (
                <p className="mt-2 text-xs text-slate-500">{x.rank_verdict}</p>
              )}
              {x.rank_score != null && (
                <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full ${scoreColor(x.rank_score)}`} style={{ width: `${x.rank_score}%` }} />
                </div>
              )}
            </article>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-slate-500 text-sm">
              Ranked jobs will appear here after evaluation.
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
              {result.ranked_count != null && <p><span className="text-white font-medium">{result.ranked_count}</span> jobs evaluated · <span className="text-white font-medium">{result.below_threshold ?? 0}</span> below threshold</p>}
              {result.message && <p className="mt-1 text-slate-500">{result.message}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { complete(); router.push('/apply') }} className="btn-secondary">
              Continue
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
