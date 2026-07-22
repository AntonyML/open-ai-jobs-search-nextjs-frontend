'use client'

import { useEffect, useState, useRef } from 'react'
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
import { PipelineEmptyState } from '@/components/PipelineEmptyState'
import { TagInput } from '@/components/ui/TagInput'
import { Search, MapPin, Briefcase, Check, Loader2, SkipForward } from 'lucide-react'
import UpgradeModal from '@/components/UpgradeModal'

const PORTALS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'freehire', label: 'FreeHire' },
  { id: 'jobbank', label: 'JobBank' },
  { id: 'jobdanmark', label: 'JobDanmark' },
  { id: 'jobindex', label: 'JobIndex' },
  { id: 'jobnet', label: 'JobNet' },
]

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  freehire: 'FreeHire',
  jobbank: 'JobBank',
  jobdanmark: 'JobDanmark',
  jobindex: 'JobIndex',
  jobnet: 'JobNet',
}

type SourceStatus = 'pending' | 'searching' | 'done' | 'skipped' | 'error'

function PortalTag({ name, active, onToggle }: { name: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? 'bg-[#0071e3] text-white'
          : 'border border-[#d2d2d7] text-[#707070] hover:border-[#0071e3]/30 hover:text-[#0071e3] bg-white'
      }`}
    >
      {name}
    </button>
  )
}

function SourceProgress({ name, status, query }: { name: string; status: SourceStatus; query?: string }) {
  const t = useTranslations('scrape')
  const icon = status === 'done' ? <Check className="h-3.5 w-3.5 text-emerald-500" />
    : status === 'searching' ? <Loader2 className="h-3.5 w-3.5 text-[#0071e3] animate-spin" />
    : status === 'skipped' ? <SkipForward className="h-3.5 w-3.5 text-[#b0b0b0]" />
    : status === 'error' ? <span className="h-3.5 w-3.5 text-rose-500 text-xs">!</span>
    : <div className="h-3.5 w-3.5 rounded-full border border-[#d2d2d7]" />
  const label = status === 'done' ? t('sourceDone')
    : status === 'searching' ? t('sourceSearching')
    : status === 'skipped' ? t('sourceSkipped')
    : t('sourcePending')
  return (
    <div className="flex items-center gap-2 py-1.5">
      {icon}
      <span className="text-xs text-[#1d1d1f] font-medium">{SOURCE_LABELS[name] || name}</span>
      <span className="text-[10px] text-[#b0b0b0] ml-auto">{label}</span>
    </div>
  )
}

function ToggleSwitch({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3">
      <div>
        <p className="text-sm text-[#1d1d1f] font-medium">{label}</p>
        <p className="text-xs text-[#707070] mt-0.5">{desc}</p>
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

function ScrapeJobCard({ job, index }: { job: any; index: number }) {
  return (
    <article key={index} className="card transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">{job.title}</p>
          <p className="text-xs text-[#707070] mt-0.5">
            {job.company || ''}{job.company && job.location ? ' · ' : ''}{job.location || ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#707070]">
          {job.portal}
        </span>
      </div>
      {job.rank_score != null && (
        <div className="mt-2 h-1.5 rounded-full bg-[#e2e2e5]">
          <div className="h-1.5 rounded-full bg-[#0071e3]" style={{ width: `${job.rank_score}%` }} />
        </div>
      )}
    </article>
  )
}

export default function Scrape() {
  const t = useTranslations('scrape')
  const tp = useTranslations('pipeline.steps')
  const router = useRouter()
  const premium = isPremium()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [keywords, setKeywords] = useState<string[]>([])
  const [targetTitles, setTargetTitles] = useState<string[]>([])
  const [seniority, setSeniority] = useState('')
  const [profileLocation, setProfileLocation] = useState('')
  const [profileRemote, setProfileRemote] = useState('')
  const [broad, setBroad] = useState(false)
  const [selectedPortals, setSelectedPortals] = useState<string[]>([])
  const prevStepDone = getCompletedSteps().includes(1)
  const [jobage_days, setJobageDays] = useState(14)
  const [limit_per_portal, setLimitPerPortal] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({})
  const [interimJobs, setInterimJobs] = useState<any[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function loadJobs() {
    apiFetch<any[]>('/api/v1/scrape/jobs').then(x => setJobs(Array.isArray(x) ? x : [])).catch(() => {})
  }
  useEffect(() => { loadJobs() }, [])

  useEffect(() => {
    apiFetch<any>('/api/v1/setup/profile').then(profile => {
      if (profile?.job_target) {
        const jt = profile.job_target
        if (jt.target_titles?.length) setTargetTitles(jt.target_titles)
        if (jt.seniority) setSeniority(jt.seniority)
        if (jt.search_locations?.length) setProfileLocation(jt.search_locations[0])
        if (jt.work_mode) setProfileRemote(Array.isArray(jt.work_mode) ? jt.work_mode.join(', ') : jt.work_mode)
        if (jt.keywords?.length) setKeywords(jt.keywords)
      }
    }).catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function togglePortal(p: string) {
    setSelectedPortals(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  // Determine planned sources before scrape starts
  function getPlannedSources(): string[] {
    const sources = selectedPortals.length > 0 ? selectedPortals : PORTALS.map(p => p.id)
    return sources
  }

  async function pollRun() {
    if (!runId) return
    try {
      const run = await apiFetch<any>(`/api/v1/scrape/runs/${runId}`)
      setSourceStatuses(prev => {
        const next = { ...prev }
        const allSources = getPlannedSources()
        for (const s of allSources) {
          if (next[s] === 'done' || next[s] === 'skipped') continue
          if (run.status === 'completed' || run.status === 'completed_with_errors') {
            next[s] = 'done'
          } else if (next[s] === 'pending') {
            next[s] = 'searching'
          }
        }
        // Mark skipped sources if there's an error about cooldown
        if (run.error_message) {
          for (const s of allSources) {
            if (run.error_message.includes(`${s}: skipped`)) next[s] = 'skipped'
          }
        }
        return next
      })
      // Load interim jobs
      if (run.status === 'running') {
        loadJobs()
      }
      if (run.status !== 'running') {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
        setLoading(false)
        loadJobs()
        setResult(run)
        const steps = getCompletedSteps()
        if (!steps.includes(2)) setCompletedSteps([...steps, 2])
      }
    } catch {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runId && loading) {
      pollRef.current = setInterval(pollRun, 3000)
      return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }
  }, [runId, loading])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setInterimJobs([])
    setRunId(null)
    // Init source statuses
    const planned = getPlannedSources()
    const init: Record<string, SourceStatus> = {}
    for (const s of planned) init[s] = 'pending'
    setSourceStatuses(init)

    try {
      const payload: Record<string, any> = { jobage_days, limit_per_portal, broad }
      if (keywords.length > 0) payload.keywords = keywords
      if (targetTitles.length > 0) payload.target_titles = targetTitles
      if (seniority) payload.seniority = seniority
      if (selectedPortals.length > 0) payload.portals = selectedPortals

      const data = await apiFetch<any>('/api/v1/scrape/', { method: 'POST', body: JSON.stringify(payload) })
      setRunId(data.run_id)
      setResult(data)
      loadJobs()

      playPipelineSound('scrape')
      const jobCount = data.jobs_found ?? 0
      showSuccess(t('jobsFound', { count: jobCount }))
      addNotification({
        pipeline: 'scrape',
        description: t('notificationFound', { count: jobCount, focus: keywords.join(', ') || 'all' }),
        status: 'success',
      })
    } catch (x) {
      const msg = x instanceof Error ? x.message : t('scrapeFailed')
      playErrorSound()
      showError(msg)
      addNotification({ pipeline: 'scrape', description: msg, status: 'error' })
      setError(msg)
      setLoading(false)
    }
  }

  const isScraping = loading && runId != null
  const hasFilters = targetTitles.length > 0 || seniority || profileLocation || profileRemote

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

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
          {hasFilters && (
            <div className="rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">
                  {t('filtersFromSetup')}
                </p>
              </div>
              {targetTitles.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Briefcase className="h-3 w-3 text-[#858585] shrink-0" />
                  <span className="text-[#707070]">{t('targetTitles')}:</span>
                  <span className="text-[#1d1d1f] font-medium truncate">{targetTitles.join(', ')}</span>
                </div>
              )}
              {seniority && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#707070]">{t('seniority')}:</span>
                  <span className="text-[#1d1d1f] font-medium">{seniority}</span>
                </div>
              )}
              {profileLocation && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-[#858585] shrink-0" />
                  <span className="text-[#707070]">{t('location')}:</span>
                  <span className="text-[#1d1d1f] font-medium">{profileLocation}</span>
                </div>
              )}
              {profileRemote && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#707070]">{t('remote')}:</span>
                  <span className="text-[#1d1d1f] font-medium">{profileRemote}</span>
                </div>
              )}
              <p className="text-[10px] text-[#b0b0b0] mt-1">{t('filtersFromSetupDesc')}</p>
            </div>
          )}

          {/* Portals */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#858585] mb-3">
              {t('portals')} <span className="text-[#b0b0b0] font-normal normal-case">({t('portalsHint')})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PORTALS.map(p => (
                <PortalTag key={p.id} name={p.label} active={selectedPortals.includes(p.id)} onToggle={() => togglePortal(p.id)} />
              ))}
            </div>
          </div>

          {/* Keywords as tags */}
          <label className="block text-sm font-medium text-[#1d1d1f]">
            <span className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[#858585]" />
              {t('keywords')}
            </span>
            <div className="mt-1.5">
              <TagInput
                tags={keywords}
                onChange={setKeywords}
                placeholder={t('keywordsPlaceholder')}
                color="blue"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#b0b0b0]">{t('keywordsHint')}</p>
          </label>

          <OptionPills
            label={t('postedInLastLabel')}
            options={[{ value: 7, label: '7d' }, { value: 14, label: '14d' }, { value: 30, label: '30d' }, { value: 60, label: '60d' }]}
            selected={jobage_days}
            onChange={setJobageDays}
            accent
          />

          <OptionPills
            label={t('resultsPerPortal')}
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

        {/* Right: Progress + Results */}
        <div className="space-y-3">
          {/* Source progress during scrape */}
          {isScraping && (
            <div className="card space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">
                {t('searchingSources', { count: getPlannedSources().length })}
              </p>
              <div className="divide-y divide-[#f0f0f0]">
                {getPlannedSources().map(s => (
                  <SourceProgress key={s} name={s} status={sourceStatuses[s] || 'pending'} />
                ))}
              </div>
            </div>
          )}

          {result && !isScraping && (
            <div className="card space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">{result.message || t('jobsFound', { count: result.jobs_found ?? 0 })}</p>
                  <p className="text-[11px] text-[#707070] mt-0.5">
                    {result.portals_queried?.join(', ') || '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-[#707070]">
                <span><strong className="text-[#1d1d1f]">{result.jobs_found}</strong> {t('found')}</span>
                <span><strong className="text-[#1d1d1f]">{result.jobs_new}</strong> {t('new')}</span>
              </div>
            </div>
          )}

          {jobs.length > 0 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t('jobsInDatabase', { count: jobs.length })}</p>
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {jobs.map((j, i) => <ScrapeJobCard key={i} job={j} index={i} />)}
              </div>
              <AppleButton variant="secondary" className="w-full" onClick={() => router.push('/rank')}>
                {t('continueToRank')}
              </AppleButton>
            </>
          ) : !isScraping ? (
            <PipelineEmptyState
              icon={Search}
              title={t('emptyTitle')}
              description={t('emptyDesc')}
              prevStep={{
                key: 'setup',
                label: tp('setup'),
                href: '/pipeline/setup',
                title: t('prevStepTitle'),
                description: t('prevStepDesc'),
                action: t('prevStepAction'),
              }}
              prevStepDone={prevStepDone}
            />
          ) : null}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
