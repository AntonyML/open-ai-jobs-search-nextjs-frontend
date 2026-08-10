import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Providers — backend real. Assertions estables del formulario que no
 * dependen del estado del usuario en la BD (proveedores configurados o no).
 */
test.describe('Providers', () => {
  test('renderiza el formulario de proveedor con guardado bloqueado', async ({
    providersPage,
  }) => {
    await providersPage.goto()

    await expect(providersPage.heading).toBeVisible()
    await expect(providersPage.providerSelect).toBeVisible()
    await expect(providersPage.apiKeyInput).toBeVisible()
    await expect(providersPage.loadModelsButton).toBeVisible()
    // Guardar requiere probar la conexión primero (client-side)
    await expect(providersPage.saveProviderButton).toBeDisabled()
  })

  test('se traduce al español en /es/pipeline/providers', async ({ page }) => {
    await page.goto('/es/pipeline/providers')

    // Header
    await expect(page.locator('section').getByText('01 / CONFIGURAR')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Configurar proveedores IA' })).toBeVisible()
    await expect(
      page.getByText('Conecta tus API keys de LLM para alimentar el pipeline.', { exact: true }),
    ).toBeVisible()

    // Formulario (no depende del estado del usuario)
    await expect(page.getByText('Proveedor de IA', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Conecta un proveedor de IA para alimentar cada etapa del pipeline', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByRole('combobox')).toContainText('OpenAI (GPT)')
    await expect(page.getByPlaceholder('API Key')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cargar modelos' })).toBeVisible()
    await expect(page.getByPlaceholder('API base (opcional)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar proveedor' })).toBeDisabled()

    // Estado del proveedor
    await expect(page.getByText('Proveedor activo')).toBeVisible()
    await expect(page.getByText('Tus proveedores configurados')).toBeVisible()
    await expect(
      page.getByText('Completa el formulario de la izquierda y guarda tu primer proveedor.', {
        exact: true,
      }),
    ).toBeVisible()

    // "Ir a configurar perfil →" solo aparece si el usuario E2E tiene un
    // proveedor activo con credenciales; se valida de forma condicional.
    await expect
      .poll(async () => {
        const configured = await page
          .getByRole('button', { name: /Ir a configurar perfil/ })
          .count()
        const empty = await page.getByText('No configurado').count()
        return configured + empty
      })
      .toBeGreaterThan(0)

    const continueBtn = page.getByRole('button', { name: /Ir a configurar perfil/ })
    if ((await continueBtn.count()) > 0) {
      await continueBtn.click()
      await expect(page).toHaveURL(/\/es\/pipeline\/setup/, { timeout: 15_000 })
    }
  })
})
