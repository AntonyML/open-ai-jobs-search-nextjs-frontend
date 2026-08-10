import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Providers — backend real. Assertions estables del formulario que no
 * dependen del estado del usuario en la BD (proveedores configurados o no).
 */
test.describe('Providers', () => {
  test('renderiza el formulario de proveedor con guardado bloqueado', async ({
    providersPage,
  }) => {
    await providersPage.goto()

    await expect(providersPage.heading).toBeVisible()
    await expect(providersPage.providerSelect).toBeVisible()
    await expect(providersPage.apiKeyInput).toBeVisible()
    await expect(providersPage.loadModelsButton).toBeVisible()
    // Guardar requiere probar la conexión primero (client-side)
    await expect(providersPage.saveProviderButton).toBeDisabled()
  })
})
