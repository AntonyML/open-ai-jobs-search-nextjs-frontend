import { getTranslations } from 'next-intl/server'

/** Product-derived stats (values are product facts, labels are i18n). */
const STATS = [
  { value: '5+', key: 'statProviders' },
  { value: '3', key: 'statDocs' },
  { value: '100%', key: 'statPrivacy' },
  { value: '24/7', key: 'statUptime' },
]

export async function StatsStrip() {
  const t = await getTranslations('marketing')

  return (
    <section className="border-t border-[#d2d2d7] bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-y-10 px-5 py-14 md:grid-cols-4 md:px-8">
        {STATS.map((s) => (
          <div key={s.key} className="text-center">
            <p className="bg-gradient-to-b from-[#0071e3] to-[#0a84ff] bg-clip-text text-[40px] font-semibold tracking-tight text-transparent md:text-[48px]">
              {s.value}
            </p>
            <p className="mx-auto mt-2 max-w-[210px] text-[13px] font-light leading-snug text-[#707070]">
              {t(s.key)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
