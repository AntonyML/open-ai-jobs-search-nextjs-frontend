'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { getUserTier, isAdmin } from '@/lib/auth'
import { useBillingStatus } from '@/hooks/useBilling'
import type { SidebarState } from './sidebar-config'

/**
 * Estado reactivo del menú: el tier se lee de la query única `billing/status`
 * (TanStack Query) y el CV base se consulta contra la API (caché propia).
 * Se re-verifica ante `cv:base-generated` (disparado al generar un CV base)
 * y al cambiar de ruta. El event bus `billing:updated` ya no existe.
 */
const cvListKeys = ['sidebar', 'cv'] as const

export function useSidebarState(): SidebarState {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [tier, setTier] = useState<string>(() => getUserTier())

  const { data: status } = useBillingStatus()
  useEffect(() => {
    if (status?.plan_key) setTier(status.plan_key)
  }, [status?.plan_key])

  const hasBaseCv = useQuery({
    queryKey: [...cvListKeys, pathname],
    queryFn: async () => {
      const cvs = await apiFetch<Array<{ cv_type: string }>>('/api/v1/cv/').catch(() => [])
      return Array.isArray(cvs) && cvs.some((c) => c.cv_type === 'base')
    },
    staleTime: 30_000,
    enabled: typeof window !== 'undefined',
  }).data ?? false

  // El guard no conoce la query; invalidar por ruta nueva o CV base generado.
  useEffect(() => {
    const onBaseGenerated = () => {
      void queryClient.invalidateQueries({ queryKey: cvListKeys })
    }
    window.addEventListener('cv:base-generated', onBaseGenerated)
    return () => window.removeEventListener('cv:base-generated', onBaseGenerated)
  }, [queryClient])

  return {
    hasBaseCv,
    isAdminUser: isAdmin(),
    tier,
  }
}