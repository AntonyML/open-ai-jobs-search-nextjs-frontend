'use client'

import { useTranslations } from 'next-intl'
import { Coins, Crown, Lock } from 'lucide-react'
import { useBillingStatus } from '@/hooks/useBilling'

/**
 * Widget del sidebar que muestra el plan actual y el balance de créditos.
 * Al hacer clic abre el modal de compra global (dispara `purchase:required`,
 * que escucha `UpgradeListener` en el layout). Los datos vienen de la query
 * única `billing/status` de TanStack Query (deduplicada con Navbar/página).
 */
export default function CreditWidget() {
  const t = useTranslations('billing')
  const { data: status } = useBillingStatus()

  if (!status) return null

  const planName = status.plan_name ?? status.plan_key ?? t('freeTier')
  const isPremium = !!status.has_active_subscription && status.plan_key !== 'free'

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('purchase:required', { detail: { status: 402 } }))}
      className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-xl border border-[#d2d2d7]/70 bg-white/70 px-3 py-2.5 text-left transition-all hover:border-[#0071e3]/40 hover:bg-[#f4f8fb]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#0060c0] text-white shadow-sm">
        {isPremium ? <Crown className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold text-[#1d1d1f]">{planName}</div>
        <div className="flex items-center gap-1 text-[10px] text-[#707070]">
          <Coins className="h-3 w-3 text-amber-500" />
          <span>
            {status.credits_balance} {t('credits')}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-[#0071e3]">{t('upgradeShort')}</span>
    </button>
  )
}
