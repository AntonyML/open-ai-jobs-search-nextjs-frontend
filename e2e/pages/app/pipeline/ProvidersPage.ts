import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/pipeline/providers — formulario de proveedores de IA. */
export class ProvidersPage {
  readonly heading = this.page.getByRole('heading', {
    name: 'Configure AI providers',
  })
  readonly providerSelect = this.page.getByRole('combobox')
  readonly apiKeyInput = this.page.getByPlaceholder('API Key')
  readonly loadModelsButton = this.page.getByRole('button', {
    name: 'Load models',
  })
  readonly saveProviderButton = this.page.getByRole('button', {
    name: 'Save provider',
  })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/pipeline/providers')
  }
}
