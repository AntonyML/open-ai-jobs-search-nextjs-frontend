'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, Check, Crown, Rocket, Sparkles, Zap, MessageCircle, Smartphone,
  Mail, Copy, Clock, ArrowRight, Coins, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import { requestPurchase } from '@/lib/billing'
import { showSuccess, showError, showWarning } from '@/lib/toasts'
import { AppleButton } from '@/components/ui/apple-button'
import type { Plan } from '@/types/billing'

interface PurchaseModalProps {
  open: boolean
  onClose: () => void
  onPurchased?: () => void
}

type Cycle = 'monthly' | 'yearly'

function PlanIcon({ planKey }: { planKey: string }) {
  if (planKey === 'max') return <Rocket className="h-5 w-5 text-[#0071e3]" />
  if (planKey === 'pro') return <Zap className="h-5 w-5 text-amber-500" />
  return <Sparkles className="h-5 w-5 text-[#858585]" />
}

function formatPrice(usd: number) {
  return usd > 0 ? `$${usd.toFixed(2)}` : '$0'
}

export default function PurchaseModal({ open, onClose, onPurchased }: PurchaseModalProps) {
  const t = useTranslations('billing')
  const { status, catalog, loading, refresh } = useBilling()

  const [selected, setSelected] = useState<string>('pro')
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [method, setMethod] = useState<'sinpe' | 'whatsapp' | 'email'>('sinpe')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ correlation_id: string; whatsapp: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset the local state every time the modal opens.
  useEffect(() => {
    if (open) {
      setDone(null)
      setMethod('sinpe')
      setPhone('')
      setNote('')
      setCopied(false)
      void refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const plans = useMemo(
    () => (catalog?.plans ?? []).filter((p) => p.key !== 'free').sort((a, b) => a.price_monthly_usd - b.price_monthly_usd),
    [catalog],
  )

  if (!open) return null

  const activePlanKey = status?.plan_key
  const currentPlan = catalog?.plans.find((p) => p.key === activePlanKey)
  const whatsapp = catalog?.whatsapp_number ?? ''

  async function handleRequest() {
    if (!selected) {
      showWarning(t('selectPlan'))
      return
    }
    if (method === 'sinpe' && !phone.trim()) {
      showWarning(t('phoneRequired'))
      return
    }
    setSending(true)
    try {
      const res = await requestPurchase({
        plan_key: selected,
        method,
        phone: method === 'sinpe' ? phone : null,
        note: note || null,
        billing_cycle: cycle,
      })
      setDone({ correlation_id: res.correlation_id, whatsapp: res.whatsapp_number || whatsapp })
      showSuccess(res.message || t('sent'))
      onPurchased?.()
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
    ? encodeURIComponent(`${t('waGreeting')} — ${t('waPlan')}: ${selected} (${cycle}) — ${t('waCode')}: ${done.correlation_id}`)
    : encodeURIComponent(`${t('waGreeting')} — ${t('waPlan')}: ${selected} (${cycle})`)

  const price = (p: Plan) => (cycle === 'monthly' ? p.price_monthly_usd : p.price_yearly_usd)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-4rem)] animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f8fb]">
              <Crown className="h-5 w-5 text-[#0071e3]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#1d1d1f]">{t('title')}</h2>
              <p className="text-[11px] text-[#707070]">{t('subtitle')}</p>
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
                {t('currentPlan')}: {currentPlan?.name ?? status.plan_key ?? t('freeTier')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#1d1d1f]">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                {status.credits_balance} {t('credits')}
              </span>
              {status.period_end && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] text-[#707070]">
                  <Clock className="h-3.5 w-3.5" />
                  {t('expires')}: {new Date(status.period_end).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {loading && !catalog ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
            </div>
          ) : (
            <>
              {/* ── Billing cycle toggle ── */}
              <div className="flex items-center justify-center gap-1 rounded-full bg-[#f5f5f7] p-1">
                {(['monthly', 'yearly'] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={`flex-1 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                      cycle === c ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#707070] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {c === 'monthly' ? t('monthly') : `${t('yearly')} −20%`}
                  </button>
                ))}
              </div>

              {/* ── Plan cards ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {plans.map((p) => {
                  const isActive = p.key === activePlanKey
                  const isPopular = p.key === 'pro'
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelected(p.key)}
                      className={`relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                        selected === p.key
                          ? 'border-[#0071e3] bg-[#f4f8fb] ring-2 ring-[#0071e3]/20'
                          : 'border-[#d2d2d7] bg-white hover:border-[#0071e3]/40'
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-2 right-3 rounded-full bg-[#0071e3] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {t('popular')}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <PlanIcon planKey={p.key} />
                        <span className="text-[14px] font-bold text-[#1d1d1f]">{p.name}</span>
                        {isActive && (
                          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                            {t('current')}
                          </span>
                        )}
                        {selected === p.key && <Check className="ml-auto h-4 w-4 text-[#0071e3]" />}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-[22px] font-bold text-[#1d1d1f]">{formatPrice(price(p))}</span>
                        <span className="text-[11px] text-[#707070]">/ {cycle === 'monthly' ? t('perMonth') : t('perYear')}</span>
                      </div>
                      {p.description && <p className="mt-1.5 text-[11px] leading-relaxed text-[#707070]">{p.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.features ?? []).slice(0, 3).map((f) => (
                          <span key={f} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#474747] ring-1 ring-[#d2d2d7]">
                            {t(`feature.${f}`, { defaultValue: f })}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* ── Payment method ── */}
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

              {/* ── Confirmation state ── */}
              {done && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-800">
                  <p className="font-semibold">{t('doneTitle')}</p>
                  <p className="mt-1 text-emerald-700">{t('doneBody')}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded-md bg-white px-2 py-1 text-[11px] text-[#1d1d1f] ring-1 ring-emerald-200">
                      {done.correlation_id}
                    </code>
                    <button onClick={copyCorrelation} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#0071e3] ring-1 ring-emerald-200 transition-all hover:bg-[#f4f8fb]">
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
            </>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="shrink-0 border-t border-[#e2e2e5] px-6 py-4 bg-white rounded-b-2xl">
          {done ? (
            <AppleButton variant="secondary" size="md" className="w-full" onClick={onClose}>
              {t('close')}
            </AppleButton>
          ) : (
            <AppleButton variant="primary" size="md" className="w-full" loading={sending || loading} onClick={handleRequest}>
              <span className="inline-flex items-center justify-center gap-2">
                {t('requestPlan')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </AppleButton>
          )}
        </div>
      </div>
    </div>
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
