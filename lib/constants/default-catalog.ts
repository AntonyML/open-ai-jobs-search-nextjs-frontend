import type { ProductCatalog } from '@/types/billing'

/**
 * Static baseline public catalog.
 *
 * Guarantees zero-latency rendering on the landing page, /limits, and auth routes
 * even when the Render backend is cold-starting or sleeping.
 *
 * Stale-While-Revalidate will silently refresh this catalog in the background
 * when the server responds.
 */
export const DEFAULT_CATALOG: ProductCatalog = {
  version: 1724000000,
  last_updated: '2026-08-20T00:00:00.000Z',
  currency: 'USD',
  whatsapp_number: '+50600000000',
  credit_costs: {
    cv_base: 1,
    cv_adapted: 1,
    rank: 1,
    apply: 1,
    interview: 1,
    expand: 1,
    upskill: 1,
    verify: 1,
  },
  topup_packs: [
    { price_usd: 9.99, credits: 50 },
    { price_usd: 19.99, credits: 120 },
  ],
  plans: [
    {
      key: 'free',
      name: 'Free',
      description: 'Prueba la IA para adaptar tu CV a ofertas laborales.',
      price_monthly_usd: 0.0,
      price_yearly_usd: 0.0,
      credits_per_period: 2,
      refill_cadence: 'weekly',
      refill_weekday: 0,
      daily_quota: 0,
      weekly_quota: 0,
      features: ['cv_base', 'cv_adapted'],
      is_active: true,
      sort_order: 10,
    },
    {
      key: 'pro',
      name: 'Pro',
      description: 'Ideal para búsqueda activa de empleo con alto volumen de postulaciones.',
      price_monthly_usd: 24.99,
      price_yearly_usd: 249.0,
      credits_per_period: 80,
      refill_cadence: 'period',
      refill_weekday: 0,
      daily_quota: 0,
      weekly_quota: 0,
      features: ['cv_base', 'cv_adapted'],
      is_active: true,
      sort_order: 20,
    },
    {
      key: 'max',
      name: 'Max',
      description: 'Acceso total a pipeline, simulaciones de entrevistas, Expand y Upskill.',
      price_monthly_usd: 69.99,
      price_yearly_usd: 699.0,
      credits_per_period: 350,
      refill_cadence: 'period',
      refill_weekday: 0,
      daily_quota: 12,
      weekly_quota: 50,
      features: ['cv_base', 'cv_adapted', 'pipeline', 'expand', 'upskill'],
      is_active: true,
      sort_order: 30,
    },
  ],
}

/**
 * Resolves the newest catalog based on version / last_updated timestamp.
 * Protects against stale responses overriding newer cached data.
 */
export function resolveLatestCatalog(
  current: ProductCatalog,
  incoming: ProductCatalog | null | undefined
): ProductCatalog {
  if (!incoming || !incoming.plans || incoming.plans.length === 0) return current
  if (incoming.version && current.version && incoming.version < current.version) {
    return current
  }
  return incoming
}
