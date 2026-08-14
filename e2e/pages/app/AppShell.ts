import type { Page } from '@playwright/test'

/**
 * Shell de la app autenticada (layout de (app)): Navbar + AppSidebar.
 * Encapsula la navegación y las acciones globales compartidas por todos los pasos.
 */
export class AppShell {
  readonly signOutButton = this.page.getByRole('button', { name: 'Sign out' })
  readonly profileLink = this.page.getByRole('link', { name: 'Profile' })

  constructor(private readonly page: Page) {}

  /** Entra a la edición del perfil de candidato. */
  async gotoPipeline() {
    await this.page.goto('/candidate')
  }

  async signOut() {
    await this.signOutButton.click()
  }
}
