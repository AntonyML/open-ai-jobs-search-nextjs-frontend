import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ProductCatalog } from '@/types/billing'

export const dynamic = 'force-dynamic'
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getCatalog(): Promise<ProductCatalog | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/catalog`, { cache: 'no-store' })
    return res.ok ? ((await res.json()) as ProductCatalog) : null
  } catch {
    return null
  }
}

const labels: Record<string, string> = {
  cv_base: 'featureCvBase', cv_adapted: 'featureCvAdapted', pipeline: 'featurePipeline',
  expand: 'featureExpand', upskill: 'featureUpskill',
}

export default async function LimitsPage() {
  const t = await getTranslations('limits')
  const catalog = await getCatalog()
  if (!catalog) {
    return <main className="mx-auto max-w-[860px] px-5 py-24 text-center"><h1 className="text-3xl font-semibold">{t('heading')}</h1><p className="mt-4 text-[#707070]">{t('unavailable')}</p></main>
  }
  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <section className="border-b border-[#d2d2d7] bg-white"><div className="mx-auto max-w-[860px] px-5 py-14 md:px-8 md:py-20"><p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">{t('label')}</p><h1 className="text-[36px] font-semibold leading-tight tracking-tight md:text-[48px]">{t('heading')}</h1></div></section>
      <section className="mx-auto max-w-[860px] px-5 py-12 md:px-8 md:py-16"><div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-4">{t('plan')}</th><th className="p-4">{t('credits')}</th><th className="p-4">{t('cadence')}</th><th className="p-4">{t('features')}</th></tr></thead><tbody>{catalog.plans.filter((p) => p.is_active).map((plan) => <tr key={plan.key} className="border-b last:border-0"><td className="p-4 font-medium">{plan.name}</td><td className="p-4">{plan.credits_per_period}</td><td className="p-4">{plan.refill_cadence}</td><td className="p-4">{plan.features.map((f) => t(labels[f] as never)).join(', ')}</td></tr>)}</tbody></table></div><Link href="/#pricing" className="mt-8 inline-block text-[#0071e3]">{t('backToPricing')}</Link></section>
    </main>
  )
}
