'use client'

import { useCallback, useEffect, useState } from 'react'
import PurchaseModal from '@/components/PurchaseModal'
import CreditsExhaustedModal from '@/components/CreditsExhaustedModal'
import type { GateDetail } from '@/types/billing'

type ModalKind = 'purchase' | 'credits' | null

interface PurchaseRequiredEvent {
  message?: string
  status?: number
  code?: string
  payload?: GateDetail | Record<string, unknown>
}

export default function UpgradeListener() {
  const [modal, setModal] = useState<ModalKind>(null)
  const [payload, setPayload] = useState<GateDetail | Record<string, unknown> | null>(null)

  const handler = useCallback((e: Event) => {
    const detail = (e as CustomEvent<PurchaseRequiredEvent>).detail ?? {}
    // The enriched 402 gate (plan.md §4) sends code='insufficient_credits':
    // open the 3-option credits modal (top-up / wait / upgrade). Any other
    // 402 or the 403-max pipeline gate keeps the classic purchase modal.
    // 429 (quota_exceeded) never dispatches this event — quotas are not
    // monetizable, the billing page shows the weekly bar instead.
    if (detail.code === 'insufficient_credits') {
      setPayload(detail.payload ?? null)
      setModal('credits')
    } else {
      setPayload(null)
      setModal('purchase')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('purchase:required', handler)
    return () => window.removeEventListener('purchase:required', handler)
  }, [handler])

  const close = useCallback(() => setModal(null), [])
  const switchToPurchase = useCallback(() => setModal('purchase'), [])

  return (
    <>
      <PurchaseModal open={modal === 'purchase'} onClose={close} />
      <CreditsExhaustedModal
        open={modal === 'credits'}
        onClose={close}
        onUpgrade={switchToPurchase}
        payload={payload}
      />
    </>
  )
}
