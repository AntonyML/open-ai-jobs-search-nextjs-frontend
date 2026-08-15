import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ProductCatalog } from '@/types/billing'

export const dynamic = 'force-dynamic'
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getCatalog(): Promise<ProductCatalog | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/public/catalog`, { cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    return (await response.json()) as ProductCatalog
  } catch { return null }
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CR' : 'en-US', { dateStyle: 'medium' }).format(date)
}

const featureLabels: Record<string, string> = { cv_base: 'featureCvBase', cv_adapted: 'featureCvAdapted', pipeline: 'featurePipeline', expand: 'featureExpand', upskill: 'featureUpskill' }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'limits' })
  return { title: `${t('heading')} | CVMeld`, description: t('introBody') }
}

export default async function LimitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'limits' })
  const catalog = await getCatalog()

  if (!catalog) return <main className="mx-auto max-w-[860px] px-5 py-24 text-center"><p className="eyebrow">{t('label')}</p><h1 className="title">{t('heading')}</h1><p className="mx-auto mt-5 max-w-xl text-[#474747]">{t('unavailable')}</p></main>

  const plans = catalog.plans.filter((plan) => plan.is_active).sort((a, b) => a.sort_order - b.sort_order)
  const updated = formatDate(catalog.last_updated, locale)

  return <main className="min-h-screen bg-[#f5f5f7]">
    <section className="border-b border-[#d2d2d7] bg-white"><div className="mx-auto max-w-[860px] px-5 py-14 md:px-8 md:py-20"><p className="eyebrow text-[#0071e3]">{t('label')}</p><h1 className="title">{t('heading')}</h1><p className="mt-5 max-w-2xl text-[17px] leading-7 text-[#474747]">{t('introBody')}</p>{updated && <p className="mt-4 text-sm text-[#5f6368]">{t('updatedWithDate', { date: updated })}</p>}</div></section>
    <section className="mx-auto max-w-[1100px] px-5 py-12 md:px-8 md:py-16"><div className="grid gap-5 md:grid-cols-3">{plans.map((plan) => <article key={plan.key} className="card"><h2 className="text-xl font-semibold text-[#1d1d1f]">{plan.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-[#474747]">{plan.description}</p><p className="mt-5 text-2xl font-semibold text-[#1d1d1f]">{plan.credits_per_period || t('noCredits')}</p>{plan.credits_per_period > 0 && <p className="text-sm text-[#5f6368]">{t('credits')}</p>}<dl className="mt-5 space-y-2 border-t border-[#d2d2d7] pt-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t('cadence')}</dt><dd className="font-medium text-[#1d1d1f]">{plan.refill_cadence === 'weekly' ? t('weekly') : t('period')}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t('dailyQuota')}</dt><dd className="font-medium text-[#1d1d1f]">{plan.daily_quota || t('unlimited')}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t('weeklyQuota')}</dt><dd className="font-medium text-[#1d1d1f]">{plan.weekly_quota || t('unlimited')}</dd></div></dl><ul className="mt-5 space-y-2 border-t border-[#d2d2d7] pt-5 text-sm text-[#474747]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#0071e3]" aria-hidden="true">✓</span><span>{featureLabels[feature] ? t(featureLabels[feature] as never) : feature}</span></li>)}</ul></article>)}</div><Link href="/#pricing" className="mt-10 inline-block text-sm font-medium text-[#0066cc] hover:underline">{t('backToPricing')} →</Link></section>
  </main>
}
