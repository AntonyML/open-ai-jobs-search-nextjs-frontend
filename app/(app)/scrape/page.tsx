'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'

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
      if (!steps.includes(2)) {
        localStorage.setItem('completed_steps', JSON.stringify([...steps, 2]))
        showSuccess(`${data.jobs_found ?? 0} jobs found! Step 3 completed.`)
      }
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Scrape failed'; setError(msg); showError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="eyebrow">03 / DISCOVER</p>
        <h2 className="title">Find your next opportunity</h2>
        <p className="mt-2 text-sm text-[#858585]">
          Scrape job portals to discover openings matching your focus area.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ═══════════════════════════════════════════════════════════
            LEFT: Form
        ═══════════════════════════════════════════════════════════ */}
        <form onSubmit={submit} className="card space-y-6">

          {/* Portals */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
              Portals <span className="text-[#b0b0b0] font-normal normal-case">(leave empty = all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PORTALS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePortal(p)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                    selectedPortals.includes(p)
                      ? 'bg-[#0071e3] text-white'
                      : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Focus area */}
          <label className="block text-sm text-[#1d1d1f]">
            Focus area <span className="text-[#b0b0b0] font-normal">optional</span>
            <input
              className="field mt-1.5"
              placeholder="e.g. data science, backend, devops…"
              value={focus_area}
              onChange={e => setFocusArea(e.target.value)}
            />
          </label>

          {/* Job age */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
              Posted in last <span className="text-[#0071e3] font-bold normal-case">{jobage_days} days</span>
            </p>
            <div className="flex gap-2">
              {[7, 14, 30, 60].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setJobageDays(d)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                    jobage_days === d
                      ? 'bg-[#0071e3] text-white'
                      : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Limit per portal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
              Results per portal <span className="text-[#0071e3] font-bold normal-case">{limit_per_portal}</span>
            </p>
            <div className="flex gap-2">
              {[10, 20, 50, 100].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLimitPerPortal(n)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                    limit_per_portal === n
                      ? 'bg-[#0071e3] text-white'
                      : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Broad mode */}
          <div className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3">
            <div>
              <p className="text-sm text-[#1d1d1f] font-medium">Broad mode</p>
              <p className="text-xs text-[#858585] mt-0.5">Search all categories, not just top 3</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={broad}
              onClick={() => setBroad(b => !b)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                broad ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
              }`}
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                broad ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Scraping…' : 'Start scraping'}
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
        </form>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT: Results
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          {/* Result banner */}
          {result && (
            <div className="card space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{result.message}</p>
                  <p className="text-[11px] text-[#858585] mt-0.5">
                    Portals: {result.portals_queried?.join(', ') || '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-[#707070]">
                <span><strong className="text-[#1d1d1f]">{result.jobs_found}</strong> found</span>
                <span><strong className="text-[#1d1d1f]">{result.jobs_new}</strong> new</span>
              </div>
            </div>
          )}

          {/* Job cards */}
          {jobs.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">
                {jobs.length} jobs in database
              </p>
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {jobs.map((j, i) => (
                  <article key={i} className="card hover:border-[#d2d2d7]/80 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1d1d1f] truncate">{j.title}</p>
                        <p className="text-xs text-[#707070] mt-0.5">
                          {j.company || ''}{j.company && j.location ? ' · ' : ''}{j.location || ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-medium text-[#707070]">
                        {j.portal}
                      </span>
                    </div>
                    {j.rank_score != null && (
                      <div className="mt-2 h-1.5 rounded-full bg-[#e2e2e5]">
                        <div
                          className="h-1.5 rounded-full bg-[#2997ff]"
                          style={{ width: `${j.rank_score}%` }}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <button onClick={() => router.push('/rank')} className="btn-secondary w-full">
                Continue to Rank →
              </button>
            </>
          )}

          {/* Empty state */}
          {!result && jobs.length === 0 && (
            <div className="card border-dashed text-center">
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f0f2]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#858585]">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#707070]">No jobs scraped yet</p>
                  <p className="text-xs text-[#b0b0b0] mt-0.5">
                    Configure your search and hit <span className="text-[#707070]">Start scraping</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
