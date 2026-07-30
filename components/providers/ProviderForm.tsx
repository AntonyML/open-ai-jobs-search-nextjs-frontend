'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'

const MASKED_KEY = '__MASKED__'

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  nvidia_nim: 'NVIDIA NIM',
}

interface ProviderFormProps {
  premium: boolean
  provider: string
  form: { api_key: string; api_base: string; model: string }
  onProviderChange: (p: string) => void
  onFormChange: (form: { api_key: string; api_base: string; model: string }) => void
  onSave: (e: React.FormEvent) => void
  saveError: string
  onUpgrade: () => void
  editingProvider?: { provider: string; api_base?: string | null; model?: string | null; has_key?: boolean } | null
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
  editingProvider,
}: ProviderFormProps) {
  const t = useTranslations('providers')
  const tc = useTranslations('common')

  function validateApiKey(provider: string, key: string): string | null {
    if (key === MASKED_KEY) return null
    if (provider === 'lm_studio' || provider === 'ollama') return null
    const trimmed = key.trim()
    if (trimmed.length < 10) {
      return t('apiKeyTooShort')
    }
    const prefixes: Record<string, string> = {
      openai: 'sk-',
      anthropic: 'sk-ant-',
      nvidia_nim: 'nvapi-',
    }
    const expected = prefixes[provider]
    if (expected && !trimmed.startsWith(expected)) {
      return t('invalidKeyFormat', { provider, prefix: expected })
    }
    return null
  }

  function sanitizeApiError(msg: string): string {
    if (/401|incorrect|invalid.*key/i.test(msg)) {
      return t('connectionFailed')
    }
    return msg
  }

  const [models, setModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const [changingKey, setChangingKey] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  const isEditing = editingProvider?.provider === provider && form.api_key === MASKED_KEY

  useEffect(() => {
    setModels([])
    setTested(false)
    setChangingKey(false)
    setModelSearch('')
  }, [provider])

  useEffect(() => {
    if (isEditing) {
      loadModels()
    }
  }, [isEditing, provider])

  async function loadModels() {
    if (isEditing && !changingKey) {
      // Use stored credentials via GET endpoint
      setLoadingModels(true)
      try {
        const x = await apiFetch<any>(`/api/v1/providers/${provider}/models`, {
          method: 'GET',
        })
        setModels(x.models || [])
        setTested(false)
        showSuccess(t('modelsLoaded', { count: (x.models || []).length }))
      } catch (e) {
        setModels([])
        const msg = e instanceof Error ? e.message : t('couldNotLoadModels')
        showError(sanitizeApiError(msg))
      } finally {
        setLoadingModels(false)
      }
      return
    }
    if (!form.api_key.trim() && provider !== 'lm_studio' && provider !== 'ollama') {
      showError(t('apiKeyRequired'))
      return
    }
    if (!form.api_base.trim() && (provider === 'lm_studio' || provider === 'ollama')) {
      showError(t('apiBaseRequired'))
      return
    }
    const keyError = validateApiKey(provider, form.api_key)
    if (keyError) {
      showError(keyError)
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
      showSuccess(t('modelsLoaded', { count: (x.models || []).length }))
    } catch (e) {
      setModels([])
      const msg = e instanceof Error ? e.message : t('couldNotLoadModels')
      showError(sanitizeApiError(msg))
    } finally {
      setLoadingModels(false)
    }
  }

  async function testProvider() {
    // Build payload: if __MASKED__, the backend will use the stored encrypted key
    // Filter empty values to avoid Pydantic HttpUrl validation failures
    const testPayload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, value]) => value.trim() !== '')
    )

    if (form.api_key !== MASKED_KEY) {
      const keyError = validateApiKey(provider, form.api_key)
      if (keyError) {
        showError(keyError)
        return
      }
    }

    setTesting(true)
    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 35000)
      const x = await apiFetch<any>('/api/v1/providers/test', {
        method: 'POST',
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      })
      window.clearTimeout(timeout)
      setTested(true)
      showSuccess(t('testOk', { provider: x.provider, model: x.model }))
    } catch (e) {
      setTested(false)
      const raw =
        e instanceof DOMException && e.name === 'AbortError'
          ? t('providerTimeout')
          : e instanceof Error
            ? e.message
            : t('testFailed')
      showError(sanitizeApiError(raw))
    } finally {
      setTesting(false)
    }
  }

  function handleKeyChange(value: string) {
    if (isEditing && !changingKey) {
      return
    }
    onFormChange({ ...form, api_key: value })
  }

  function startKeyChange() {
    setChangingKey(true)
    onFormChange({ ...form, api_key: '' })
  }

  function cancelEdit() {
    setChangingKey(false)
    onFormChange({ ...form, api_key: MASKED_KEY })
  }

  return (
    <form onSubmit={onSave} className="card space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('providerConfig') || 'Provider'}</p>
          <p className="mt-0.5 text-[11px] text-[#707070] leading-relaxed">{t('providerDesc') || 'Conecta un proveedor de IA para alimentar cada etapa del pipeline'}</p>
        </div>
      </div>

      {/* Provider Select */}
      <select
        className="field"
        value={provider}
        onChange={(e) => onProviderChange(e.target.value)}
        disabled={!!editingProvider}
      >
          {['anthropic', 'openai', 'nvidia_nim']
            .filter((x) => premium || x !== 'nvidia_nim')
            .map((x) => (
              <option key={x} value={x}>{PROVIDER_LABELS[x] || x}</option>
            ))}
      </select>

      {/* Premium lock for NVIDIA */}
      {!premium && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="flex-1 text-xs text-amber-700">
            {t('nvidiaLocked') || 'NVIDIA NIM is only available on Premium'}
          </span>
          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 text-xs font-medium text-amber-700 underline-offset-2 hover:text-amber-800 hover:underline"
          >
            {t('upgrade') || 'Upgrade'}
          </button>
        </div>
      )}

      {/* API Key */}
      {isEditing && !changingKey ? (
        <div className="flex gap-2 items-center">
          <div className="field flex-1 flex items-center text-[#707070] select-none text-xs">
            {(prefixes[provider] || '') + '\u2022'.repeat(12)}
          </div>
          <button
            type="button"
            onClick={startKeyChange}
            className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
          >
            {t('replaceKey')}
          </button>
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
      ) : (
        <div className="flex gap-2">
          <input
            className="field flex-1"
            placeholder={t('apiKey')}
            value={form.api_key}
            onChange={(e) => handleKeyChange(e.target.value)}
          />
          {isEditing && changingKey && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
            >
              {t('cancel')}
            </button>
          )}
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
      )}

      {/* API Base */}
      <input
        className="field"
        placeholder={t('apiBase')}
        value={form.api_base}
        onChange={(e) => onFormChange({ ...form, api_base: e.target.value })}
      />

      {/* Model Select */}
      {models.length > 0 && (
        <div className="space-y-2">
          {models.length > 10 && (
            <input
              className="field"
              placeholder={t('searchModels') || 'Buscar modelo…'}
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
            />
          )}
          <div className="max-h-48 overflow-y-auto">
            {models
              .filter((m) => !modelSearch || m.id.toLowerCase().includes(modelSearch.toLowerCase()))
              .map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    form.model === m.id
                      ? 'bg-[#0071e3]/10 text-[#0071e3] font-medium'
                      : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={form.model === m.id}
                    onChange={(e) => {
                      onFormChange({ ...form, model: e.target.value })
                      setTested(false)
                    }}
                    className="accent-[#0071e3]"
                  />
                  {m.id}
                </label>
              ))}
            {models.filter((m) => !modelSearch || m.id.toLowerCase().includes(modelSearch.toLowerCase())).length ===
              0 && (
              <p className="px-3 py-2 text-xs text-[#707070]">{tc('noResults')}</p>
            )}
          </div>
        </div>
      )}

      {/* Test Provider — visible always when model selected */}
      {form.model && (
        <AppleButton
          type="button"
          variant="secondary"
          className="w-full"
          disabled={testing}
          loading={testing}
          onClick={testProvider}
        >
          {testing
            ? t('testing')
            : tested
              ? t('testOkSimple') || '✓ Test OK'
              : t('testProvider')}
        </AppleButton>
      )}

      {/* Save Provider — always visible, disabled until test passes */}
      <AppleButton
        type="submit"
        className="w-full"
        disabled={!tested}
      >
        {isEditing ? t('saveChanges') : t('saveProvider')}
      </AppleButton>

      {/* Inline error with upgrade CTA */}
      {saveError && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-700">{saveError}</p>
          <button
            type="button"
            onClick={onUpgrade}
            className="text-xs font-medium text-amber-700 underline-offset-2 hover:text-amber-800 hover:underline"
          >
            {t('upgrade')}
          </button>
        </div>
      )}
    </form>
  )
}
