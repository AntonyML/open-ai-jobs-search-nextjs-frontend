import { expect, type Page } from '@playwright/test'

/** Espejo de app/[locale]/(marketing) — landing pública. */
export class LandingPage {
  readonly heroHeading = this.page.getByRole('heading', { level: 1 })
  readonly tryFreeLink = this.page.getByRole('link', { name: 'Try it free' })
  readonly signInLink = this.page.getByRole('link', { name: 'Sign in' })
  /** El link About existe en navbar y footer; el del navbar lleva igual. */
  readonly aboutLink = this.page.locator('header').getByRole('link', { name: 'About' })

  /** CTAs de la landing (logged-out, EN default). */
  readonly getStartedNav = this.page.locator('header').getByRole('link', { name: 'Get started', exact: true })
  readonly getStartedFreeCta = this.page.getByRole('link', { name: 'Get started free', exact: true })

  /** Headings de las páginas de destino de auth. */
  readonly loginHeading = this.page.getByRole('heading', { name: 'Welcome back' })
  readonly registerHeading = this.page.getByRole('heading', { name: 'Create your account' })

  /** Links de navegación del navbar (marketing). */
  readonly navFeatures = this.page.locator('header').getByRole('link', { name: 'Features' })
  readonly navAbout = this.page.locator('header').getByRole('link', { name: 'About' })

  /** Headings de las secciones de la landing (EN default). */
  readonly featuresHeading = this.page.getByRole('heading', { name: 'Your job search, from profile to offer' })
  readonly pricingHeading = this.page.getByRole('heading', { name: 'Start free. Upgrade when you need it.' })
  readonly aboutHeading = this.page.getByRole('heading', { name: 'Enterprise-grade AI for your job search' })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  /**
   * Cambia idioma desde el LanguageSwitcher del navbar.
   * Reintenta el click hasta que la URL refleje el cambio: en compilación en
   * frío el primer click puede ocurrir antes de la hidratación de React.
   * `force` + `noWaitAfter`: el botón queda deshabilitado durante la transición
   * (isPending) y la ruta /es puede tardar en compilarse — un click normal
   * se bloquearía esperando actionability y agotaría el poll. Con force el
   * click es inmediato (sobre un botón disabled es un no-op) y el poll solo
   * observa la URL.
   */
  async switchLanguage(locale: 'EN' | 'ES') {
    const button = this.page.getByRole('button', { name: locale, exact: true })
    const expectedUrl = locale === 'ES' ? /\/es/ : /\/$/
    await expect
      .poll(async () => {
        if (!expectedUrl.test(this.page.url())) {
          await button.click({ force: true, noWaitAfter: true }).catch(() => {})
        }
        return expectedUrl.test(this.page.url())
      }, { timeout: 25_000 })
      .toBe(true)
  }
}
