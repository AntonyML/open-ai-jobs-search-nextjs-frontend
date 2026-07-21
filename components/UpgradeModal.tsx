'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Crown, Heart, X, Check, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { AppleButton } from '@/components/ui/apple-button'
import { AppleBadge } from '@/components/ui/apple-badge'
import { showSuccess, showError, showWarning } from '@/lib/toasts'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

type ModalTab = 'upgrade' | 'donate'

// ── Comparison table ─────────────────────────────────────────────

const COMPARE_ROWS = [
  { key: 'compareProviders', free: '1', prem: '∞' },
  { key: 'compareScrapeSites', free: '1', prem: '∞' },
  { key: 'compareApplications', free: '5', prem: '∞' },
  { key: 'compareRankIterations', free: '3', prem: '∞' },
  { key: 'compareExpand', free: '—', prem: '✓' },
  { key: 'compareUpskill', free: '—', prem: '✓' },
]

function ComparisonTable({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-lg border border-[#d2d2d7] bg-white overflow-hidden">
      <div className="grid grid-cols-3 gap-px bg-[#e2e2e5] text-[12px]">
        <div className="bg-[#f5f5f7] px-3 py-2 font-medium text-[#707070]">{t('upgrade.compareFeature')}</div>
        <div className="bg-[#f5f5f7] px-3 py-2 text-center font-medium text-[#707070]">{t('upgrade.compareFree')}</div>
        <div className="bg-[#f5f5f7] px-3 py-2 text-center font-medium text-[#0071e3]">{t('upgrade.comparePremium')}</div>
        {COMPARE_ROWS.map((row, i) => (
          <div key={i} className="contents">
            <div className="bg-white px-3 py-2 text-[#1d1d1f]">{t(`upgrade.${row.key}`)}</div>
            <div className="bg-white px-3 py-2 text-center text-[#858585]">{row.free}</div>
            <div className="bg-white px-3 py-2 text-center font-medium text-[#0071e3]">{row.prem}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Payment method card ──────────────────────────────────────────

function MethodCard({
  icon: Icon,
  selected,
  onSelect,
  title,
  desc,
}: {
  icon: typeof Crown
  selected: boolean
  onSelect: () => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
        selected
          ? 'border-[#0071e3] bg-[#f4f8fb]'
          : 'border-[#d2d2d7] bg-white hover:bg-[#f5f5f7]'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        selected ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#707070]'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-[#1d1d1f]">{title}</div>
        <div className="text-[11px] text-[#707070]">{desc}</div>
      </div>
      {selected && <Check className="h-4 w-4 text-[#0071e3]" />}
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════
// MODAL
// ═════════════════════════════════════════════════════════════════

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const t = useTranslations()
  const [tab, setTab] = useState<ModalTab>('upgrade')
  const [step, setStep] = useState<'pay' | 'confirm'>('pay')
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
    setStep('pay')
    setCooldown(0)
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current)
      cooldownTimer.current = null
    }
  }

  async function handleSend() {
    setLoading(true)

    if (tab === 'donate') {
      const num = parseFloat(amount)
      if (!amount.trim() || isNaN(num) || num <= 0) {
        showWarning('Please enter a valid amount')
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
      setTimeout(() => showWarning(t('upgrade.cooldown')), 300)
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-5rem)] animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {tab === 'upgrade' ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f8fb]">
                <Crown className="h-5 w-5 text-[#0071e3]" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
            )}
            <div>
              <h2 className="text-[16px] font-bold text-[#1d1d1f]">
                {tab === 'upgrade' ? t('upgrade.title') : t('upgrade.donateTitle')}
              </h2>
              {tab === 'upgrade' && (
                <AppleBadge color="blue" size="sm" className="mt-0.5">
                  <Sparkles className="-mt-0.5 mr-0.5 inline h-2.5 w-2.5" />
                  {t('upgrade.upgrade')}
                </AppleBadge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#858585] transition-all hover:bg-[#f5f5f7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="px-6 pb-4">
          <div className="tab-group">
            <button
              onClick={() => switchTab('upgrade')}
              className={`tab-pill ${tab === 'upgrade' ? 'active' : ''}`}
            >
              <Crown className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              {t('upgrade.upgrade')}
            </button>
            <button
              onClick={() => switchTab('donate')}
              className={`tab-pill ${tab === 'donate' ? 'active' : ''}`}
            >
              <Heart className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              {t('upgrade.donate')}
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            {tab === 'upgrade' ? (
              step === 'pay' ? (
                <>
                  <p className="text-[13px] text-[#707070]">{t('upgrade.description')}</p>
                  <ComparisonTable t={t} />
                </>
              ) : (
                <>
                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => setStep('pay')}
                    className="inline-flex items-center gap-1 text-[12px] text-[#0071e3] hover:underline"
                  >
                    ← Back
                  </button>
                  <p className="text-[13px] text-[#707070]">{t('upgrade.description')}</p>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#858585]">{t('upgrade.paymentMethod')}</p>
                    <MethodCard
                      icon={Crown}
                      selected={method === 'email'}
                      onSelect={() => setMethod('email')}
                      title={t('upgrade.contactEmail')}
                      desc={t('upgrade.contactEmailDesc')}
                    />
                    <MethodCard
                      icon={Heart}
                      selected={method === 'sinpe'}
                      onSelect={() => setMethod('sinpe')}
                      title={t('upgrade.sinpe')}
                      desc={t('upgrade.sinpeDesc')}
                    />
                    {method === 'sinpe' && (
                      <div className="pl-12">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t('upgrade.phonePlaceholder')}
                          className="field"
                        />
                        <p className="mt-1 text-[11px] text-[#858585]">{t('upgrade.phoneHint')}</p>
                      </div>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[#707070]">{t('upgrade.donateDescription')}</p>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#707070]">
                    {t('upgrade.amount')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('upgrade.amountPlaceholder')}
                    className="field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── CTA (always visible at bottom) ── */}
          <div className="shrink-0 border-t border-[#e2e2e5] px-6 py-4 bg-white rounded-b-2xl">
            {tab === 'upgrade' && step === 'pay' ? (
              <AppleButton
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setStep('confirm')}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              </AppleButton>
            ) : (
              <AppleButton
                variant={tab === 'upgrade' ? 'primary' : 'secondary'}
                loading={loading}
                disabled={cooldown > 0}
                size="md"
                className="w-full"
                onClick={handleSend}
              >
                {cooldown > 0 ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    {tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation')} ({cooldown}s)
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    {tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </AppleButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
