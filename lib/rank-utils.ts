/** Shared styling utilities for the rank page */

export function scoreColor(s: number): string {
  return s >= 75 ? 'bg-emerald-400' : s >= 50 ? 'bg-[#2997ff]' : s >= 25 ? 'bg-amber-400' : 'bg-rose-400'
}

export function scoreTextColor(s: number): string {
  return s >= 75 ? 'text-emerald-700 bg-emerald-100' : s >= 50 ? 'text-[#0066cc] bg-[#f4f8fb]' : s >= 25 ? 'text-amber-700 bg-amber-100' : 'text-rose-700 bg-rose-100'
}
