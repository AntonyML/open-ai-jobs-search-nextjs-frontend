'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Server,
  KeyRound,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Globe,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'
import { cn } from '@/lib/utils'

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

  // Fetch live/static models whenever the provider changes.
  useEffect(() => {
    if (!provider) return
    let cancelled = false
    apiFetch<{ models: Array<{ id: string }> }>(`/api/v1/admin/providers/${provider}/models`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (cancelled) return
        const ids = (res?.models ?? []).map((m) => m.id)
        if (ids.length > 0) {
          setModels(ids)
          // Keep current model if present in list, else fall back to first.
          setModel((prev) => (ids.includes(prev) ? prev : currentInfo?.static_models?.includes(prev) ? prev : ids[0]))
        } else {
          setModels(currentInfo?.static_models ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setModels(currentInfo?.static_models ?? [])
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  function handleProviderChange(name: string) {
    setProvider(name)
    const info = catalog.find((p) => p.name === name)
    setModel(info?.default_model || '')
    setModels(info?.static_models ?? [])
    setApiBase(info?.example_base_url || '')
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
      <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-6">
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="h-5 w-5 animate-spin text-[#858585]" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
          <Server className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">{t('providerConfigTitle')}</h3>
          <p className="mt-0.5 text-xs leading-5 text-[#707070]">{t('providerConfigDesc')}</p>
        </div>
      </div>

      {/* ── Current state strip ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-[#e2e2e5] bg-[#fafafa] p-4 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#858585]">{t('providerConfigProvider')}</p>
          <p className="mt-1 text-sm font-medium text-[#1d1d1f]">{config?.display_name || config?.provider || t('providerConfigNone')}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#858585]">{t('providerConfigModel')}</p>
          <p className="mt-1 truncate text-sm font-medium text-[#1d1d1f]">{config?.model || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#858585]">{t('providerConfigKey')}</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#1d1d1f]">
            <KeyRound className="size-3.5 text-[#b0b0b0]" />
            {config?.has_key ? t('providerConfigKeySet') : t('providerConfigKeyEmpty')}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#858585]">{t('providerConfigStatus')}</p>
          {config?.last_status ? (
            <p className={cn(
              'mt-1 flex items-center gap-1 text-sm font-medium',
              config.last_status === 'ok' ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {config.last_status === 'ok'
                ? <CheckCircle2 className="size-3.5" />
                : <XCircle className="size-3.5" />}
              {config.last_status === 'ok' ? t('providerConfigStatusOk') : t('providerConfigStatusFail')}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-[#858585]">—</p>
          )}
        </div>
      </div>

      {config?.last_error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {config.last_error}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
          <XCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Form ── */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-[#1d1d1f]">
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

          <label className="block text-sm text-[#1d1d1f]">
            {t('providerConfigModel')}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="field mt-1.5 h-10"
            >
              {(models.length > 0 ? models : [model]).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-[#1d1d1f]">
          {t('providerConfigApiKey')}
          <span className="ml-2 text-[11px] text-[#b0b0b0]">{t('providerConfigApiKeyHint')}</span>
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
          <label className="block text-sm text-[#1d1d1f]">
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
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AppleButton onClick={save} loading={saving} disabled={saving || testing} className="w-full sm:w-auto">
          {t('providerConfigSave')}
        </AppleButton>
        <AppleButton variant="secondary" onClick={test} loading={testing} disabled={saving || testing} className="w-full sm:w-auto">
          <RefreshCw className="mr-1.5 size-3.5" />
          {t('providerConfigTest')}
        </AppleButton>
        <AppleButton variant="ghost" onClick={clear} disabled={saving || testing} className="w-full sm:w-auto">
          <Trash2 className="mr-1.5 size-3.5" />
          {t('providerConfigClear')}
        </AppleButton>
      </div>

      {testResult && (
        <div className={cn(
          'mt-4 rounded-lg border px-3 py-2.5 text-xs',
          testResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-600'
        )}>
          {testResult.ok ? (
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              {t('providerConfigTestOk')}
            </p>
          ) : (
            <p className="flex items-start gap-1.5">
              <XCircle className="mt-0.5 size-3.5 shrink-0" />
              <span className="break-words">{testResult.error || t('providerConfigTestFail')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact summary table of the global provider config — used on the
 * /pipeline/providers page, visible only to admins. Shows basic info plus
 * a direct link to the full admin panel.
 */
export function AdminProviderSummary() {
  const t = useTranslations('admin')
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AdminConfig>('/api/v1/admin/providers')
      .then((c) => setConfig(c))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-[#0071e3]" />
          <p className="text-sm font-medium text-[#1d1d1f]">{t('providerSummaryTitle')}</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
        >
          {t('providerSummaryGo')}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-4 w-4 animate-spin text-[#b0b0b0]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e2e2e5]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e2e2e5] bg-[#f5f5f7] text-left text-[10px] font-semibold uppercase tracking-widest text-[#858585]">
                <th className="px-3 py-2">{t('providerConfigProvider')}</th>
                <th className="px-3 py-2">{t('providerConfigModel')}</th>
                <th className="px-3 py-2">{t('providerConfigKey')}</th>
                <th className="px-3 py-2">{t('providerConfigStatus')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e2e2e5] last:border-0">
                <td className="px-3 py-2.5 font-medium text-[#1d1d1f]">
                  {config?.display_name || config?.provider || t('providerConfigNone')}
                </td>
                <td className="max-w-[160px] truncate px-3 py-2.5 text-[#707070]">{config?.model || '—'}</td>
                <td className="px-3 py-2.5 text-[#707070]">
                  {config?.has_key ? t('providerConfigKeySet') : t('providerConfigKeyEmpty')}
                </td>
                <td className="px-3 py-2.5">
                  {config?.last_status === 'ok' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="size-3" /> {t('providerConfigStatusOk')}
                    </span>
                  ) : config?.last_status ? (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircle className="size-3" /> {t('providerConfigStatusFail')}
                    </span>
                  ) : (
                    <span className="text-[#b0b0b0]">—</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
