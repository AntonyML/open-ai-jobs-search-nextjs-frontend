import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LegalStyles from '@/components/LegalStyles'
import type { ProductCatalog } from '@/types/billing'

// Página dinámica: el catálogo vive en la DB (admin). Sin esto, SSG/OpenNext
// congelaría precios/cuotas en el build.
export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const FALLBACK_CATALOG: ProductCatalog = {
  plans: [
    {
      key: 'free',
      name: 'Free',
      description: null,
      price_monthly_usd: 0,
      price_yearly_usd: 0,
      credits_per_period: 2,
      refill_cadence: 'weekly',
      refill_weekday: 0,
      daily_quota: 0,
      weekly_quota: 0,
      features: ['cv_base', 'cv_adapted'],
      is_active: true,
      sort_order: 10,
    },
    {
      key: 'pro',
      name: 'Pro',
      description: null,
      price_monthly_usd: 19.99,
      price_yearly_usd: 199,
      credits_per_period: 100,
      refill_cadence: 'period',
      refill_weekday: 0,
      daily_quota: 0,
      weekly_quota: 0,
      features: ['cv_base', 'cv_adapted'],
      is_active: true,
      sort_order: 20,
    },
    {
      key: 'max',
      name: 'Max',
      description: null,
      price_monthly_usd: 59.99,
      price_yearly_usd: 599,
      credits_per_period: 500,
      refill_cadence: 'period',
      refill_weekday: 0,
      daily_quota: 20,
      weekly_quota: 80,
      features: ['cv_base', 'cv_adapted', 'pipeline', 'expand', 'upskill'],
      is_active: true,
      sort_order: 30,
    },
  ],
  credit_costs: { cv_base: 1, cv_adapted: 1, pipeline: 1 },
  whatsapp_number: '',
  currency: 'USD',
  last_updated: null,
}

async function getCatalog(): Promise<ProductCatalog> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/catalog`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) return FALLBACK_CATALOG
    return (await res.json()) as ProductCatalog
  } catch {
    return FALLBACK_CATALOG
  }
}

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function formatPrice(usd: number): string {
  return currencyFmt.format(usd)
}

const FEATURE_LABELS: Record<string, (t: (key: string, params?: Record<string, string | number | Date>) => string) => string> = {
  cv_base: (t) => t('featureCvBase'),
  cv_adapted: (t) => t('featureCvAdapted'),
  pipeline: (t) => t('featurePipeline'),
  expand: (t) => t('featureExpand'),
  upskill: (t) => t('featureUpskill'),
}

function formatFeatures(features: string[], t: (key: string, params?: Record<string, string | number | Date>) => string): string {
  if (features.length === 0) return '—'
  return features.map((f) => FEATURE_LABELS[f]?.(t) ?? f).join(', ')
}

export default async function LimitsPage() {
  const t = await getTranslations('limits')
  const catalog = await getCatalog()
  const byKey = new Map(catalog.plans.map((p) => [p.key, p]))
  const free = byKey.get('free')
  const pro = byKey.get('pro')
  const max = byKey.get('max')
  const updated = catalog.last_updated ? new Date(catalog.last_updated) : null

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* ── Hero ── */}
      <section className="border-b border-[#d2d2d7] bg-white">
        <div className="mx-auto max-w-[860px] px-5 py-14 md:px-8 md:py-20">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('label')}
          </p>
          <h1 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('heading')}
          </h1>
          <p className="mt-3 text-[15px] text-[#707070]">
            {updated
              ? t('updatedWithDate', { date: updated.toLocaleDateString() })
              : t('updated')}
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-[860px] px-5 py-12 md:px-8 md:py-16">
        <div className="prose-legal">
          <h2>{t('introTitle')}</h2>
          <p>{t('introBody')}</p>
          <ul>
            <li>{t('creditCvBase', { cost: catalog.credit_costs.cv_base })}</li>
            <li>{t('creditCvAdapted', { cost: catalog.credit_costs.cv_adapted })}</li>
            <li>{t('creditPipeline', { cost: catalog.credit_costs.pipeline })}</li>
          </ul>

          <h2>{t('plansTitle')}</h2>
          <p>{t('plansBody')}</p>

          <div className="overflow-x-auto">
            <table className="limits-table">
              <thead>
                <tr>
                  <th>{t('tablePlan')}</th>
                  <th>{t('tablePrice')}</th>
                  <th>{t('tableCredits')}</th>
                  <th>{t('tableQuotas')}</th>
                  <th>{t('tableIncludes')}</th>
                </tr>
              </thead>
              <tbody>
                {free && (
                  <tr>
                    <td><strong>Free</strong></td>
                    <td>{t('freePrice')}</td>
                    <td>{free.credits_per_period == 0 ? t('noCredits') : t('creditsPerPeriod', { count: free.credits_per_period, cadence: t(free.refill_cadence === 'weekly' ? 'cadenceWeekly' : 'cadencePeriod') })}</td>
                    <td>{t('freeQuotas')}</td>
                    <td>{formatFeatures(free.features, t)}</td>
                  </tr>
                )}
                {pro && (
                  <tr>
                    <td><strong>Pro</strong></td>
                    <td>{t('priceMonthly', { amount: formatPrice(pro.price_monthly_usd) })}</td>
                    <td>{pro.credits_per_period == 0 ? t('noCredits') : t('creditsPerPeriod', { count: pro.credits_per_period, cadence: t('cadencePeriod') })}</td>
                    <td>{t('proQuotas')}</td>
                    <td>{formatFeatures(pro.features, t)}</td>
                  </tr>
                )}
                {max && (
                  <tr>
                    <td><strong>Max</strong></td>
                    <td>{t('priceMonthly', { amount: formatPrice(max.price_monthly_usd) })}</td>
                    <td>{max.credits_per_period == 0 ? t('noCredits') : t('creditsPerPeriod', { count: max.credits_per_period, cadence: t('cadencePeriod') })}</td>
                    <td>{t('maxQuotas', { daily: max.daily_quota, weekly: max.weekly_quota })}</td>
                    <td>{formatFeatures(max.features, t)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2>{t('refillsTitle')}</h2>
          <ul>
            <li>{t('refillFree', { credits: free?.credits_per_period ?? 2 })}</li>
            <li>{t('refillPro', { credits: pro?.credits_per_period ?? 100 })}</li>
            <li>{t('refillMax', { credits: max?.credits_per_period ?? 500 })}</li>
            <li>{t('refillNoAccumulate')}</li>
          </ul>

          <h2>{t('changesTitle')}</h2>
          <p>{t('changesBody')}</p>

          <h2>{t('questionsTitle')}</h2>
          <p>
            {t('questionsBody')}{' '}
            <a href="mailto:legal.ai-jobs@tonyml.com">legal.ai-jobs@tonyml.com</a>
          </p>
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-[#d2d2d7] pt-8 sm:flex-row sm:items-center">
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#0068d2] transition-all"
          >
            {t('backToPricing')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-5 py-2.5 text-[13px] font-medium text-[#474747] hover:border-[#0071e3]/40 transition-all"
          >
            {t('createAccount')}
          </Link>
        </div>
      </section>

      <LegalStyles />
    </main>
  )
}
