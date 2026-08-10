import type { Page } from '@playwright/test'

/**
 * Shell de la app autenticada (layout de (app)): Navbar + PipelineSidebar.
 * Encapsula la navegación y las acciones globales compartidas por todos los pasos.
 */
export class AppShell {
  readonly signOutButton = this.page.getByRole('button', { name: 'Sign out' })
  readonly profileLink = this.page.getByRole('link', { name: 'Profile' })
  /** Contenedor del menú del sidebar para acotar los queries. */
  private readonly sidebarMenu = this.page.locator('[data-sidebar="menu"]')

  constructor(private readonly page: Page) {}

  /** Paso del sidebar accesible (link). */
  stepLink(name: string) {
    return this.sidebarMenu.getByRole('link', { name: new RegExp(name) })
  }

  /** Paso bloqueado del sidebar (botón sin href). */
  lockedStep(name: string) {
    return this.sidebarMenu.getByRole('button', { name: new RegExp(name) })
  }

  /** Entra al primer paso del pipeline (providers). */
  async gotoPipeline() {
    await this.page.goto('/pipeline/providers')
  }

  async signOut() {
    await this.signOutButton.click()
  }
}
