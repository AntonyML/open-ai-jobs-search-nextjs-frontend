import { API_URL, E2E_EMAIL, E2E_PASSWORD } from '../config'

export interface LoginResult {
  access_token: string
  token_type?: string
}

/**
 * Login contra el backend real — respeta la arquitectura de auth de la app
 * (JWT emitido por el API; la app lo guarda en localStorage).
 * El flujo UI se prueba en e2e/auth/login.spec.ts; aquí solo obtenemos el token.
 */
export async function loginViaApi(
  email: string = E2E_EMAIL,
  password: string = E2E_PASSWORD,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(
      `E2E login falló (${res.status}). ¿Está corriendo el backend en ${API_URL}? ` +
        'Ajusta E2E_API_URL / E2E_EMAIL / E2E_PASSWORD.',
    )
  }
  const data = (await res.json()) as LoginResult
  return data.access_token
}

/** Decodifica el payload del JWT (misma forma que lib/auth.ts en la app). */
export function decodeToken(token: string): {
  sub: string
  role: string
  tier: string
  exp: number
} {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8'),
  )
  return {
    sub: payload.sub,
    role: payload.role ?? 'client',
    tier: payload.tier ?? 'free',
    exp: payload.exp,
  }
}
