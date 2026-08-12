import type { Page } from '@playwright/test'

/**
 * Shell de la app autenticada (layout de (app)): Navbar + AppSidebar.
 * Encapsula la navegación y las acciones globales compartidas por todos los pasos.
 */
export class AppShell {
  readonly signOutButton = this.page.getByRole('button', { name: 'Sign out' })
  readonly profileLink = this.page.getByRole('link', { name: 'Profile' })

  constructor(private readonly page: Page) {}

  /** Entra al primer paso del pipeline. */
  async gotoPipeline() {
    await this.page.goto('/pipeline/setup')
  }

  async signOut() {
    await this.signOutButton.click()
  }
}
