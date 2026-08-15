import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

/**
 * plan.md §3 — /admin/credits was absorbed:
 * - subscriptions + pending queue → /admin/billing
 * - per-user adjust/approvals → /admin/users/[id]
 * Redirect so old bookmarks and bell deep-links never 404.
 */
export default async function AdminCreditsRedirect() {
  const locale = await getLocale()
  redirect(`/${locale}/admin/billing`)
}
