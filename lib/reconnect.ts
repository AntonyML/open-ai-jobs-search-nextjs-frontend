/**
 * Global reconnection state (module singleton — same pattern as the
 * `redirectingToLogin` guard in lib/api.ts).
 *
 * The ReconnectionLayer subscribes to this store and renders an overlay
 * whenever a network-level failure is detected (backend asleep / unreachable),
 * without unmounting the page behind it.
 */

export type ReconnectState = 'idle' | 'reconnecting' | 'restored' | 'error' | 'offline'

/** Milliseconds the "✓ Conexión restablecida" message stays visible before fading out. */
export const RESTORED_VISIBLE_MS = 1000

let state: ReconnectState = 'idle'
const listeners = new Set<() => void>()
let idleTimer: ReturnType<typeof setTimeout> | null = null

/** Check if the browser is currently offline. */
export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

/**
 * Classify thrown fetch errors: only network-level failures (fetch failed,
 * DNS/connection refused, timeout, aborted) are candidates for the
 * reconnection layer. HTTP responses (200/401/403/404/500…) mean the API is
 * alive and must NOT trigger it.
 */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true
  if (e instanceof DOMException && e.name === 'AbortError') return true
  if (e instanceof Error && /fetch failed|networkerror|connection (refused|reset)|timed out|failed to fetch/i.test(e.message)) return true
  return false
}

export function getReconnectState(): ReconnectState {
  if (isBrowserOffline() && state !== 'idle') {
    return 'offline'
  }
  return state
}

export function subscribeReconnect(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function set(next: ReconnectState) {
  if (next === state) return
  state = next
  listeners.forEach((fn) => fn())
}

/** A network-level request failed → trigger reconnection / waking state. */
export function reportNetworkFailure() {
  if (state === 'reconnecting') return // keep the current attempt going
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  set(isBrowserOffline() ? 'offline' : 'reconnecting')
}

/** Any HTTP response (even 4xx/5xx) proves the API is alive. */
export function reportAlive() {
  if (state === 'idle') return
  set('restored')
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => set('idle'), RESTORED_VISIBLE_MS)
}

/** Automatic retries were exhausted → hand control to the user. */
export function exhaustReconnectRetries() {
  if (state === 'reconnecting') set('error')
}

/** User clicked "Reintentar" → restart the automatic attempt loop. */
export function retryReconnect() {
  if (state === 'error' || state === 'offline') set('reconnecting')
}
