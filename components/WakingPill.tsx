'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Cloud, WifiOff } from 'lucide-react'
import {
  getReconnectState,
  subscribeReconnect,
  type ReconnectState,
} from '@/lib/reconnect'
import { useReducedMotion } from '@/components/three/useReducedMotion'

/**
 * WakingPill: A subtle, non-intrusive bottom-left status pill for marketing pages.
 *
 * Appears ONLY when the Render backend is waking up or reconnecting in the background.
 * It NEVER blocks the screen, clicks, or reading flow.
 */
export default function WakingPill() {
  const t = useTranslations('reconnect')
  const reduced = useReducedMotion()
  const [state, setState] = useState<ReconnectState>(() => getReconnectState())

  useEffect(() => {
    return subscribeReconnect(() => setState(getReconnectState()))
  }, [])

  if (state === 'idle' || state === 'error') {
    return null
  }

  const isRestored = state === 'restored'
  const isOffline = state === 'offline'

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-[#d2d2d7]/80 bg-white/90 px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2"
    >
      {isRestored ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-2.5 w-2.5 stroke-[2.5]" aria-hidden="true" />
        </span>
      ) : isOffline ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <WifiOff className="h-2.5 w-2.5 stroke-[2]" aria-hidden="true" />
        </span>
      ) : (
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center text-[#0071e3] ${reduced ? '' : 'animate-pulse'}`}>
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}

      <span className="text-[12px] font-medium text-[#1d1d1f]">
        {isRestored
          ? t('pillRestored')
          : isOffline
            ? t('pillOffline')
            : t('pillWaking')}
      </span>

      {!isRestored && !isOffline && (
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full bg-[#0071e3] ${reduced ? '' : 'animate-pulse'}`}
              style={reduced ? undefined : { animationDelay: `${i * 200}ms` }}
            />
          ))}
        </span>
      )}
    </div>
  )
}
