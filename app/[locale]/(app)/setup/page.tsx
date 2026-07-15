import { redirect } from 'next/navigation'

export default async function SetupRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/setup`)
}
