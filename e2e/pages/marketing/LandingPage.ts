import { expect, type Page } from '@playwright/test'

/** Espejo de app/[locale]/(marketing) — landing pública. */
export class LandingPage {
  readonly heroHeading = this.page.getByRole('heading', { level: 1 })
  readonly tryFreeLink = this.page.getByRole('link', { name: 'Try it free' })
  /** El link About existe en navbar y footer; cualquiera navega igual. */
  readonly aboutLink = this.page.getByRole('link', { name: 'About' }).first()
  readonly signInLink = this.page.getByRole('link', { name: 'Sign in' })

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
