import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function NotFound() {
  const t = useTranslations('errors')
  const c = useTranslations('common')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f7] px-4 text-center dark:bg-[#000]">
      <h1 className="text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">404</h1>
      <p className="text-[#86868b]">{t('notFound')}</p>
      <Link
        href="/dashboard"
        className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
      >
        {c('back')}
      </Link>
    </main>
  )
}
