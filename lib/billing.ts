// ── Billing API client ──────────────────────────────────────────────

import { apiFetch } from '@/lib/api'
import type {
  AdminCreditAdjust,
  AdminSubscriptionCreate,
  AdminUserSearchResult,
  CreditStatus,
  CreditTransaction,
  PlanAdmin,
  ProductCatalog,
  PurchaseRequest,
  PurchaseRequestOut,
  SubscriptionAdmin,
} from '@/types/billing'

export async function getBillingStatus(): Promise<CreditStatus> {
  return apiFetch<CreditStatus>('/api/v1/billing/status')
}

export async function getBillingCatalog(): Promise<ProductCatalog> {
  return apiFetch<ProductCatalog>('/api/v1/billing/catalog')
}

export async function getCreditTransactions(): Promise<CreditTransaction[]> {
  return apiFetch<CreditTransaction[]>('/api/v1/billing/transactions')
}

export async function requestPurchase(payload: PurchaseRequest): Promise<PurchaseRequestOut> {
  return apiFetch<PurchaseRequestOut>('/api/v1/billing/purchase', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Admin endpoints ────────────────────────────────────────────────

export async function adminListPlans(): Promise<PlanAdmin[]> {
  return apiFetch<PlanAdmin[]>('/api/v1/admin/plans')
}

export async function adminUpsertPlan(planKey: string, data: Partial<PlanAdmin>): Promise<PlanAdmin> {
  return apiFetch<PlanAdmin>(`/api/v1/admin/plans/${encodeURIComponent(planKey)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function adminDeletePlan(planKey: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/admin/plans/${encodeURIComponent(planKey)}`, {
    method: 'DELETE',
  })
}

export async function adminGetCreditCosts(): Promise<{ cv_base: number; cv_adapted: number; pipeline: number }> {
  return apiFetch('/api/v1/admin/credit-costs')
}

export async function adminSetCreditCosts(
  costs: { cv_base: number; cv_adapted: number; pipeline: number },
): Promise<{ cv_base: number; cv_adapted: number; pipeline: number }> {
  return apiFetch('/api/v1/admin/credit-costs', {
    method: 'PUT',
    body: JSON.stringify(costs),
  })
}

export async function adminAdjustCredits(payload: AdminCreditAdjust): Promise<{ user_id: string; balance: number }> {
  return apiFetch('/api/v1/admin/credits/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function adminListSubscriptions(params?: {
  plan?: string
  status?: string
  limit?: number
}): Promise<SubscriptionAdmin[]> {
  const qs = new URLSearchParams()
  if (params?.plan) qs.set('plan', params.plan)
  if (params?.status) qs.set('status_filter', params.status)
  if (params?.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<SubscriptionAdmin[]>(`/api/v1/admin/subscriptions${suffix}`)
}

export async function adminActivateSubscription(payload: AdminSubscriptionCreate): Promise<SubscriptionAdmin> {
  return apiFetch<SubscriptionAdmin>('/api/v1/admin/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function adminUserTransactions(userId: string): Promise<CreditTransaction[]> {
  return apiFetch<CreditTransaction[]>(`/api/v1/admin/users/${encodeURIComponent(userId)}/transactions`)
}

export async function adminSearchUsers(search: string): Promise<AdminUserSearchResult[]> {
  const qs = new URLSearchParams()
  qs.set('search', search)
  qs.set('page_size', '8')
  const data = await apiFetch<{ items: AdminUserSearchResult[] }>(`/api/v1/admin/users?${qs.toString()}`)
  return data.items
}
