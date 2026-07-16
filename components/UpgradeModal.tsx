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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-[#d2d2d7] w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e2e2e5]">
          <div className="flex items-center gap-2">
            {tab === 'upgrade' ? (
              <Star className="w-5 h-5 text-amber-500" />
            ) : (
              <Heart className="w-5 h-5 text-rose-500" />
            )}
            <h2 className="text-lg font-semibold text-[#1d1d1f]">
              {tab === 'upgrade' ? t('upgrade.title') : t('upgrade.donateTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#707070] hover:bg-[#f5f5f7] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple-style pill tabs */}
        <div className="px-6 pt-4 pb-3">
          <div className="tab-group w-full">
            <button
              onClick={() => switchTab('upgrade')}
              className={`tab-pill flex-1 text-center ${tab === 'upgrade' ? 'active' : ''}`}
            >
              <Star className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {t('upgrade.upgrade')}
            </button>
            <button
              onClick={() => switchTab('donate')}
              className={`tab-pill flex-1 text-center ${tab === 'donate' ? 'active' : ''}`}
            >
              <Heart className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {t('upgrade.donate')}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {tab === 'upgrade' && (
            <div className="space-y-4">
              <p className="text-sm text-[#707070]">{t('upgrade.description')}</p>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-amber-800 text-center">{t('upgrade.compareTitle')}</h3>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-xs">
                  <div className="font-medium text-[#707070]">{t('upgrade.compareFeature')}</div>
                  <div className="text-center font-medium text-[#707070]">{t('upgrade.compareFree')}</div>
                  <div className="text-center font-medium text-amber-800">{t('upgrade.comparePremium')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareProviders')}</div>
                  <div className="text-center text-[#858585]">1</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareScrapeSites')}</div>
                  <div className="text-center text-[#858585]">1</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareJobsPerScrape')}</div>
                  <div className="text-center text-[#858585]">5</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareRankIterations')}</div>
                  <div className="text-center text-[#858585]">3</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareApplications')}</div>
                  <div className="text-center text-[#858585]">5</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareInterviewPreps')}</div>
                  <div className="text-center text-[#858585]">5</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareTrackedOutcomes')}</div>
                  <div className="text-center text-[#858585]">5</div>
                  <div className="text-center text-amber-700 font-medium">{t('upgrade.compareUnlimited')}</div>

                  <div className="text-[#474747]">{t('upgrade.compareExpand')}</div>
                  <div className="text-center text-[#858585]">{t('upgrade.compareLocked')}</div>
                  <div className="text-center text-amber-700 font-medium">✓</div>

                  <div className="text-[#474747]">{t('upgrade.compareUpskill')}</div>
                  <div className="text-center text-[#858585]">{t('upgrade.compareLocked')}</div>
                  <div className="text-center text-amber-700 font-medium">✓</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'donate' && (
            <div className="space-y-4">
              <p className="text-sm text-[#707070]">{t('upgrade.donateDescription')}</p>
              <div>
                <label className="block text-xs font-medium text-[#474747] mb-1.5">{t('upgrade.amount')}</label>
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

          {/* Payment method */}
          <div>
            <label className="block text-xs font-medium text-[#474747] mb-2">{t('upgrade.paymentMethod')}</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border border-[#d2d2d7] p-3 cursor-pointer hover:bg-[#f5f5f7] transition-all">
                <input
                  type="radio"
                  name="method"
                  value="email"
                  checked={method === 'email'}
                  onChange={() => setMethod('email')}
                  className="accent-[#0071e3]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d1d1f]">{t('upgrade.contactEmail')}</span>
                  <p className="text-xs text-[#707070]">{t('upgrade.contactEmailDesc')}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-[#d2d2d7] p-3 cursor-pointer hover:bg-[#f5f5f7] transition-all">
                <input
                  type="radio"
                  name="method"
                  value="sinpe"
                  checked={method === 'sinpe'}
                  onChange={() => setMethod('sinpe')}
                  className="accent-[#0071e3]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d1d1f]">{t('upgrade.sinpe')}</span>
                  <p className="text-xs text-[#707070]">{t('upgrade.sinpeDesc')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Phone (SINPE only) */}
          {method === 'sinpe' && (
            <div>
              <label className="block text-xs font-medium text-[#474747] mb-1.5">{t('upgrade.phoneLabel')}</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('upgrade.phonePlaceholder') || '+506 8888-8888'}
                className="field"
              />
              <p className="mt-1 text-xs text-[#858585]">{t('upgrade.phoneHint')}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          )}

          <AppleButton type="submit" loading={loading} size="md" className="w-full">
            {tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation')}
          </AppleButton>
        </form>
      </div>
    </div>
  )
}
