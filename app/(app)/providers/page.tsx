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
  const [models, setModels] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [tested, setTested] = useState(false)
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

  useEffect(() => {
    setModels([])
  }, [provider])

  async function loadModels() {
    if (!form.api_key.trim() && provider !== 'lm_studio' && provider !== 'ollama') {
      setMsg('API key is required before loading models')
      return
    }
    if (!form.api_base.trim() && (provider === 'lm_studio' || provider === 'ollama')) {
      setMsg('API base is required before loading models')
      return
    }
    setLoadingModels(true)
    try {
      const x = await apiFetch<any>(`/api/v1/providers/${provider}/models`, { method: 'POST', body: JSON.stringify({ provider, ...form }) })
      setModels(x.models || [])
      setTested(false)
      setMsg(`${(x.models || []).length} models loaded`)
    } catch (e) {
      setModels([])
      setMsg(e instanceof Error ? `Could not load models: ${e.message}` : 'Could not load models')
    } finally {
      setLoadingModels(false)
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model.trim()) {
      setMsg('Choose or enter a model before saving')
      return
    }
    if ((provider === 'lm_studio' || provider === 'ollama') && !form.api_base.trim()) {
      setMsg('API base is required for this provider')
      return
    }
    const payload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    setMsg('Testing provider…')
    await apiFetch('/api/v1/providers/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await apiFetch('/api/v1/providers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const updated = await apiFetch<any>('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider }),
    })
    setActive(updated)
    setMsg(`Provider saved and active: ${updated.provider} / ${updated.model}`)
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

  async function remove(p: string) {
    await apiFetch(`/api/v1/providers/${p}`, { method: 'DELETE' })
    if (active?.provider === p) {
      setActive(null)
    }
    setMsg(`Provider deleted: ${p}`)
    loadMyProviders()
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
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="API key"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={loadModels} disabled={loadingModels}>
              {loadingModels ? 'Loading…' : 'Load models'}
            </button>
          </div>
          <input
            className="field"
            placeholder="API base (optional)"
            value={form.api_base}
            onChange={(e) => setForm({ ...form, api_base: e.target.value })}
          />
          {models.length > 0 && <select className="field" value={form.model} onChange={(e) => { setForm({ ...form, model: e.target.value }); setTested(false) }}>
            <option value="">Choose model</option>{models.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>}
          {form.model && <button type="button" className="btn-secondary w-full" disabled={testing} onClick={async () => {
            setTesting(true)
            try { const x = await apiFetch<any>('/api/v1/providers/test', { method: 'POST', body: JSON.stringify({ provider, ...form }) }); setTested(true); setMsg(`Test OK: ${x.provider} / ${x.model}`) }
            catch (e) { setTested(false); setMsg(e instanceof Error ? `Test failed: ${e.message}` : 'Test failed') }
            finally { setTesting(false) }
          }}>{testing ? 'Testing…' : 'Test active provider'}</button>}
          {tested && <button className="btn-primary w-full">Save provider</button>}
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
                <div className="flex gap-2">
                  {!p.is_active && (
                    <button
                      onClick={() => activate(p.provider)}
                      className="btn-secondary text-xs py-1 px-3"
                    >
                      Set active
                    </button>
                  )}
                  <button
                    onClick={() => remove(p.provider)}
                    className="btn-secondary text-xs py-1 px-3 text-rose-400"
                  >
                    Delete
                  </button>
                </div>
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
