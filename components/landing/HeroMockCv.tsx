import { getTranslations } from 'next-intl/server'

const CHIPS = ['heroBadgeCvAdapted', 'heroBadgeCoverLetter', 'heroBadgeInterview'] as const

const FLOAT_CLASSES = ['animate-float', 'animate-float-delayed', 'animate-float-slow']

/**
 * Decorative CV preview for the hero (pure CSS — no real PDF).
 *
 * Layout notes (these were previous bugs):
 * - The capability chips live in normal flow BELOW the card — never absolutely
 *   positioned over it, so nothing overlaps the card content and nothing gets
 *   clipped by the section's `overflow-hidden`.
 * - The card has NO rotation: CSS transforms blur text on Chromium and a
 *   hover straighten causes flicker. The chips still float gently in place.
 * - Reduced-motion users get a static version (global reduced-motion override).
 */
export default async function HeroMockCv() {
  const t = await getTranslations('marketing')

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#0a84ff] text-[13px] font-semibold text-white">
            JD
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Jane Doe</p>
            <p className="text-[12px] text-[#707070]">Senior Software Engineer</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="h-2 w-full rounded-full bg-[#e8f0fe]" />
          <div className="h-2 w-4/5 rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-full rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-3/5 rounded-full bg-[#f5f5f7]" />
          <div className="h-1.5 w-5/6 rounded-full bg-[#f5f5f7]" />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f4f8fb] px-3 py-2">
          <span className="flex items-center gap-2 text-[11px] font-medium text-[#1d1d1f]">
            <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
              ✓
            </span>
            {t('heroBadgeAts')}
          </span>
        </div>
      </div>

      {/* Capability chips — in normal flow below the card (no overlap, no clipping) */}
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {CHIPS.map((key, i) => (
          <li
            key={key}
            className={`rounded-full border border-[#d2d2d7] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur ${FLOAT_CLASSES[i]}`}
          >
            <span aria-hidden="true" className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
              ✓
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  )
}
