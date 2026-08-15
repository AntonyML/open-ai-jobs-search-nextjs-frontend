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
  /** When the quota windows reset (drives the weekly quota bar). */
  next_reset_at: string | null
  features: string[]
  credits: CreditTransaction[]
  correlation_id: string | null
}

/** Flat effective costs (public/billing catalog — one entry per action). */
export interface CreditCosts {
  cv_base: number
  cv_adapted: number
  rank: number
  apply: number
  interview: number
  expand: number
  upskill: number
  verify: number
}

/** Admin view of one billable action (GET /admin/credit-costs). */
export interface CreditCostOut {
  key: string
  group: string
  cost: number
  default_cost: number
  feature_gate: string | null
  version: number
}

/** Rich admin catalog — the plans page renders from this (no hardcoded lists). */
export interface CreditCostsOut {
  groups: string[]
  actions: CreditCostOut[]
}

export interface TopupPack {
  price_usd: number
  credits: number
}

export interface BillingPolicy {
  refund_credit_threshold: number
  annual_cooling_days: number
}

export interface ProductCatalog {
  plans: Plan[]
  credit_costs: CreditCosts
  topup_packs: TopupPack[]
  whatsapp_number: string
  currency: string
  last_updated: string | null
}

export interface TopupRequest {
  pack_credits: number
  method: 'sinpe' | 'whatsapp' | 'email'
  phone?: string | null
  note?: string | null
}

export interface TopupRequestOut {
  ok: boolean
  correlation_id: string
  message: string
  whatsapp_number: string
  pack: TopupPack | null
}

/** Enriched 402/429 detail from enforce_action_gate (plan.md §4). */
export interface GateDetail {
  code: 'insufficient_credits' | 'quota_exceeded' | string
  message?: string
  balance?: number
  next_reset_at?: string | null
  quota_week_used?: number
  quota_week_limit?: number
  topup_packs?: TopupPack[]
  correlation_id?: string | null
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
  /** What the user actually paid (e.g. the prorated amount of an upgrade). */
  price_paid?: number
  note?: string | null
}

export interface AdminTopupApprove {
  user_id: string
  pack_credits: number
  /** Amount the user actually paid — required (plan.md §2.8). */
  price_paid: number
  correlation_id?: string | null
}

export interface AdminRefundApprove {
  user_id: string
  correlation_id?: string | null
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
  is_active?: boolean
  created_at?: string | null
}

/** Global stats for the admin dashboard (plan.md §2.7 — no legacy premium). */
export interface AdminUserListStats {
  total: number
  admins: number
  active_subs: number
}

export interface AdminUserListResponse {
  items: AdminUserSearchResult[]
  total: number
  page: number
  page_size: number
  stats: AdminUserListStats
}
