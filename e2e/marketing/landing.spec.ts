import { test, expect } from '../fixtures/pages'

/** Landing pública — no requiere sesión. */
test.describe('Landing', () => {
  test('muestra el hero y el CTA para visitantes sin sesión', async ({
    landingPage,
  }) => {
    await landingPage.goto()

    await expect(landingPage.heroHeading).toContainText('Your AI-powered')
    await expect(landingPage.tryFreeLink).toBeVisible()
    await expect(landingPage.signInLink).toBeVisible()
  })

  test('navega a la página About desde el navbar', async ({ page, landingPage }) => {
    await landingPage.goto()
    await landingPage.aboutLink.click()

    await expect(page).toHaveURL(/\/about/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: 'Enterprise-grade AI for your job search' }),
    ).toBeVisible()
  })
})
