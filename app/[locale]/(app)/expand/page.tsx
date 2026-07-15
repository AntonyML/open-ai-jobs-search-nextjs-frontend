import { redirect } from 'next/navigation'

export default async function ExpandRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/pipeline/expand`)
}
