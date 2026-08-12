import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'
import { mockSearchApi, mockSearchApiIncomplete } from '../mocks/api'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Search — flujo LLM mockeado: el perfil determina el estado inicial y la
 * búsqueda devuelve resultados deterministas sin llamar al microservicio.
 */
test.describe('Search', () => {
  test('muestra el briefing desde el perfil y ejecuta una búsqueda', async ({
    page,
    searchPage,
  }) => {
    await mockSearchApi(page)
    await searchPage.goto()

    // Perfil completo → briefing
    await expect(searchPage.briefingHeading).toBeVisible()
    await searchPage.search()

    // Resultados deterministas del mock
    await expect(searchPage.resultsHeading).toBeVisible({ timeout: 15_000 })
    await expect(searchPage.firstJobTitle).toBeVisible()
    await expect(searchPage.evaluateJobsButton).toBeVisible()
  })

  test('muestra el estado incomplete cuando el perfil no tiene rol objetivo', async ({
    page,
    searchPage,
  }) => {
    await mockSearchApiIncomplete(page)
    await searchPage.goto()

    await expect(searchPage.incompleteHeading).toBeVisible()
    await expect(searchPage.completeProfileButton).toBeVisible()
  })

  test('se traduce al español en /es/pipeline/search', async ({ page }) => {
    await mockSearchApi(page)
    await page.goto('/es/pipeline/search')

    // Header
    await expect(page.locator('section').getByText('03 / BUSCAR')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Tu búsqueda está lista' }),
    ).toBeVisible()

    // Briefing desde el perfil mockeado
    await expect(
      page.getByText('Según tu perfil, estos son los parámetros de búsqueda', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByText('Rol', { exact: true })).toBeVisible()
    await expect(page.getByText('Software Engineer', { exact: true })).toBeVisible()
    await expect(page.getByText('Zona', { exact: true })).toBeVisible()
    await expect(page.getByText('Remote', { exact: true })).toBeVisible()
    await expect(page.getByText('Nivel', { exact: true })).toBeVisible()
    await expect(page.getByText('Senior', { exact: true })).toBeVisible()
    await expect(page.getByText('Modalidad', { exact: true })).toBeVisible()
    await expect(page.getByText('Remoto', { exact: true })).toBeVisible()
    await expect(page.getByText('Skills clave', { exact: true })).toBeVisible()
    await expect(page.getByText('Python', { exact: true })).toBeVisible()

    // Acciones del briefing
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajustar búsqueda' })).toBeVisible()

    // Búsqueda mockeada → resultados en español
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(
      page.getByRole('heading', {
        name: 'Encontramos 2 trabajos que encajan contigo',
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Senior Frontend Engineer', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ir a evaluar trabajos/ })).toBeVisible()
  })
})
