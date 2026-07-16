'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface UsageData {
  tier: string
  limits: {
    max_apply_count: number
    max_prepare_count: number
    max_rank_iterations: number
    max_track_count: number
  }
  usage: {
    applications: number
    interview_preps: number
    rank_iterations: number
    outcomes: number
  }
}

export function useUsageLimits() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetch<UsageData>('/api/v1/users/usage')
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
