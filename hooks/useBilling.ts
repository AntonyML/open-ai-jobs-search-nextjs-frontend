'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBillingCatalog,
  getBillingStatus,
  getCreditTransactions,
  getPublicCatalog,
} from '@/lib/billing'
import { billingKeys } from '@/lib/query-keys'
import type { CreditStatus, CreditTransaction, ProductCatalog } from '@/types/billing'

/**
 * Fuente única de verdad de billing basada en TanStack Query.
 *
 * - La query `billing/status` es única y compartida: Navbar, CreditWidget,
 *   sidebar, página de billing y PurchaseModal consumen la misma entry
 *   (deduplicación → 1 sola request, no 8 por ola).
 * - Sin event bus: la invalidación explícita (compra, foco, montaje) es lo que
 *   refresca los datos. Esto elimina el bucle reflexivo provider ↔ página.
 * - `enabled` solo en cliente: durante el SSR no hay token y las llamadas solo
 *   añadirían ruido 401 al backend.
 */

const browserOnly = { enabled: typeof window !== 'undefined' }

export function useBillingStatus() {
  return useQuery<CreditStatus>({
    queryKey: billingKeys.status(),
    queryFn: () => getBillingStatus(),
    staleTime: 30_000, // el balance/plan se considera fresco 30s (incl. refocus)
    ...browserOnly,
  })
}

export function useBillingCatalog() {
  return useQuery<ProductCatalog>({
    queryKey: billingKeys.catalog(),
    queryFn: () => getBillingCatalog(),
    staleTime: 5 * 60_000, // el catálogo cambia rara vez
    ...browserOnly,
  })
}

/** Public catalog for the landing / limits — no auth, safe for visitors. */
export function usePublicCatalog() {
  return useQuery<ProductCatalog>({
    queryKey: billingKeys.publicCatalog(),
    queryFn: () => getPublicCatalog(),
    staleTime: 5 * 60_000,
    ...browserOnly,
  })
}

export function useTransactions() {
  return useQuery<CreditTransaction[]>({
    queryKey: billingKeys.transactions(),
    queryFn: () => getCreditTransactions(),
    staleTime: 30_000,
    ...browserOnly,
  })
}

export interface BillingState {
  status: CreditStatus | null
  catalog: ProductCatalog | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isPremium: boolean
  isMax: boolean
  planKey: string
}

/**
 * Hook de compatibilidad que mantiene la misma superficie que el antiguo
 * `BillingProvider`, ahora con estado 100% respaldado por TanStack Query.
 * Evita tocar los consumidores de `useBilling().isPremium` (features, settings)
 * a la vez que todo pasa por una sola query cacheada.
 */
export function useBilling(): BillingState {
  const queryClient = useQueryClient()
  const statusQuery = useBillingStatus()
  const catalogQuery = useBillingCatalog()

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.status() }),
      queryClient.invalidateQueries({ queryKey: billingKeys.catalog() }),
      queryClient.invalidateQueries({ queryKey: billingKeys.transactions() }),
    ])
  }, [queryClient])

  const status = statusQuery.data ?? null
  const catalog = catalogQuery.data ?? null
  const planKey = status?.plan_key ?? 'free'

  return {
    status,
    catalog,
    loading: statusQuery.isPending || catalogQuery.isPending,
    error: statusQuery.error?.message ?? catalogQuery.error?.message ?? null,
    refresh,
    isPremium: !!status?.has_active_subscription && planKey !== 'free',
    isMax: planKey === 'max',
    planKey,
  }
}