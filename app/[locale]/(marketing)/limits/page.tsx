import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LegalStyles from '@/components/LegalStyles'

export default async function LimitsPage() {
  const t = await getTranslations('limits')

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
          <p className="mt-3 text-[15px] text-[#707070]">{t('updated')}</p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-[860px] px-5 py-12 md:px-8 md:py-16">
        <div className="prose-legal">
          <h2>{t('introTitle')}</h2>
          <p>{t('introBody')}</p>
          <ul>
            <li>{t('creditCvBase')}</li>
            <li>{t('creditCvAdapted')}</li>
            <li>{t('creditPipeline')}</li>
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
                <tr>
                  <td><strong>Free</strong></td>
                  <td>{t('freePrice')}</td>
                  <td>{t('freeCredits')}</td>
                  <td>{t('freeQuotas')}</td>
                  <td>{t('freeIncludes')}</td>
                </tr>
                <tr>
                  <td><strong>Pro</strong></td>
                  <td>{t('proPrice')}</td>
                  <td>{t('proCredits')}</td>
                  <td>{t('proQuotas')}</td>
                  <td>{t('proIncludes')}</td>
                </tr>
                <tr>
                  <td><strong>Max</strong></td>
                  <td>{t('maxPrice')}</td>
                  <td>{t('maxCredits')}</td>
                  <td>{t('maxQuotas')}</td>
                  <td>{t('maxIncludes')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>{t('refillsTitle')}</h2>
          <ul>
            <li>{t('refillFree')}</li>
            <li>{t('refillPro')}</li>
            <li>{t('refillMax')}</li>
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
