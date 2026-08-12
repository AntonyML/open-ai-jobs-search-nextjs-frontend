import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Proveedor global — la página pública /pipeline/providers fue eliminada
 * (legacy). La configuración ahora vive en /admin/providers, admin-only.
 * Estos tests solo verifican el guard y que la página del admin carga.
 */
test.describe('Global provider (admin)', () => {
  test('renderiza el formulario del proveedor global', async ({ providersPage }) => {
    await providersPage.goto()

    await expect(providersPage.heading).toBeVisible()
  })

  test('se traduce al español en /es/admin/providers', async ({ page }) => {
    await page.goto('/es/admin/providers')

    await expect(page.getByRole('heading', { name: 'Proveedor de IA global' })).toBeVisible()
    await expect(
      page.getByText('Configura el proveedor LLM que usa todo el sistema y carga sus modelos disponibles.', {
        exact: true,
      }),
    ).toBeVisible()
  })
})
