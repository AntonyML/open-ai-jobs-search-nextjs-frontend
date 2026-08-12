'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { isAdmin } from '@/lib/auth'
import {
  markNotificationRead,
  markAllNotificationsRead,
  useAdminNotifications,
  type AdminNotification,
} from '@/lib/adminNotifications'
import { showError } from '@/lib/toasts'

// ── Icons ──────────────────────────────────────────────────────────

function PurchaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'quota_exhausted' || type === 'ia_exhausted') {
    return <AlertIcon />
  }
  return <PurchaseIcon />
}

function BellIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] animate-pulse-dot items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}

function NotificationTypeBadge({ type }: { type: string }) {
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
  return (
    <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#707070] ring-1 ring-[#d2d2d7]/50">
      Info
    </span>
  )
}

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

function NotificationItem({ notif, onRead }: { notif: AdminNotification; onRead: () => void }) {
  return (
    <button
      type="button"
      onClick={onRead}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
        !notif.is_read ? 'bg-[#fffbf0] hover:bg-[#fff6e0]' : 'hover:bg-[#f5f5f7]'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${notif.type === 'quota_exhausted' || notif.type === 'ia_exhausted' ? 'text-rose-500' : 'text-amber-500'}`}>
        <TypeIcon type={notif.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <NotificationTypeBadge type={notif.type} />
          {!notif.is_read && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff9500]" />}
        </div>
        <p className="mt-1 text-[12px] font-semibold leading-snug text-[#1d1d1f]">{notif.title}</p>
        {notif.body && <p className="mt-0.5 text-[11px] leading-snug text-[#707070] line-clamp-3">{notif.body}</p>}
        <p className="mt-1 text-[10px] text-[#a0a0a0]">{formatTimestamp(notif.created_at)}</p>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — admin-only bell (purchase requests + alerts)
// ═══════════════════════════════════════════════════════════════════

export default function AdminNotificationBell() {
  const t = useTranslations('adminNotifs')
  const router = useRouter()
  const enabled = typeof window !== 'undefined' && isAdmin()
  const { notifs, unread } = useAdminNotifications(enabled)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [busy, setBusy] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  if (!enabled) return null

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  async function handleReadAll() {
    setBusy(true)
    try {
      await markAllNotificationsRead()
      window.dispatchEvent(new Event('notifications:refresh'))
    } catch {
      showError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleReadOne(id: string) {
    try {
      await markNotificationRead(id)
      window.dispatchEvent(new Event('notifications:refresh'))
    } catch {
      showError(t('error'))
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
            ? 'bg-[#ff9500] text-white'
            : unread.length > 0
              ? 'text-amber-600 hover:bg-amber-50'
              : 'text-[#707070] hover:bg-[#f5f5f7]'
        }`}
        aria-label={t('label', { count: unread.length })}
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
            <div className="flex items-center justify-between border-b border-[#e2e2e5] bg-gradient-to-r from-amber-50/60 to-white px-4 py-3">
              <div>
                <p className="text-[12px] font-semibold text-[#1d1d1f]">{t('title')}</p>
                <p className="text-[10px] text-[#a0a0a0]">{t('subtitle')}</p>
              </div>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={handleReadAll}
                  disabled={busy}
                  className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#ff9500] ring-1 ring-amber-200/70 transition-all hover:bg-amber-50 disabled:opacity-50"
                >
                  {t('markAll')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <TypeIcon type="info" />
                  <p className="text-[12px] text-[#858585]">{t('empty')}</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <NotificationItem key={n.id} notif={n} onRead={() => handleReadOne(n.id)} />
                ))
              )}
            </div>

            <div className="border-t border-[#e2e2e5] px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push('/admin/credits')
                }}
                className="w-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110"
              >
                {t('manage')}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
