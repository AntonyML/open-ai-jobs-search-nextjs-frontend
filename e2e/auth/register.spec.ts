import { test, expect } from '../fixtures/pages'

/**
 * Registro — flujo UI real contra el backend con email único por ejecución
 * (el backend rechaza emails duplicados; Date.now() evita colisiones).
 */
test.describe('Register', () => {
  test('crea una cuenta tras aceptar los términos y puede iniciar sesión', async ({
    page,
    registerPage,
    loginPage,
  }) => {
    const email = `e2e-${Date.now()}@example.com`
    const password = 'E2ePass123!'

    await registerPage.goto()
    await registerPage.register('E2E Tester', email, password)

    // Tras registrarse redirige al login
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })

    // La cuenta nueva debe poder iniciar sesión
    await loginPage.signIn(email, password)
    await expect(page).toHaveURL(/\/pipeline\/providers/, { timeout: 20_000 })
  })

  test('se traduce al español en /es/register', async ({ page }) => {
    await page.goto('/es/register')

    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible()
    await expect(
      page.getByText('Comienza tu búsqueda de empleo con IA.', { exact: true }),
    ).toBeVisible()

    // Campos del formulario
    await expect(page.getByText('Nombre completo')).toBeVisible()
    await expect(page.getByPlaceholder('Jane Doe')).toBeVisible()
    await expect(page.getByText('Correo electrónico')).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByText('Contraseña')).toBeVisible()
    await expect(page.getByPlaceholder('Ingresa tu contraseña')).toBeVisible()

    // Aviso de correlación de email
    await expect(
      page.getByText('funciona como el identificador único de tu cuenta', { exact: false }),
    ).toBeVisible()

    // Aviso de términos + botón de aceptación
    await expect(page.getByRole('button', { name: 'Términos de Servicio' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Política de Privacidad' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Leer y aceptar términos/ })).toBeVisible()

    // "¿Ya tienes cuenta? Iniciar sesión" → /es/login
    await page.getByRole('link', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/es\/login/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible()
  })
})
