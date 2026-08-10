import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/pipeline/rank — formulario + resultados del ranking. */
export class RankPage {
  readonly heading = this.page.getByRole('heading', {
    name: 'Prioritize the best fits',
  })
  readonly rankButton = this.page.getByRole('button', {
    name: 'Rank jobs',
    exact: true,
  })
  readonly readyTitle = this.page.getByText('2 jobs ready for evaluation')
  /** Rama "Search required" (prevStep sin completar): alerta + título + CTA. */
  readonly prevStepBadge = this.page.getByText('Search required')
  readonly emptyTitle = this.page.getByText('Find jobs first')
  readonly goToSearchLink = this.page.getByRole('link', { name: 'Go to Search' })
  /** Resumen del resultado (bloque #rank-results). */
  readonly resultSummary = this.page
    .locator('#rank-results')
    .getByText(/jobs evaluated/)
  readonly continueToApplyButton = this.page.getByRole('button', {
    name: 'Continue to Apply',
  })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/pipeline/rank')
  }

  /** Inyecta rank_job_ids antes de cargar la página (como haría el paso Search). */
  async gotoWithJobIds(jobIds: string[] = ['job-1', 'job-2']) {
    await this.page.addInitScript((ids) => {
      localStorage.setItem('rank_job_ids', JSON.stringify(ids))
    }, jobIds)
    await this.goto()
  }

  async rank() {
    await this.rankButton.click()
  }
}
