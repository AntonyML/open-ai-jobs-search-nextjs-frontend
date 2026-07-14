'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Providers() {
  const [catalog, setCatalog] = useState<any[]>([])
  const [myProviders, setMyProviders] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [provider, setProvider] = useState('openai')
  const [form, setForm] = useState({ api_key: '', api_base: '', model: '' })
  const [msg, setMsg] = useState('')
  const router = useRouter()

  function loadMyProviders() {
    apiFetch<any[]>('/api/v1/providers/me')
      .then((x) => setMyProviders(Array.isArray(x) ? x : []))
      .catch(() => {})
  }

  useEffect(() => {
    apiFetch<any>('/api/v1/providers/')
      .then((x) => setCatalog(Array.isArray(x) ? x : x.providers || []))
      .catch(() => {})
    apiFetch<any>('/api/v1/providers/me/active')
      .then(setActive)
      .catch(() => {})
    loadMyProviders()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const payload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    await apiFetch('/api/v1/providers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setMsg('Provider saved')
    loadMyProviders()
  }

  async function activate(p: string) {
    await apiFetch('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider: p }),
    })
    const updated = await apiFetch<any>('/api/v1/providers/me/active')
    setActive(updated)
    localStorage.setItem('completed_steps', '[0]')
  }

  const isConfigured = (p: string) => myProviders.some((c) => c.provider === p)

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">01 / CONFIGURE</p>
      <h2 className="title">Choose your AI provider</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={add} className="card space-y-4">
          <select className="field" value={provider} onChange={(e) => setProvider(e.target.value)}>
            {['anthropic', 'openai', 'nvidia_nim', 'lm_studio', 'ollama'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input
            className="field"
            placeholder="API key"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          />
          <input
            className="field"
            placeholder="API base (optional)"
            value={form.api_base}
            onChange={(e) => setForm({ ...form, api_base: e.target.value })}
          />
          <input
            className="field"
            placeholder="Model (optional)"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
          <button className="btn-primary w-full">Save provider</button>
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        </form>

        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-slate-400">Active provider</p>
            <p className="mt-2 text-xl font-bold text-white">
              {active?.provider || 'Not configured'}
            </p>
          </div>

          <div className="card">
            <p className="mb-3 text-sm text-slate-400">Your configured providers</p>
            {myProviders.length === 0 && (
              <p className="text-sm text-slate-500">None saved yet</p>
            )}
            {myProviders.map((p, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-800 py-2">
                <span className="text-sm text-slate-300">
                  {p.provider}
                  {p.is_active && <span className="ml-2 text-xs text-emerald-400">(active)</span>}
                </span>
                {!p.is_active && (
                  <button
                    onClick={() => activate(p.provider)}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Set active
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <p className="mb-3 text-sm text-slate-400">Available catalog</p>
            {catalog.map((x, i) => (
              <div key={i} className="border-b border-slate-800 py-2 text-sm text-slate-300">
                {x.name || x.provider || x}
              </div>
            ))}
          </div>

          {isConfigured(provider) && active?.provider !== provider && (
            <button onClick={() => activate(provider)} className="btn-secondary w-full">
              Set {provider} as active
            </button>
          )}

          {active?.provider && (
            <button onClick={() => router.push('/setup')} className="btn-primary w-full">
              Continue to Setup →
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
