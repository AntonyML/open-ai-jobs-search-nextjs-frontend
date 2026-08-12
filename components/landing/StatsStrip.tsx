import { getTranslations } from 'next-intl/server'

/**
 * Product facts, not marketing numbers — every stat is real and verifiable in
 * the product (no invented or inflated claims).
 */
const STATS = [
  { value: '5', key: 'statProviders' },
  { value: '3', key: 'statDocs' },
  { value: '0', key: 'statZeroTemplates' },
]

export async function StatsStrip() {
  const t = await getTranslations('marketing')

  return (
    <div className="shrink-0 border-t border-[#d2d2d7]/60">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 py-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[#d2d2d7]/60 md:px-8">
        {STATS.map((s) => (
          <div key={s.key} className="text-center">
            <p className="bg-gradient-to-b from-[#0071e3] to-[#0a84ff] bg-clip-text text-[36px] font-semibold tracking-tight text-transparent md:text-[44px]">
              {s.value}
            </p>
            <p className="mx-auto mt-2 max-w-[250px] text-[13px] font-light leading-snug text-[#707070]">
              {t(s.key)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
