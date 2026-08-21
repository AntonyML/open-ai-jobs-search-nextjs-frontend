'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Cloud, RotateCw, LogOut } from 'lucide-react'
import { API_BASE } from '@/lib/api'
import {
  exhaustReconnectRetries,
  getReconnectState,
  reportAlive,
  retryReconnect,
  subscribeReconnect,
  type ReconnectState,
} from '@/lib/reconnect'
import { clearToken } from '@/lib/auth'
import { useReducedMotion } from '@/components/three/useReducedMotion'

import { usePathname } from '@/i18n/routing'
import WakingPill from '@/components/WakingPill'

/** Probe schedule (ms) until automatic retries are exhausted (~25 s total). */
const BACKOFF = [1000, 2000, 4000, 5000, 5000, 5000]
const PROBE_TIMEOUT_MS = 10_000

const MARKETING_ROUTES = ['/', '/about', '/limits', '/terms', '/privacy', '/blog']
const AUTH_ROUTES = ['/login', '/register']

const COPY_STAGES = [
  { min: 0, key: 'connecting', sub: 'connectingSub' },
  { min: 5_000, key: 'preparing', sub: 'preparingSub' },
  { min: 10_000, key: 'waking', sub: 'wakingSub' },
  { min: 15_000, key: 'slow', sub: 'slowSub' },
] as const

export default function ReconnectionLayer() {
  const t = useTranslations('reconnect')
  const reduced = useReducedMotion()
  const pathname = usePathname()

  const [state, setState] = useState<ReconnectState>(() => getReconnectState())
  const [elapsed, setElapsed] = useState(0)
  const [restoredElapsed, setRestoredElapsed] = useState(0)

  const startedAtRef = useRef<number | null>(null)
  const restoredAtRef = useRef<number | null>(null)
  const attemptsRef = useRef(0)

  useEffect(() => subscribeReconnect(() => setState(getReconnectState())), [])

  // If on marketing routes, delegate to WakingPill (non-intrusive).
  const isMarketing = MARKETING_ROUTES.includes(pathname)
  const isAuth = AUTH_ROUTES.includes(pathname)

  // Wall-clock since the current phase began, for the staged copy + fade-out.
  useEffect(() => {
    if (isMarketing || isAuth) return
    if (state === 'reconnecting' && startedAtRef.current === null) {
      startedAtRef.current = Date.now()
      restoredAtRef.current = null
      setRestoredElapsed(0)
    }
    if (state === 'restored' && restoredAtRef.current === null) {
      restoredAtRef.current = Date.now()
    }
    if (state === 'idle') {
      startedAtRef.current = null
      restoredAtRef.current = null
      setElapsed(0)
      setRestoredElapsed(0)
    }
    const id = setInterval(() => {
      if (state === 'reconnecting' && startedAtRef.current) {
        setElapsed(Date.now() - startedAtRef.current)
      } else if (state === 'restored' && restoredAtRef.current) {
        setRestoredElapsed(Date.now() - restoredAtRef.current)
      }
    }, 200)
    return () => clearInterval(id)
  }, [state, isMarketing, isAuth])

  // Automatic probe loop with exponential backoff (only while reconnecting on protected app pages).
  useEffect(() => {
    if (state !== 'reconnecting' || isMarketing || isAuth) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    attemptsRef.current = 0

    const attempt = async () => {
      if (cancelled) return
      try {
        const res = await fetch(`${API_BASE}/api/v1/health`, {
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        })
        void res
        // Any HTTP response means the server is awake.
        reportAlive()
        return
      } catch {
        // Network failure — schedule the next probe.
      }
      if (cancelled) return
      attemptsRef.current += 1
      if (attemptsRef.current >= BACKOFF.length) {
        exhaustReconnectRetries()
        return
      }
      timer = setTimeout(attempt, BACKOFF[attemptsRef.current - 1])
    }

    attempt()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [state, isMarketing, isAuth])

  if (isMarketing) {
    return <WakingPill />
  }

  if (isAuth || state === 'idle') {
    return null
  }

  const fading = state === 'restored' && restoredElapsed > 600
  const stage =
    state === 'reconnecting'
      ? COPY_STAGES.findLast((s) => elapsed >= s.min) ?? COPY_STAGES[0]
      : null

  const handleLeave = () => {
    clearToken()
    window.location.assign('/')
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-white/60 backdrop-blur-[2px] transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      />
      <div
        role="status"
        aria-live="polite"
        data-testid="reconnection-layer"
        className={`relative w-full max-w-sm rounded-2xl border border-[#d2d2d7] bg-white/95 p-8 text-center shadow-xl backdrop-blur transition-opacity duration-500 animate-in fade-in-0 duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {state === 'restored' ? (
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#34c759]" aria-hidden="true" />
        ) : (
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3]/10 ${reduced ? '' : 'animate-pulse'}`}
          >
            <Cloud className="h-6 w-6 text-[#0071e3]" aria-hidden="true" />
          </div>
        )}

        {state === 'error' ? (
          <>
            <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
              {t('errorTitle')}
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#707070]">
              {t('errorSub')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                autoFocus
                onClick={retryReconnect}
                className="inline-flex items-center rounded-full bg-[#0071e3] px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0068d2]"
              >
                <RotateCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t('retry')}
              </button>
              <button
                onClick={handleLeave}
                className="inline-flex items-center rounded-full border border-[#d2d2d7] px-5 py-2.5 text-[14px] font-medium text-[#474747] transition-colors hover:bg-[#f5f5f7]"
              >
                <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t('leave')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
              {state === 'restored' ? t('restored') : stage ? t(stage.key) : t('connecting')}
            </h2>
            {stage && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#707070]">{t(stage.sub)}</p>
            )}
            <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full bg-[#0071e3]/60 ${reduced ? '' : 'animate-pulse'}`}
                  style={reduced ? undefined : { animationDelay: `${i * 300}ms` }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}