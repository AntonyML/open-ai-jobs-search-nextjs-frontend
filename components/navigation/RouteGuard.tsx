'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getRouteRequirement } from './sidebar-config'
import { useBillingStatus } from '@/hooks/useBilling'
import { getUserTier, isAdmin } from '@/lib/auth'
import { showWarning } from '@/lib/toasts'

/**
 * Route guard del layout autenticado: restringe por plan y por rol.
 *
 * El candado del sidebar es solo visual; esta capa es la que de verdad impide
 * entrar a /search, /rank, /apply, /interview, /expand, /upskill, /outcome y
 * /analytics sin el plan Max, y a /admin/* sin rol admin. El tier se lee de la
 * query única `billing/status` (fuente de verdad, el JWT puede ir desactualizado)
 * con fallback al JWT mientras carga o si falla.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('appSidebar')
  const pathname = usePathname()
  const router = useRouter()
  const { data: status, isPending, error } = useBillingStatus()

  const requirement = getRouteRequirement(pathname)
  const isAdminUser = isAdmin()

  // Rutas sin restricción se renderizan de inmediato (sin flash de null).
  const [decided, setDecided] = useState(() => !requirement)

  // Tier efectivo: billing primero (fuente de verdad), JWT como fallback.
  const billingTier = status?.plan_key
  const jwtTier = getUserTier()
  const effectiveTier = billingTier ?? jwtTier

  useEffect(() => {
    if (!requirement) {
      setDecided(true)
      return
    }
    if (requirement.adminOnly) {
      if (isAdminUser) {
        setDecided(true)
        return
      }
      showWarning(t('routeBlockedAdmin'))
      router.replace('/dashboard')
      return
    }
    // Ruta de plan Max. El admin siempre pasa.
    if (isAdminUser || effectiveTier === 'max') {
      setDecided(true)
      return
    }
    // Sin acceso confirmado: si el billing aún no cargó y el JWT tampoco da
    // acceso, esperar (no bloquear a un Max recién comprado con JWT viejo).
    if (isPending && !billingTier && jwtTier !== 'max' && !error) {
      return
    }
    showWarning(t('routeBlockedMax'))
    router.replace('/dashboard')
  }, [requirement, isAdminUser, effectiveTier, billingTier, jwtTier, isPending, error, router, t])

  if (!decided) return null

  return <>{children}</>
}
