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

  /**
   * Links de navegación del navbar: cada opción lleva a su sección/página.
   * "Características" → /#features, "Pipeline" → /#pipeline, "Acerca de" → /about.
   */
  test('navega a la sección Características desde el navbar', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.navFeatures.click()

    await expect(page).toHaveURL(/#features/, { timeout: 15_000 })
    await expect(landingPage.featuresHeading).toBeVisible()
  })

  test('navega a la sección Pipeline desde el navbar', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.navPipeline.click()

    await expect(page).toHaveURL(/#pipeline/, { timeout: 15_000 })
    await expect(landingPage.pipelineHeading).toBeVisible()
  })

  test('navega a la página About desde el navbar (Acerca de)', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.navAbout.click()

    await expect(page).toHaveURL(/\/about/, { timeout: 15_000 })
    await expect(landingPage.aboutHeading).toBeVisible()
  })

  test('los links de navegación se traducen al español', async ({ page, landingPage }) => {
    await landingPage.goto()
    await landingPage.switchLanguage('ES')

    const nav = page.locator('header')
    await expect(nav.getByRole('link', { name: 'Características', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Pipeline', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Acerca de', exact: true })).toBeVisible()

    // "Acerca de" navega a /es/about
    await nav.getByRole('link', { name: 'Acerca de', exact: true }).click()
    await expect(page).toHaveURL(/\/es\/about/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: 'IA de nivel empresarial para tu búsqueda de empleo' }),
    ).toBeVisible()
  })
})
