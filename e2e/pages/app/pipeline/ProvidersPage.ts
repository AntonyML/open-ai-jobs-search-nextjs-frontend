import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/admin/providers — configuración del proveedor global. */
export class ProvidersPage {
  readonly heading = this.page.getByRole('heading', {
    name: 'Global AI provider',
  })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin/providers')
  }
}
