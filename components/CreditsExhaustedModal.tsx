'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, Coins, Clock, Crown, ArrowRight, MessageCircle, Smartphone,
  Mail, Copy, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import { requestTopup } from '@/lib/billing'
import { showSuccess, showError, showWarning } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'
import type { GateDetail, TopupPack } from '@/types/billing'

interface CreditsExhaustedModalProps {
  open: boolean
  onClose: () => void
  /** Switch to the classic purchase modal (upgrade option). */
  onUpgrade: () => void
  /** Enriched 402 detail from the gate (balance, next_reset_at, topup_packs). */
  payload?: GateDetail | Record<string, unknown> | null
}

type View = 'options' | 'topup' | 'waiting' | 'done'

export default function CreditsExhaustedModal({ open, onClose, onUpgrade, payload }: CreditsExhaustedModalProps) {
  const t = useTranslations('billing')
  const { status, catalog, refresh } = useBilling()

  const [view, setView] = useState<View>('options')
  const [selectedPack, setSelectedPack] = useState<TopupPack | null>(null)
  const [method, setMethod] = useState<'sinpe' | 'whatsapp' | 'email'>('sinpe')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ correlation_id: string; whatsapp: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset local state every time the modal opens.
  useEffect(() => {
    if (open) {
      setView('options')
      setSelectedPack(null)
      setMethod('sinpe')
      setPhone('')
      setNote('')
      setDone(null)
      setCopied(false)
      void refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const planKey = status?.plan_key ?? 'free'
  const isPaid = !!status?.has_active_subscription && planKey !== 'free'
  const isMax = planKey === 'max'
  const whatsapp = catalog?.whatsapp_number ?? ''
  // Packs come from the gate payload first (fresh at the 402 moment), falling
  // back to the catalog for the general case.
  const packs = (payload?.topup_packs as TopupPack[] | undefined) ?? catalog?.topup_packs ?? []
  // "Esperar" date: the gate already sends the next refill (period_end for
  // paid, weekly refill for free); period_end from status is the fallback.
  const nextReset =
    (typeof payload?.next_reset_at === 'string' && payload.next_reset_at) ||
    status?.period_end ||
    null
  const planName = catalog?.plans.find((p) => p.key === planKey)?.name ?? (planKey !== 'free' ? planKey : t('freeTier'))

  async function handleTopup() {
    if (!selectedPack) {
      showWarning(t('exhaustedSelectPack'))
      return
    }
    if (method === 'sinpe' && !phone.trim()) {
      showWarning(t('phoneRequired'))
      return
    }
    setSending(true)
    try {
      const res = await requestTopup({
        pack_credits: selectedPack.credits,
        method,
        phone: method === 'sinpe' ? phone : null,
        note: note || null,
      })
      setDone({ correlation_id: res.correlation_id, whatsapp: res.whatsapp_number || whatsapp })
      setView('done')
      showSuccess(res.message || t('sent'))
      void refresh()
    } catch (x) {
      showError(x instanceof Error ? x.message : t('error'))
    } finally {
      setSending(false)
    }
  }

  async function copyCorrelation() {
    if (!done) return
    try {
      await navigator.clipboard.writeText(done.correlation_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showWarning(t('copyFailed'))
    }
  }

  const waText = done
    ? encodeURIComponent(
        `${t('exhaustedWaGreeting')} — ${t('exhaustedWaPack')}: ${selectedPack?.credits ?? ''} — ${t('waCode')}: ${done.correlation_id}`,
      )
    : ''

  const waitDate = nextReset
    ? new Date(nextReset).toLocaleDateString()
    : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-4rem)] animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#1d1d1f]">{t('exhaustedTitle')}</h2>
              <p className="text-[11px] text-[#707070]">{t('exhaustedSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#858585] transition-all hover:bg-[#f5f5f7]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {/* Current plan + balance */}
          {status && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d2d2d7]/70 bg-[#f5f5f7]/60 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#1d1d1f]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {t('currentPlan')}: {planName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#1d1d1f]">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                {status.credits_balance} {t('credits')}
              </span>
            </div>
          )}

          {/* ── Options ── */}
          {view === 'options' && (
            <div className="space-y-2.5">
              {isPaid && (
                <OptionCard
                  icon={Coins}
                  iconBg="bg-amber-50 text-amber-500"
                  title={t('exhaustedTopup')}
                  desc={t('exhaustedTopupDesc')}
                  onClick={() => setView('topup')}
                />
              )}
              <OptionCard
                icon={Clock}
                iconBg="bg-[#f4f8fb] text-[#0071e3]"
                title={t('exhaustedWait')}
                desc={waitDate ? t('exhaustedWaitDesc', { date: waitDate }) : t('exhaustedWaitSoon')}
                onClick={() => setView('waiting')}
              />
              {!isMax && (
                <OptionCard
                  icon={Crown}
                  iconBg="bg-[#f4f8fb] text-[#0071e3]"
                  title={t('exhaustedUpgrade')}
                  desc={t('exhaustedUpgradeDesc')}
                  onClick={onUpgrade}
                />
              )}
            </div>
          )}

          {/* ── Top-up flow ── */}
          {view === 'topup' && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t('exhaustedPackExpiry')}
              </div>

              {packs.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-[#707070]">{t('exhaustedNoPacks')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {packs.map((p) => {
                    const isSelected = selectedPack?.credits === p.credits
                    return (
                      <button
                        key={p.credits}
                        type="button"
                        onClick={() => setSelectedPack(p)}
                        className={`flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-[#0071e3] bg-[#f4f8fb] ring-2 ring-[#0071e3]/20'
                            : 'border-[#d2d2d7] bg-white hover:border-[#0071e3]/40'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#858585]">
                          {p.credits} {t('credits')}
                        </span>
                        <span className="mt-1 text-[20px] font-bold text-[#1d1d1f]">
                          ${p.price_usd.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#858585]">{t('paymentMethod')}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <MethodCard
                    selected={method === 'sinpe'}
                    onSelect={() => setMethod('sinpe')}
                    icon={Smartphone}
                    title={t('sinpe')}
                    desc={t('sinpeDesc')}
                  />
                  <MethodCard
                    selected={method === 'whatsapp'}
                    onSelect={() => setMethod('whatsapp')}
                    icon={MessageCircle}
                    title="WhatsApp"
                    desc={t('whatsappDesc')}
                  />
                  <MethodCard
                    selected={method === 'email'}
                    onSelect={() => setMethod('email')}
                    icon={Mail}
                    title={t('email')}
                    desc={t('emailDesc')}
                  />
                </div>
                {method === 'sinpe' && (
                  <div className="pl-1">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('phonePlaceholder')}
                      className="field w-full"
                    />
                    <p className="mt-1 text-[11px] text-[#858585]">{t('phoneHint')}</p>
                  </div>
                )}
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('notePlaceholder')}
                  className="field w-full"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setView('options')}
                  className="rounded-full px-3 py-2 text-[12px] font-medium text-[#707070] transition-all hover:bg-[#f5f5f7]"
                >
                  {t('exhaustedBack')}
                </button>
                <AppleButton variant="primary" size="md" loading={sending} onClick={handleTopup} className="flex-1">
                  <span className="inline-flex items-center justify-center gap-2">
                    {t('exhaustedRequest')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </AppleButton>
              </div>
            </>
          )}

          {/* ── Wait view ── */}
          {view === 'waiting' && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-[#d2d2d7]/70 bg-[#f5f5f7]/60 p-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d1d1f]">
                  <Clock className="h-4 w-4 text-[#0071e3]" />
                  {t('exhaustedWaitTitle')}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#707070]">
                  {waitDate ? t('exhaustedWaitDesc', { date: waitDate }) : t('exhaustedWaitSoon')}
                </p>
              </div>
              <AppleButton variant="secondary" size="md" className="w-full" onClick={onClose}>
                {t('close')}
              </AppleButton>
            </div>
          )}

          {/* ── Done view ── */}
          {view === 'done' && done && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-800">
              <p className="font-semibold">{t('exhaustedDoneTitle')}</p>
              <p className="mt-1 text-emerald-700">{t('exhaustedDoneBody')}</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-md bg-white px-2 py-1 text-[11px] text-[#1d1d1f] ring-1 ring-emerald-200">
                  {done.correlation_id}
                </code>
                <button
                  onClick={copyCorrelation}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#0071e3] ring-1 ring-emerald-200 transition-all hover:bg-[#f4f8fb]"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
              {done.whatsapp && (
                <a
                  href={`https://wa.me/${done.whatsapp.replace(/[^0-9]/g, '')}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:brightness-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('openWhatsapp')}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#e2e2e5] px-6 py-4 bg-white rounded-b-2xl">
          <AppleButton variant="secondary" size="md" className="w-full" onClick={onClose}>
            {t('close')}
          </AppleButton>
        </div>
      </div>
    </div>
  )
}

function OptionCard({
  icon: Icon,
  iconBg,
  title,
  desc,
  onClick,
}: {
  icon: typeof Coins
  iconBg: string
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-[#d2d2d7] bg-white p-3.5 text-left transition-all hover:border-[#0071e3]/40 hover:bg-[#f5f5f7]"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[#1d1d1f]">{title}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#707070]">{desc}</div>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#858585]" />
    </button>
  )
}

function MethodCard({
  icon: Icon,
  selected,
  onSelect,
  title,
  desc,
}: {
  icon: typeof Smartphone
  selected: boolean
  onSelect: () => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
        selected ? 'border-[#0071e3] bg-[#f4f8fb]' : 'border-[#d2d2d7] bg-white hover:bg-[#f5f5f7]'
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        selected ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#707070]'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-medium text-[#1d1d1f]">{title}</div>
        <div className="truncate text-[10px] text-[#707070]">{desc}</div>
      </div>
    </button>
  )
}
