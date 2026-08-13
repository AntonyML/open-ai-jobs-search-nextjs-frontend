'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getBillingCatalog, getBillingStatus } from '@/lib/billing'
import type { CreditStatus, ProductCatalog } from '@/types/billing'

export interface BillingContextValue {
  status: CreditStatus | null
  catalog: ProductCatalog | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Tier en tiempo real desde billing (el del JWT queda stale hasta re-login). */
  isPremium: boolean
  isMax: boolean
  planKey: string
}

/** Evento global que notifica cambios de billing a los widgets legacy. */
export const BILLING_UPDATED_EVENT = 'billing:updated'

const BillingContext = createContext<BillingContextValue | null>(null)

/**
 * Fuente única de verdad de billing. Consulta el estado de créditos y el
 * catálogo una vez al montar y ante cada `refresh()`, re-sincroniza al
 * recuperar el foco o al cambiar la sesión (`auth:changed`) y, tras cada
 * refresco, dispara `billing:updated` para que los suscriptores legacy
 * (Navbar, CreditWidget, sidebar, notificaciones) se actualicen en vivo.
 */
export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CreditStatus | null>(null)
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getBillingStatus(), getBillingCatalog()])
      setStatus(s)
      setCatalog(c)
      setError(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(BILLING_UPDATED_EVENT))
      }
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onRefresh = () => void refresh()
    window.addEventListener('focus', onRefresh)
    window.addEventListener('auth:changed', onRefresh)
    return () => {
      window.removeEventListener('focus', onRefresh)
      window.removeEventListener('auth:changed', onRefresh)
    }
  }, [refresh])

  const hasActiveSubscription = !!status?.has_active_subscription
  const planKey = status?.plan_key ?? 'free'

  return (
    <BillingContext.Provider
      value={{
        status,
        catalog,
        loading,
        error,
        refresh,
        isPremium: hasActiveSubscription && planKey !== 'free',
        isMax: planKey === 'max',
        planKey,
      }}
    >
      {children}
    </BillingContext.Provider>
  )
}

export function useBillingContext(): BillingContextValue {
  const ctx = useContext(BillingContext)
  if (!ctx) {
    throw new Error('useBillingContext must be used within a <BillingProvider>')
  }
  return ctx
}