import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'
import { mockRankApi } from '../mocks/api'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Rank — flujo LLM mockeado: el POST /rank/ crea un job y el poll del
 * orquestador avanza running → completed sin un worker real.
 */
test.describe('Rank', () => {
  test('rankea los jobs de la búsqueda y muestra los resultados', async ({
    page,
    rankPage,
  }) => {
    await mockRankApi(page)
    // Simula el paso Search: deja los job_ids seleccionados en localStorage
    await rankPage.gotoWithJobIds(['job-1', 'job-2'])

    await expect(rankPage.readyTitle).toBeVisible()
    await rankPage.rank()

    // El resumen aparece tras completarse el poll (running → completed)
    await expect(rankPage.resultSummary).toBeVisible({ timeout: 30_000 })
    await expect(rankPage.continueToApplyButton).toBeVisible()
  })

  test('muestra el empty state sin jobs y sin job_ids', async ({
    page,
    rankPage,
  }) => {
    await mockRankApi(page)
    await rankPage.goto()

    await expect(rankPage.prevStepBadge).toBeVisible()
    await expect(rankPage.emptyTitle).toBeVisible()
    await expect(rankPage.goToSearchLink).toBeVisible()
  })
})
