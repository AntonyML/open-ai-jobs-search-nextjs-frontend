import { expect, type Page } from '@playwright/test'

/** Espejo de app/[locale]/(auth)/register — incluye el flujo del modal de términos. */
export class RegisterPage {
  readonly nameInput = this.page.getByPlaceholder('Jane Doe')
  readonly emailInput = this.page.getByPlaceholder('you@example.com')
  readonly passwordInput = this.page.getByPlaceholder('Enter your password')
  readonly submitButton = this.page.getByRole('button', {
    name: /Leer y aceptar términos/,
  })
  readonly termsDialog = this.page.getByRole('dialog')

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register')
  }

  /** Rellena el formulario y completa el flujo de términos para registrarse. */
  async register(fullName: string, email: string, password: string) {
    await this.nameInput.fill(fullName)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.acceptTerms()
  }

  /**
   * El modal exige llegar al 95% del scroll para habilitar el checkbox.
   * El contenido legal carga async (fetch de terms.md), así que se repite el
   * scroll hasta que el checkbox se habilite (con timeout por si carga lento).
   */
  async acceptTerms() {
    await this.termsDialog.waitFor()
    const body = this.termsDialog.locator('.legal-modal-body')
    const checkbox = this.termsDialog.locator('#accept-terms-checkbox')

    await expect
      .poll(
        async () => {
          await body.evaluate((el) => {
            el.scrollTop = el.scrollHeight
          })
          return checkbox.isEnabled()
        },
        { timeout: 15_000, message: 'checkbox de términos no se habilitó' },
      )
      .toBe(true)

    // El input está oculto visualmente (position:absolute; width/height:0),
    // así que check() falla aunque sea con force. Un click nativo lo togglea
    // y dispara el onChange de React igual que lo haría un usuario real.
    await checkbox.evaluate((el) => (el as HTMLInputElement).click())
    await this.termsDialog
      .getByRole('button', { name: 'Acepto y Continúo →' })
      .click()
  }
}
