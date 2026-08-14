import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/apply — tarjetas de jobs + generación de CV. */
export class ApplyPage {
  readonly heading = this.page.getByRole('heading', {
    name: 'Turn a strong fit into an application',
  })
  readonly firstGenerateButton = this.page
    .getByRole('button', { name: /Generate CV \+ cover letter/ })
    .first()
  readonly generatedText = this.page.getByText('Generated')
  readonly continueToInterviewButton = this.page.getByRole('button', {
    name: 'Continue to Interview',
  })
  readonly emptyTitle = this.page.getByText('Rank jobs first')

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/apply')
  }

  async generateFirst() {
    await this.firstGenerateButton.click()
  }
}
