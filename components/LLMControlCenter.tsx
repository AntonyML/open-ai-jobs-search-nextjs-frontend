/**
 * LLM Control Center — full-width admin page (Status | Queue grid)
 *
 * Real-time view of the running LLM execution system (admin only):
 * • Active provider & model with health status
 * • Provider health cards (latency, cooldown, error counts)
 * • Model state list
 * • Queue view with all jobs
 * • Controls (pause/resume/cancel/retry)
 * • Real-time metrics
 * • Friendly error messages (no stack traces)
 *
 * Design: Apple-inspired light theme (#f5f5f7 canvas, #0071e3 accent)
 * Polling: Adaptive — WebSocket with HTTP fallback
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

// ── Single Icon component (replaces 9 inline SVG functions) ─────

const ICON_PATHS: Record<string, string> = {
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  play: 'M5 3l14 9-14 9V3z',
  x: 'M18 6L6 18M6 6l12 12',
  refresh: 'M23 4v6h-6M20.49 15a9 9 0 11-2.12-9.36L23 10',
  alertCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  check: 'M20 6L9 17l-5-5',
  clock: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4v6l4 2',
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICON_PATHS[name] || ICON_PATHS.x} />
    </svg>
  )
}

// ── Collapsible Section ──────────────────────────────────────────

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
        onClick={() => setOpen((o) => !o)}
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
          <Icon name={open ? 'chevronUp' : 'chevronDown'} />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="space-y-1.5 pb-1 pt-2">{children}</div>
      </div>
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────────

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

// ── Provider Card ────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: ProviderHealth }) {
  const hasCooldown = provider.status === 'cooldown'
  const isDegraded = provider.status === 'degraded'
  const isDisabled = provider.status === 'disabled'
  const totalAttempts = provider.total_calls || 1
  const successLabel =
    provider.total_calls > 0 ? `${provider.success_count}/${totalAttempts - 1} ok` : '—'

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
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold text-[#1d1d1f]">{provider.provider}</span>
        <StatusBadge status={provider.status} pulse={hasCooldown} />
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#858585]">
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" /> {formatMs(provider.last_latency_ms)}
        </span>
        <span>{successLabel}</span>
        {provider.rate_limit_count > 0 && (
          <span className="text-blue-500">{provider.rate_limit_count}× 429</span>
        )}
      </div>

      {provider.last_error && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-rose-50 px-2 py-1.5">
          <span className="mt-0.5 shrink-0 text-rose-400"><Icon name="alertCircle" /></span>
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

      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#e2e2e5]">
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

// ── Queue Job Row ────────────────────────────────────────────────

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
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-[#1d1d1f]">
            {job.description || job.pipeline || 'LLM call'}
          </span>
        </div>
        <StatusBadge status={job.status} pulse={isRunning || isRetrying} />
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#707070]">
        {job.provider && <span className="font-medium text-[#474747]">{job.provider}</span>}
        {job.model && <span>{job.model}</span>}
        {job.retry_count > 0 && (
          <span className="text-amber-500">
            retry {job.retry_count}/{job.max_retries}
          </span>
        )}
        {job.execution_time_ms != null && <span>{formatMs(job.execution_time_ms)}</span>}
      </div>

      {job.last_error && (
        <p className="mt-1 truncate text-[10px] leading-tight text-rose-500">
          {job.last_error.split('\n')[0].substring(0, 80)}
        </p>
      )}

      {showActions && (
        <div className="mt-1.5 flex gap-1.5">
          {isRunning && (
            <button
              onClick={() => onCancel(job.id)}
              className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-0.5 text-[9px] font-medium text-[#707070] transition-colors hover:border-rose-300 hover:text-rose-500"
            >
              <Icon name="x" /> {t('cancel')}
            </button>
          )}
          {isFailed && (
            <button
              onClick={() => onRetry(job.id)}
              className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-0.5 text-[9px] font-medium text-[#707070] transition-colors hover:border-[#0071e3]/30 hover:text-[#0071e3]"
            >
              <Icon name="refresh" /> {t('retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Metric Card ──────────────────────────────────────────────────

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
      <p
        className={`text-[15px] font-semibold leading-tight ${accent ? accentColors[accent] : 'text-[#1d1d1f]'}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[9px] text-[#858585]">{sub}</p>}
    </div>
  )
}

// ── Metrics Grid ─────────────────────────────────────────────────

function MetricsGrid({
  completed,
  completionRate,
  failed,
  tc,
}: {
  completed: number
  completionRate: number
  failed: number
  tc: (key: string) => string
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1.5">
      <MetricCard
        label={tc('done')}
        value={completed}
        sub={completed > 0 ? `${completionRate}% rate` : undefined}
        accent="emerald"
      />
      <MetricCard
        label={tc('error')}
        value={failed}
        accent={failed > 0 ? 'rose' : undefined}
      />
    </div>
  )
}

// ── Queue Controls ───────────────────────────────────────────────

function QueueControls({
  paused,
  isWorking,
  pendingCount,
  failedCount,
  onPause,
  onResume,
  onCancelAll,
  onRetry,
  t,
}: {
  paused: boolean
  isWorking: boolean
  pendingCount: number
  failedCount: number
  onPause: () => void
  onResume: () => void
  onCancelAll: () => void
  onRetry: () => void
  t: (key: string) => string
}) {
  const hasActivity = isWorking || pendingCount > 0

  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {paused ? (
        <button
          onClick={onResume}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
        >
          <Icon name="play" /> {t('resume')}
        </button>
      ) : (
        <button
          onClick={onPause}
          disabled={!hasActivity}
          className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#707070] transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
        >
          <Icon name="pause" /> {t('pause')}
        </button>
      )}
      <button
        onClick={onCancelAll}
        disabled={!hasActivity}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#707070] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
      >
        <Icon name="x" /> {t('cancelAll')}
      </button>
      {failedCount > 0 && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-full border border-[#0071e3]/30 bg-[#f4f8fb] px-2.5 py-1 text-[10px] font-medium text-[#0071e3] transition-colors hover:bg-[#e8f0fe]"
        >
          <Icon name="refresh" /> {t('retry')}
        </button>
      )}
    </div>
  )
}

// ── Queue Summary Footer ─────────────────────────────────────────

function QueueSummary({
  total,
  completed,
  failed,
  cancelled,
  tc,
}: {
  total: number
  completed: number
  failed: number
  cancelled: number
  tc: (key: string) => string
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-[#e2e2e5] pt-2 text-[9px] text-[#858585]">
      <span>{tc('all')}: {total}</span>
      <span>{completed} ✓</span>
      <span>{failed} ✗</span>
      <span>{cancelled} ⊘</span>
    </div>
  )
}

// ── Status Panel ────────────────────────────────────────────────

function StatusTab({
  queue,
  providers,
  models,
  providerErrors,
  tc,
  t,
}: {
  queue: any
  providers: ProviderHealth[]
  models: any[]
  providerErrors: Record<string, string>
  tc: (key: string) => string
  t: (key: string) => string
}) {
  const totalEnqueued = queue?.total_enqueued ?? 0
  const completionRate =
    totalEnqueued > 0 ? Math.round(((queue?.total_completed ?? 0) / totalEnqueued) * 100) : 0

  return (
    <>
      <MetricsGrid
        completed={queue?.total_completed ?? 0}
        completionRate={completionRate}
        failed={queue?.total_failed ?? 0}
        tc={tc}
      />

      {Object.keys(providerErrors).length > 0 && (
        <div className="mb-3 space-y-1">
          {Object.entries(providerErrors)
            .slice(0, 2)
            .map(([prov, msg]) => (
              <div
                key={prov}
                className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5"
              >
                <span className="mt-0.5 shrink-0 text-amber-500"><Icon name="alertCircle" /></span>
                <p className="text-[10px] leading-tight text-amber-700">{msg}</p>
              </div>
            ))}
        </div>
      )}

      {providers.length > 0 && (
        <Section title={t('providers')} count={providers.length}>
          {providers.map((p) => <ProviderCard key={p.provider} provider={p} />)}
        </Section>
      )}

      {models.length > 0 && (
        <Section title={t('models')} count={models.length} defaultOpen={false}>
          {models.slice(0, 8).map((m) => (
            <div
              key={`${m.provider}/${m.model_name}`}
              className="flex items-center justify-between rounded-lg border border-[#e2e2e5] px-2.5 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-[#1d1d1f]">{m.model_name}</p>
                <p className="text-[9px] text-[#707070]">{m.provider}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={m.state} pulse={m.state === 'COOLDOWN'} />
                {m.average_latency_ms != null && (
                  <span className="text-[9px] text-[#707070]">{formatMs(m.average_latency_ms)}</span>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}
    </>
  )
}

// ── Queue Panel ─────────────────────────────────────────────────

function QueueTab({
  queue,
  cancelJob,
  retryFailed,
  pauseQueue,
  resumeQueue,
  cancelAll,
  isWorking,
  tc,
  t,
}: {
  queue: any
  cancelJob: (id: string) => void
  retryFailed: (id?: string) => void
  pauseQueue: () => void
  resumeQueue: () => void
  cancelAll: () => void
  isWorking: boolean
  tc: (key: string) => string
  t: (key: string) => string
}) {
  const runningJobs: ExecutionJob[] = queue?.running_jobs ?? []
  const pendingJobs: ExecutionJob[] = queue?.pending_jobs ?? []
  const recentCompleted: ExecutionJob[] = queue?.recent_completed ?? []
  const recentFailed: ExecutionJob[] = queue?.recent_failed ?? []

  return (
    <>
      <QueueControls
        paused={queue?.paused}
        isWorking={isWorking}
        pendingCount={pendingJobs.length}
        failedCount={queue?.total_failed ?? 0}
        onPause={pauseQueue}
        onResume={resumeQueue}
        onCancelAll={cancelAll}
        onRetry={() => retryFailed()}
        t={t}
      />

      {queue?.paused && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
          <span className="text-amber-500"><Icon name="alertCircle" /></span>
          <p className="text-[10px] text-amber-700">{t('pausedHint')}</p>
        </div>
      )}

      {runningJobs.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] font-semibold text-[#474747]">{t('running')}</p>
          {runningJobs.map((job) => (
            <JobRow key={job.id} job={job} onCancel={cancelJob} onRetry={retryFailed} />
          ))}
        </div>
      )}

      {pendingJobs.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] font-semibold text-[#474747]">
            {t('queued')} · {pendingJobs.length}
          </p>
          {pendingJobs.slice(0, 10).map((job) => (
            <JobRow key={job.id} job={job} onCancel={cancelJob} onRetry={retryFailed} />
          ))}
        </div>
      )}

      {recentCompleted.length > 0 && (
        <Section title={t('recent')} count={recentCompleted.length} defaultOpen={false}>
          {recentCompleted.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-[#e2e2e5] px-2.5 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium text-[#1d1d1f]">
                  {job.description || job.pipeline}
                </p>
                <p className="text-[9px] text-[#858585]">
                  {job.provider && `${job.provider} · `}
                  {formatDate(job.finished_at)}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-medium text-emerald-500">
                <Icon name="check" />
              </span>
            </div>
          ))}
        </Section>
      )}

      {recentFailed.length > 0 && (
        <Section title={t('failed')} count={recentFailed.length} defaultOpen={false}>
          {recentFailed.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium text-[#1d1d1f]">
                  {job.description || job.pipeline}
                </p>
                <p className="text-[9px] text-[#858585]">
                  {job.provider && `${job.provider} · `}
                  {formatDate(job.finished_at)}
                </p>
                {job.last_error && (
                  <p className="mt-0.5 truncate text-[9px] text-rose-500">
                    {job.last_error.split('\n')[0].substring(0, 60)}
                  </p>
                )}
              </div>
              <button
                onClick={() => retryFailed(job.id)}
                className="shrink-0 rounded-full border border-[#d2d2d7] bg-white px-2 py-0.5 text-[9px] font-medium text-[#707070] transition-colors hover:border-[#0071e3]/30 hover:text-[#0071e3]"
              >
                <Icon name="refresh" />
              </button>
            </div>
          ))}
        </Section>
      )}

      {(!queue || (runningJobs.length === 0 && pendingJobs.length === 0 && recentCompleted.length === 0 && recentFailed.length === 0)) && (
        <div className="rounded-lg border border-dashed border-[#d2d2d7] p-4 text-center">
          <p className="text-[10px] text-[#858585]">{t('noJobs')}</p>
          <p className="mt-0.5 text-[9px] text-[#858585]">{t('startHint')}</p>
        </div>
      )}

      {queue && (
        <QueueSummary
          total={queue.total_enqueued}
          completed={queue.total_completed}
          failed={queue.total_failed}
          cancelled={queue.total_cancelled}
          tc={tc}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

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
    pauseQueue,
    resumeQueue,
    cancelJob,
    cancelAll,
    retryFailed,
    refresh,
  } = useOrchestrator()

  const activeProvider = providers.find((p) =>
    (queue?.running_jobs ?? []).some((j: any) => j.provider === p.provider)
  ) ?? providers[0]

  // Friendly top-level status message
  const topStatus = (() => {
    if (loading) return { text: t('loading'), accent: 'text-[#858585]' as const }
    if (error) return { text: tc('error'), accent: 'text-rose-500' as const }
    if (isWorking)
      return { text: `${t('status')} · ${queue?.running_jobs.length ?? 0}`, accent: 'text-cyan-500' as const }
    if (queue?.paused) return { text: t('pause'), accent: 'text-amber-500' as const }
    if (isCooldown) return { text: t('cooldown'), accent: 'text-blue-500' as const }
    if (queue?.pending_jobs.length)
      return { text: `${queue.pending_jobs.length} ${t('queued').toLowerCase()}`, accent: 'text-[#707070]' as const }
    return { text: t('idle'), accent: 'text-[#707070]' as const }
  })()

  const totalJobs = queue ? queue.running_jobs.length + queue.pending_jobs.length + (queue?.recent_failed ?? []).length + (queue?.total_cancelled ?? 0) : 0

  return (
    <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Status card ── */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  isWorking
                    ? 'animate-pulse bg-cyan-400'
                    : queue?.paused
                      ? 'bg-amber-400'
                      : isCooldown
                        ? 'bg-blue-400'
                        : 'bg-emerald-400'
                }`}
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0071e3]">
                  {t('status')}
                </p>
                <p className={`text-[13px] font-semibold ${topStatus.accent}`}>{topStatus.text}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {activeProvider && (
                <p className="text-[11px] text-[#707070]">
                  {activeProvider.provider} ·{' '}
                  {models.find((m) => m.provider === activeProvider.provider)?.model_name ?? '—'}
                </p>
              )}
              <button
                onClick={refresh}
                className="rounded-full p-1.5 text-[#858585] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                title={tc('refresh')}
              >
                <Icon name="refresh" />
              </button>
            </div>
          </div>

          <StatusTab
            queue={queue}
            providers={providers}
            models={models}
            providerErrors={providerErrors}
            tc={tc}
            t={t}
          />

          {error && (
            <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
              <span className="mt-0.5 shrink-0 text-rose-400"><Icon name="alertCircle" /></span>
              <div>
                <p className="text-[10px] font-medium text-rose-600">{tc('error')}</p>
                <p className="mt-0.5 text-[9px] text-rose-500">{t('retry')}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Queue card ── */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  isWorking
                    ? 'animate-pulse bg-cyan-400'
                    : queue?.paused
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
              />
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0071e3]">
                {t('queue')}
                {totalJobs > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[#0071e3] px-1.5 text-[9px] font-bold text-white">
                    {totalJobs}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={refresh}
              className="rounded-full p-1.5 text-[#858585] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
              title={tc('refresh')}
            >
              <Icon name="refresh" />
            </button>
          </div>

          <QueueTab
            queue={queue}
            cancelJob={cancelJob}
            retryFailed={retryFailed}
            pauseQueue={pauseQueue}
            resumeQueue={resumeQueue}
            cancelAll={cancelAll}
            isWorking={isWorking}
            tc={tc}
            t={t}
          />
        </div>
      </div>
    )
  }

