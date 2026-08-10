import { test, expect } from '../fixtures/pages'
import { E2E_EMAIL, E2E_PASSWORD } from '../config'

/**
 * Login — flujo UI real contra el backend.
 * Estos specs NO usan storageState: prueban el formulario desde cero.
 */
test.describe('Login', () => {
  test('inicia sesión con credenciales válidas y llega al pipeline', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto()
    await loginPage.signIn(E2E_EMAIL, E2E_PASSWORD)

    // El login redirige a /providers → que server-redirige a /pipeline/providers
    await expect(page).toHaveURL(/\/pipeline\/providers/, { timeout: 20_000 })
    // Navbar autenticado visible
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('muestra error con credenciales inválidas', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.signIn(E2E_EMAIL, 'wrong-password')

    await expect(loginPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
