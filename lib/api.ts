import { clearToken } from '@/lib/auth'
import { isBrowserOffline, isNetworkError, reportAlive, reportNetworkFailure } from '@/lib/reconnect'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** Hard cap per request — a backend asleep on Render hangs instead of refusing. */
const REQUEST_TIMEOUT_MS = 30_000

// ── Bilingual error messages ──────────────────────────────────
// Keys match the `errors.*` namespace in messages/{en,es}.json.
// api.ts is a plain utility (no React), so we detect the locale from
// the URL path and pick the right language at runtime.
const ERROR_MSGS: Record<string, { en: string; es: string }> = {
  aiAuth:             { en: 'AI service authentication failed. Please contact support.', es: 'Error de autenticación con el servicio de IA. Por favor contacta soporte.' },
  aiRateLimit:        { en: 'AI service is temporarily busy. Please try again in a moment.', es: 'El servicio de IA está ocupado temporalmente. Por favor intenta en un momento.' },
  aiModelNotFound:    { en: 'The requested AI model is unavailable. Please try again later.', es: 'El modelo de IA solicitado no está disponible. Por favor intenta más tarde.' },
  aiContextLength:    { en: 'The input is too long for the AI to process.', es: 'La entrada es demasiado larga para que la IA la procese.' },
  aiQuota:            { en: 'AI quota exhausted. Please try again later or contact support.', es: 'Cuota de IA agotada. Por favor intenta más tarde o contacta soporte.' },
  aiServerError:      { en: 'AI service is temporarily unavailable. Please try again later.', es: 'El servicio de IA no está disponible temporalmente. Por favor intenta más tarde.' },
  aiTimeout:          { en: 'AI service took too long to respond. Please try again.', es: 'El servicio de IA tardó demasiado en responder. Por favor intenta de nuevo.' },
  aiWebSearch:        { en: 'Web search is temporarily unavailable.', es: 'La búsqueda web no está disponible temporalmente.' },
  aiProvider:         { en: 'AI provider is temporarily unavailable. Please try again later.', es: 'El proveedor de IA no está disponible temporalmente. Por favor intenta más tarde.' },
  aiGeneric:          { en: 'An error occurred with the AI service. Please try again later.', es: 'Ocurrió un error con el servicio de IA. Por favor intenta más tarde.' },
  backendUnavailable: { en: 'Unable to connect to the service. We are preparing the connection.', es: 'No fue posible conectar con el servicio. Estamos preparando la conexión.' },
  offline:            { en: 'No internet connection. Please check your network.', es: 'Sin conexión a internet. Comprueba tu conexión de red.' },
  timeout:            { en: 'The service is taking longer than usual to respond. Please try again.', es: 'El servicio está tardando más de lo habitual en responder. Por favor intenta de nuevo.' },
  unauthorized:       { en: 'Incorrect email or password. Please verify your credentials.', es: 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales.' },
  unexpected:         { en: 'An unexpected error occurred. Please try again later.', es: 'Ocurrió un error temporal. Por favor intenta más tarde.' },
}

/** Detect the UI locale from the URL path (e.g. /es/cv-builder → 'es'). */
function getLocale(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'es'
  const seg = window.location.pathname.split('/')[1]
  return seg === 'en' ? 'en' : 'es'
}

function t(key: keyof typeof ERROR_MSGS): string {
  const msgs = ERROR_MSGS[key]
  const locale = getLocale()
  return msgs[locale] ?? msgs.es
}

// Maps LiteLLM/Anthropic/OpenAI error type codes to our i18n keys.
const PROVIDER_CODE_MAP: Record<string, keyof typeof ERROR_MSGS> = {
  authentication_error:    'aiAuth',
  rate_limit_error:        'aiRateLimit',
  not_found_error:         'aiModelNotFound',
  context_window_exceeded: 'aiContextLength',
  quota_exceeded:          'aiQuota',
  server_error:            'aiServerError',
  timeout_error:           'aiTimeout',
  web_search_error:        'aiWebSearch',
  provider_error:          'aiProvider',
}

/**
 * Strips technical substrings, exception names, stack traces, and internal
 * error text from error messages before showing them to the user.
 */
function sanitizeError(raw: string): string {
  if (/litellm\./i.test(raw) || /anthropic\./i.test(raw) || /openai\./i.test(raw)) {
    try {
      const embedded = raw.match(/\{.*\}/s)
      if (embedded) {
        const parsed = JSON.parse(embedded[0]) as { error?: { type?: string; message?: string } }
        const code = parsed.error?.type
        if (code && PROVIDER_CODE_MAP[code]) return t(PROVIDER_CODE_MAP[code])
      }
    } catch { /* ignore parse errors */ }
    return t('aiGeneric')
  }
  if (/failed to fetch|networkerror|connection (refused|reset)|timed out|econnrefused/i.test(raw)) {
    return t('backendUnavailable')
  }
  return raw
}

// Guard against several parallel requests 401-ing at once (e.g. on app mount).
let redirectingToLogin = false

export type ApiErrorKind =
  | 'offline'
  | 'backend_unavailable'
  | 'timeout'
  | 'unauthorized'
  | 'server_error'
  | 'client_error'

export class ApiError extends Error {
  status: number
  /** Backend error code (e.g. 'web_search_unavailable'), empty when not provided. */
  code: string
  kind: ApiErrorKind
  isNetwork: boolean

  constructor(
    message: string,
    status: number,
    code = '',
    kind: ApiErrorKind = 'client_error',
    isNetwork = false
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.kind = kind
    this.isNetwork = isNetwork
  }
}

export interface ApiFetchOptions {
  /** When true, network failures or timeouts will NOT trigger the global ReconnectionLayer (e.g. background polling / public catalog). */
  isBackground?: boolean
  /** Custom timeout in ms (defaults to 30,000 ms). */
  timeoutMs?: number
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
    })
  } catch (e) {
    if (e instanceof ApiError) {
      throw e
    }
    const isOffline = isBrowserOffline()
    const isTimeout = e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')

    let kind: ApiErrorKind = 'backend_unavailable'
    let humanMsg = t('backendUnavailable')

    if (isOffline) {
      kind = 'offline'
      humanMsg = t('offline')
    } else if (isTimeout) {
      kind = 'timeout'
      humanMsg = t('timeout')
    }

    // Case B — network failure / timeout: the backend may be asleep.
    // Background / non-critical requests must NOT trigger the global ReconnectionLayer.
    if (isNetworkError(e) && !options?.isBackground) {
      reportNetworkFailure()
    }
    throw new ApiError(humanMsg, 0, 'NETWORK_ERROR', kind, true)
  }
  // Case A — the API responded (any status: 200/401/403/404/500…): it is alive.
  reportAlive()
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
    }
    let kind: ApiErrorKind = 'client_error'
    if (res.status === 401) {
      kind = 'unauthorized'
      if (path.startsWith('/api/v1/auth/login')) {
        msg = t('unauthorized')
      }
    } else if (res.status >= 500) {
      kind = 'server_error'
    }
    throw new ApiError(msg, res.status, code, kind, false)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
