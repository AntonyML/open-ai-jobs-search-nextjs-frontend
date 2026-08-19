'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { MobileAppLauncher } from './MobileAppLauncher'
import { MobileBottomNavigation } from './MobileBottomNavigation'

interface MobileNavigationContextValue {
  /** True cuando el provider está montado (dentro del layout autenticado). */
  available: boolean
  launcherOpen: boolean
  openLauncher: () => void
  closeLauncher: () => void
}

const NOOP: MobileNavigationContextValue = {
  available: false,
  launcherOpen: false,
  openLauncher: () => {},
  closeLauncher: () => {},
}

const MobileNavigationContext = createContext<MobileNavigationContextValue>(NOOP)

/** Acceso al launcher desde cualquier componente (fuera del provider devuelve no-op). */
export function useMobileNavigation(): MobileNavigationContextValue {
  return useContext(MobileNavigationContext)
}

/**
 * Provee el estado del launcher móvil (una única instancia por layout autenticado)
 * y lo cierra ante cada cambio de ruta para conservar la convención de deep links:
 * la navegación nunca depende de estado local, siempre de la URL.
 */
export function MobileNavigationProvider({ children }: { children: React.ReactNode }) {
  const [launcherOpen, setLauncherOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLauncherOpen(false)
  }, [pathname])

  const value = useMemo<MobileNavigationContextValue>(
    () => ({
      available: true,
      launcherOpen,
      openLauncher: () => setLauncherOpen(true),
      closeLauncher: () => setLauncherOpen(false),
    }),
    [launcherOpen],
  )

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
      <MobileAppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
      <MobileBottomNavigation />
    </MobileNavigationContext.Provider>
  )
}