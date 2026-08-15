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
