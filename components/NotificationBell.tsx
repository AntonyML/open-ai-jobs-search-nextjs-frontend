'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { isAdmin } from '@/lib/auth'
import {
  markAsRead,
  markAllAsRead,
  clearNotifications,
  useNotifications,
  type ServerNotification,
} from '@/lib/notifications'
import { showError } from '@/lib/toasts'

// ── Icons ──────────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function PurchaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

// ── Pipeline labels (from the server `type`) ───────────────────────

const PIPELINE_LABELS: Record<string, string> = {
  rank: 'Ranking',
  search: 'Search',
  scrape: 'Search',
  expand: 'Skill expansion',
  upskill: 'Upskill',
  apply: 'Application',
  interview: 'Interview',
  rank_error: 'Ranking',
  search_error: 'Search',
  scrape_error: 'Search',
  expand_error: 'Skill expansion',
  upskill_error: 'Upskill',
  apply_error: 'Application',
  interview_error: 'Interview',
}

function isErrorType(type: string): boolean {
  return type.endsWith('_error')
}

function isAlertType(type: string): boolean {
  return type === 'purchase_request' || type === 'quota_exhausted' || type === 'ia_exhausted'
}

function typeIconColor(type: string): string {
  if (isErrorType(type)) return 'text-[#ff3b30]'
  if (type === 'purchase_request' || type === 'quota_exhausted' || type === 'ia_exhausted') return 'text-amber-500'
  return 'text-[#34c759]'
}

// ── Type badge ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  if (type === 'purchase_request') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200/60">
        <PurchaseIcon />
        Purchase
      </span>
    )
  }
  if (type === 'quota_exhausted' || type === 'ia_exhausted') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-rose-200/60">
        Alert
      </span>
    )
  }
  if (PIPELINE_LABELS[type]) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#f4f8fb] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#0066cc] ring-1 ring-[#0071e3]/20">
        {PIPELINE_LABELS[type]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#707070] ring-1 ring-[#d2d2d7]/50">
      Info
    </span>
  )
}

// ── Time formatter ────────────────────────────────────────────────

function formatTimestamp(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
  return d.toLocaleDateString()
}

// ── Notification item ─────────────────────────────────────────────

function NotificationItem({ notif, onRead }: { notif: ServerNotification; onRead: () => void }) {
  const error = isErrorType(notif.type)
  const unread = !notif.is_read
  return (
    <button
      type="button"
      onClick={onRead}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
        unread ? 'bg-[#f4f8fb] hover:bg-[#eef4f8]' : 'hover:bg-[#f5f5f7]'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${typeIconColor(notif.type)}`}>
        {error ? <ErrorIcon /> : isAlertType(notif.type) ? <PurchaseIcon /> : <SuccessIcon />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TypeBadge type={notif.type} />
          {unread && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#0071e3]" />}
        </div>
        <p className="mt-1 text-[12px] font-semibold leading-snug text-[#1d1d1f]">{notif.title}</p>
        {notif.body && notif.body !== notif.title && (
          <p className="mt-0.5 text-[11px] leading-snug text-[#707070] line-clamp-2">{notif.body}</p>
        )}
        <p className="mt-1 text-[10px] text-[#858585]">{formatTimestamp(notif.created_at)}</p>
      </div>
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────────

function EmptyBellState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="text-[#d2d2d7]">
        <InfoIcon />
      </span>
      <p className="text-[12px] text-[#858585]">{t('noNotifications')}</p>
      <p className="text-[10px] text-[#d2d2d7]">{t('noNotificationsHint')}</p>
    </div>
  )
}

// ── Bell icon ─────────────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — server-backed bell for all users
// ═══════════════════════════════════════════════════════════════════

export default function NotificationBell() {
  const t = useTranslations('nav')
  const router = useRouter()
  const { notifications, unread } = useNotifications()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [busy, setBusy] = useState(false)
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

  async function handleMarkAll() {
    setBusy(true)
    try {
      await markAllAsRead()
      window.dispatchEvent(new Event('notifications:refresh'))
    } catch {
      showError(t('notificationsMarkAllError'))
    } finally {
      setBusy(false)
    }
  }

  async function handleClear() {
    setBusy(true)
    try {
      await clearNotifications()
      window.dispatchEvent(new Event('notifications:refresh'))
      setOpen(false)
    } catch {
      showError(t('notificationsClearError'))
    } finally {
      setBusy(false)
    }
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
            : unread.length > 0
              ? 'text-[#0071e3] hover:bg-[#f4f8fb]'
              : 'text-[#707070] hover:bg-[#f5f5f7]'
        }`}
        aria-label={`${t('notifications')}${unread.length > 0 ? ` (${unread.length})` : ''}`}
      >
        <BellIcon count={unread.length} />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right }}
            className="z-[60] w-80 animate-fade-in-up overflow-hidden rounded-xl border border-[#d2d2d7] bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e2e2e5] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#1d1d1f]">{t('notifications')}</p>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    disabled={busy}
                    className="text-[10px] font-medium text-[#0066cc] transition-colors hover:text-[#0071e3] disabled:opacity-50"
                  >
                    {t('markAllRead')}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={busy}
                    className="text-[10px] font-medium text-[#858585] transition-colors hover:text-[#ff3b30] disabled:opacity-50"
                  >
                    {t('clearNotifications')}
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <EmptyBellState t={t} />
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={() => {
                      void markAsRead(notif.id)
                      window.dispatchEvent(new Event('notifications:refresh'))
                    }}
                  />
                ))
              )}
            </div>

            {/* Admin footer */}
            {isAdmin() && notifications.length > 0 && (
              <div className="border-t border-[#e2e2e5] px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    router.push('/admin/credits')
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110"
                >
                  {t('manageSubscriptions')}
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
