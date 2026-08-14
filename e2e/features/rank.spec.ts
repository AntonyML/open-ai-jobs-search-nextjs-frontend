import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'
import { mockRankApi } from '../mocks/api'
import { rankJobRunning, rankJobCompleted } from '../mocks/data'

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

  test('se traduce al español en /es/rank', async ({ page }) => {
    await mockRankApi(page)
    await page.addInitScript((ids) => {
      localStorage.setItem('rank_job_ids', JSON.stringify(ids))
    }, ['job-1', 'job-2'])
    await page.goto('/es/rank')

    // Header (el eyebrow "04 / EVALUATE" sigue en inglés, hardcoded en el componente)
    await expect(page.locator('section').getByText('04 / EVALUATE')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Prioriza los mejores ajustes' }),
    ).toBeVisible()
    await expect(
      page.getByText('Rankea los empleos scapeados según su compatibilidad con tu perfil.'),
    ).toBeVisible()

    // Focus area (etiqueta híbrida: "Focus area" hardcoded + "opcional")
    await expect(page.getByText('Focus area opcional')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Machine Learning' })).toBeVisible()
    await expect(page.getByPlaceholder('Or type a custom focus area…')).toBeVisible()

    // Slider + re-rank + CTA (traducidos)
    await expect(page.getByText('Mejores resultados')).toBeVisible()
    await expect(page.getByText('Re-rankear empleos ya evaluados')).toBeVisible()
    await expect(
      page.getByText('Útil después de actualizar tu perfil', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Rankear empleos', exact: true }),
    ).toBeVisible()

    // Rankeo mockeado → resumen (el resumen sigue en inglés en esta página)
    await page.getByRole('button', { name: 'Rankear empleos', exact: true }).click()
    await expect(
      page.locator('#rank-results').getByText(/jobs evaluated/),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('reanuda un job en ejecución al refrescar la página', async ({
    page,
    rankPage,
  }) => {
    // El job de rank ya está running en la cola del orquestador cuando la
    // página se monta (refresco a mitad de ranking). El mock por defecto la
    // devuelve idle — lo sobreescribimos para simular el caso real.
    await mockRankApi(page)
    await page.route('**/api/v1/orchestrator/queue', (route) =>
      route.fulfill({
        json: {
          paused: false,
          status: 'running',
          running_jobs: [{ ...rankJobRunning, pipeline: 'rank' }],
          pending_jobs: [],
        },
      }),
    )

    await rankPage.gotoWithJobIds(['job-1', 'job-2'])

    // En lugar del botón normal, la página retoma el seguimiento del job:
    // muestra progreso + un botón para cancelar.
    await expect(page.getByText('Ranking…')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()

    // El poll retoma running → completed y muestra el resumen
    await expect(rankPage.resultSummary).toBeVisible({ timeout: 30_000 })
    await expect(rankPage.continueToApplyButton).toBeVisible()
  })

  test('cancela un job en ejecución desde la página', async ({ page, rankPage }) => {
    await mockRankApi(page)
    let cancelled = false
    await page.route('**/api/v1/orchestrator/queue/control', (route) => {
      cancelled = true
      const body = route.request().postDataJSON()
      expect(body?.action).toBe('cancel')
      expect(body?.job_id).toBe('job-run-1')
      return route.fulfill({
        json: { action: 'cancel', affected_jobs: 1, message: 'Job cancelled' },
      })
    })

    await rankPage.gotoWithJobIds(['job-1', 'job-2'])
    await rankPage.rank()
    // Espera el progreso y cancela desde la página
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()

    // Cancelar corta el poll y vuelve al formulario sin resumen
    await expect(page.getByRole('button', { name: 'Rank jobs', exact: true })).toBeVisible()
    expect(cancelled).toBe(true)
  })
})
