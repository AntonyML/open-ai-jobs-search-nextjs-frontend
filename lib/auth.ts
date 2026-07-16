export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
export const setToken = (token: string) => {
  localStorage.setItem('access_token', token)
  // Si cambia el usuario, limpiar el estado del pipeline del usuario anterior
  // para que no se hereden los checks verdes entre cuentas.
  clearCompletedSteps()
}
export const clearToken = () => {
  localStorage.removeItem('access_token')
  clearCompletedSteps()
}
export const isLoggedIn = () => !!getToken()

/**
 * Clave de almacenamiento del estado del pipeline asociada al usuario actual.
 * Así cada cuenta mantiene su propio progreso y no se heredan los checks verdes.
 */
const COMPLETED_STEPS_KEY = 'completed_steps'

const userScopedKey = () => {
  const token = getToken()
  if (!token) return COMPLETED_STEPS_KEY
  // Usar un hash simple del token para no exponer el token completo en la clave.
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

export const setCompletedSteps = (steps: number[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(userScopedKey(), JSON.stringify(steps))
}

export const clearCompletedSteps = () => {
  if (typeof window === 'undefined') return
  // Limpiar tanto la clave legacy (global) como la del usuario actual.
  localStorage.removeItem(COMPLETED_STEPS_KEY)
  localStorage.removeItem(userScopedKey())
}
