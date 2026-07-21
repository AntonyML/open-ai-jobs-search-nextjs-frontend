'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Star, Heart, Crown, Check, AlertTriangle, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { AppleButton } from '@/components/ui/apple-button'
import { showSuccess, showError, showWarning } from '@/lib/toasts'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

type ModalTab = 'upgrade' | 'donate'

// ── Comparison table subcomponent ─────────────────────────────────

function ComparisonRow({ feature, free, premium }: { feature: string; free: string; premium: string }) {
  return (
    <>
      <div className="text-sm text-white/70">{feature}</div>
      <div className="text-center text-sm text-white/50">{free}</div>
      <div className="text-center text-sm font-semibold text-amber-300">{premium}</div>
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
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4">
      <h3 className="mb-3 text-center text-sm font-bold text-amber-300">
        {t('upgrade.compareTitle')}
      </h3>
      <div className="grid grid-cols-3 gap-x-2 gap-y-2">
        <div className="text-xs font-medium text-white/50">{t('upgrade.compareFeature')}</div>
        <div className="text-center text-xs font-medium text-white/50">{t('upgrade.compareFree')}</div>
        <div className="text-center text-xs font-medium text-amber-400">{t('upgrade.comparePremium')}</div>
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
      <label className="mb-2 block text-xs font-medium text-white/60">{methodLabel}</label>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10 has-[:checked]:border-amber-400/50 has-[:checked]:bg-amber-500/10">
          <input
            type="radio"
            name="method"
            value="email"
            checked={method === 'email'}
            onChange={() => onChange('email')}
            className="accent-amber-400"
          />
          <div>
            <span className="text-sm font-medium text-white">{emailLabel}</span>
            <p className="text-xs text-white/50">{emailDesc}</p>
          </div>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10 has-[:checked]:border-amber-400/50 has-[:checked]:bg-amber-500/10">
          <input
            type="radio"
            name="method"
            value="sinpe"
            checked={method === 'sinpe'}
            onChange={() => onChange('sinpe')}
            className="accent-amber-400"
          />
          <div>
            <span className="text-sm font-medium text-white">{sinpeLabel}</span>
            <p className="text-xs text-white/50">{sinpeDesc}</p>
          </div>
        </label>
      </div>

      {method === 'sinpe' && (
        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-white/60">{phoneLabel}</label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={phonePlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          />
          <p className="mt-1 text-xs text-white/40">{phoneHint}</p>
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
  const [cooldown, setCooldown] = useState(0)
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open && cooldownTimer.current) {
      clearInterval(cooldownTimer.current)
      cooldownTimer.current = null
      setCooldown(0)
    }
  }, [open])

  if (!open) return null

  const switchTab = (next: ModalTab) => {
    setTab(next)
    setCooldown(0)
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current)
      cooldownTimer.current = null
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (tab === 'donate') {
      const num = parseFloat(amount)
      if (!amount.trim() || isNaN(num) || num <= 0) {
        showWarning(t('upgrade.amountPlaceholder') || 'Please enter a valid amount')
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
        showSuccess(t('upgrade.sent'))
      } else {
        await apiFetch('/api/v1/auth/donate', {
          method: 'POST',
          body: JSON.stringify({ amount, method, phone: method === 'sinpe' ? phone : null }),
        })
        showSuccess(t('upgrade.thankYou'))
      }

      setCooldown(30)
      setTimeout(() => showWarning(t('upgrade.cooldown') || 'You can send another request in 30s'), 300)
      cooldownTimer.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            if (cooldownTimer.current) clearInterval(cooldownTimer.current)
            cooldownTimer.current = null
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Error'
      if (msg.includes('429') || msg.includes('Too Many') || msg.includes('wait')) {
        showWarning(msg)
      } else {
        showError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient accent line */}
        <div className="relative px-8 pb-4 pt-8">
          <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tab === 'upgrade' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/20">
                  <Heart className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  {tab === 'upgrade' ? t('upgrade.title') : t('upgrade.donateTitle')}
                </h2>
                {tab === 'upgrade' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    <Star className="h-2.5 w-2.5" /> Premium
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 pb-4">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => switchTab('upgrade')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === 'upgrade'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Crown className="h-4 w-4" />
              {t('upgrade.upgrade')}
            </button>
            <button
              onClick={() => switchTab('donate')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === 'donate'
                  ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Heart className="h-4 w-4" />
              {t('upgrade.donate')}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-8">
          {tab === 'upgrade' && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">{t('upgrade.description')}</p>
              <ComparisonTable t={t} />
            </div>
          )}

          {tab === 'donate' && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">{t('upgrade.donateDescription')}</p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {t('upgrade.amount')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('upgrade.amountPlaceholder') || '$10, $20, etc.'}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/20"
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

          <AppleButton
            type="submit"
            loading={loading}
            disabled={cooldown > 0}
            size="md"
            className={`w-full !rounded-xl !border-0 !bg-gradient-to-r !py-3 !text-sm !font-semibold !shadow-lg transition-all ${
              tab === 'upgrade'
                ? '!from-amber-400 !to-amber-600 !shadow-amber-500/20 hover:!shadow-amber-500/40'
                : '!from-rose-400 !to-rose-600 !shadow-rose-500/20 hover:!shadow-rose-500/40'
            } ${cooldown > 0 ? '!from-gray-500 !to-gray-600 !shadow-none' : ''}`}
          >
            {cooldown > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                {tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation')} ({cooldown}s)
              </span>
            ) : tab === 'upgrade' ? (
              <span className="flex items-center justify-center gap-2">
                <Crown className="h-4 w-4" />
                {t('upgrade.sendRequest')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" />
                {t('upgrade.sendDonation')}
              </span>
            )}
          </AppleButton>
        </form>
      </div>
    </div>
  )
}
