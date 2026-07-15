'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'

const steps = [
  ['Providers', 'AI provider', '/providers'],
  ['Setup', 'Your profile', '/setup'],
  ['Scrape', 'Find jobs', '/scrape'],
  ['Rank', 'Evaluate fit', '/rank'],
  ['Apply', 'CV + letter', '/apply'],
  ['Interview', 'Prepare', '/interview'],
  ['Outcome', 'Track progress', '/outcome'],
]

const extras = [
  ['Expand', 'Discover skills', '/expand'],
  ['Upskill', 'Skill gaps', '/upskill'],
]

export default function StepSidebar({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: number[]
}) {
  const router = useRouter()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleReset = async () => {
    try {
      // Call backend API to delete all tracked pipeline data
      const res = await apiFetch<{ status: string; total_deleted: number; message: string }>('/api/v1/pipeline-reset/', {
        method: 'DELETE',
      })
      showSuccess(res.message || `Pipeline reset — ${res.total_deleted} records deleted`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reset pipeline data')
    }

    // Clear frontend-local progress (keeps auth + accessibility settings)
    localStorage.removeItem('completed_steps')
    localStorage.removeItem('ranking_job_id')
    setShowResetConfirm(false)
    router.push('/providers')
  }

  return (
    <aside className="w-full border-b bg-white px-5 py-5 md:min-h-screen md:w-72 md:border-b-0 md:border-r md:px-6 md:py-8 md:flex md:flex-col">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#707070]">
          Career OS
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#1d1d1f]">
          Job pipeline
        </h1>
      </div>

      {/* Steps nav */}
      <nav className="space-y-1 flex-1">
        {steps.map(([label, sub, href], i) => {
          const done = completedSteps.includes(i)
          const active = i === currentStep
          const enabled = done || i <= currentStep

          return enabled ? (
            <Link
              key={href}
              href={href}
              data-cuelume-press
              className={`flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                active
                  ? 'bg-[#f4f8fb] text-[#1d1d1f]'
                  : 'text-[#707070] hover:bg-[#f5f5f7]'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                  done
                    ? 'border-[#2997ff] text-[#0066cc]'
                    : active
                    ? 'border-[#1d1d1f]'
                    : 'border-[#d2d2d7]'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-[#858585]">{sub}</span>
              </span>
            </Link>
          ) : (
            <div
              key={href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#b0b0b0]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e2e2e5] text-xs">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm">{label}</span>
                <span className="block text-xs">{sub}</span>
              </span>
            </div>
          )
        })}
      </nav>

      {/* Extras */}
      <div className="mt-4 mb-2 px-3">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b0b0b0]">Extras</p>
      </div>
      <nav className="space-y-1">
        {extras.map(([label, sub, href]) => {
          const active = href === `/expand`
          return (
            <Link
              key={href}
              href={href}
              data-cuelume-press
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                active
                  ? 'bg-[#f4f8fb] text-[#1d1d1f]'
                  : 'text-[#707070] hover:bg-[#f5f5f7]'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-[#b0b0b0]">+</span>
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-[11px] text-[#858585]">{sub}</span>
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Reset Pipeline ──────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t border-[#e2e2e5]">
        {showResetConfirm ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-2">
            <p className="text-[12px] text-rose-700 leading-snug">
              ¿Estás seguro? Se borrará todo el progreso del pipeline.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                data-cuelume-press
                className="flex-1 rounded-full bg-rose-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-rose-600 transition-colors"
              >
                Sí, reiniciar
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            data-cuelume-press
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#e2e2e5] px-3 py-2.5 text-[11px] font-medium text-[#858585] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Reiniciar pipeline
          </button>
        )}
      </div>
    </aside>
  )
}
