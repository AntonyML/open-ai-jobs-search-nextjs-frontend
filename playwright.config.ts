import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // El dev server de Next compila rutas on-demand: 16 workers paralelos lo
  // saturan y producen flakiness (compilaciones en frío > timeout). 6 es un
  // equilibrio razonable localmente; CI usa 4.
  workers: process.env.CI ? 4 : 6,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }],
  ],
  // Autenticación compartida: un solo login vía API antes de toda la suite
  globalSetup: './e2e/global-setup.ts',
  outputDir: 'e2e/test-results',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    // El dev server de Next compila rutas on-demand: asserts con 5s fallan
    // en la primera corrida. 15s absorbe la compilación en frío.
    timeout: 15_000,
  },
  projects: [
    // El frontend es desktop-first; un solo proyecto mantiene la suite rápida.
    // Para añadir móvil/tags: https://playwright.dev/docs/test-projects
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // e2e-dev.sh mata listeners huérfanos en 300x y limpia .next antes de
    // arrancar (Windows deja huérfanos de `next dev` que corrompen el caché
    // si un segundo servidor comparte .next). Solo corre si no hay un server
    // sano en :3000 que reutilizar.
    command: 'bash scripts/e2e-dev.sh',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
