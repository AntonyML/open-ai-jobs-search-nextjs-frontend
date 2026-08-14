/** Types and helpers for the CV Builder (FASE 2). */
import { API_BASE } from '@/lib/api'
import { getToken } from '@/lib/auth'

export interface CVAnalysis {
  match_score: number
  missing_keywords: string[]
  red_flags: string[]
  adapted_experience: string[]
}

export interface CVJobRef {
  id: string
  title: string
  company: string | null
  location: string | null
}

export interface CVResponse {
  cv_id: string
  cv_type: 'base' | 'personalized'
  /** 'active' | 'obsolete' for base CVs, null for personalized CVs. */
  base_status: 'active' | 'obsolete' | null
  job_url: string | null
  job_posting_id: string | null
  job: CVJobRef | null
  job_description_text: string | null
  json_cv: Record<string, unknown>
  pdf_url: string | null
  analysis: CVAnalysis | null
  created_at: string
}

/** A job posting (offer) available in the system, for adapting a CV. */
export interface JobOption {
  id: string
  title: string
  company: string | null
  location: string | null
  portal: string
  rank_score: number | null
  rank_verdict: string | null
}

/** Build the authenticated download URL for a CV's PDF. */
export function cvPdfUrl(cvId: string, pdfUrl?: string | null): string {
  if (pdfUrl) return pdfUrl
  return `${API_BASE}/api/v1/cv/${cvId}/download`
}

/**
 * Fetch a CV PDF as an object URL, sending the auth token so the
 * download endpoint accepts the request (same origin policy otherwise).
 */
export async function fetchCvPdfObjectUrl(pdfUrl: string): Promise<string> {
  const token = getToken()
  const res = await fetch(pdfUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(`PDF download failed (${res.status})`)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
