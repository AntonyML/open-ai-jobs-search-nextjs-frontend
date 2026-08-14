// ── Billing / credits types (mirrors backend app/schemas/billing.py) ──

export interface Plan {
  key: string
  name: string
  description: string | null
  price_monthly_usd: number
  price_yearly_usd: number
  credits_per_period: number
  refill_cadence: 'weekly' | 'period'
  refill_weekday: number
  daily_quota: number
  weekly_quota: number
  features: string[]
  is_active: boolean
  sort_order: number
}

export interface PlanAdmin extends Plan {
  id: string
  refill_weekday: number
  daily_quota: number
  weekly_quota: number
}

export interface UserSubscription {
  id: string
  plan_key: string
  correlation_id: string
  period_start: string | null
  period_end: string | null
  status: string
  source: string
  auto_renew: boolean
  price_paid: number
  is_expired: boolean
}

export interface CreditTransaction {
  id: string
  action: string
  credits_delta: number
  description: string | null
  model_used: string | null
  correlation_id: string | null
  created_at: string | null
}

export interface CreditStatus {
  tier: string
  plan_key: string | null
  plan_name: string | null
  has_active_subscription: boolean
  subscription: UserSubscription | null
  credits_balance: number
  credits_total: number
  credits_used: number
  period_start: string | null
  period_end: string | null
  quota_day_used: number
  quota_day_limit: number
  quota_week_used: number
  quota_week_limit: number
  features: string[]
  credits: CreditTransaction[]
  correlation_id: string | null
}

export interface CreditCosts {
  cv_base: number
  cv_adapted: number
  pipeline: number
}

export interface ProductCatalog {
  plans: Plan[]
  credit_costs: CreditCosts
  whatsapp_number: string
  currency: string
  last_updated: string | null
}

export interface PurchaseRequest {
  plan_key: string
  method: 'sinpe' | 'whatsapp' | 'email'
  phone?: string | null
  note?: string | null
  billing_cycle: 'monthly' | 'yearly'
}

export interface PurchaseRequestOut {
  ok: boolean
  correlation_id: string
  message: string
  whatsapp_number: string
}

export interface AdminCreditAdjust {
  user_id: string
  delta: number
  reason?: string | null
}

export interface AdminSubscriptionCreate {
  user_id: string
  plan_key: string
  billing_cycle: 'monthly' | 'yearly'
  auto_renew: boolean
  note?: string | null
}

export interface SubscriptionAdmin {
  id: string
  plan_key: string
  correlation_id: string
  period_start: string | null
  period_end: string | null
  status: string
  source: string
  auto_renew: boolean
  price_paid: number
  is_expired: boolean
  user_id: string
  user_email: string
}

export interface AdminUserSearchResult {
  id: string
  email: string
  full_name: string | null
  tier: string
  role: string
}
