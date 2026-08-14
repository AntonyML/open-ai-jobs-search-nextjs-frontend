import { test, expect } from '../fixtures/pages'
import { E2E_EMAIL, E2E_PASSWORD } from '../config'

/**
 * Login — flujo UI real contra el backend.
 * Estos specs NO usan storageState: prueban el formulario desde cero.
 */
test.describe('Login', () => {
  test('inicia sesión con credenciales válidas y llega al dashboard', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto()
    await loginPage.signIn(E2E_EMAIL, E2E_PASSWORD)

    // El login redirige al dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
    // Navbar autenticado visible
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('muestra error con credenciales inválidas', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.signIn(E2E_EMAIL, 'wrong-password')

    await expect(loginPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('se traduce al español en /es/login', async ({ page }) => {
    await page.goto('/es/login')

    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible()
    await expect(
      page.getByText('Inicia sesión para continuar tu búsqueda de empleo.', { exact: true }),
    ).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Ingresa tu contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()

    // "Crear una" lleva a /es/register
    await page.getByRole('link', { name: 'Crear una' }).click()
    await expect(page).toHaveURL(/\/es\/register/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible()
  })
})
