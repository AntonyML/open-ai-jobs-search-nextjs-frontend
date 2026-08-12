import { getTranslations } from 'next-intl/server'

/**
 * Decorative CV preview for the hero (pure CSS — no real PDF).
 *
 * The floating chips name the documents the app actually produces (no invented
 * metrics), and the card tilts gently, straightening on hover. Reduced-motion
 * users get a static version automatically (global reduced-motion override).
 */
export default async function HeroMockCv() {
  const t = await getTranslations('marketing')

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Floating capability chips */}
      <div className="absolute -left-4 top-8 hidden animate-float rounded-full border border-[#d2d2d7] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur sm:block lg:-left-8">
        <span aria-hidden="true" className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
          ✓
        </span>
        {t('heroBadgeCvAdapted')}
      </div>

      <div className="absolute -right-4 top-1/3 hidden animate-float-delayed rounded-full border border-[#d2d2d7] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur sm:block lg:-right-8">
        <span aria-hidden="true" className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
          ✓
        </span>
        {t('heroBadgeCoverLetter')}
      </div>

      <div className="absolute -bottom-4 left-10 hidden animate-float-slow rounded-full border border-[#d2d2d7] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur sm:block">
        <span aria-hidden="true" className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
          ✓
        </span>
        {t('heroBadgeInterview')}
      </div>

      {/* Card */}
      <div className="-rotate-1 rounded-2xl border border-[#d2d2d7] bg-white p-6 text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:rotate-0 sm:-rotate-2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#0a84ff] text-[13px] font-semibold text-white">
            JD
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Jane Doe</p>
            <p className="text-[12px] text-[#707070]">Senior Software Engineer</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-2 w-full rounded-full bg-[#e8f0fe]" />
          <div className="h-2 w-4/5 rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-full rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-3/5 rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-5/6 rounded-full bg-[#f5f5f7]" />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-[#f4f8fb] px-3 py-2">
          <span className="flex items-center gap-2 text-[11px] font-medium text-[#1d1d1f]">
            <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
              ✓
            </span>
            {t('heroBadgeAts')}
          </span>
        </div>
      </div>
    </div>
  )
}
