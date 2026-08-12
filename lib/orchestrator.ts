/**
 * Orchestrator API client & hooks
 *
 * Synchronizes the frontend with the backend LLMOrchestrator.
 * Uses WebSocket for real-time queue status updates — no polling.
 *
 * Architecture:
 * - useOrchestrator(): main hook returning full state + action functions
 *   - Connects to ws://<api>/api/v1/orchestrator/ws?token=<jwt>
 *   - Receives QueueStatus JSON whenever the execution queue state changes
 *   - Falls back to polling if WebSocket fails to connect
 * - Types mirror backend schemas (QueueStatusOut, ProviderHealthOut, etc.)
 *
 * Provider/model health is still fetched via HTTP on mount (it changes
 * infrequently and doesn't warrant a separate WebSocket channel).
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from './api'
import { getToken } from './auth'

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
  recent_failed: ExecutionJob[]
}

export interface OrchestratorState {
  /** Queue status (pushed via WebSocket) */
  queue: QueueStatus | null
  /** Provider health (fetched via HTTP on mount) */
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
  /** WebSocket connection state */
  wsConnected: boolean
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

// ── WebSocket URL helper ───────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function wsUrl(): string {
  const token = getToken()
  if (!token) return ''
  const base = API_BASE.replace(/^http/, 'ws')
  return `${base}/api/v1/orchestrator/ws?token=${encodeURIComponent(token)}`
}

// ── WebSocket reconnection settings ────────────────────────────────

const WS_RECONNECT_DELAY_MS = 3000
const POLL_FALLBACK_MS = 5000

/**
 * Main orchestrator hook.
 *
 * Connects to the backend via WebSocket for real-time queue status updates.
 * Falls back to HTTP polling if the WebSocket connection fails.
 *
 * Returns the full orchestrator state and action functions.
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
    wsConnected: false,
  })
  const mountedRef = useRef(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch providers / models (HTTP — infrequent data) ──────────

  const fetchProviders = useCallback(async () => {
    try {
      const [providersRes] = await Promise.all([
        apiFetch<{ providers: ProviderHealth[] }>('/api/v1/orchestrator/providers').catch(() => ({ providers: [] })),
      ])

      if (!mountedRef.current) return

      const modelPromises = (providersRes?.providers ?? []).map(p =>
        apiFetch<{ provider: string; models: ModelHealth[] }>(`/api/v1/orchestrator/models?provider=${p.provider}`)
          .catch(() => ({ provider: p.provider, models: [] }))
      )
      const modelResults = await Promise.all(modelPromises)
      const allModels = modelResults.flatMap(r => r.models ?? [])

      const isCooldown = (providersRes?.providers ?? []).some(p => p.status === 'cooldown')

      const providerErrors: Record<string, string> = {}
      for (const p of providersRes?.providers ?? []) {
        if (p.last_error || p.status === 'cooldown') {
          providerErrors[p.provider] = friendlyError(p.provider, p.last_error_code, p.last_error)
        }
      }

      setState(prev => ({
        ...prev,
        providers: providersRes?.providers ?? [],
        models: allModels,
        isCooldown,
        providerErrors,
      }))
    } catch (err) {
      if (!mountedRef.current) return
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch provider status',
      }))
    }
  }, [])

  // ── WebSocket connection management ────────────────────────────

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = wsUrl()
    if (!url) return // No token yet

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        setState(prev => ({ ...prev, wsConnected: true, loading: false, error: null }))
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const queue: QueueStatus = JSON.parse(event.data)
          const isWorking = queue.running_jobs.length > 0
          setState(prev => ({
            ...prev,
            queue,
            isWorking,
            loading: false,
            error: null,
          }))
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onerror = (event) => {
        console.error('[WS] Connection error:', event)
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!mountedRef.current) return
        setState(prev => ({ ...prev, wsConnected: false }))

        // Schedule reconnection
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null
            connectWs()
          }, WS_RECONNECT_DELAY_MS)
        }
      }
    } catch {
      // WebSocket constructor can throw if the URL is invalid
      if (!mountedRef.current) return
      setState(prev => ({ ...prev, wsConnected: false }))

      // Fall back to polling
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          connectWs()
        }, WS_RECONNECT_DELAY_MS)
      }
    }
  }, [])

  // ── Initial fetch + WebSocket connection ───────────────────────

  useEffect(() => {
    mountedRef.current = true

    // Fetch providers/models once on mount
    fetchProviders()

    // Connect WebSocket
    const timer = setTimeout(connectWs, 100) // Small delay to ensure token is ready

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on intentional close
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connectWs, fetchProviders])

  // ── Polling fallback (when WebSocket is disconnected) ──────────

  useEffect(() => {
    if (state.wsConnected) return // Don't poll when WS is active

    const poll = async () => {
      try {
        const data = await apiFetch<QueueStatus>('/api/v1/orchestrator/queue')
        if (!mountedRef.current) return
        const isWorking = data.running_jobs.length > 0
        setState(prev => ({
          ...prev,
          queue: data,
          isWorking,
          loading: false,
          error: null,
        }))
      } catch {
        // Silently ignore — WS will reconnect
      }
    }

    // Initial poll if no data yet
    if (!state.queue) {
      poll()
    }

    const timer = setInterval(poll, POLL_FALLBACK_MS)
    return () => clearInterval(timer)
  }, [state.wsConnected, state.queue])

  // ── Action functions ─────────────────────────────────────────────

  const pauseQueue = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'pause' }),
    })
    // The WebSocket will push the updated state
  }, [])

  const resumeQueue = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'resume' }),
    })
  }, [])

  const cancelJob = useCallback(async (jobId: string) => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel', job_id: jobId }),
    })
  }, [])

  const cancelAll = useCallback(async () => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel' }),
    })
  }, [])

  const retryFailed = useCallback(async (jobId?: string) => {
    await apiFetch('/api/v1/orchestrator/queue/control', {
      method: 'POST',
      body: JSON.stringify({ action: 'retry_failed', job_id: jobId }),
    })
  }, [])

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
    refresh: fetchProviders,
  }
}

/**
 * Lightweight hook that uses the same QueueStatus but doesn't fetch
 * providers/models — ideal for pages that just need job progress.
 */
export function useQueueStatus(pollMs: number = 2000) {
  const { queue, loading, wsConnected } = useOrchestrator()
  return { queue, loading, wsConnected }
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
