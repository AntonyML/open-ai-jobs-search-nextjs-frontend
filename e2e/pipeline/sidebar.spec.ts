import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * PipelineSidebar — con una sesión nueva (sin pasos completados),
 * solo el paso 0 (providers) es accesible; el resto están bloqueados.
 */
test.describe('Sidebar del pipeline', () => {
  test('el paso providers es un link y los siguientes están bloqueados', async ({
    appShell,
  }) => {
    await appShell.gotoPipeline()

    // Paso 0 (providers): accesible → renderiza como link
    await expect(appShell.stepLink('Providers')).toBeVisible()
    // Pasos siguientes: bloqueados → botones sin href
    for (const step of ['Setup', 'Search', 'Rank', 'Apply', 'Interview', 'Outcome']) {
      await expect(appShell.lockedStep(step)).toBeVisible()
    }
  })

  test('muestra el progreso 1/7 en el paso providers', async ({ page, appShell }) => {
    await appShell.gotoPipeline()
    await expect(page.getByText('1 / 7')).toBeVisible()
  })
})
