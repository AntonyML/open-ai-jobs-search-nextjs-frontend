'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBillingCatalog, getBillingStatus } from '@/lib/billing'
import type { CreditStatus, ProductCatalog } from '@/types/billing'

interface BillingState {
  status: CreditStatus | null
  catalog: ProductCatalog | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useBilling(): BillingState {
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
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { status, catalog, loading, error, refresh }
}
