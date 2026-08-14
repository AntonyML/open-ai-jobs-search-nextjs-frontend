import { clearToken } from '@/lib/auth'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Guard against several parallel requests 401-ing at once (e.g. on app mount).
let redirectingToLogin = false

export class ApiError extends Error {
  status: number
  /** Backend error code (e.g. 'web_search_unavailable'), empty when not provided. */
  code: string
  constructor(message: string, status: number, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    let code = ''
    try { const j = JSON.parse(text); msg = j.message || j.detail || text; code = j.error || '' } catch {}
    if (typeof window !== 'undefined') {
      if (res.status === 401) {
        // Sesión caducada o token inválido → cerrar la sesión local.
        const hadToken = !!localStorage.getItem('access_token')
        if (hadToken) {
          clearToken()
          // Evitar redirecciones en llamadas propias del flujo de auth
          // (ej. login fallido con credenciales incorrectas).
          const isAuthFlow = path.startsWith('/api/v1/auth/login') || path.startsWith('/api/v1/auth/register')
          if (!isAuthFlow && !redirectingToLogin) {
            redirectingToLogin = true
            window.location.assign('/login')
          }
        }
      } else if (res.status === 402) {
        // Out of credits / paywall → open the purchase modal.
        window.dispatchEvent(new CustomEvent('purchase:required', { detail: { message: msg, status: res.status } }))
      } else if (res.status === 403 && /plan max|max\b/i.test(msg)) {
        // Pipeline gated to plan Max → open the purchase modal.
        window.dispatchEvent(new CustomEvent('purchase:required', { detail: { message: msg, status: res.status } }))
      }
    }
    throw new ApiError(msg, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
