'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, showWarning } from '@/lib/toasts'
import { setCompletedSteps, isPremium } from '@/lib/auth'
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

  const [myProviders, setMyProviders] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [provider, setProvider] = useState('openai')
  const [form, setForm] = useState({ api_key: '', api_base: '', model: '' })
  const [saveError, setSaveError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  function loadMyProviders() {
    apiFetch<any[]>('/api/v1/providers/me')
      .then((x) => setMyProviders(Array.isArray(x) ? x : []))
      .catch(() => {})
  }

  useEffect(() => {
    apiFetch<any>('/api/v1/providers/me/active')
      .then((x) => {
        setActive(x)
        if (!x?.provider) {
          showWarning(t('noActiveProvider'))
        }
      })
      .catch(() => {})
    loadMyProviders()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    if (!form.model.trim()) {
      showError(t('chooseModelRequired'))
      return
    }
    if ((provider === 'lm_studio' || provider === 'ollama') && !form.api_base.trim()) {
      showError(t('apiBaseRequiredForProvider'))
      return
    }
    const keyError = validateApiKey(provider, form.api_key)
    if (keyError) {
      showError(keyError)
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
      const msg = e instanceof Error ? e.message : t('testFailed')
      showError(sanitizeApiError(msg))
      return
    }
    try {
      await apiFetch('/api/v1/providers/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      const raw = e instanceof Error ? e.message : t('failedToSave')
      const msg = sanitizeApiError(raw)
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
      <PipelineHeader
        eyebrow="01 / CONFIGURE"
        title={t('title')}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <ProviderForm
          premium={premium}
          provider={provider}
          form={form}
          onProviderChange={setProvider}
          onFormChange={setForm}
          onSave={add}
          saveError={saveError}
          onUpgrade={() => setShowUpgrade(true)}
        />

        {/* Right: Info & Actions */}
        <div className="space-y-4">
          <ActiveProviderCard activeProvider={active?.provider || null} />

          <ProviderList
            providers={myProviders}
            premium={premium}
            maxFreeProviders={1}
            onActivate={activate}
            onDelete={remove}
            onUpgrade={() => setShowUpgrade(true)}
          />

          {isConfigured(provider) && active?.provider !== provider && (
            <AppleButton
              variant="secondary"
              className="w-full"
              onClick={() => activate(provider)}
            >
              {t('setProviderActive', { provider })}
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
