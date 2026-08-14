import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Proveedor global — la página pública de proveedores fue eliminada
 * (legacy). La configuración ahora vive en /admin/providers, admin-only.
 * Estos tests solo verifican el guard y que la página del admin carga.
 *
 * El RouteGuard exige rol admin: el usuario E2E de la BD puede ser client,
 * así que inyectamos user_info con role admin ANTES de que la página cargue
 * (el guard lee el rol del JWT en localStorage).
 */
const adminUserInfo = {
  sub: 'e2e-admin',
  role: 'admin',
  tier: 'max',
  exp: 9999999999,
}

test.describe('Global provider (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((info) => {
      localStorage.setItem('user_info', JSON.stringify(info))
    }, adminUserInfo)
  })

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
