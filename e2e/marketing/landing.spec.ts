import { test, expect } from '../fixtures/pages'

/** Landing pública — no requiere sesión. */
test.describe('Landing', () => {
  test('muestra el hero y el CTA para visitantes sin sesión', async ({
    landingPage,
  }) => {
    await landingPage.goto()

    await expect(landingPage.heroHeading).toContainText('Land your next role')
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
   * "Características" → /#features, "Cómo funciona" → /#how-it-works, "Acerca de" → /about.
   */
  test('navega a la sección Características desde el navbar', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.navFeatures.click()

    await expect(page).toHaveURL(/#features/, { timeout: 15_000 })
    await expect(landingPage.featuresHeading).toBeVisible()
  })

  test('navega a la sección Cómo funciona desde el navbar', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.navHowItWorks.click()

    await expect(page).toHaveURL(/#how-it-works/, { timeout: 15_000 })
    await expect(landingPage.howItWorksHeading).toBeVisible()
  })

  test('muestra la sección de precios', async ({ landingPage }) => {
    await landingPage.goto()

    await expect(landingPage.pricingHeading).toBeVisible()
  })

  test('monta el canvas 3D en el hero', async ({ page }) => {
    await page.goto('/')

    // El canvas WebGL se monta bajo demanda (escena 3D del hero).
    await expect(page.locator('main canvas').first()).toBeVisible({ timeout: 15_000 })
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
    await expect(nav.getByRole('link', { name: 'Cómo funciona', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Acerca de', exact: true })).toBeVisible()

    // "Acerca de" navega a /es/about
    await nav.getByRole('link', { name: 'Acerca de', exact: true }).click()
    await expect(page).toHaveURL(/\/es\/about/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: 'IA de nivel empresarial para tu búsqueda de empleo' }),
    ).toBeVisible()
  })

  /**
   * CTAs de conversión: cada uno lleva a su destino de auth.
   * "Iniciar sesión" → /login, "Comenzar" / "Pruébalo gratis" / "Comienza gratis" → /register.
   */
  test('Iniciar sesión navega al login', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.signInLink.click()

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(landingPage.loginHeading).toBeVisible()
  })

  test('Comenzar (navbar) navega al registro', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.getStartedNav.click()

    await expect(page).toHaveURL(/\/register/, { timeout: 15_000 })
    await expect(landingPage.registerHeading).toBeVisible()
  })

  test('Pruébalo gratis (hero) navega al registro', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.tryFreeLink.click()

    await expect(page).toHaveURL(/\/register/, { timeout: 15_000 })
    await expect(landingPage.registerHeading).toBeVisible()
  })

  test('Comienza gratis (CTA final) navega al registro', async ({ page, landingPage }) => {
    await landingPage.goto()

    await landingPage.getStartedFreeCta.click()

    await expect(page).toHaveURL(/\/register/, { timeout: 15_000 })
    await expect(landingPage.registerHeading).toBeVisible()
  })

  test('las CTAs se traducen al español y navegan en /es', async ({ page, landingPage }) => {
    await landingPage.goto()
    await landingPage.switchLanguage('ES')

    const nav = page.locator('header')
    await expect(nav.getByRole('link', { name: 'Comenzar', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pruébalo gratis', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Comienza gratis', exact: true })).toBeVisible()

    // "Pruébalo gratis" navega a /es/register
    await page.getByRole('link', { name: 'Pruébalo gratis', exact: true }).click()
    await expect(page).toHaveURL(/\/es\/register/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible()
  })
})
