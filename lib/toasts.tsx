/**
 * Toast utility — wraps react-hot-toast with Apple-inspired styling,
 * consistent UX patterns, and proper accessibility.
 *
 * Usage:
 *   showSuccess('Profile saved!')
 *   showError('Failed to save profile')
 *   showWarning('Please enter a valid amount')
 *   showInfo('Calibration refreshed')
 *   showLoading('Ranking jobs…')
 *   showPromise(saveProfile(), { loading: 'Saving…', success: 'Saved!', error: 'Failed' })
 *
 * Accessibility: all toasts use role="status" (success/info/loading) or
 * role="alert" (error) with aria-live so screen readers announce them.
 *
 * NOTE: Base visual styles (background, color, border-radius, font-size,
 * max-width, padding) are defined once in the <Toaster> component at
 * app/layout.tsx via toastOptions. Custom renders here inherit those
 * defaults and only add layout-specific styles.
 */

import toast from 'react-hot-toast'

const TOAST_DURATION = 4000

/* ── Icons ──────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34c759"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ff3b30"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ff9500"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0071e3"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0071e3"
      strokeWidth="2.5"
      className="animate-spin"
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

/** Shared layout for all custom toasts. Applies only spacing/layout —
 *  visual tokens (background, color, border-radius, etc.) come from
 *  the <Toaster> toastOptions in layout.tsx. */
function ToastRow({
  children,
  visible,
  role = 'status',
}: {
  children: React.ReactNode
  visible: boolean
  role?: 'status' | 'alert'
}) {
  return (
    <div
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={visible ? 'animate-fade-in-up' : 'animate-fade-out-down'}
      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
    >
      {children}
    </div>
  )
}

/** Optional subtitle line — used by admin toasts that need extra context. */
function Subtitle({ text }: { text: string }) {
  return (
    <p style={{ fontSize: '12px', lineHeight: 1.4, opacity: 0.7, marginTop: '2px' }}>
      {text}
    </p>
  )
}

/* ── Public API ─────────────────────────────────────────────────── */

export function showSuccess(message: string, subtitle?: string) {
  toast.custom(
    (t) => (
      <ToastRow visible={t.visible}>
        <CheckIcon />
        <div>
          <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
          {subtitle && <Subtitle text={subtitle} />}
        </div>
      </ToastRow>
    ),
    { duration: TOAST_DURATION },
  )
}

export function showError(message: string, subtitle?: string) {
  toast.custom(
    (t) => (
      <ToastRow visible={t.visible} role="alert">
        <XIcon />
        <div>
          <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
          {subtitle && <Subtitle text={subtitle} />}
        </div>
      </ToastRow>
    ),
    { duration: TOAST_DURATION },
  )
}

export function showWarning(message: string, subtitle?: string) {
  toast.custom(
    (t) => (
      <ToastRow visible={t.visible}>
        <WarningIcon />
        <div>
          <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
          {subtitle && <Subtitle text={subtitle} />}
        </div>
      </ToastRow>
    ),
    { duration: 6000 },
  )
}

export function showInfo(message: string, subtitle?: string) {
  toast.custom(
    (t) => (
      <ToastRow visible={t.visible}>
        <InfoIcon />
        <div>
          <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
          {subtitle && <Subtitle text={subtitle} />}
        </div>
      </ToastRow>
    ),
    { duration: TOAST_DURATION },
  )
}

export function showLoading(message: string): string {
  return toast.custom(
    (t) => (
      <ToastRow visible={t.visible}>
        <Spinner />
        <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
      </ToastRow>
    ),
    { duration: Infinity },
  )
}

export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}

/**
 * Wraps a promise with loading/success/error toasts.
 * Uses toast.promise which inherits the <Toaster> toastOptions automatically.
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string },
): Promise<T> {
  return toast.promise(promise, messages, {
    success: {
      icon: <CheckIcon />,
      duration: TOAST_DURATION,
    },
    error: {
      icon: <XIcon />,
      duration: TOAST_DURATION,
    },
    loading: {
      icon: <Spinner />,
    },
  })
}
