import { redirect } from 'next/navigation'

export default async function ApplyRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/apply`)
}
