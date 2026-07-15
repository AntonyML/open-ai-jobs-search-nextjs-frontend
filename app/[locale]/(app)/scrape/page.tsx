import { redirect } from 'next/navigation'

export default async function ScrapeRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/scrape`)
}
