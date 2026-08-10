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
})
