import type { Page } from '@playwright/test'

/** Espejo de app/[locale]/(app)/search — estados briefing/incomplete/results. */
export class SearchPage {
  readonly briefingHeading = this.page.getByRole('heading', {
    name: 'Your search is ready',
  })
  readonly searchButton = this.page.getByRole('button', {
    name: 'Search',
    exact: true,
  })
  readonly incompleteHeading = this.page.getByRole('heading', {
    name: 'We need your desired role',
  })
  readonly completeProfileButton = this.page.getByRole('button', {
    name: 'Complete profile',
  })
  readonly resultsHeading = this.page.getByRole('heading', {
    name: /We found 2 jobs that match/,
  })
  readonly firstJobTitle = this.page.getByText('Senior Frontend Engineer')
  readonly evaluateJobsButton = this.page.getByRole('button', {
    name: /Evaluate jobs/,
  })

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/search')
  }

  async search() {
    await this.searchButton.click()
  }
}
