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
import { PipelineEmptyState } from '@/components/PipelineEmptyState'
import { TagInput } from '@/components/ui/TagInput'
import { Search, Briefcase, MapPin, Check, Loader2 } from 'lucide-react'
import UpgradeModal from '@/components/UpgradeModal'
import { OptionPills } from '@/components/scrape/OptionPills'

interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  url: string | null
  description: string | null
  salary: string | null
  ingested_at: string | null
}

interface JobSearchResponse {
  jobs: JobResult[]
  count: number
  fresh: boolean
  ingest_job_id: string | null
  message: string | null
}

function JobCard({ job, index }: { job: JobResult; index: number }) {
  return (
    <article key={index} className="card transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">{job.title}</p>
          <p className="text-xs text-[#707070] mt-0.5">
            {job.company || ''}{job.company && job.location ? ' · ' : ''}{job.location || ''}
          </p>
        </div>
        {job.salary && (
          <span className="shrink-0 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#707070]">
            {job.salary}
          </span>
        )}
      </div>
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
  const [seniority, setSeniority] = useState('')
  const [profileLocation, setProfileLocation] = useState('')
  const prevStepDone = getCompletedSteps().includes(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<JobSearchResponse | null>(null)
  const [jobs, setJobs] = useState<JobResult[]>([])

  useEffect(() => {
    apiFetch<any>('/api/v1/setup/profile').then(profile => {
      if (profile?.job_target) {
        const jt = profile.job_target
        if (jt.seniority) setSeniority(jt.seniority)
        if (jt.search_locations?.length) setProfileLocation(jt.search_locations[0])
        if (jt.keywords?.length) setKeywords(jt.keywords)
      }
    }).catch(() => {})
  }, [])

  async function searchJobs(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const keywordsStr = keywords.length > 0 ? keywords.join(' ') : (seniority || 'developer')
      const payload: Record<string, any> = { keywords: keywordsStr }
      if (profileLocation) payload.location = profileLocation

      const data = await apiFetch<JobSearchResponse>('/api/v1/jobs/search', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setJobs(data.jobs ?? [])
      setResult(data)

      playPipelineSound('scrape')
      showSuccess(t('jobsFound', { count: data.count }))
      addNotification({
        pipeline: 'scrape',
        description: t('notificationFound', { count: data.count, focus: keywordsStr }),
        status: 'success',
      })

      const steps = getCompletedSteps()
      if (!steps.includes(2)) setCompletedSteps([...steps, 2])
    } catch (x) {
      const msg = x instanceof Error ? x.message : t('scrapeFailed')
      playErrorSound()
      showError(msg)
      addNotification({ pipeline: 'scrape', description: msg, status: 'error' })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const hasFilters = keywords.length > 0 || seniority || profileLocation

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      {!premium && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Free plan: limited results. Upgrade for unlimited.'}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t('upgrade') || 'Upgrade'}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <form onSubmit={searchJobs} className="card space-y-6">
          {hasFilters && (
            <div className="rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">
                  {t('filtersFromSetup')}
                </p>
              </div>
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
              <p className="text-[10px] text-[#b0b0b0] mt-1">{t('filtersFromSetupDesc')}</p>
            </div>
          )}

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

          <AppleButton disabled={loading || keywords.length === 0} loading={loading} className="w-full">
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
          {result && !loading && (
            <div className="card space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">{result.message || t('jobsFound', { count: result.count })}</p>
                  {result.ingest_job_id && (
                    <p className="text-[11px] text-[#707070] mt-0.5">
                      Fetching more in background...
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-[#707070]">
                <span><strong className="text-[#1d1d1f]">{result.count}</strong> {t('found')}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="card flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-[#0071e3] animate-spin" />
            </div>
          )}

          {jobs.length > 0 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t('jobsFound', { count: jobs.length })}</p>
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {jobs.map((j, i) => <JobCard key={j.id || i} job={j} index={i} />)}
              </div>
              <AppleButton variant="secondary" className="w-full" onClick={() => router.push('/rank')}>
                {t('continueToRank')}
              </AppleButton>
            </>
          ) : !loading ? (
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
