/** Shared types for the job search pipeline */
import type { LucideIcon } from 'lucide-react'

// ── User & Auth ─────────────────────────────────────────────────

export interface UserInfo {
  sub: string
  role: string
  tier: 'free' | 'premium'
  exp: number
}

export interface UsageData {
  tier: string
  limits: {
    max_apply_count: number
    max_prepare_count: number
    max_rank_iterations: number
    max_track_count: number
  }
  usage: {
    applications: number
    interview_preps: number
    rank_iterations: number
    outcomes: number
  }
}

// ── Providers ──────────────────────────────────────────────────

export interface ProviderOption {
  name: string
  display_name: string
  default_model: string
}

export interface ProviderCredential {
  provider: string
  api_key: string
  api_base: string
  model: string
  is_active: boolean
}

export interface ProviderModel {
  id: string
  name?: string
  provider?: string
}

// ── Job Posting ────────────────────────────────────────────────

export interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  rank_score: number | null
  rank_verdict: string | null
  salary?: {
    salary_delta_pct: number
    company_name: string
    match_confidence: number
  }
  created_at: string
}

// ── Pipeline Steps ─────────────────────────────────────────────

export type PipelineStep = 'providers' | 'setup' | 'search' | 'rank' | 'apply' | 'interview' | 'outcome'
export type ExtraStep = 'expand' | 'upskill'

export interface PipelineStepMeta {
  key: PipelineStep
  label: string
  eyebrow: string
  href: string
  order: number
}

export const PIPELINE_STEPS: PipelineStepMeta[] = [
  { key: 'providers', label: 'Providers', eyebrow: '01 / CONFIGURE', href: '/pipeline/providers', order: 0 },
  { key: 'setup',     label: 'Setup',     eyebrow: '02 / PROFILE',   href: '/pipeline/setup',     order: 1 },
  { key: 'search',    label: 'Search',    eyebrow: '03 / DISCOVER',  href: '/pipeline/search',    order: 2 },
  { key: 'rank',      label: 'Rank',      eyebrow: '04 / EVALUATE',  href: '/pipeline/rank',      order: 3 },
  { key: 'apply',     label: 'Apply',     eyebrow: '05 / APPLY',     href: '/pipeline/apply',     order: 4 },
  { key: 'interview', label: 'Interview',  eyebrow: '06 / PREP',      href: '/pipeline/interview', order: 5 },
  { key: 'outcome',   label: 'Outcome',   eyebrow: '07 / TRACK',     href: '/pipeline/outcome',   order: 6 },
]

// ── Apply ──────────────────────────────────────────────────────

export interface Application {
  id: string
  job_posting_id: string
  created_at: string
  job_posting?: {
    id: string
    company: string | null
    title: string
  } | null
}

// ── Interview ──────────────────────────────────────────────────

export interface InterviewPrepSummary {
  id: string
  application_id: string
  stage: string
  interview_date: string | null
  interview_format: string | null
  created_at: string
}

export interface InterviewPrep {
  id: string
  application_id: string
  stage: string
  interview_date: string | null
  interview_format: string | null
  interviewer_names: string[] | null
  company_research: {
    mission: string | null
    values: string[]
    recent_news: { title: string; url: string; date: string }[]
    products: string[]
    team_structure: string | null
    growth_signals: string[]
    red_flags: string[]
  } | null
  conversation_hooks: { topic: string; source_url: string; why_relevant: string }[]
  likely_questions: { question: string; source: string; priority: string }[]
  star_mapping: { question: string; star_example_id: string; star_example_title: string }[]
  new_star_drafts: { question: string; draft_situation: string; draft_task: string; draft_action: string; draft_result: string }[]
  consistency_brief: { claim: string; source: string; why_probed: string }[]
  tough_questions: { question: string; answer: string }[]
  questions_to_ask: { question: string; category: string; why_ask: string }[]
  logistics: { date: string | null; format: string | null; interviewer_names: string[]; phone_video_tips: string[] } | null
  mock_transcript: string | null
  created_at: string
}

export interface MockResponse {
  prep_id: string
  question: string
  feedback: string | null
  question_number: number
  total_questions: number
  is_complete: boolean
  transcript: { role: string; content: string }[]
  message: string
}

// ── Outcome ────────────────────────────────────────────────────

export interface OutcomeSummary {
  id: string
  application_id: string
  status: string
  date_resolved: string | null
  created_at: string
}

export interface FunnelMetrics {
  total_applications: number
  interviews: number
  offers: number
  hired: number
  rejected: number
  no_response: number
  withdrawn: number
  in_progress: number
  application_to_interview_pct: number
  interview_to_offer_pct: number
  offer_to_hired_pct: number
  overall_success_pct: number
}

export interface CalibrationKeyword {
  keyword: string
  present_in_count: number
  interview_rate: number
  hire_rate: number
  avg_score: number
  correlation: string
}

export interface CalibrationInsight {
  category: string
  insight: string
  recommendation: string
  impact: string
}

export interface CalibrationReport {
  funnel: FunnelMetrics
  top_keywords: CalibrationKeyword[]
  bottom_keywords: CalibrationKeyword[]
  insights: CalibrationInsight[]
  data_points: number
  generated_at: string
}

// ── Props for reusable components ──────────────────────────────

export interface FormField {
  name: string
  label: string
  type?: string
  optional?: boolean
}

export interface PipelinePageProps {
  title: string
  eyebrow: string
  subtitle?: string
  endpoint: string
  listEndpoint?: string
  fields: FormField[]
  step: number
  next?: string
  actionLabel?: string
  actionDisabled?: boolean
  actionDisabledTooltip?: string
  emptyTitle?: string
  emptyDesc?: string
  emptyAction?: string
  emptyHref?: string
  emptyPrevTitle?: string
  emptyPrevDesc?: string
  emptyPrevAction?: string
  emptyPrevHref?: string
  emptyPrevDone?: boolean
  emptyPrevLabel?: string
  emptyPrevKey?: string
  cardMode?: boolean
  actionField?: string
  statusEndpoint?: string
  continueTooltip?: string
  continueLabel?: string
}

export interface UpgradeBannerProps {
  message: string
  usage?: string
  onUpgrade: () => void
  upgradeLabel?: string
}

export interface TabOption {
  key: string
  label: string
  icon?: LucideIcon
}
