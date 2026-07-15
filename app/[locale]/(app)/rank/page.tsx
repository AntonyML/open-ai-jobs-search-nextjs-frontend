import { redirect } from 'next/navigation'

export default async function RankRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/rank`)
}
