import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/pipeline/providers — vista del proveedor global de IA. */
export class ProvidersPage {
  readonly heading = this.page.getByRole('heading', {
    name: 'AI Provider',
  })
  readonly globalProviderCard = this.page.getByText('Global provider', { exact: true })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/pipeline/providers')
  }
}
