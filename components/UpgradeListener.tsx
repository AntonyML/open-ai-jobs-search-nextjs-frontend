'use client'

import { useCallback, useEffect, useState } from 'react'
import PurchaseModal from '@/components/PurchaseModal'

export default function UpgradeListener() {
  const [open, setOpen] = useState(false)

  const handler = useCallback(() => {
    setOpen(true)
  }, [])

  useEffect(() => {
    window.addEventListener('purchase:required', handler)
    return () => window.removeEventListener('purchase:required', handler)
  }, [handler])

  return <PurchaseModal open={open} onClose={() => setOpen(false)} />
}
