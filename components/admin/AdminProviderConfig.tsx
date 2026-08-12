'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Server,
  KeyRound,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import styles from './AdminProviderConfig.module.css'

const MASKED_KEY = '__MASKED__'

interface AdminConfig {
  provider: string | null
  display_name: string | null
  model: string | null
  api_base: string | null
  has_key: boolean
  last_status: string | null
  last_error: string | null
  last_checked_at: string | null
  updated_by: string | null
  updated_at: string | null
}

interface ProviderInfo {
  name: string
  display_name: string
  requires_api_key: boolean
  supports_custom_base: boolean
  default_model: string
  example_base_url: string | null
  static_models: string[] | null
}

/**
 * Admin-managed global LLM provider configuration.
 *
 * Reads/writes the singleton row via the /api/v1/admin/providers endpoints:
 * GET (current), PUT (save), POST /test (validate), DELETE (clear → .env fallback).
 */
export function AdminProviderConfig() {
  const t = useTranslations('admin')
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [catalog, setCatalog] = useState<ProviderInfo[]>([])
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; response?: string } | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cfg, cat] = await Promise.all([
        apiFetch<AdminConfig>('/api/v1/admin/providers').catch(() => null),
        apiFetch<ProviderInfo[]>('/api/v1/admin/providers/catalog').catch(() => []),
      ])
      const list = Array.isArray(cat) ? cat : []
      setCatalog(list)
      setConfig(cfg)
      if (cfg?.provider) {
        setProvider(cfg.provider)
        setModel(cfg.model || '')
        setApiBase(cfg.api_base || '')
        if (cfg.has_key) setApiKey(MASKED_KEY)
      } else if (list.length > 0) {
        setProvider(list[0].name)
        setModel(list[0].default_model)
      }
    } catch {
      setError(t('providerConfigLoadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const currentInfo = useMemo(
    () => catalog.find((p) => p.name === provider) || null,
    [catalog, provider]
  )

  // Load the model list for a provider (live fetch or static fallback).
  const loadModels = useCallback(async (providerName: string) => {
    if (!providerName) return
    setLoadingModels(true)
    const info = catalog.find((p) => p.name === providerName)
    try {
      const res = await apiFetch<{ models: Array<{ id: string }> }>(
        `/api/v1/admin/providers/${providerName}/models`,
        { method: 'POST', body: JSON.stringify({}) }
      )
      const ids = (res?.models ?? []).map((m) => m.id)
      if (ids.length > 0) {
        setModels(ids)
        // Keep current model if present in list, else fall back to first.
        setModel((prev) => (ids.includes(prev) ? prev : info?.static_models?.includes(prev) ? prev : ids[0]))
        showSuccess(t('providerConfigModelsLoaded', { count: ids.length }))
      } else {
        setModels(info?.static_models ?? [])
      }
    } catch {
      setModels(info?.static_models ?? [])
    } finally {
      setLoadingModels(false)
    }
  }, [catalog, t])

  // Auto-load models when the provider changes (or once the catalog arrives).
  useEffect(() => {
    if (provider) loadModels(provider)
  }, [provider, loadModels])

  function handleProviderChange(name: string) {
    setProvider(name)
    const info = catalog.find((p) => p.name === name)
    setModel(info?.default_model || '')
    setModels(info?.static_models ?? [])
    setApiBase(info?.example_base_url || '')
    // Never carry the masked key to a different provider — the stored key
    // belongs to the previously selected provider.
    setApiKey('')
    setTestResult(null)
    setError('')
  }

  async function save() {
    if (!provider) return
    setSaving(true)
    setError('')
    setTestResult(null)
    try {
      const payload: Record<string, string | null> = {
        provider,
        api_key: apiKey || (config?.has_key ? MASKED_KEY : ''),
        model: model || null,
        api_base: apiBase || null,
      }
      const res = await apiFetch<AdminConfig>('/api/v1/admin/providers', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setConfig(res)
      if (res.has_key && apiKey !== MASKED_KEY) setApiKey(MASKED_KEY)
      showSuccess(t('providerConfigSaved'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('providerConfigSaveError')
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    if (!provider) return
    setTesting(true)
    setTestResult(null)
    setError('')
    try {
      const payload: Record<string, string | null> = {
        provider,
        api_key: apiKey || (config?.has_key ? MASKED_KEY : ''),
        model: model || null,
        api_base: apiBase || null,
      }
      const res = await apiFetch<{ ok: boolean; error?: string; response?: string }>(
        '/api/v1/admin/providers/test',
        { method: 'POST', body: JSON.stringify(payload) }
      )
      setTestResult(res)
      if (res.ok) showSuccess(t('providerConfigTestOk'))
      else showError(res.error || t('providerConfigTestFail'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('providerConfigTestFail')
      setTestResult({ ok: false, error: msg })
      showError(msg)
    } finally {
      setTesting(false)
    }
  }

  async function clear() {
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch<AdminConfig>('/api/v1/admin/providers', { method: 'DELETE' })
      setConfig(res)
      setProvider(res.provider || catalog[0]?.name || '')
      setModel(res.model || catalog[0]?.default_model || '')
      setApiBase(res.api_base || catalog[0]?.example_base_url || '')
      setApiKey('')
      setTestResult(null)
      showSuccess(t('providerConfigCleared'))
    } catch (x: any) {
      const msg = x instanceof Error ? x.message : t('providerConfigSaveError')
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.stateStrip}>
          <div className={`${styles.shimmer} h-[64px]`} />
          <div className={`${styles.shimmer} h-[64px]`} />
          <div className={`${styles.shimmer} h-[64px]`} />
          <div className={`${styles.shimmer} h-[64px]`} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className="flex items-start gap-3 p-6 pb-0 sm:items-center">
        <span className={styles.iconWrap}>
          <Server size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={styles.cardTitle}>{t('providerConfigTitle')}</h3>
          <p className={styles.cardSubtitle}>{t('providerConfigDesc')}</p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* ── Current state strip ── */}
        <div className={styles.stateStrip}>
          <div className="min-w-0">
            <p className={styles.stateLabel}>{t('providerConfigProvider')}</p>
            <p className={styles.stateValue}>{config?.display_name || config?.provider || t('providerConfigNone')}</p>
          </div>
          <div className="min-w-0">
            <p className={styles.stateLabel}>{t('providerConfigModel')}</p>
            <p className={styles.stateValue}>{config?.model || '—'}</p>
          </div>
          <div className="min-w-0">
            <p className={styles.stateLabel}>{t('providerConfigKey')}</p>
            <p className={`${styles.stateValue} flex items-center gap-1`}>
              <KeyRound className="size-3.5 shrink-0 text-[#b0b0b0]" />
              <span className="min-w-0 overflow-hidden text-ellipsis">
                {config?.has_key ? t('providerConfigKeySet') : t('providerConfigKeyEmpty')}
              </span>
            </p>
          </div>
          <div className="min-w-0">
            <p className={styles.stateLabel}>{t('providerConfigStatus')}</p>
            {config?.last_status ? (
              <p className={`${styles.stateValue} flex items-center gap-1 ${
                config.last_status === 'ok' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {config.last_status === 'ok'
                  ? <CheckCircle2 className="size-3.5 shrink-0" />
                  : <XCircle className="size-3.5 shrink-0" />}
                <span className="min-w-0 overflow-hidden text-ellipsis">
                  {config.last_status === 'ok' ? t('providerConfigStatusOk') : t('providerConfigStatusFail')}
                </span>
              </p>
            ) : (
              <p className={styles.stateValue}>—</p>
            )}
          </div>
        </div>

        {config?.last_error && (
          <p className={styles.errorStrip}>{config.last_error}</p>
        )}

        {error && (
          <p className={`${styles.errorStrip} flex items-start gap-2`}>
            <XCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0">{error}</span>
          </p>
        )}

        {/* ── Form ── */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={styles.formLabel}>
              {t('providerConfigProvider')}
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="field mt-1.5 h-10"
              >
                {catalog.map((p) => (
                  <option key={p.name} value={p.name}>{p.display_name}</option>
                ))}
              </select>
            </label>

            <label className={styles.formLabel}>
              {t('providerConfigModel')}
              <div className={styles.modelRow}>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`field h-10 ${styles.modelSelect}`}
                >
                  {(models.length > 0 ? models : [model]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => loadModels(provider)}
                  disabled={loadingModels || !provider}
                  className={styles.loadModelsBtn}
                >
                  {loadingModels ? (
                    <span className={styles.spinner} />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  {loadingModels ? t('providerConfigLoadingModels') : t('providerConfigLoadModels')}
                </button>
              </div>
            </label>
          </div>

          <label className={styles.formLabel}>
            {t('providerConfigApiKey')}
            <span className={styles.hint}>{t('providerConfigApiKeyHint')}</span>
            <input
              type="password"
              value={apiKey === MASKED_KEY ? '' : apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.has_key ? t('providerConfigApiKeyMasked') : ''}
              autoComplete="off"
              className="field mt-1.5"
            />
          </label>

          {currentInfo?.supports_custom_base && (
            <label className={styles.formLabel}>
              {t('providerConfigApiBase')}
              <input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder={currentInfo.example_base_url || ''}
                className="field mt-1.5"
              />
            </label>
          )}
        </div>

        {/* ── Actions ── */}
        <div className={styles.actionRow}>
          <button type="button" onClick={save} disabled={saving || testing} className={styles.btnPrimary}>
            {saving && <span className={styles.spinner} />}
            {t('providerConfigSave')}
          </button>
          <button type="button" onClick={test} disabled={saving || testing} className={styles.btnSecondary}>
            {testing && <span className={styles.spinner} />}
            {!testing && <RefreshCw className="size-3.5" />}
            {t('providerConfigTest')}
          </button>
          <button type="button" onClick={clear} disabled={saving || testing} className={styles.btnGhost}>
            <Trash2 className="size-3.5" />
            {t('providerConfigClear')}
          </button>
        </div>

        {testResult && (
          <div className={testResult.ok ? styles.resultOk : styles.resultFail}>
            {testResult.ok ? (
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 shrink-0" />
                {t('providerConfigTestOk')}
              </p>
            ) : (
              <p className="flex items-start gap-1.5">
                <XCircle className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0">{testResult.error || t('providerConfigTestFail')}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
