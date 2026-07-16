'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'

interface ProviderFormProps {
  premium: boolean
  provider: string
  form: { api_key: string; api_base: string; model: string }
  onProviderChange: (p: string) => void
  onFormChange: (form: { api_key: string; api_base: string; model: string }) => void
  onSave: (e: React.FormEvent) => void
  saveError: string
  onUpgrade: () => void
}

export function ProviderForm({
  premium,
  provider,
  form,
  onProviderChange,
  onFormChange,
  onSave,
  saveError,
  onUpgrade,
}: ProviderFormProps) {
  const t = useTranslations('providers')
  const [models, setModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)

  useEffect(() => {
    setModels([])
    setTested(false)
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
      const modelPayload = Object.fromEntries(
        Object.entries({ provider, ...form }).filter(([, value]) => value.trim() !== '')
      )
      const x = await apiFetch<any>(`/api/v1/providers/${provider}/models`, {
        method: 'POST',
        body: JSON.stringify(modelPayload),
      })
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

  async function testProvider() {
    setTesting(true)
    try {
      const testPayload = Object.fromEntries(
        Object.entries({ provider, ...form }).filter(([, value]) => value.trim() !== '')
      )
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 35000)
      const x = await apiFetch<any>('/api/v1/providers/test', {
        method: 'POST',
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      })
      window.clearTimeout(timeout)
      setTested(true)
      showSuccess(`Test OK: ${x.provider} / ${x.model}`)
    } catch (e) {
      setTested(false)
      const msg =
        e instanceof DOMException && e.name === 'AbortError'
          ? 'Provider timeout (35s)'
          : e instanceof Error
            ? e.message
            : 'Test failed'
      showError(msg)
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={onSave} className="card space-y-4">
      {/* Provider Select */}
      <select
        className="field"
        value={provider}
        onChange={(e) => onProviderChange(e.target.value)}
      >
        {['anthropic', 'openai', 'nvidia_nim' /*, 'lm_studio', 'ollama' */]
          .filter((x) => premium || x !== 'nvidia_nim')
          .map((x) => (
            <option key={x}>{x}</option>
          ))}
      </select>

      {/* Premium lock for NVIDIA */}
      {!premium && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-50/10 px-3 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="flex-1 text-xs text-amber-400/80">
            {t('nvidiaLocked') || 'NVIDIA NIM is only available on Premium'}
          </span>
          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 text-xs font-medium text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}

      {/* API Key + Load Models */}
      <div className="flex gap-2">
        <input
          className="field flex-1"
          placeholder={t('apiKey')}
          value={form.api_key}
          onChange={(e) => onFormChange({ ...form, api_key: e.target.value })}
        />
        <AppleButton
          type="button"
          variant="secondary"
          className="shrink-0"
          loading={loadingModels}
          onClick={loadModels}
        >
          {loadingModels ? t('loadingModels') : t('loadModels')}
        </AppleButton>
      </div>

      {/* API Base */}
      <input
        className="field"
        placeholder={t('apiBase')}
        value={form.api_base}
        onChange={(e) => onFormChange({ ...form, api_base: e.target.value })}
      />

      {/* Model Select */}
      {models.length > 0 && (
        <select
          className="field"
          value={form.model}
          onChange={(e) => {
            onFormChange({ ...form, model: e.target.value })
            setTested(false)
          }}
        >
          <option value="">{t('chooseModel')}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </select>
      )}

      {/* Test Provider */}
      {form.model && (
        <AppleButton
          type="button"
          variant="secondary"
          className="w-full"
          disabled={testing}
          loading={testing}
          onClick={testProvider}
        >
          {testing ? t('testing') : t('testProvider')}
        </AppleButton>
      )}

      {/* Save Provider */}
      {tested && (
        <AppleButton type="submit" className="w-full">
          {t('saveProvider')}
        </AppleButton>
      )}

      {/* Inline error with upgrade CTA */}
      {saveError && (
        <div className="space-y-2 rounded-lg border border-amber-200/30 bg-amber-50/10 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-400/90">{saveError}</p>
          <button
            type="button"
            onClick={onUpgrade}
            className="text-xs font-medium text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
          >
            {t('upgrade')}
          </button>
        </div>
      )}
    </form>
  )
}
