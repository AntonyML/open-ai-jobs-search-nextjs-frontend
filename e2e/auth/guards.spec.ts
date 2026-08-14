import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

/** Guards de rutas — el layout de (app) redirige a /login sin sesión. */
test.describe('Guards de rutas', () => {
  test('redirige visitantes sin sesión a /login', async ({ page }) => {
    await page.goto('/admin/providers')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('no permite acceder al dashboard sin sesión', async ({ page }) => {
    await page.goto('/rank')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })
})

test.describe('Guards de rutas (autenticado)', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('permite el acceso a la app con sesión activa', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /Dashboard|Panel/ })).toBeVisible()
  })

  test('sign out limpia la sesión y vuelve a la landing', async ({
    page,
    appShell,
  }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await appShell.signOut()

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    // Navbar vuelve al estado logged-out
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })
})
