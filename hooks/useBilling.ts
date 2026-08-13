'use client'

import { useBillingContext } from '@/components/BillingProvider'
import type { BillingContextValue } from '@/components/BillingProvider'

/**
 * Hook de billing en vivo. Requiere estar dentro de un <BillingProvider>
 * (montado en el layout de la app). Sustituye al tier del JWT, que queda
 * stale hasta re-login, por el estado real de la suscripción.
 */
export function useBilling(): BillingContextValue {
  return useBillingContext()
}