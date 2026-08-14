import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'
import { mockApplyApi } from '../mocks/api'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Apply — flujo LLM mockeado: la generación crea una aplicación y el poll de
 * status avanza al 100% sin llamar al microservicio.
 */
test.describe('Apply', () => {
  test('genera CV + cover letter para un job rankeado', async ({
    page,
    applyPage,
  }) => {
    await mockApplyApi(page)
    await applyPage.goto()

    await expect(applyPage.heading).toBeVisible()
    await expect(applyPage.firstGenerateButton).toBeVisible()

    await applyPage.generateFirst()

    // Tras el poll de status (3s) la tarjeta queda "Generated"
    await expect(applyPage.generatedText).toBeVisible({ timeout: 20_000 })
    await expect(applyPage.continueToInterviewButton).toBeVisible()
  })

  test('muestra el empty state sin jobs disponibles', async ({
    page,
    applyPage,
  }) => {
    await mockApplyApi(page, { jobs: [] })
    await applyPage.goto()

    await expect(applyPage.emptyTitle).toBeVisible()
  })
})
