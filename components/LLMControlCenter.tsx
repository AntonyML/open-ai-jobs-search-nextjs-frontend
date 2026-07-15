/**
 * LLM Control Center — permanent sticky right sidebar
 *
 * Every user-facing view of the running LLM execution system:
 * • Active provider & model with health status
 * • Provider health cards (latency, cooldown, error counts)
 * • Model state list
 * • Queue view with all jobs
 * • Controls (pause/resume/cancel/retry)
 * • Real-time metrics
 * • Friendly error messages (no stack traces)
 *
 * Design: Apple-inspired light theme (#f5f5f7 canvas, #0071e3 accent)
 * Polling: Adaptive — 2s during active, 15s when idle
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ExecutionJob,
  formatDate,
  formatMs,
  ProviderHealth,
  statusColor,
  statusLabel,
  useOrchestrator,
} from '@/lib/orchestrator'

// ── Icons (inline SVGs for dependency-free operation) ──────────────

const IconPause = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
)
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconAlertCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

// ── Collapsible Section ────────────────────────────────────────────

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number | string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-[#d2d2d7] pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-left group"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#707070]">
          {title}
          {count != null && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#e2e2e5] text-[8px] font-medium text-[#707070]">
              {count}
            </span>
          )}
        </span>
        <span className="text-[#858585] transition-transform duration-200 group-hover:text-[#707070]">
          {open ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="pt-2 pb-1 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Status Badge ───────────────────────────────────────────────────

function StatusBadge({ status, pulse }: { status: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`relative inline-flex h-2 w-2 ${pulse ? 'animate-pulse' : ''}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${statusColor(status)}`} />
        {pulse && (
          <span
            className={`absolute inset-0 inline-block h-2 w-2 rounded-full ${statusColor(status)} animate-ping opacity-30`}
          />
        )}
      </span>
      <span className="text-[11px] font-medium text-[#474747]">{statusLabel(status)}</span>
    </span>
  )
}

// ── Provider Card ──────────────────────────────────────────────────

function ProviderCard({
  provider,
  allProviders,
}: {
  provider: ProviderHealth
  allProviders: ProviderHealth[]
}) {
  const hasCooldown = provider.status === 'cooldown'
  const isDegraded = provider.status === 'degraded'
  const isDisabled = provider.status === 'disabled'
  const totalAttempts = provider.total_calls || 1
  const successLabel = provider.total_calls > 0
    ? `${provider.success_count}/${totalAttempts - 1} ok`
    : '—'

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        isDisabled
          ? 'border-[#e2e2e5] bg-[#f5f5f7] opacity-60'
          : hasCooldown
          ? 'border-blue-200 bg-blue-50'
          : isDegraded
          ? 'border-amber-200 bg-amber-50'
          : 'border-[#d2d2d7] bg-white hover:border-[#0071e3]/30 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#1d1d1f] truncate">{provider.provider}</span>
        <StatusBadge status={provider.status} pulse={hasCooldown} />
      </div>

      {/* Metrics row */}
      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#858585]">
        <span className="inline-flex items-center gap-1">
          <IconClock /> {formatMs(provider.last_latency_ms)}
        </span>
        <span>
          {successLabel}
        </span>
        {provider.rate_limit_count > 0 && (
          <span className="text-blue-500">{provider.rate_limit_count}× 429</span>
        )}
      </div>

      {/* Error message */}
      {provider.last_error && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-rose-50 px-2 py-1.5">
          <span className="mt-0.5 shrink-0 text-rose-400"><IconAlertCircle /></span>
          <p className="text-[10px] leading-tight text-rose-600">
            {provider.last_error_code === 'rate_limit'
              ? `Rate limited. ${provider.cooldown_until ? 'Resuming shortly.' : 'Cooling down.'}`
              : provider.last_error_code === 'auth_error'
              ? 'Auth failed. Check your API key.'
              : provider.last_error_code === 'timeout'
              ? 'Timed out. Switching provider.'
              : provider.last_error?.split('\n')[0].substring(0, 60)}
          </p>
        </div>
      )}

      {/* Health bar */}
      <div className="mt-1.5 h-1 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            provider.health_score > 0.8
              ? 'bg-emerald-400'
              : provider.health_score > 0.5
              ? 'bg-amber-400'
              : 'bg-rose-400'
          }`}
          style={{ width: `${Math.round(provider.health_score * 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Queue Job Row ──────────────────────────────────────────────────

function JobRow({
  job,
  onCancel,
  onRetry,
}: {
  job: ExecutionJob
  onCancel: (id: string) => void
  onRetry: (id: string) => void
}) {
  const t = useTranslations('llmControl')
  const isRunning = job.status === 'running' || job.status === 'Running'
  const isFailed = job.status === 'failed' || job.status === 'Failed'
  const isRetrying = job.status === 'retrying' || job.status === 'Retrying'
  const isRateLimited = job.status === 'rate_limited' || job.status === 'RateLimited'
  const showActions = isRunning || isFailed || isRetrying

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-all ${
        isRunning
          ? 'border-cyan-200 bg-cyan-50'
          : isFailed
          ? 'border-rose-200 bg-rose-50'
          : isRetrying
          ? 'border-amber-200 bg-amber-50'
          : isRateLimited
          ? 'border-blue-200 bg-blue-50'
          : 'border-[#d2d2d7] bg-white'
      }`}
    >
      {/* Job header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-[#1d1d1f] truncate block">
            {job.description || job.pipeline || 'LLM call'}
          </span>
        </div>
        <StatusBadge status={job.status} pulse={isRunning || isRetrying} />
      </div>

      {/* Job details */}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#858585] flex-wrap">
        {job.provider && <span className="font-medium text-[#474747]">{job.provider}</span>}
        {job.model && <span>{job.model}</span>}
        {job.retry_count > 0 && <span className="text-amber-500">retry {job.retry_count}/{job.max_retries}</span>}
        {job.execution_time_ms != null && <span>{formatMs(job.execution_time_ms)}</span>}
      </div>

      {/* Last error */}
      {job.last_error && (
        <p className="mt-1 text-[10px] leading-tight text-rose-500 truncate">
          {job.last_error.split('\n')[0].substring(0, 80)}
        </p>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-1.5 flex gap-1.5">
          {isRunning && (
            <button
              onClick={() => onCancel(job.id)}
              className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-0.5 text-[9px] font-medium text-[#707070] hover:border-rose-300 hover:text-rose-500 transition-colors"
            >                              <IconX /> {t('cancel')}
                            </button>
                          )}
                          {isFailed && (
                            <button
                              onClick={() => onRetry(job.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-0.5 text-[9px] font-medium text-[#707070] hover:border-[#0071e3]/30 hover:text-[#0071e3] transition-colors"
                            >
                              <IconRefresh /> {t('retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'emerald' | 'amber' | 'rose' | 'cyan'
}) {
  const accentColors: Record<string, string> = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    cyan: 'text-cyan-500',
  }
  return (
    <div className="rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-wider text-[#858585]">{label}</p>
      <p className={`text-[15px] font-semibold leading-tight ${accent ? accentColors[accent] : 'text-[#1d1d1f]'}`}>
        {value}
      </p>
      {sub && <p className="text-[9px] text-[#858585] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────

export default function LLMControlCenter() {
  const t = useTranslations('llmControl')
  const tc = useTranslations('common')
  const {
    queue,
    providers,
    models,
    isWorking,
    isCooldown,
    loading,
    error,
    providerErrors,
    wsConnected,
    pauseQueue,
    resumeQueue,
    cancelJob,
    cancelAll,
    retryFailed,
    refresh,
  } = useOrchestrator()

  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'status' | 'queue'>('status')

  const activeProvider = providers.find(
    p => (queue?.running_jobs ?? []).some(j => j.provider === p.provider)
  ) ?? providers[0]

  // Friendly top-level status message
  const topStatus = (() => {
    if (loading) return { text: t('loading'), accent: 'text-[#858585]' as const }
    if (error) return { text: tc('error'), accent: 'text-rose-500' as const }
    if (isWorking) return { text: `${t('status')} · ${queue?.running_jobs.length ?? 0}`, accent: 'text-cyan-500' as const }
    if (queue?.paused) return { text: t('pause'), accent: 'text-amber-500' as const }
    if (isCooldown) return { text: t('loading'), accent: 'text-blue-500' as const }
    if (queue?.pending_jobs.length) return { text: `${queue.pending_jobs.length} ${t('queued').toLowerCase()}`, accent: 'text-[#707070]' as const }
    return { text: t('idle'), accent: 'text-[#707070]' as const }
  })()

  const totalEnqueued = queue
    ? queue.total_enqueued
    : 0
  const completionRate = totalEnqueued > 0
    ? Math.round(((queue?.total_completed ?? 0) / totalEnqueued) * 100)
    : 0

  return (
    <aside
      className={`sticky top-6 z-30 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-12' : 'w-[280px]'
      } shrink-0 hidden lg:block`}
    >
      <div
        className={`rounded-2xl border border-[#d2d2d7] bg-white shadow-sm transition-all llm-control-scroll ${
          collapsed ? 'p-2' : 'p-4'
        }`}
        style={{ maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
      >
        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="float-right rounded-full p-1 text-[#858585] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        {/* Collapsed state — minimal dots */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 pt-6">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isWorking ? 'bg-cyan-400 animate-pulse' : queue?.paused ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[8px] uppercase tracking-wider text-[#858585] [writing-mode:vertical-rl]">
              LLM
            </span>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#0071e3]">
                  {t('title')}
                </p>
                <div className="flex items-center gap-1">
                  {/* WebSocket connection status */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-all ${
                      wsConnected
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                    title={wsConnected ? t('live') : t('polling')}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        wsConnected
                          ? 'bg-emerald-400'
                          : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <span className="text-[8px] font-medium leading-none">
                      {wsConnected ? t('live') : t('polling')}
                    </span>
                  </span>
                  <button
                    onClick={refresh}
                    className="rounded-full p-1 text-[#858585] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
                    title={tc('refresh')}
                  >
                    <IconRefresh />
                  </button>
                </div>
              </div>

              {/* Main status */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    isWorking
                      ? 'bg-cyan-400 animate-pulse'
                      : queue?.paused
                      ? 'bg-amber-400'
                      : isCooldown
                      ? 'bg-blue-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <p className={`text-[13px] font-semibold ${topStatus.accent}`}>
                  {topStatus.text}
                </p>
              </div>
              {activeProvider && (
                <p className="mt-0.5 text-[11px] text-[#858585]">
                  {activeProvider.provider} · {models.find(m => m.provider === activeProvider.provider)?.model_name ?? '—'}
                </p>
              )}
            </div>

            {/* ── Tabs ───────────────────────────────────────────── */}
            <div className="flex gap-1 mb-3 rounded-lg bg-[#f5f5f7] p-0.5">
              <button
                onClick={() => setActiveTab('status')}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  activeTab === 'status'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#858585] hover:text-[#474747]'
                }`}
              >
                {t('status')}
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  activeTab === 'queue'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#858585] hover:text-[#474747]'
                }`}
              >
                {t('queue')}
                {queue && (queue.running_jobs.length + queue.pending_jobs.length) > 0 && (
                  <span className="ml-1 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#0071e3] px-1 text-[8px] font-bold text-white">
                    {queue.running_jobs.length + queue.pending_jobs.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── Status Tab ─────────────────────────────────────── */}
            {activeTab === 'status' && (
              <>
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <MetricCard
                    label={tc('done')}
                    value={queue?.total_completed ?? 0}
                    sub={totalEnqueued > 0 ? `${completionRate}% rate` : undefined}
                    accent="emerald"
                  />
                  <MetricCard
                    label={tc('error')}
                    value={queue?.total_failed ?? 0}
                    accent={((queue?.total_failed ?? 0) > 0) ? 'rose' : undefined}
                  />
                  <MetricCard
                    label={t('activeWorkers')}
                    value={queue?.active_workers ?? 0}
                    sub={`of ${queue?.max_concurrency ?? 4}`}
                    accent={(queue?.active_workers ?? 0) > 0 ? 'cyan' : undefined}
                  />
                  <MetricCard
                    label={t('rateLimitCount')}
                    value={providers.reduce((s, p) => s + p.rate_limit_count, 0)}
                    accent="amber"
                  />
                </div>

                {/* Provider errors */}
                {Object.keys(providerErrors).length > 0 && (
                  <div className="mb-3 space-y-1">
                    {Object.entries(providerErrors).slice(0, 2).map(([prov, msg]) => (
                      <div
                        key={prov}
                        className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5"
                      >
                        <span className="mt-0.5 shrink-0 text-amber-500"><IconAlertCircle /></span>
                        <p className="text-[10px] leading-tight text-amber-700">{msg}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Providers section */}
                <Section title={t('providers')} count={providers.length}>
                  {providers.length === 0 ? (
                    <p className="text-[10px] text-[#858585] italic">{tc('noResults')}</p>
                  ) : (
                    providers.map(p => (
                      <ProviderCard key={p.provider} provider={p} allProviders={providers} />
                    ))
                  )}
                </Section>

                {/* Models section (collapsed by default) */}
                <Section title={t('models')} count={models.length} defaultOpen={false}>
                  {models.length === 0 ? (
                    <p className="text-[10px] text-[#858585] italic">{tc('noResults')}</p>
                  ) : (
                    models.slice(0, 8).map(m => (
                      <div
                        key={`${m.provider}/${m.model_name}`}
                        className="flex items-center justify-between rounded-lg border border-[#e2e2e5] px-2.5 py-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-[#1d1d1f] truncate">{m.model_name}</p>
                          <p className="text-[9px] text-[#858585]">{m.provider}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={m.state} pulse={m.state === 'COOLDOWN'} />
                          {m.average_latency_ms != null && (
                            <span className="text-[9px] text-[#858585]">{formatMs(m.average_latency_ms)}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </Section>
              </>
            )}

            {/* ── Queue Tab ──────────────────────────────────────── */}
            {activeTab === 'queue' && (
              <>
                {/* Controls bar */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {queue?.paused ? (
                    <button
                      onClick={resumeQueue}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <IconPlay /> {t('resume')}
                    </button>
                  ) : (
                    <button
                      onClick={pauseQueue}
                      className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#707070] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                      disabled={!isWorking && queue?.pending_jobs.length === 0}
                    >
                      <IconPause /> {t('pause')}
                    </button>
                  )}
                  <button
                    onClick={cancelAll}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#707070] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    disabled={!isWorking && queue?.pending_jobs.length === 0}
                  >
                    <IconX /> {t('cancelAll')}
                  </button>
                  {(queue?.total_failed ?? 0) > 0 && (
                    <button
                      onClick={() => retryFailed()}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0071e3]/30 bg-[#f4f8fb] px-2.5 py-1 text-[10px] font-medium text-[#0071e3] hover:bg-[#e8f0fe] transition-colors"
                    >
                      <IconRefresh /> {t('retry')}
                    </button>
                  )}
                </div>

                {/* Paused indicator */}
                {queue?.paused && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                    <span className="text-amber-500"><IconAlertCircle /></span>
                    <p className="text-[10px] text-amber-700">{t('pausedHint')}</p>
                  </div>
                )}

                {/* Running jobs */}
                {(queue?.running_jobs ?? []).length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-[#474747] mb-1">
                      {t('running')}
                    </p>
                    {queue!.running_jobs.map(job => (
                      <JobRow key={job.id} job={job} onCancel={cancelJob} onRetry={retryFailed} />
                    ))}
                  </div>
                )}

                {/* Pending jobs */}
                {(queue?.pending_jobs ?? []).length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-[#474747] mb-1">
                      {t('queued')} · {queue!.pending_jobs.length}
                    </p>
                    {queue!.pending_jobs.slice(0, 10).map(job => (
                      <JobRow key={job.id} job={job} onCancel={cancelJob} onRetry={retryFailed} />
                    ))}
                  </div>
                )}

                {/* Recent completed */}
                {(queue?.recent_completed ?? []).length > 0 && (
                  <Section title={t('recent')} count={queue?.recent_completed.length} defaultOpen={false}>
                    {queue!.recent_completed.slice(0, 5).map(job => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between rounded-lg border border-[#e2e2e5] px-2.5 py-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium text-[#1d1d1f] truncate">
                            {job.description || job.pipeline}
                          </p>
                          <p className="text-[9px] text-[#858585]">
                            {job.provider && `${job.provider} · `}{formatDate(job.finished_at)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium text-emerald-500">
                          <IconCheck />
                        </span>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Empty state */}
                {(!queue || (queue.running_jobs.length === 0 && queue.pending_jobs.length === 0 && queue.recent_completed.length === 0)) && (
                  <div className="rounded-lg border border-dashed border-[#d2d2d7] p-4 text-center">
                    <p className="text-[10px] text-[#858585]">{t('noJobs')}</p>
                    <p className="text-[9px] text-[#b0b0b0] mt-0.5">{t('startHint')}</p>
                  </div>
                )}

                {/* Queue summary */}
                {queue && (
                  <div className="mt-2 flex items-center justify-between text-[9px] text-[#858585] border-t border-[#e2e2e5] pt-2">
                    <span>{tc('all')}: {queue.total_enqueued}</span>
                    <span>{queue.total_completed} ✓</span>
                    <span>{queue.total_failed} ✗</span>
                    <span>{queue.total_cancelled} ⊘</span>
                  </div>
                )}
              </>
            )}

            {/* ── Error toast area ───────────────────────────────── */}
            {error && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
                <span className="mt-0.5 shrink-0 text-rose-400"><IconAlertCircle /></span>
                <div>
                  <p className="text-[10px] font-medium text-rose-600">{tc('error')}</p>
                  <p className="text-[9px] text-rose-500 mt-0.5">{t('retry')}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
