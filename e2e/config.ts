/**
 * Configuración E2E — todos los valores son sobrescribibles por env vars.
 * Los defaults coinciden con el entorno local de desarrollo.
 */
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'

/** Usuario de prueba — el mismo `demo@example.com` que usan los scripts del backend. */
export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'demo@example.com'
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'demo1234'

/** storageState generado por global-setup.ts (gitignored). */
export const AUTH_STATE_PATH = 'e2e/.auth/user.json'
