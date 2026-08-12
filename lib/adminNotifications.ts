// ── Admin notifications API client (app_notifications) ─────────────

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface AdminNotification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string | null
}

export async function fetchNotifications(unreadOnly = false): Promise<AdminNotification[]> {
  const qs = unreadOnly ? '?unread_only=true' : ''
  return apiFetch<AdminNotification[]>(`/api/v1/notifications${qs}`)
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/api/v1/notifications/read-all', { method: 'POST' })
}

/**
 * Polls the notifications endpoint while the user is an admin.
 * Dispatches `notifications:updated` so other components stay in sync.
 */
export function useAdminNotifications(enabled: boolean, intervalMs = 15000) {
  const [notifs, setNotifs] = useState<AdminNotification[]>([])
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
    const timer = window.setInterval(() => void load(), intervalMs)
    window.addEventListener('notifications:refresh', onRefresh)
    window.addEventListener('billing:updated', onRefresh)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('notifications:refresh', onRefresh)
      window.removeEventListener('billing:updated', onRefresh)
    }
  }, [enabled, intervalMs])

  const unread = notifs.filter((n) => !n.is_read)
  const purchasePending = notifs.filter((n) => n.type === 'purchase_request' && !n.is_read)

  return { notifs, loading, unread, purchasePending }
}
