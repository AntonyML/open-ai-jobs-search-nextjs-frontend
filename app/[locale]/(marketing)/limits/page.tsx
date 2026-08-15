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
const costLabels: Record<string, string> = { cv_base: 'creditCvBase', cv_adapted: 'creditCvAdapted', rank: 'creditRank', apply: 'creditApply', interview: 'creditInterview' }

function money(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
}

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
    <section className="mx-auto max-w-[1100px] px-5 py-12 md:px-8 md:py-16">
      <div className="mb-8 rounded-2xl border border-[#cfe2ff] bg-[#f4f8fb] p-5 md:p-6"><h2 className="text-lg font-semibold text-[#1d1d1f]">{t('valueTitle')}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#474747]">{t('valueBody')}</p></div>
      <div className="mb-10 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const maxCredits = Math.max(...plans.map((item) => item.credits_per_period), 1)
          const width = plan.credits_per_period ? Math.max(8, Math.round((plan.credits_per_period / maxCredits) * 100)) : 4
          return <article key={plan.key} className={`card ${plan.key === 'max' ? 'border-[#0071e3] ring-1 ring-[#0071e3]/20' : ''}`}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#1d1d1f]">{plan.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-[#474747]">{plan.description}</p></div><span className="rounded-full bg-[#f4f8fb] px-2.5 py-1 text-xs font-semibold text-[#0066cc]">{money(plan.price_monthly_usd, catalog.currency)}</span></div>
            <div className="mt-6"><div className="flex items-end justify-between text-sm"><span className="font-medium text-[#1d1d1f]">{plan.credits_per_period || t('noCredits')} {plan.credits_per_period > 0 && t('credits')}</span><span className="text-[#5f6368]">{plan.refill_cadence === 'weekly' ? t('weekly') : t('period')}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e2e2e5]"><div className="h-full rounded-full bg-[#0071e3]" style={{ width: `${width}%` }} /></div></div>
            <dl className="mt-5 space-y-2 border-t border-[#d2d2d7] pt-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t('yearlyPrice')}</dt><dd className="font-medium text-[#1d1d1f]">{money(plan.price_yearly_usd, catalog.currency)}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t(plan.key === 'max' ? 'pipelineDailyQuota' : 'creditDailyQuota')}</dt><dd className="text-right font-medium text-[#1d1d1f]">{plan.daily_quota ? `${plan.daily_quota} ${t('actions')}` : t('creditBased')}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#5f6368]">{t(plan.key === 'max' ? 'pipelineWeeklyQuota' : 'creditWeeklyQuota')}</dt><dd className="text-right font-medium text-[#1d1d1f]">{plan.weekly_quota ? `${plan.weekly_quota} ${t('actions')}` : t('creditBased')}</dd></div></dl>
            <ul className="mt-5 space-y-2 border-t border-[#d2d2d7] pt-5 text-sm text-[#474747]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#0071e3]" aria-hidden="true">✓</span><span>{featureLabels[feature] ? t(featureLabels[feature] as never) : feature}</span></li>)}</ul>
          </article>
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card"><h2 className="text-xl font-semibold text-[#1d1d1f]">{t('costsTitle')}</h2><p className="mt-2 text-sm leading-6 text-[#474747]">{t('costsBody')}</p><div className="mt-6 overflow-hidden rounded-lg border border-[#d2d2d7]"><table className="w-full text-left text-sm"><thead className="bg-[#f5f5f7]"><tr><th className="p-3 font-medium text-[#474747]">{t('action')}</th><th className="p-3 text-right font-medium text-[#474747]">{t('cost')}</th></tr></thead><tbody>{Object.entries(catalog.credit_costs).filter(([key]) => costLabels[key]).map(([key, cost]) => <tr key={key} className="border-t border-[#e2e2e5]"><td className="p-3 text-[#474747]">{t(costLabels[key] as never, { cost } as never)}</td><td className="p-3 text-right font-semibold text-[#1d1d1f]">{cost}</td></tr>)}</tbody></table></div></section>
        <section className="card"><h2 className="text-xl font-semibold text-[#1d1d1f]">{t('comparisonTitle')}</h2><p className="mt-2 text-sm leading-6 text-[#474747]">{t('comparisonBody')}</p><div className="mt-6 overflow-hidden rounded-lg border border-[#d2d2d7]"><table className="w-full text-left text-sm"><thead className="bg-[#f5f5f7]"><tr><th className="p-3 font-medium text-[#474747]">{t('plan')}</th><th className="p-3 text-right font-medium text-[#474747]">{t('monthlyPrice')}</th><th className="p-3 text-right font-medium text-[#474747]">{t('credits')}</th></tr></thead><tbody>{plans.map((plan) => <tr key={plan.key} className="border-t border-[#e2e2e5]"><td className="p-3 font-medium text-[#1d1d1f]">{plan.name}</td><td className="p-3 text-right text-[#474747]">{money(plan.price_monthly_usd, catalog.currency)}</td><td className="p-3 text-right font-semibold text-[#0071e3]">{plan.credits_per_period}</td></tr>)}</tbody></table></div><div className="mt-6 rounded-lg bg-[#f4f8fb] p-4 text-sm leading-6 text-[#1d1d1f]">{t('valueNote')}</div></section>
      </div>
      <Link href="/#pricing" className="mt-10 inline-block text-sm font-medium text-[#0066cc] hover:underline">{t('backToPricing')} →</Link>
    </section>
  </main>
}
