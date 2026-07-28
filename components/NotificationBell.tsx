'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  type ProcessNotification,
} from '@/lib/notifications'

const PIPELINE_LABELS: Record<string, string> = {
  rank: 'Ranking',
  search: 'Search',
  expand: 'Skill expansion',
  upskill: 'Upskill',
  apply: 'Application',
}

// ── Bell Icon ────────────────────────────────────────────────────

function BellIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}

// ── Status Icon ──────────────────────────────────────────────────

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

// ── Time formatter ───────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString()
}

// ── Notification Item ────────────────────────────────────────────

function NotificationItem({
  notif,
  onClick,
}: {
  notif: ProcessNotification
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
        !notif.read ? 'bg-[#f4f8fb] hover:bg-[#eef4f8]' : 'hover:bg-[#f5f5f7]'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <StatusIcon status={notif.status} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#0066cc]">
            {PIPELINE_LABELS[notif.pipeline] || notif.pipeline}
          </span>
          {!notif.read && (
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#0071e3]" />
          )}
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-[#1d1d1f] line-clamp-2">
          {notif.description}
        </p>
        <p className="mt-0.5 text-[10px] text-[#858585]">{formatTimestamp(notif.timestamp)}</p>
      </div>
    </button>
  )
}

// ── Empty State ──────────────────────────────────────────────────

function EmptyBellState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d2d2d7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <p className="text-[12px] text-[#858585]">No notifications yet</p>
      <p className="text-[10px] text-[#d2d2d7]">Complete a pipeline step to see it here.</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function NotificationBell() {
  const { notifications, unread } = useNotifications()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown on click outside
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
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen((o) => !o)
  }

  return (
    <>
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
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <BellIcon count={unread} />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right }}
            className="z-[60] w-80 animate-fade-in-up overflow-hidden rounded-xl border border-[#d2d2d7] bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e2e2e5] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#1d1d1f]">Notifications</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    className="text-[10px] font-medium text-[#0066cc] transition-colors hover:text-[#0071e3]"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearNotifications()
                      setOpen(false)
                    }}
                    className="text-[10px] font-medium text-[#858585] transition-colors hover:text-[#ff3b30]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <EmptyBellState />
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onClick={() => markAsRead(notif.id)}
                  />
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
