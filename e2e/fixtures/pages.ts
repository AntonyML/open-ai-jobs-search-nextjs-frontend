import { test as base, expect } from '@playwright/test'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { LandingPage } from '../pages/marketing/LandingPage'
import { AppShell } from '../pages/app/AppShell'
import { ProvidersPage } from '../pages/app/features/ProvidersPage'
import { SearchPage } from '../pages/app/features/SearchPage'
import { RankPage } from '../pages/app/features/RankPage'
import { ApplyPage } from '../pages/app/features/ApplyPage'

/**
 * Fixtures de Page Objects — evitan `new XPage(page)` en cada spec.
 * El contexto (auth vía storageState, mocks) se define por spec con `test.use`
 * y las funciones de e2e/mocks.
 */
type Pages = {
  loginPage: LoginPage
  registerPage: RegisterPage
  landingPage: LandingPage
  appShell: AppShell
  providersPage: ProvidersPage
  searchPage: SearchPage
  rankPage: RankPage
  applyPage: ApplyPage
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  landingPage: async ({ page }, use) => use(new LandingPage(page)),
  appShell: async ({ page }, use) => use(new AppShell(page)),
  providersPage: async ({ page }, use) => use(new ProvidersPage(page)),
  searchPage: async ({ page }, use) => use(new SearchPage(page)),
  rankPage: async ({ page }, use) => use(new RankPage(page)),
  applyPage: async ({ page }, use) => use(new ApplyPage(page)),
})

export { expect }
