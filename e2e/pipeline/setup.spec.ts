import { test, expect } from '../fixtures/pages'
import { AUTH_STATE_PATH } from '../config'

test.use({ storageState: AUTH_STATE_PATH })

/**
 * Setup de perfil — backend real. Solo se validan textos estructurales ya que
 * los valores de los campos (nombre, experiencias, etc.) dependen del perfil
 * del usuario E2E en la BD.
 */
test.describe('Setup', () => {
  test('se traduce al español en /es/pipeline/setup', async ({ page }) => {
    await page.goto('/es/pipeline/setup')

    // Header
    await expect(page.locator('section').getByText('02 / PERFIL')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Construye tu perfil de candidato' }),
    ).toBeVisible()
    await expect(
      page.getByText('Tu perfil alimenta cada evaluación. Complétalo con cuidado.', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Volver a Proveedores' })).toBeVisible()

    // Información básica
    await expect(page.getByText('Información básica')).toBeVisible()
    await expect(page.getByText('Tu nombre y datos de contacto')).toBeVisible()
    await expect(page.getByText('Nombre completo')).toBeVisible()
    await expect(page.getByText('Correo electrónico')).toBeVisible()
    await expect(page.getByText('Teléfono')).toBeVisible()
    await expect(page.getByText('Ubicación *')).toBeVisible()
    await expect(
      page.getByText('Este correo será tu identificador permanente.', { exact: false }),
    ).toBeVisible()

    // Objetivo laboral
    await expect(page.getByText('Objetivo laboral', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Los cargos, industria y filtros que guían cada evaluación de tu perfil contra cada oferta', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByText('Agrega un cargo por línea — ej: Senior React Native Developer', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /\+\s*Cargos/ })).toBeVisible()
    await expect(page.getByText('Nivel de experiencia')).toBeVisible()
    await expect(
      page.getByRole('combobox').filter({ hasText: 'Junior' }).first(),
    ).toContainText('Ejecutivo')
    await expect(page.getByText('Modalidad de trabajo')).toBeVisible()
    await expect(page.getByRole('button', { name: /\+\s*Ubicaciones de búsqueda/ })).toBeVisible()
    await expect(page.getByText('Una ubicación por línea', { exact: true })).toBeVisible()
    await expect(page.getByText('Radio de búsqueda (km)', { exact: true })).toBeVisible()
    await expect(page.getByText('Tipo de empleo')).toBeVisible()
    await expect(page.getByText('Jornada completa')).toBeVisible()
    await expect(page.getByText('Keywords / Tech Stack', { exact: true })).toBeVisible()
    await expect(page.getByText('Excluir keywords', { exact: true })).toBeVisible()
    await expect(page.getByText('Excluir empresas', { exact: true })).toBeVisible()
    await expect(page.getByText('Rango salarial', { exact: true })).toBeVisible()
    await expect(page.getByText('Disponibilidad', { exact: true })).toBeVisible()
    await expect(
      page.getByText('¿Necesitas visa / permiso de trabajo?', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('¿Dispuesto a reubicarte?', { exact: true }),
    ).toBeVisible()

    // Experiencia / Educación / Proyectos
    await expect(page.getByText('Experiencia', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Agregar experiencia/ })).toBeVisible()
    await expect(page.getByText('Educación', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Agregar educación/ })).toBeVisible()
    await expect(page.getByText('Proyectos', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Agregar proyecto/ })).toBeVisible()

    // Habilidades y resumen
    await expect(page.getByText('Habilidades y resumen', { exact: true })).toBeVisible()
    await expect(page.getByText('Presiona Enter o coma para agregar cada habilidad', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Este resumen aparece al inicio de tu CV y cartas de presentación.', {
        exact: true,
      }),
    ).toBeVisible()

    // Panel sticky: eliminar + guardar/actualizar (depende del estado del perfil)
    await expect(page.getByRole('button', { name: 'Eliminar perfil' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^(Actualizar|Guardar perfil)$/ }),
    ).toBeVisible()
  })
})