/**
 * Notifications — server-backed via `app_notifications` (replaces the old
 * localStorage-only history).
 *
 * Process events (`addNotification`) are persisted with `POST
 * /api/v1/notifications` so the bell shows history across sessions and
 * devices.  The bell (`NotificationBell`) reads them back with
 * `useNotifications`.
 */

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface ServerNotification {
  id: string
  type: string // info | credits_low | quota_exhausted | ia_exhausted | purchase_request | plan_expired | <action>[_error]
  title: string
  body: string | null
  is_read: boolean
  created_at: string | null
  /** Structured payload for deep-link actions (e.g. purchase_request). */
  payload: {
    user_id?: string
    user_email?: string
    user_name?: string | null
    plan_key?: string
    billing_cycle?: string
    correlation_id?: string
    // topup_request
    credits?: number
    // upgrade_prorate
    plan_from?: string
    plan_to?: string
    amount_due?: number
  } | null
}

/** Admin-actionable request types (deep-link to the admin credits page). */
export const REQUEST_TYPES = ['purchase_request', 'topup_request', 'refund_request', 'upgrade_prorate'] as const

export type RequestType = (typeof REQUEST_TYPES)[number]

export function isRequestType(type: string): type is RequestType {
  return (REQUEST_TYPES as readonly string[]).includes(type)
}

/**
 * Deep-link target for an admin-actionable request notification.
 *
 * The admin credits page reads the query params (``approve=topup|refund``,
 * ``plan``, ``cycle``, ``amount``, ``cid``) to pre-fill the approval form.
 */
export function requestDeepLink(notif: ServerNotification): string {
  const p = notif.payload ?? {}
  const qs = new URLSearchParams()
  if (p.user_id) qs.set('user', p.user_id)
  if (p.correlation_id) qs.set('cid', p.correlation_id)
  if (notif.type === 'purchase_request') {
    if (p.plan_key) qs.set('plan', p.plan_key)
    if (p.billing_cycle) qs.set('cycle', p.billing_cycle)
  } else if (notif.type === 'topup_request') {
    qs.set('approve', 'topup')
    if (p.credits) qs.set('credits', String(p.credits))
  } else if (notif.type === 'refund_request') {
    qs.set('approve', 'refund')
  } else if (notif.type === 'upgrade_prorate') {
    if (p.plan_to) qs.set('plan', p.plan_to)
    if (p.billing_cycle) qs.set('cycle', p.billing_cycle)
    if (typeof p.amount_due === 'number') qs.set('amount', String(p.amount_due))
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return `/admin/credits${suffix}`
}

/** Shape accepted by `addNotification`. */
export interface ProcessNotification {
  action: string
  description: string
  status: 'success' | 'error'
}

const MAX_TITLE = 120

export async function fetchNotifications(unreadOnly = false): Promise<ServerNotification[]> {
  const qs = unreadOnly ? '?unread_only=true' : ''
  return apiFetch<ServerNotification[]>(`/api/v1/notifications${qs}`)
}

export async function createNotification(
  type: string,
  title: string,
  body?: string | null,
): Promise<ServerNotification | null> {
  try {
    return await apiFetch<ServerNotification>('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify({ type, title, body: body ?? null }),
    })
  } catch {
    return null
  }
}

/** Persist a process event. */
export function addNotification(notif: ProcessNotification): void {
  const type = notif.status === 'error' ? `${notif.action}_error` : notif.action
  const title = notif.description.length > MAX_TITLE
    ? `${notif.description.slice(0, MAX_TITLE)}…`
    : notif.description
  void createNotification(type, title, notif.description).then((created) => {
    if (created) window.dispatchEvent(new Event('notifications:refresh'))
  })
}

export async function markAsRead(id: string): Promise<void> {
  try {
    await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
  } catch {
    // ignore
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await apiFetch('/api/v1/notifications/read-all', { method: 'POST' })
  } catch {
    // ignore
  }
}

export async function clearNotifications(): Promise<void> {
  try {
    await apiFetch('/api/v1/notifications', { method: 'DELETE' })
  } catch {
    // ignore
  }
}

/**
 * Polls the server notifications while mounted and dispatches
 * `notifications:refresh` so other components stay in sync.
 */
export function useNotifications(enabled = true, intervalMs = 15000) {
  const [notifs, setNotifs] = useState<ServerNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function load() {
      try {
        const rows = await fetchNotifications()
        if (!cancelled) setNotifs(rows)
      } catch {
        // silent — backend may be down
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const onRefresh = () => void load()
    const onFocus = () => void load()
    const timer = window.setInterval(() => void load(), intervalMs)
    window.addEventListener('notifications:refresh', onRefresh)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('notifications:refresh', onRefresh)
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, intervalMs])

  const unread = notifs.filter((n) => !n.is_read)
  return { notifications: notifs, unread, loading }
}
