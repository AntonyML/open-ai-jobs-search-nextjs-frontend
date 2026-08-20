'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { isNetworkError } from '@/lib/reconnect'

/**
 * Proveedor global de TanStack Query. Sustituye al event bus (`billing:updated`)
 * como mecanismo de sincronización: caché + deduplicación + invalidación explícita.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            // Network failures (backend asleep) get a few extra retries with
            // exponential backoff; other errors keep the original single retry.
            retry: (failureCount, error) =>
              isNetworkError(error) ? failureCount < 3 : failureCount < 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
            refetchOnWindowFocus: true,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}