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
})
