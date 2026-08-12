export interface UserInfo {
  sub: string
  role: string
  tier: string
  exp: number
}

const TOKEN_KEY = 'access_token'
const USER_INFO_KEY = 'user_info'

/** Event dispatched whenever the auth state changes (login / logout / expiry). */
export const AUTH_CHANGED = 'auth:changed'

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED))
  }
}

/**
 * Read the access token from localStorage.
 *
 * Returns null (and cleans the session up) when the JWT has expired, so an
 * expired login is never presented as an active session.
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  if (isTokenExpired(token)) {
    clearToken()
    return null
  }
  return token
}

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
  const info = decodeToken(token)
  if (info) localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  clearCompletedSteps()
  notifyAuthChanged()
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  clearCompletedSteps()
  notifyAuthChanged()
}

export const isLoggedIn = () => !!getToken()

/** True when the JWT payload's `exp` claim is already in the past. */
export function isTokenExpired(token: string): boolean {
  const info = decodeToken(token)
  if (!info || typeof info.exp !== 'number') return true
  return info.exp * 1000 <= Date.now()
}

/** Decode the JWT payload without verifying the signature (safe on client). */
export function decodeToken(token: string): UserInfo | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return { sub: payload.sub, role: payload.role || 'client', tier: payload.tier || 'free', exp: payload.exp }
  } catch {
    return null
  }
}

/** Get cached user info from localStorage or decode from token. */
export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null
  const token = getToken() // null si falta o caducó (además limpia la sesión)
  if (!token) {
    localStorage.removeItem(USER_INFO_KEY)
    return null
  }
  const cached = localStorage.getItem(USER_INFO_KEY)
  if (cached) {
    try {
      const info = JSON.parse(cached) as UserInfo
      if (info?.sub && info.exp) return info
    } catch { /* ignore */ }
  }
  const info = decodeToken(token)
  if (info) localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  return info
}

export const isAdmin = () => getUserInfo()?.role === 'admin'
export const getUserTier = () => getUserInfo()?.tier || 'free'
export const isPremium = () => getUserInfo()?.tier === 'premium'
export const isMax = () => getUserInfo()?.tier === 'max'

/** Clave de almacenamiento del estado del pipeline asociada al usuario actual. */
const COMPLETED_STEPS_KEY = 'completed_steps'

const userScopedKey = () => {
  const token = getToken()
  if (!token) return COMPLETED_STEPS_KEY
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i)
    hash |= 0
  }
  return `${COMPLETED_STEPS_KEY}:${Math.abs(hash).toString(36)}`
}

export const getCompletedSteps = (): number[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(userScopedKey()) || '[]')
  } catch {
    return []
  }
}

export const COMPLETED_STEPS_UPDATED = 'completed-steps-updated'

export const setCompletedSteps = (steps: number[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(userScopedKey(), JSON.stringify(steps))
  window.dispatchEvent(new CustomEvent(COMPLETED_STEPS_UPDATED, { detail: steps }))
}

export const clearCompletedSteps = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COMPLETED_STEPS_KEY)
  localStorage.removeItem(userScopedKey())
}
