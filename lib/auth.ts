export interface UserInfo {
  sub: string
  role: string
  tier: string
  exp: number
}

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

export const setToken = (token: string) => {
  localStorage.setItem('access_token', token)
  const info = decodeToken(token)
  if (info) localStorage.setItem('user_info', JSON.stringify(info))
  clearCompletedSteps()
}

export const clearToken = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_info')
  clearCompletedSteps()
}

export const isLoggedIn = () => !!getToken()

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
  const cached = localStorage.getItem('user_info')
  if (cached) {
    try { return JSON.parse(cached) } catch { /* ignore */ }
  }
  const token = getToken()
  if (!token) return null
  const info = decodeToken(token)
  if (info) localStorage.setItem('user_info', JSON.stringify(info))
  return info
}

export const isAdmin = () => getUserInfo()?.role === 'admin'
export const getUserTier = () => getUserInfo()?.tier || 'free'
export const isPremium = () => getUserInfo()?.tier === 'premium'

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
