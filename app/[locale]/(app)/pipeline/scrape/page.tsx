'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playPipelineSound, playErrorSound } from '@/lib/sounds'
import { getCompletedSteps, setCompletedSteps, isPremium } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { OptionPills } from '@/components/scrape/OptionPills'
import UpgradeModal from '@/components/UpgradeModal'

const PORTALS = ['linkedin', 'freehire', 'jobbank', 'jobdanmark', 'jobindex', 'jobnet']

function PortalTag({ name, active, onToggle }: { name: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? 'bg-[#0071e3] text-white'
          : 'border border-[#d2d2d7] text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
      }`}
    >
      {name}
    </button>
  )
}

function ToggleSwitch({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3">
      <div>
        <p className="text-sm text-[#1d1d1f] font-medium">{label}</p>
        <p className="text-xs text-[#858585] mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${value ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'}`}
      >
        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function ScrapeResultBanner({ result }: { result: any }) {
  return (
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
  )
}

function ScrapeJobCard({ job, index }: { job: any; index: number }) {
  return (
    <article key={index} className="card hover:border-[#d2d2d7]/80 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">{job.title}</p>
          <p className="text-xs text-[#707070] mt-0.5">
            {job.company || ''}{job.company && job.location ? ' · ' : ''}{job.location || ''}
          </p>
        </div>
        <span className="tag-filled shrink-0 bg-[#f5f5f7] text-[#707070]">
          {job.portal}
        </span>
      </div>
      {job.rank_score != null && (
        <div className="mt-2 h-1.5 rounded-full bg-[#e2e2e5]">
          <div className="h-1.5 rounded-full bg-[#2997ff]" style={{ width: `${job.rank_score}%` }} />
        </div>
      )}
    </article>
  )
}

export default function Scrape() {
  const t = useTranslations('scrape')
  const tc = useTranslations('common')
  const router = useRouter()
  const premium = isPremium()
  const [showUpgrade, setShowUpgrade] = useState(false)

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
    apiFetch<any[]>('/api/v1/scrape/jobs').then(x => setJobs(Array.isArray(x) ? x : [])).catch(() => {})
  }
  useEffect(() => { loadJobs() }, [])

  function togglePortal(p: string) {
    setSelectedPortals(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, any> = { jobage_days, limit_per_portal, broad }
      if (focus_area.trim()) payload.focus_area = focus_area.trim()
      if (selectedPortals.length > 0) payload.portals = selectedPortals

      const data = await apiFetch<any>('/api/v1/scrape/', { method: 'POST', body: JSON.stringify(payload) })
      setResult(data)
      loadJobs()

      const steps = getCompletedSteps()
      if (!steps.includes(2)) setCompletedSteps([...steps, 2])

      playPipelineSound('scrape')
      const jobCount = data.jobs_found ?? 0
      showSuccess(`${jobCount} jobs found! Step 3 completed.`)
      addNotification({ pipeline: 'scrape', description: `Found ${jobCount} jobs · focus=${focus_area || 'all'}`, status: 'success' })
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Scrape failed'
      playErrorSound()
      showError(msg)
      addNotification({ pipeline: 'scrape', description: msg, status: 'error' })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader eyebrow="03 / DISCOVER" title={t('title')} subtitle={t('subtitle')} />

      {!premium && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: 1 site, 5 jobs max. Upgrade for unlimited.'}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t('upgrade') || 'Upgrade'}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <form onSubmit={submit} className="card space-y-6">
          {/* Portals */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] mb-3">
              Portals <span className="text-[#b0b0b0] font-normal normal-case">({t('portalsHint')})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PORTALS.map(p => (
                <PortalTag key={p} name={p} active={selectedPortals.includes(p)} onToggle={() => togglePortal(p)} />
              ))}
            </div>
          </div>

          {/* Focus area */}
          <label className="block text-sm text-[#1d1d1f]">
            Focus area <span className="text-[#b0b0b0] font-normal">{tc('optional')}</span>
            <input className="field mt-1.5" placeholder={t('focusAreaPlaceholder')} value={focus_area} onChange={e => setFocusArea(e.target.value)} />
          </label>

          <OptionPills
            label={`Posted in last`}
            options={[{ value: 7, label: '7d' }, { value: 14, label: '14d' }, { value: 30, label: '30d' }, { value: 60, label: '60d' }]}
            selected={jobage_days}
            onChange={setJobageDays}
            accent
          />

          <OptionPills
            label="Results per portal"
            options={[{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
            selected={limit_per_portal}
            onChange={setLimitPerPortal}
            accent
          />

          <ToggleSwitch value={broad} onChange={setBroad} label={t('broadMode')} desc={t('broadModeDesc')} />

          <AppleButton disabled={loading} loading={loading} className="w-full">
            {loading ? t('scraping') : t('startScraping')}
          </AppleButton>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </form>

        {/* Right: Results */}
        <div className="space-y-3">
          {result && <ScrapeResultBanner result={result} />}

          {jobs.length > 0 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{jobs.length} jobs in database</p>
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {jobs.map((j, i) => <ScrapeJobCard key={i} job={j} index={i} />)}
              </div>
              <AppleButton variant="secondary" className="w-full" onClick={() => router.push('/rank')}>
                Continue to Rank →
              </AppleButton>
            </>
          ) : (
            <div className="card border-dashed text-center">
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f0f2]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#858585]">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#707070]">{t('noJobsYet')}</p>
                  <p className="text-xs text-[#b0b0b0] mt-0.5">{t('noJobsHint')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
