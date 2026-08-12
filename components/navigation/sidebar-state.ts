'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getUserTier, isAdmin } from '@/lib/auth'
import type { SidebarState } from './sidebar-config'

/**
 * Estado reactivo del menú: el CV base se consulta contra la API y se
 * re-verifica al montar, al cambiar de ruta, al recuperar el foco y ante
 * el evento `cv:base-generated` (disparado al generar un CV base).
 */
export function useSidebarState(): SidebarState {
  const pathname = usePathname()
  const [hasBaseCv, setHasBaseCv] = useState(false)
  const [tier, setTier] = useState<string>(() => getUserTier())

  useEffect(() => {
    let cancelled = false
    async function check() {
      // Tier real desde billing (no el JWT, que queda stale hasta re-login).
      const status = await apiFetch<{ plan_key: string | null }>('/api/v1/billing/status').catch(() => null)
      if (!cancelled && status) setTier(status.plan_key ?? 'free')
      const cvs = await apiFetch<Array<{ cv_type: string }>>('/api/v1/cv/').catch(() => [])
      if (!cancelled) setHasBaseCv(Array.isArray(cvs) && cvs.some((c) => c.cv_type === 'base'))
    }
    check()
    const onFocus = () => check()
    const onBaseGenerated = () => check()
    const onBillingUpdated = () => check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('cv:base-generated', onBaseGenerated)
    window.addEventListener('billing:updated', onBillingUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('cv:base-generated', onBaseGenerated)
      window.removeEventListener('billing:updated', onBillingUpdated)
    }
  }, [pathname])

  return {
    hasBaseCv,
    isAdminUser: isAdmin(),
    tier,
  }
}
