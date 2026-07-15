/**
 * Notification history — tracks completed pipeline processes (ranking, scraping, etc.)
 * with persistence in localStorage so the bell icon shows history across sessions.
 *
 * Each notification stores: pipeline name, description, status (success/error),
 * timestamp, and read/unread state.
 */

'use client'

import { useEffect, useState } from 'react'

export interface ProcessNotification {
  id: string
  pipeline: string
  description: string
  status: 'success' | 'error'
  timestamp: string  // ISO 8601
  read: boolean
}

const STORAGE_KEY = 'pipeline_notifications'
const MAX_NOTIFICATIONS = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getNotifications(): ProcessNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ProcessNotification[]
  } catch {
    return []
  }
}

function saveNotifications(notifs: ProcessNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs))
  } catch {
    // localStorage full — silently ignore
  }
}

export function addNotification(notif: Omit<ProcessNotification, 'id' | 'timestamp' | 'read'>): void {
  const notifs = getNotifications()
  notifs.unshift({
    ...notif,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  })
  // Keep only the most recent N
  if (notifs.length > MAX_NOTIFICATIONS) {
    notifs.length = MAX_NOTIFICATIONS
  }
  saveNotifications(notifs)
  window.dispatchEvent(new Event('notification-change'))
}

export function markAsRead(id: string): void {
  const notifs = getNotifications()
  const idx = notifs.findIndex(n => n.id === id)
  if (idx !== -1) {
    notifs[idx].read = true
    saveNotifications(notifs)
    window.dispatchEvent(new Event('notification-change'))
  }
}

export function markAllAsRead(): void {
  const notifs = getNotifications()
  for (const n of notifs) n.read = true
  saveNotifications(notifs)
  window.dispatchEvent(new Event('notification-change'))
}

export function clearNotifications(): void {
  saveNotifications([])
  window.dispatchEvent(new Event('notification-change'))
}

export function unreadCount(): number {
  return getNotifications().filter(n => !n.read).length
}

/**
 * React hook that subscribes to notification changes.
 * Re-renders the component whenever a notification is added or marked read.
 */
export function useNotifications() {
  const [notifs, setNotifs] = useState<ProcessNotification[]>([])
  const [unread, setUnread] = useState(0)

  // We use a nonce to force refresh — incremented by pages when they add a notification
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    setNotifs(getNotifications())
    setUnread(unreadCount())

    // Listen for storage changes (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setNotifs(getNotifications())
        setUnread(unreadCount())
      }
    }
    window.addEventListener('storage', onStorage)

    // Custom event for same-tab notification changes
    const onNotifChange = () => {
      setNotifs(getNotifications())
      setUnread(unreadCount())
    }
    window.addEventListener('notification-change', onNotifChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('notification-change', onNotifChange)
    }
  }, [nonce])

  const refresh = () => setNonce(n => n + 1)

  return { notifications: notifs, unread, refresh }
}
