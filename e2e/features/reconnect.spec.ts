import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

/**
 * Reconnection Layer — aparece solo ante errores de red (backend dormido),
 * nunca ante respuestas HTTP (caso 500), y se recupera cuando la API responde.
 */
test.describe('Reconnection Layer', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('muestra la capa ante fallos de red, conservando el contenido detrás', async ({
    page,
  }) => {
    await page.route('**/api/v1/**', (route) => route.abort('failed'))

    await page.goto('/dashboard')

    const layer = page.getByTestId('reconnection-layer')
    await expect(layer).toBeVisible({ timeout: 15_000 })
    await expect(layer).toContainText(/Reconnecting|Reconectando/i)

    // El shell de la app sigue visible detrás del overlay (contexto conservado).
    await expect(page.getByRole('button', { name: /Sign out|Salir/i }).first()).toBeVisible()

    // El copy evoluciona con el tiempo (no se queda congelado).
    await expect(layer).toContainText(/Preparing your session|Preparando tu sesión/i, {
      timeout: 15_000,
    })
  })

  test('una respuesta 500 NO activa la capa (la API está viva)', async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 500, json: { detail: 'boom' } }),
    )

    await page.goto('/dashboard')
    await page.waitForTimeout(6_000)

    await expect(page.getByTestId('reconnection-layer')).toBeHidden()
  })

  test('tras agotar los reintentos automáticos ofrece Reintentar', async ({ page }) => {
    await page.route('**/api/v1/**', (route) => route.abort('failed'))

    await page.goto('/dashboard')

    const layer = page.getByTestId('reconnection-layer')
    await expect(layer).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Retry|Reintentar/i })).toBeVisible({
      timeout: 45_000,
    })
  })

  test('cuando el servidor despierta muestra "Conexión restablecida" y desaparece', async ({
    page,
  }) => {
    let healthFailing = true
    await page.route('**/api/v1/**', (route) => route.abort('failed'))
    // Registrada después → tiene prioridad sobre el catch-all anterior.
    await page.route('**/api/v1/health', (route) => {
      if (healthFailing) return route.abort('failed')
      return route.fulfill({ status: 200, json: { status: 'ok' } })
    })

    await page.goto('/dashboard')

    const layer = page.getByTestId('reconnection-layer')
    await expect(layer).toBeVisible({ timeout: 15_000 })

    // El servidor "despierta" → el siguiente probe del backoff tiene éxito.
    healthFailing = false

    await expect(layer).toContainText(/Connection restored|Conexión restablecida/i, {
      timeout: 15_000,
    })
    await expect(layer).toBeHidden({ timeout: 15_000 })
  })
})