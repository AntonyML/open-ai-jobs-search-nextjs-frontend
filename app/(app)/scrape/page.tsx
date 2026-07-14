'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

const PORTALS = ['linkedin', 'freehire', 'jobbank', 'jobdanmark', 'jobindex', 'jobnet']

export default function Scrape() {
  const router = useRouter()
  const [focus_area, setFocusArea] = useState('')
  const [broad, setBroad] = useState(false)
  const [selectedPortals, setSelectedPortals] = useState<string[]>([])
  const [jobage_days, setJobageDays] = useState(14)
  const [limit_per_portal, setLimitPerPortal] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])

  function loadJobs() {
    apiFetch<any[]>('/api/v1/scrape/jobs')
      .then(x => setJobs(Array.isArray(x) ? x : []))
      .catch(() => {})
  }

  useEffect(() => { loadJobs() }, [])

  function togglePortal(p: string) {
    setSelectedPortals(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        jobage_days,
        limit_per_portal,
        broad,
      }
      if (focus_area.trim()) payload.focus_area = focus_area.trim()
      if (selectedPortals.length > 0) payload.portals = selectedPortals

      const data = await apiFetch<any>('/api/v1/scrape/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(data)
      loadJobs()
      const steps = JSON.parse(localStorage.getItem('completed_steps') || '[]')
      if (!steps.includes(2)) localStorage.setItem('completed_steps', JSON.stringify([...steps, 2]))
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Scrape failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">03 / DISCOVER</p>
      <h2 className="title">Find your next opportunity</h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-6">

          {/* Portals */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">
              Portals <span className="text-slate-500 font-normal">(leave empty = all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PORTALS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePortal(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedPortals.includes(p)
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Focus area */}
          <label className="block text-sm text-slate-300">
            Focus area <span className="text-slate-500 font-normal">optional</span>
            <input
              className="field mt-2"
              placeholder="e.g. data science, backend, devops…"
              value={focus_area}
              onChange={e => setFocusArea(e.target.value)}
            />
          </label>

          {/* Job age */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">
              Posted in last <span className="text-cyan-400 font-bold">{jobage_days} days</span>
            </p>
            <div className="flex gap-2">
              {[7, 14, 30, 60].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setJobageDays(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    jobage_days === d
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Limit per portal */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">
              Results per portal <span className="text-cyan-400 font-bold">{limit_per_portal}</span>
            </p>
            <div className="flex gap-2">
              {[10, 20, 50, 100].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLimitPerPortal(n)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    limit_per_portal === n
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Broad mode */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setBroad(b => !b)}
              className={`relative h-6 w-11 rounded-full transition-colors ${broad ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${broad ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-slate-300">
              Broad mode <span className="text-slate-500">(all categories, not just top 3)</span>
            </span>
          </label>

          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Scraping…' : 'Start scraping'}
          </button>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>

        {/* Results panel */}
        <div className="space-y-3">
          {result && (
            <div className="card space-y-1 text-sm">
              <p className="font-semibold text-emerald-400">{result.message}</p>
              <p className="text-slate-400">Portals: {result.portals_queried?.join(', ') || '—'}</p>
              <p className="text-slate-400">{result.jobs_found} found · {result.jobs_new} new</p>
            </div>
          )}

          {jobs.length > 0 && (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{jobs.length} jobs in db</p>
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                {jobs.map((j, i) => (
                  <article key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-sm leading-snug">{j.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{j.company} · {j.location}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{j.portal}</span>
                    </div>
                    {j.rank_score != null && (
                      <div className="mt-2 h-1.5 rounded bg-slate-800">
                        <div className="h-1.5 rounded bg-cyan-400" style={{ width: `${j.rank_score}%` }} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <button onClick={() => router.push('/rank')} className="btn-primary w-full">Continue to Rank →</button>
            </>
          )}

          {!result && jobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-slate-500 text-sm">
              Configure your search and hit <span className="text-slate-400">Start scraping</span>.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
