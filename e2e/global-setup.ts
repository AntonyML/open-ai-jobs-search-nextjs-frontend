import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { BASE_URL, AUTH_STATE_PATH } from './config'
import { loginViaApi, decodeToken } from './helpers/auth'

/**
 * Corre UNA vez antes de la suite. Logea vía API y guarda el estado de sesión
 * (access_token + user_info en localStorage) en e2e/.auth/user.json.
 * Los specs autenticados hacen `test.use({ storageState: AUTH_STATE_PATH })`.
 */
export default async function globalSetup() {
  const token = await loginViaApi()
  const info = decodeToken(token)

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          { name: 'access_token', value: token },
          { name: 'user_info', value: JSON.stringify(info) },
        ],
      },
    ],
  }

  mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true })
  writeFileSync(AUTH_STATE_PATH, JSON.stringify(storageState, null, 2))
  console.log(`[e2e] Sesión lista → ${AUTH_STATE_PATH} (${BASE_URL})`)
}
