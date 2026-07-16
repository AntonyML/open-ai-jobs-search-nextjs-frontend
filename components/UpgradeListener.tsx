'use client'

import { useCallback, useEffect, useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function UpgradeListener() {
  const [open, setOpen] = useState(false)

  const handler = useCallback(() => {
    setOpen(true)
  }, [])

  useEffect(() => {
    window.addEventListener('upgrade:required', handler)
    return () => window.removeEventListener('upgrade:required', handler)
  }, [handler])

  return <UpgradeModal open={open} onClose={() => setOpen(false)} />
}