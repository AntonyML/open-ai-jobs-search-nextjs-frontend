'use client'

import { useEffect, useRef, useState } from 'react'
import { useNotifications, markAsRead, markAllAsRead, clearNotifications, type ProcessNotification } from '@/lib/notifications'

const PIPELINE_LABELS: Record<string, string> = {
  rank: 'Ranking',
  scrape: 'Scraping',
  expand: 'Skill expansion',
  upskill: 'Upskill',
  apply: 'Application',
}

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <span className="relative">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {hasUnread && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
          •
        </span>
      )}
    </span>
  )
}

function StatusIcon({ status }: { status: 'success' | 'error' }) {
  if (status === 'success') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString()
}

function NotificationItem({ notif, onClick }: { notif: ProcessNotification; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5f5f7] ${
        !notif.read ? 'bg-[#f4f8fb]' : ''
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <StatusIcon status={notif.status} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#0066cc] uppercase tracking-wide">
            {PIPELINE_LABELS[notif.pipeline] || notif.pipeline}
          </span>
          {!notif.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-[#1d1d1f] leading-snug line-clamp-2">
          {notif.description}
        </p>
        <p className="mt-0.5 text-[10px] text-[#b0b0b0]">
          {formatTimestamp(notif.timestamp)}
        </p>
      </div>
    </button>
  )
}

export default function NotificationBell() {
  const { notifications, unread } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const handleToggle = () => {
    setOpen(o => !o)
  }

  const handleItemClick = (id: string) => {
    markAsRead(id)
    // Keep dropdown open on click
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleClear = () => {
    clearNotifications()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        data-cuelume-press
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          open
            ? 'bg-[#0071e3] text-white'
            : unread > 0
            ? 'text-[#0071e3] hover:bg-[#f4f8fb]'
            : 'text-[#707070] hover:bg-[#f5f5f7]'
        }`}
        title="Notifications"
      >
        <BellIcon hasUnread={unread > 0} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[#d2d2d7] bg-white shadow-lg shadow-black/5 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e2e5]">
            <p className="text-[12px] font-semibold text-[#1d1d1f]">
              Notifications
            </p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-medium text-[#0071e3] hover:text-[#0066cc] transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] font-medium text-[#858585] hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d2d2d7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-[12px] text-[#b0b0b0]">No notifications yet</p>
                <p className="text-[10px] text-[#d2d2d7]">
                  Complete a pipeline step to see it here.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onClick={() => handleItemClick(notif.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
