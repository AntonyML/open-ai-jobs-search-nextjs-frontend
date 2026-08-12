/**
 * Static, decorative CV preview used in the hero (pure CSS — no real PDF).
 * Kept language-neutral (iconographic bars) so it works in EN and ES.
 */
export default function HeroMockCv() {
  return (
    <div className="mx-auto mt-14 w-full max-w-md rounded-2xl border border-[#d2d2d7] bg-white p-6 text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
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
        <span className="text-[11px] font-medium text-[#1d1d1f]">ATS readiness</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          98%
        </span>
      </div>
    </div>
  )
}
