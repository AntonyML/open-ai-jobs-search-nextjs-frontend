import { clearToken } from '@/lib/auth'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Bilingual error messages ──────────────────────────────────
// Keys match the `errors.*` namespace in messages/{en,es}.json.
// api.ts is a plain utility (no React), so we detect the locale from
// the URL path and pick the right language at runtime.
const ERROR_MSGS: Record<string, { en: string; es: string }> = {
  aiAuth:         { en: 'AI service authentication failed. Please contact support.', es: 'Error de autenticación con el servicio de IA. Por favor contacta soporte.' },
  aiRateLimit:    { en: 'AI service is temporarily busy. Please try again in a moment.', es: 'El servicio de IA está ocupado temporalmente. Por favor intenta en un momento.' },
  aiModelNotFound:{ en: 'The requested AI model is unavailable. Please try again later.', es: 'El modelo de IA solicitado no está disponible. Por favor intenta más tarde.' },
  aiContextLength:{ en: 'The input is too long for the AI to process.', es: 'La entrada es demasiado larga para que la IA la procese.' },
  aiQuota:        { en: 'AI quota exhausted. Please try again later or contact support.', es: 'Cuota de IA agotada. Por favor intenta más tarde o contacta soporte.' },
  aiServerError:  { en: 'AI service is temporarily unavailable. Please try again later.', es: 'El servicio de IA no está disponible temporalmente. Por favor intenta más tarde.' },
  aiTimeout:      { en: 'AI service took too long to respond. Please try again.', es: 'El servicio de IA tardó demasiado en responder. Por favor intenta de nuevo.' },
  aiWebSearch:    { en: 'Web search is temporarily unavailable.', es: 'La búsqueda web no está disponible temporalmente.' },
  aiProvider:     { en: 'AI provider is temporarily unavailable. Please try again later.', es: 'El proveedor de IA no está disponible temporalmente. Por favor intenta más tarde.' },
  aiGeneric:      { en: 'An error occurred with the AI service. Please try again later.', es: 'Ocurrió un error con el servicio de IA. Por favor intenta más tarde.' },
  unexpected:     { en: 'An unexpected error occurred. Please try again later.', es: 'Ocurrió un error inesperado. Por favor intenta más tarde.' },
}

/** Detect the UI locale from the URL path (e.g. /es/cv-builder → 'es'). */
function getLocale(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'en'
  const seg = window.location.pathname.split('/')[1]
  return seg === 'es' ? 'es' : 'en'
}

function t(key: keyof typeof ERROR_MSGS): string {
  const msgs = ERROR_MSGS[key]
  const locale = getLocale() as 'en' | 'es'
  return msgs[locale] ?? msgs.en
}

// Maps LiteLLM/Anthropic/OpenAI error type codes to our i18n keys.
const PROVIDER_CODE_MAP: Record<string, keyof typeof ERROR_MSGS> = {
  authentication_error: 'aiAuth',
  rate_limit_exceeded: 'aiRateLimit',
  model_not_found: 'aiModelNotFound',
  context_length_exceeded: 'aiContextLength',
  insufficient_quota: 'aiQuota',
  server_error: 'aiServerError',
  timeout: 'aiTimeout',
}

/**
 * Strip provider internals from error messages.
 * Returns a user-safe, locale-aware string — never raw LiteLLM/Anthropic/OpenAI text.
 */
function sanitizeError(raw: string): string {
  const lower = raw.toLowerCase()
  if (
    lower.includes('litellm') ||
    lower.includes('anthropicexception') ||
    lower.includes('openaiexception') ||
    lower.includes('x-api-key') ||
    lower.includes('api_key') ||
    lower.includes(' authentication_error') ||
    /\"type\"\s*:\s*\"error\"/.test(raw) ||
    /request_id\s*[:=]/.test(lower)
  ) {
    // Try to extract a typed error code from the embedded JSON.
    try {
      const embedded = raw.match(/\{[\s\S]*\"type\"\s*:\s*\"error\"[\s\S]*\}/)
      if (embedded) {
        const parsed = JSON.parse(embedded[0]) as { error?: { type?: string; message?: string } }
        const code = parsed.error?.type
        if (code && PROVIDER_CODE_MAP[code]) return t(PROVIDER_CODE_MAP[code])
      }
    } catch { /* ignore parse errors */ }
    return t('aiGeneric')
  }
  return raw
}

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
    // Parse the error payload.  The enriched gate (402/429) sends a structured
    // detail: { code: "insufficient_credits" | "quota_exceeded", message, balance, ... }.
    // `msg` must stay a string — the UI feeds it to toasts and ApiError.
    let msg = text
    let code = ''
    let payload: Record<string, unknown> | undefined
    try {
      const j = JSON.parse(text) as { message?: unknown; detail?: unknown; error?: unknown }
      const detail = j.detail
      if (detail !== null && typeof detail === 'object') {
        const d = detail as Record<string, unknown>
        msg = typeof d.message === 'string' ? d.message : (typeof j.message === 'string' ? j.message : text)
        code = typeof d.code === 'string' ? d.code : (typeof j.error === 'string' ? j.error : '')
        payload = d
      } else {
        msg = typeof j.message === 'string' ? j.message : (typeof detail === 'string' ? detail : text)
        code = typeof j.error === 'string' ? j.error : ''
      }
    } catch {
      // Non-JSON error body (traceback, HTML error page, etc.) — never
      // expose raw text to the user.
      if (res.status >= 500) {
        msg = t('unexpected')
      }
    }
    // Sanitize the message so provider internals never reach the UI.
    msg = sanitizeError(msg)
    // Final guard: 5xx errors should never show raw backend text.
    if (res.status >= 500 && (msg.length > 200 || /traceback|exception|error/i.test(msg))) {
      msg = t('unexpected')
    }

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
        // Out of credits / paywall → open the purchase modal (frontend keys on `code`).
        window.dispatchEvent(new CustomEvent('purchase:required', { detail: { message: msg, status: res.status, code, payload } }))
      } else if (res.status === 403 && /plan max|max\b/i.test(msg)) {
        // Pipeline gated to plan Max → open the purchase modal.
        window.dispatchEvent(new CustomEvent('purchase:required', { detail: { message: msg, status: res.status, code, payload } }))
      }
      // 429 (quota) intentionally does NOT open the purchase modal: quotas are
      // not monetizable — the billing page shows the weekly quota bar instead.
    }
    throw new ApiError(msg, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
