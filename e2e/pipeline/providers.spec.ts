import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Providers — backend real. La página ahora es una vista informativa del
 * proveedor global de IA (gestionado por el administrador). Assertions
 * estables que no dependen del estado de la BD.
 */
test.describe('Providers', () => {
  test('renderiza la vista del proveedor global', async ({ providersPage }) => {
    await providersPage.goto()

    await expect(providersPage.heading).toBeVisible()
    await expect(providersPage.globalProviderCard).toBeVisible()
  })

  test('se traduce al español en /es/pipeline/providers', async ({ page }) => {
    await page.goto('/es/pipeline/providers')

    // Header
    await expect(page.locator('section').getByText('01 / CONFIGURAR')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Proveedor de IA' })).toBeVisible()
    await expect(
      page.getByText('El sistema usa un proveedor de IA central gestionado por el administrador.', {
        exact: true,
      }),
    ).toBeVisible()

    // Tarjeta del proveedor global (no depende del estado del usuario)
    await expect(page.getByText('Proveedor global', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Configurado por el administrador para todo el sistema', { exact: true }),
    ).toBeVisible()
  })
})
