'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'
import { setCompletedSteps, isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'

export default function Providers() {
  const t = useTranslations('providers')
  const tc = useTranslations('common')
  const [catalog, setCatalog] = useState<any[]>([])
  const [myProviders, setMyProviders] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [provider, setProvider] = useState('openai')
  const [form, setForm] = useState({ api_key: '', api_base: '', model: '' })
  // msg state replaced by toast notifications
  const [models, setModels] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [tested, setTested] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const router = useRouter()
  const premium = isPremium()

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
      showError('API key is required before loading models')
      return
    }
    if (!form.api_base.trim() && (provider === 'lm_studio' || provider === 'ollama')) {
      showError('API base is required before loading models')
      return
    }
    setLoadingModels(true)
    try {
      const modelPayload = Object.fromEntries(Object.entries({ provider, ...form }).filter(([, value]) => value.trim() !== ''))
      const x = await apiFetch<any>(`/api/v1/providers/${provider}/models`, { method: 'POST', body: JSON.stringify(modelPayload) })
      setModels(x.models || [])
      setTested(false)
      showSuccess(`${(x.models || []).length} models loaded`)
    } catch (e) {
      setModels([])
      const msg = e instanceof Error ? e.message : 'Could not load models'
      showError(msg)
    } finally {
      setLoadingModels(false)
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    if (!form.model.trim()) {
      showError('Choose or enter a model before saving')
      return
    }
    if ((provider === 'lm_studio' || provider === 'ollama') && !form.api_base.trim()) {
      showError('API base is required for this provider')
      return
    }
    const payload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    try {
      await apiFetch('/api/v1/providers/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Test failed'
      showError(msg)
      return
    }
    try {
      await apiFetch('/api/v1/providers/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save provider'
      showError(msg)
      setSaveError(msg)
      return
    }
    const updated = await apiFetch<any>('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider }),
    })
    setActive(updated)
    setSaveError('')
    showSuccess(`Provider saved: ${updated.provider} / ${updated.model}`)
    loadMyProviders()
  }

  async function activate(p: string) {
    await apiFetch('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider: p }),
    })
    const updated = await apiFetch<any>('/api/v1/providers/me/active')
    setActive(updated)
    setCompletedSteps([0])
  }

  async function remove(p: string) {
    await apiFetch(`/api/v1/providers/${p}`, { method: 'DELETE' })
    if (active?.provider === p) {
      setActive(null)
    }
    showSuccess(`Provider deleted: ${p}`)
    loadMyProviders()
  }

  const isConfigured = (p: string) => myProviders.some((c) => c.provider === p)

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">01 / CONFIGURE</p>
      <h2 className="title">{t('title')}</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={add} className="card space-y-4">
          <select className="field" value={provider} onChange={(e) => setProvider(e.target.value)}>
            {/* lm_studio and ollama are commented out for now */}
            {['anthropic', 'openai', 'nvidia_nim' /*, 'lm_studio', 'ollama' */]
              .filter((x) => premium || x !== 'nvidia_nim')
              .map((x) => (
                <option key={x}>{x}</option>
              ))}
          </select>
          {!premium && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs text-amber-400/80 flex-1">
                {t('nvidiaLocked') || 'NVIDIA NIM is only available on Premium'}
              </span>
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
              >
                {t('upgrade') || 'Upgrade'}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder={t('apiKey')}
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={loadModels} disabled={loadingModels}>
              {loadingModels ? t('loadingModels') : t('loadModels')}
            </button>
          </div>
          <input
            className="field"
            placeholder={t('apiBase')}
            value={form.api_base}
            onChange={(e) => setForm({ ...form, api_base: e.target.value })}
          />
          {models.length > 0 && <select className="field" value={form.model} onChange={(e) => { setForm({ ...form, model: e.target.value }); setTested(false) }}>
            <option value="">{t('chooseModel')}</option>{models.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>}
          {form.model && <button type="button" className="btn-secondary w-full" disabled={testing} onClick={async () => {
            setTesting(true)
            try {
              const testPayload = Object.fromEntries(Object.entries({ provider, ...form }).filter(([, value]) => value.trim() !== ''))
              const controller = new AbortController()
              const timeout = window.setTimeout(() => controller.abort(), 35000)
              const x = await apiFetch<any>('/api/v1/providers/test', { method: 'POST', body: JSON.stringify(testPayload), signal: controller.signal }); window.clearTimeout(timeout); setTested(true); showSuccess(`Test OK: ${x.provider} / ${x.model}`)
            }
            catch (e) { setTested(false); const msg = e instanceof DOMException && e.name === 'AbortError' ? 'Provider timeout (35s)' : e instanceof Error ? e.message : 'Test failed'; showError(msg) }
            finally { setTesting(false) }
          }}>{testing ? t('testing') : t('testProvider')}</button>}
          {tested && <button className="btn-primary w-full">{t('saveProvider')}</button>}

          {/* Inline error con upgrade CTA */}
          {saveError && (
            <div className="rounded-lg border border-amber-200/30 bg-amber-50/10 px-4 py-3 space-y-2">
              <p className="text-xs text-amber-400/90 leading-relaxed">{saveError}</p>
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
              >
                {t('upgrade')}
              </button>
            </div>
          )}
        </form>

        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-slate-400">{t('activeProvider')}</p>
            <p className="mt-2 text-xl font-bold text-white">
              {active?.provider || t('notConfigured')}
            </p>
          </div>

          <div className="card">
            <p className="mb-3 text-sm text-slate-400">{t('yourProviders')}</p>
            {myProviders.length === 0 && (
              <p className="text-sm text-slate-500">{t('noneSaved')}</p>
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
                      {t('setActive')}
                    </button>
                  )}
                  <button
                    onClick={() => remove(p.provider)}
                    className="btn-secondary text-xs py-1 px-3 text-rose-400"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
            {!premium && myProviders.length >= 1 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50/10 border border-amber-200/20 px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-xs text-amber-400/80 flex-1">
                  {t('maxProvidersReached') || 'Max 1 provider on Free. Upgrade for more.'}
                </span>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline shrink-0"
                >
                  {t('upgrade') || 'Upgrade'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <p className="mb-3 text-sm text-slate-400">{t('availableCatalog')}</p>
            {catalog.map((x, i) => (
              <div key={i} className="border-b border-slate-800 py-2 text-sm text-slate-300">
                {x.name || x.provider || x}
              </div>
            ))}
          </div>

          {isConfigured(provider) && active?.provider !== provider && (
            <button onClick={() => activate(provider)} className="btn-secondary w-full">
              {t('setProviderActive', { provider })}
            </button>
          )}

          {active?.has_credential && (
            <button onClick={() => router.push('/setup')} className="btn-primary w-full">
              {t('continueSetup')}
            </button>
          )}
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
