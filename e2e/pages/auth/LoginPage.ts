import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(auth)/login — encapsula locators y acciones del formulario. */
export class LoginPage {
  readonly emailInput = this.page.getByPlaceholder('you@example.com')
  readonly passwordInput = this.page.getByPlaceholder('Enter your password')
  readonly submitButton = this.page.getByRole('button', { name: 'Sign in' })
  /** Error inline del form (el mismo texto también aparece en el toast). */
  readonly errorMessage = this.page.locator('form').getByText('Invalid email or password')

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
