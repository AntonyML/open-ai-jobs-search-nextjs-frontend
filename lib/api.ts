const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try { const j = JSON.parse(text); msg = j.message || j.detail || text } catch {}
    if (res.status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('upgrade:required', { detail: msg }))
    }
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
