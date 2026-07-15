import { redirect } from 'next/navigation'

export default async function OutcomeRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/outcome`)
}
