'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function LLMControlCenter() {
  const [state, setState] = useState<any>(null)
  const [active, setActive] = useState<any>(null)
  useEffect(() => {
    apiFetch<any>('/api/v1/providers/me/active').then(setActive).catch(() => setActive(null))
    const id = localStorage.getItem('ranking_job_id')
    if (!id) return
    const poll = () => apiFetch<any>(`/api/v1/rank/status/${id}`).then(setState).catch(() => {})
    poll(); const timer = window.setInterval(poll, 2000)
    return () => window.clearInterval(timer)
  }, [])
  return <aside className="sticky top-6 hidden h-fit w-72 shrink-0 rounded-3xl border border-slate-800 bg-slate-900 p-5 lg:block">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">LLM STATUS</p>
    <p className="mt-4 text-sm text-slate-400">Provider</p>
    <p className="text-lg font-semibold text-white">{active?.has_credential ? active.provider : 'None configured'}</p>
    <p className="mt-3 text-sm text-slate-400">Model</p>
    <p className="text-sm text-white">{active?.has_credential ? active.model : '—'}</p>
    <p className="mt-3 text-sm text-slate-400">Status</p>
    <p className="text-lg font-semibold text-white">{!active?.has_credential ? '⚪ Not configured' : state?.status === 'running' ? '🟢 Working' : state?.status === 'failed' ? '🔴 Failed' : '🟢 Ready'}</p>
    {state?.error && <p className="mt-3 break-words text-xs text-rose-400">{state.error}</p>}
    {state?.started_at && <p className="mt-3 text-xs text-slate-500">Ranking job active. This panel updates automatically.</p>}
  </aside>
}
