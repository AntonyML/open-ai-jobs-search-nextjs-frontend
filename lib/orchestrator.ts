/**
 * Orchestrator API client & hooks
 *
 * Synchronizes the frontend with the backend LLMOrchestrator.
 * Provides adaptive polling — fast during active jobs, slow when idle.
 *
 * Architecture:
 * - useOrchestrator(): main hook returning full state + action functions
 * - Types mirror backend schemas (QueueStatusOut, ProviderHealthOut, etc.)
 * - Adaptive polling intervals: running=2s, queued=4s, idle=15s, error=8s
 *
 * 422 Error Fix:
 * The backend ``get_current_user`` dependency used ``Header(...)`` (required),
 * which caused FastAPI to return 422 when the auth header was missing (e.g.
 * during initial page load before ``localStorage`` is populated).
 * The backend was fixed to use ``Header(None)`` and return 401 instead.
 * The frontend catches 401 errors gracefully and returns null/empty state.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from './api'

// ── Types (mirroring backend schemas) ──────────────────────────────

export interface ProviderHealth {
  provider: string
  status: 'healthy' | 'degraded' | 'cooldown' | 'disabled'
  priority: number
  cooldown_until: string | null
  total_calls: number
  success_count: number
  failure_count: number
  rate_limit_count: number
  timeout_count: number
  consecutive_failures: number
  health_score: number
  last_latency_ms: number | null
  last_error: string | null
  last_error_code: string | null
}

export interface ModelHealth {
  provider: string
  model_name: string
  state: 'READY' | 'BUSY' | 'COOLDOWN' | 'DISABLED'
  priority: number
  cost_rank: number
  context_window: number | null
  cooldown_until: string | null
  average_latency_ms: number | null
  average_success_rate: number
  total_calls: number
  last_error: string | null
  last_error_code: string | null
}

export interface ExecutionJob {
  id: string
  user_id: string
  pipeline: string
  group_id: string | null
  description: string | null
  status: string
  provider: string | null
  model: string | null
  retry_count: number
  max_retries: number
  last_error: string | null
  last_error_code: string | null
  started_at: string | null
  finished_at: string | null
  execution_time_ms: number | null
  worker_id: string | null
  created_at: string
  updated_at: string
}

export interface QueueStatus {
  paused: boolean
  max_concurrency: number
  active_workers: number
  total_enqueued: number
  total_completed: number
  total_failed: number
  total_cancelled: number
  pending_jobs: ExecutionJob[]
  running_jobs: ExecutionJob[]
  recent_completed: ExecutionJob[]
}

export interface OrchestratorState {
  /** Queue status (fetched from /queue) */
  queue: QueueStatus | null
  /** Provider health (fetched from /providers) */
  providers: ProviderHealth[]
  /** Model health aggregated from all providers */
  models: ModelHealth[]
  /** Whether the orchestrator is actively working */
  isWorking: boolean
  /** Whether any provider is in cooldown */
  isCooldown: boolean
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
  /** Last error per provider for friendly messages */
  providerErrors: Record<string, string>
}

// ── Friendly error messages ────────────────────────────────────────

function friendlyError(provider: string, code: string | null, message: string | null): string {
  if (!message) return `${provider} encountered an issue`
  if (code === 'rate_limit') return `${provider} reached rate limit. Cooling down.`
  if (code === 'timeout') return `${provider} timed out. Automatically switching.`
  if (code === 'auth_error') return `${provider} authentication failed. Check your API key.`
  if (code === 'server_error') return `${provider} is unavailable. Using next provider.`
  if (code === 'empty_response') return `${provider} returned an empty response. Retrying.`
  // Extract the core message, strip stack traces
  const clean = message.split('\n')[0].substring(0, 80)
  return `${provider}: ${clean}`
}

// ── Adaptive polling hook ──────────────────────────────────────────

const POLL_INTERVALS = {
  running: 2000,   // 2s — actively processing
  queued: 4000,    // 4s — jobs waiting
  idle: 15000,     // 15s — nothing happening
  error: 8000,     // 8s — after an error
}

/**
 * Determine the current polling interval based on queue state.
 */
function getPollInterval(queue: QueueStatus | null): number {
  if (!queue) return POLL_INTERVALS.idle
  if (queue.running_jobs.length > 0) return POLL_INTERVALS.running
  if (queue.pending_jobs.length > 0 && !queue.paused) return POLL_INTERVALS.queued
  return POLL_INTERVALS.idle
}

/**
 * Main orchestrator hook.
 *
 * Returns the full orchestrator state and action functions.
 * Adaptively polls the backend: faster when jobs are running, slower when idle.
 */
export function useOrchestrator() {
  const [state, setState] = useState<OrchestratorState>({
    queue: null,
    providers: [],
    models: [],
    isWorking: false,
    isCooldown: false,
    loading: true,
    error: null,
    providerErrors: {},
  })
  const mountedRef = useRef(true)

  // ── Fetch all orchestrator data ──────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [queueRes, providersRes] = await Promise.all([
        apiFetch<QueueStatus>('/api/v1/orchestrator/queue').catch(() => null),
        apiFetch<{ providers: ProviderHealth[] }>('/api/v1/orchestrator/providers').catch(() => ({ providers: [] })),
      ])

      if (!mountedRef.current) return

      // Fetch models for each provider that has health data
      const modelPromises = (providersRes?.providers ?? []).map(p =>
        apiFetch<{ provider: string; models: ModelHealth[] }>(`/api/v1/orchestrator/models?provider=${p.provider}`)
          .catch(() => ({ provider: p.provider, models: [] }))
      )
      const modelResults = await Promise.all(modelPromises)
      const allModels = modelResults.flatMap(r => r.models ?? [])

      // Build friendly provider errors
      const providerErrors: Record<string, string> = {}
      for (const p of providersRes?.providers ?? []) {
        if (p.last_error || p.status === 'cooldown') {
          providerErrors[p.provider] = friendlyError(p.provider, p.last_error_code, p.last_error)
        }
      }

      const isWorking = (queueRes?.running_jobs.length ?? 0) > 0
      const isCooldown = (providersRes?.providers ?? []).some(p => p.status === 'cooldown')

      setState({
        queue: queueRes,
        providers: providersRes?.providers ?? [],
        models: allModels,
        isWorking,
        isCooldown,
        loading: false,
        error: null,
        providerErrors,
      })
    } catch (err) {
      if (!mountedRef.current) return
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch orchestrator status',
      }))
    }
  }, [])

  // ── Adaptive polling loop ────────────────────────────────────────
  // Uses a single setTimeout chain that re-evaluates the delay after each fetch.
  // This avoids multiple intervals coexisting and stale closure issues.
  // Initial fetch is chained with .then() to prevent race with first poll timeout.

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    mountedRef.current = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      await fetchAll()
      if (!mountedRef.current) return
      const nextDelay = getPollInterval(stateRef.current.queue)
      timeoutId = setTimeout(poll, nextDelay)
    }

    // Chain initial fetch so the first poll doesn't race with it
    fetchAll().then(() => {
      timeoutId = setTimeout(poll, getPollInterval(stateRef.current.queue))
    })

    return () => {
      mountedRef.current = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fetchAll])

  // ── Action functions ─────────────────────────────────────────────

  const pauseQueue = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'pause' }),
    })
    await fetchAll()
  }, [fetchAll])

  const resumeQueue = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'resume' }),
    })
    await fetchAll()
  }, [fetchAll])

  const cancelJob = useCallback(async (jobId: string) => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel', job_id: jobId }),
    })
    await fetchAll()
  }, [fetchAll])

  const cancelAll = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel' }),
    })
    await fetchAll()
  }, [fetchAll])

  const retryFailed = useCallback(async (jobId?: string) => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'retry_failed', job_id: jobId }),
    })
    await fetchAll()
  }, [fetchAll])

  const resetPipeline = useCallback(async () => {
    const res = await apiFetch<{ status: string; total_deleted: number; message: string }>('/api/v1/pipeline-reset/', {
      method: 'DELETE',
    })
    return res
  }, [])

  return {
    ...state,
    pauseQueue,
    resumeQueue,
    cancelJob,
    cancelAll,
    retryFailed,
    resetPipeline,
    refresh: fetchAll,
  }
}

/**
 * Lightweight hook that only fetches the queue status on a fixed interval.
 * Less data than useOrchestrator — ideal for pages that just need job progress.
 * Does NOT poll providers or models, so it's cheaper on the backend.
 */
export function useQueueStatus(pollMs: number = 2000) {
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const poll = async () => {
      try {
        const data = await apiFetch<QueueStatus>('/api/v1/orchestrator/queue')
        if (mountedRef.current) {
          setQueue(data)
          setLoading(false)
        }
      } catch {
        if (mountedRef.current) setLoading(false)
      }
    }
    poll()
    const timer = setInterval(poll, pollMs)
    return () => {
      mountedRef.current = false
      clearInterval(timer)
    }
  }, [pollMs])

  return { queue, loading }
}

// ── Helpers for status display ─────────────────────────────────────

export function statusColor(status: string): string {
  switch (status) {
    case 'healthy': return 'bg-emerald-400'
    case 'degraded': return 'bg-amber-400'
    case 'cooldown': return 'bg-blue-400'
    case 'disabled': return 'bg-slate-400'
    case 'READY': return 'bg-emerald-400'
    case 'BUSY': return 'bg-cyan-400'
    case 'COOLDOWN': return 'bg-blue-400'
    case 'DISABLED': return 'bg-slate-400'
    case 'running': case 'Running': return 'bg-cyan-400'
    case 'completed': case 'Completed': return 'bg-emerald-400'
    case 'failed': case 'Failed': return 'bg-rose-400'
    case 'queued': case 'Queued': return 'bg-slate-500'
    case 'pending': case 'Pending': return 'bg-slate-500'
    case 'cancelled': case 'Cancelled': return 'bg-slate-400'
    case 'retrying': case 'Retrying': return 'bg-amber-400'
    case 'rate_limited': case 'RateLimited': return 'bg-blue-400'
    default: return 'bg-slate-400'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'healthy': return 'Healthy'
    case 'degraded': return 'Degraded'
    case 'cooldown': return 'Cooling down'
    case 'disabled': return 'Disabled'
    case 'READY': return 'Ready'
    case 'BUSY': return 'Running'
    case 'COOLDOWN': return 'Cooling down'
    case 'DISABLED': return 'Disabled'
    default: return status
  }
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}
