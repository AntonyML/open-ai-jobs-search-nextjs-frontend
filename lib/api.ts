export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try { const j = JSON.parse(text); msg = j.message || j.detail || text } catch {}
    if ((res.status === 402 || res.status === 403) && typeof window !== 'undefined') {
      // 402 → out of credits / paywall; 403 → pipeline locked to plan Max.
      window.dispatchEvent(new CustomEvent('purchase:required', { detail: { message: msg, status: res.status } }))
    }
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
