// ── TanStack Query — key factory ────────────────────────────────────

export const billingKeys = {
  all: ['billing'] as const,
  status: () => [...billingKeys.all, 'status'] as const,
  catalog: () => [...billingKeys.all, 'catalog'] as const,
  transactions: () => [...billingKeys.all, 'transactions'] as const,
}