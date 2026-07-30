'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, showWarning } from '@/lib/toasts'
import { setCompletedSteps, getCompletedSteps, isPremium } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { ProviderForm } from '@/components/providers/ProviderForm'
import { ActiveProviderCard } from '@/components/providers/ActiveProviderCard'
import { ProviderList } from '@/components/providers/ProviderList'
import UpgradeModal from '@/components/UpgradeModal'

export default function Providers() {
  const t = useTranslations('providers')

  function validateApiKey(provider: string, key: string): string | null {
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
  const router = useRouter()
  const premium = isPremium()

  const MASKED_KEY = '__MASKED__'

  const [myProviders, setMyProviders] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [provider, setProvider] = useState('openai')
  const [form, setForm] = useState({ api_key: '', api_base: '', model: '' })
  const [saveError, setSaveError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)

  function loadMyProviders() {
    apiFetch<any[]>('/api/v1/providers/me')
      .then((x) => setMyProviders(Array.isArray(x) ? x : []))
      .catch(() => {})
  }

  useEffect(() => {
    apiFetch<any>('/api/v1/providers/me/active')
      .then((x) => {
        setActive(x)
        if (x?.provider) {
          const steps = getCompletedSteps()
          if (!steps.includes(0)) {
            setCompletedSteps([...steps, 0])
          }
        } else {
          showWarning(t('noActiveProvider'))
        }
      })
      .catch(() => {})
    loadMyProviders()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')

    // ── Always test before save, regardless of how add() was triggered ──
    if (!form.model.trim()) {
      showError(t('chooseModelRequired'))
      return
    }
    if ((provider === 'lm_studio' || provider === 'ollama') && !form.api_base.trim()) {
      showError(t('apiBaseRequiredForProvider'))
      return
    }
    if (form.api_key !== MASKED_KEY) {
      const keyError = validateApiKey(provider, form.api_key)
      if (keyError) {
        showError(keyError)
        return
      }
    }

    // Build test payload — if MASKED_KEY, backend will use stored encrypted key
    const testPayload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    try {
      await apiFetch('/api/v1/providers/test', {
        method: 'POST',
        body: JSON.stringify(testPayload),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('testFailed')
      showError(sanitizeApiError(msg))
      return
    }

    // ── Save ──
    const isNewProvider = !(editingProvider && form.api_key === MASKED_KEY)
    if (!isNewProvider) {
      // PATCH — keep existing key, update model/api_base
      const patchPayload: Record<string, string> = {}
      if (form.model) patchPayload.model = form.model
      if (form.api_base) patchPayload.api_base = form.api_base
      try {
        await apiFetch(`/api/v1/providers/${provider}`, {
          method: 'PATCH',
          body: JSON.stringify(patchPayload),
        })
      } catch (e) {
        const raw = e instanceof Error ? e.message : t('failedToSave')
        showError(raw)
        setSaveError(raw)
        return
      }
      setEditingProvider(null)
      setSaveError('')
      showSuccess(t('providerUpdated', { provider }))
      loadMyProviders()
      return
    }

    // POST — new provider or upsert with new key + auto-activate
    const savePayload = Object.fromEntries(
      Object.entries({ provider, ...form }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    try {
      await apiFetch('/api/v1/providers/', {
        method: 'POST',
        body: JSON.stringify(savePayload),
      })
    } catch (e) {
      const raw = e instanceof Error ? e.message : t('failedToSave')
      const msg = sanitizeApiError(raw)
      showError(msg)
      setSaveError(msg)
      return
    }
    // Auto-activate the new/updated provider
    const updated = await apiFetch<any>('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider }),
    })
    setActive(updated)
    setEditingProvider(null)
    setSaveError('')
    showSuccess(t('providerSaved', { provider: updated.provider, model: updated.model }))
    loadMyProviders()
  }

  async function activate(p: string) {
    await apiFetch('/api/v1/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider: p }),
    })
    const updated = await apiFetch<any>('/api/v1/providers/me/active')
    setActive(updated)
    const steps = getCompletedSteps()
    if (!steps.includes(0)) {
      setCompletedSteps([...steps, 0])
    }
  }

  async function remove(p: string) {
    await apiFetch(`/api/v1/providers/${p}`, { method: 'DELETE' })
    if (active?.provider === p) {
      setActive(null)
    }
    showSuccess(t('providerDeleted', { provider: p }))
    loadMyProviders()
  }

  function handleEdit(p: any) {
    setEditingProvider(p)
    setProvider(p.provider)
    setForm({
      api_key: MASKED_KEY,
      api_base: p.api_base || '',
      model: p.model || '',
    })
    setSaveError('')
  }

  function handleCancelEdit() {
    setEditingProvider(null)
    setProvider('openai')
    setForm({ api_key: '', api_base: '', model: '' })
    setSaveError('')
  }

  const isConfigured = (p: string) => myProviders.some((c) => c.provider === p)

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="order-2 lg:order-1">
          <ProviderForm
            premium={premium}
            provider={provider}
            form={form}
            editingProvider={editingProvider}
            onProviderChange={(p) => {
              setProvider(p)
              if (editingProvider) handleCancelEdit()
            }}
            onFormChange={setForm}
            onSave={add}
            saveError={saveError}
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        {/* Right: Info & Actions */}
        <div className="order-1 lg:order-2 space-y-4">
          <ActiveProviderCard
            activeProvider={active?.provider || null}
            activeModel={active?.model || null}
            displayName={active?.display_name || null}
          />

          <ProviderList
            providers={myProviders}
            premium={premium}
            maxFreeProviders={1}
            onActivate={activate}
            onDelete={remove}
            onEdit={handleEdit}
            onUpgrade={() => setShowUpgrade(true)}
          />

          {editingProvider && (
            <AppleButton
              variant="secondary"
              className="w-full"
              onClick={handleCancelEdit}
            >
              {t('cancelEdit')}
            </AppleButton>
          )}

          {!editingProvider && isConfigured(provider) && active?.provider !== provider && (
            <AppleButton
              variant="secondary"
              className="w-full"
              onClick={() => activate(provider)}
            >
              {t('setProviderActive', { provider: active?.display_name || provider })}
            </AppleButton>
          )}

          {active?.has_credential && (
            <AppleButton className="w-full" onClick={() => router.push('/setup')}>
              {t('continueSetup')}
            </AppleButton>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
