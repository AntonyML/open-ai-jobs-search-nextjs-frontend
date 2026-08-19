import { getTranslations } from 'next-intl/server'

/**
 * Product facts, not marketing numbers — every stat is real and verifiable in
 * the product (no invented or inflated claims).
 *
 * Mobile keeps the three stats in one horizontal row (compact type, clamped
 * captions) so the hero doesn't grow taller than the viewport on phones.
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
      <div className="mx-auto grid max-w-[1440px] grid-cols-3 gap-3 px-5 py-5 md:gap-0 md:divide-x md:divide-[#d2d2d7]/60 md:px-8 md:py-8">
        {STATS.map((s) => (
          <div key={s.key} className="text-center">
            <p className="bg-gradient-to-b from-[#0071e3] to-[#0a84ff] bg-clip-text text-[24px] font-semibold leading-none tracking-tight text-transparent md:text-[44px]">
              {s.value}
            </p>
            <p className="mx-auto mt-1.5 max-w-[250px] text-[10.5px] font-light leading-snug text-[#707070] line-clamp-3 md:mt-2 md:text-[13px] md:line-clamp-none">
              {t(s.key)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
