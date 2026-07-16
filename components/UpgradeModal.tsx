'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Star, Heart } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { AppleButton } from '@/components/ui/apple-button'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

type ModalTab = 'upgrade' | 'donate'

// ── Comparison table subcomponent ─────────────────────────────────

function ComparisonRow({ feature, free, premium }: { feature: string; free: string; premium: string }) {
  return (
    <>
      <div className="text-[#474747]">{feature}</div>
      <div className="text-center text-[#858585]">{free}</div>
      <div className="text-center font-medium text-amber-700">{premium}</div>
    </>
  )
}

function ComparisonTable({ t }: { t: (key: string) => string }) {
  const rows = [
    { feature: t('upgrade.compareProviders'), free: '1', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareScrapeSites'), free: '1', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareJobsPerScrape'), free: '5', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareRankIterations'), free: '3', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareApplications'), free: '5', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareInterviewPreps'), free: '5', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareTrackedOutcomes'), free: '5', premium: t('upgrade.compareUnlimited') },
    { feature: t('upgrade.compareExpand'), free: t('upgrade.compareLocked'), premium: '✓' },
    { feature: t('upgrade.compareUpskill'), free: t('upgrade.compareLocked'), premium: '✓' },
  ]

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
      <h3 className="mb-3 text-center text-sm font-semibold text-amber-800">
        {t('upgrade.compareTitle')}
      </h3>
      <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-xs">
        <div className="font-medium text-[#707070]">{t('upgrade.compareFeature')}</div>
        <div className="text-center font-medium text-[#707070]">{t('upgrade.compareFree')}</div>
        <div className="text-center font-medium text-amber-800">{t('upgrade.comparePremium')}</div>
        {rows.map((row, i) => (
          <ComparisonRow key={i} feature={row.feature} free={row.free} premium={row.premium} />
        ))}
      </div>
    </div>
  )
}

// ── Payment method selector ───────────────────────────────────────

function PaymentMethodSelector({
  method,
  onChange,
  phone,
  onPhoneChange,
  methodLabel,
  sinpeLabel,
  sinpeDesc,
  emailLabel,
  emailDesc,
  phoneLabel,
  phonePlaceholder,
  phoneHint,
}: {
  method: 'sinpe' | 'email'
  onChange: (m: 'sinpe' | 'email') => void
  phone: string
  onPhoneChange: (v: string) => void
  methodLabel: string
  sinpeLabel: string
  sinpeDesc: string
  emailLabel: string
  emailDesc: string
  phoneLabel: string
  phonePlaceholder: string
  phoneHint: string
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[#474747]">{methodLabel}</label>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#d2d2d7] p-3 transition-all hover:bg-[#f5f5f7]">
          <input
            type="radio"
            name="method"
            value="email"
            checked={method === 'email'}
            onChange={() => onChange('email')}
            className="accent-[#0071e3]"
          />
          <div>
            <span className="text-sm font-medium text-[#1d1d1f]">{emailLabel}</span>
            <p className="text-xs text-[#707070]">{emailDesc}</p>
          </div>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#d2d2d7] p-3 transition-all hover:bg-[#f5f5f7]">
          <input
            type="radio"
            name="method"
            value="sinpe"
            checked={method === 'sinpe'}
            onChange={() => onChange('sinpe')}
            className="accent-[#0071e3]"
          />
          <div>
            <span className="text-sm font-medium text-[#1d1d1f]">{sinpeLabel}</span>
            <p className="text-xs text-[#707070]">{sinpeDesc}</p>
          </div>
        </label>
      </div>

      {method === 'sinpe' && (
        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-[#474747]">{phoneLabel}</label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={phonePlaceholder}
            className="field"
          />
          <p className="mt-1 text-xs text-[#858585]">{phoneHint}</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const t = useTranslations()
  const [tab, setTab] = useState<ModalTab>('upgrade')
  const [method, setMethod] = useState<'sinpe' | 'email'>('email')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const switchTab = (next: ModalTab) => {
    setTab(next)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (tab === 'donate') {
      const num = parseFloat(amount)
      if (!amount.trim() || isNaN(num) || num <= 0) {
        setError(t('upgrade.amountPlaceholder') ? 'Please enter a valid amount' : '')
        setLoading(false)
        return
      }
    }

    try {
      if (tab === 'upgrade') {
        await apiFetch('/api/v1/auth/upgrade', {
          method: 'POST',
          body: JSON.stringify({ method, phone: method === 'sinpe' ? phone : null }),
        })
        setSuccess(t('upgrade.sent'))
      } else {
        await apiFetch('/api/v1/auth/donate', {
          method: 'POST',
          body: JSON.stringify({ amount, method, phone: method === 'sinpe' ? phone : null }),
        })
        setSuccess(t('upgrade.thankYou'))
      }
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#d2d2d7] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e2e5] px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            {tab === 'upgrade' ? (
              <Star className="h-5 w-5 text-amber-500" />
            ) : (
              <Heart className="h-5 w-5 text-rose-500" />
            )}
            <h2 className="text-lg font-semibold text-[#1d1d1f]">
              {tab === 'upgrade' ? t('upgrade.title') : t('upgrade.donateTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#707070] transition-all hover:bg-[#f5f5f7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-3 pt-4">
          <div className="tab-group w-full">
            <button
              onClick={() => switchTab('upgrade')}
              className={`tab-pill flex-1 text-center ${tab === 'upgrade' ? 'active' : ''}`}
            >
              <Star className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              {t('upgrade.upgrade')}
            </button>
            <button
              onClick={() => switchTab('donate')}
              className={`tab-pill flex-1 text-center ${tab === 'donate' ? 'active' : ''}`}
            >
              <Heart className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              {t('upgrade.donate')}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          {tab === 'upgrade' && (
            <div className="space-y-4">
              <p className="text-sm text-[#707070]">{t('upgrade.description')}</p>
              <ComparisonTable t={t} />
            </div>
          )}

          {tab === 'donate' && (
            <div className="space-y-4">
              <p className="text-sm text-[#707070]">{t('upgrade.donateDescription')}</p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#474747]">
                  {t('upgrade.amount')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('upgrade.amountPlaceholder') || '$10, $20, etc.'}
                  className="field"
                />
              </div>
            </div>
          )}

          <PaymentMethodSelector
            method={method}
            onChange={setMethod}
            phone={phone}
            onPhoneChange={setPhone}
            methodLabel={t('upgrade.paymentMethod')}
            emailLabel={t('upgrade.contactEmail')}
            emailDesc={t('upgrade.contactEmailDesc')}
            sinpeLabel={t('upgrade.sinpe')}
            sinpeDesc={t('upgrade.sinpeDesc')}
            phoneLabel={t('upgrade.phoneLabel')}
            phonePlaceholder={t('upgrade.phonePlaceholder') || '+506 8888-8888'}
            phoneHint={t('upgrade.phoneHint')}
          />

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <AppleButton type="submit" loading={loading} size="md" className="w-full">
            {tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation')}
          </AppleButton>
        </form>
      </div>
    </div>
  )
}
