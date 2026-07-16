'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Star, Heart } from 'lucide-react'
import { apiFetch } from '@/lib/api'

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#d2d2d7]/60">
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

        {/* Tabs */}
        <div className="flex border-b border-[#d2d2d7]/60">
          <button
            onClick={() => { setTab('upgrade'); setError(''); setSuccess('') }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              tab === 'upgrade'
                ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                : 'text-[#707070] hover:text-[#1d1d1f]'
            }`}
          >
            <Star className="w-4 h-4 inline mr-1.5" />
            {t('upgrade.upgrade')}
          </button>
          <button
            onClick={() => { setTab('donate'); setError(''); setSuccess('') }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              tab === 'donate'
                ? 'text-rose-500 border-b-2 border-rose-500'
                : 'text-[#707070] hover:text-[#1d1d1f]'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-1.5" />
            {t('upgrade.donate')}
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {tab === 'upgrade' && (
            <div className="space-y-4">
              <p className="text-sm text-[#707070]">{t('upgrade.description')}</p>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-amber-800">Premium</h3>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>• {t('upgrade.feature1')}</li>
                  <li>• {t('upgrade.feature2')}</li>
                  <li>• {t('upgrade.feature3')}</li>
                  <li>• {t('upgrade.feature4')}</li>
                </ul>
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$10, $20, etc."
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
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
                placeholder="+506 8888-8888"
                className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0068d2] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? t('common.loading') : (tab === 'upgrade' ? t('upgrade.sendRequest') : t('upgrade.sendDonation'))}
          </button>
        </form>
      </div>
    </div>
  )
}
