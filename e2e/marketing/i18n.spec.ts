import { test, expect } from '../fixtures/pages'

/** i18n — el LanguageSwitcher del navbar cambia la URL y los textos. */
test.describe('i18n', () => {
  test('cambia el idioma EN → ES → EN', async ({ page, landingPage }) => {
    await landingPage.goto()

    // EN por defecto
    await expect(landingPage.heroHeading).toContainText('Land your next role')
    await expect(page).toHaveURL(/\/$/)

    // → ES
    await landingPage.switchLanguage('ES')
    await expect(page).toHaveURL(/\/es/, { timeout: 15_000 })
    await expect(landingPage.heroHeading).toContainText('Consigue tu próximo empleo')
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()

    // → EN
    await landingPage.switchLanguage('EN')
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    await expect(landingPage.heroHeading).toContainText('Land your next role')
  })
})
