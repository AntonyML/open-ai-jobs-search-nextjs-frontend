/**
 * Toast utility — wraps react-hot-toast with Apple-inspired styling
 * and consistent UX patterns.
 *
 * Usage:
 *   showSuccess('Profile saved!')
 *   showError('Failed to save profile')
 *   showPromise(saveProfile(), { loading: 'Saving…', success: 'Saved!', error: 'Failed' })
 *   showLoading('Ranking jobs…')
 */

import toast from 'react-hot-toast'

const TOAST_DURATION = 4000

function ToastContainer({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <div
      className={visible ? 'animate-fade-in-up' : 'animate-fade-out-down'}
      style={{
        borderRadius: '12px',
        background: '#1d1d1f',
        color: '#f5f5f7',
        padding: '12px 16px',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      {children}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2.5" className="animate-spin">
      <path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

export function showSuccess(message: string) {
  toast.custom(t => (
    <ToastContainer visible={t.visible}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckIcon />
        <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
      </div>
    </ToastContainer>
  ), { duration: TOAST_DURATION })
}

export function showError(message: string) {
  toast.custom(t => (
    <ToastContainer visible={t.visible}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <XIcon />
        <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
      </div>
    </ToastContainer>
  ), { duration: TOAST_DURATION })
}

export function showLoading(message: string): string {
  return toast.custom(t => (
    <ToastContainer visible={t.visible}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Spinner />
        <span style={{ fontSize: '14px', lineHeight: 1.4 }}>{message}</span>
      </div>
    </ToastContainer>
  ), { duration: Infinity })
}

export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}

export function showPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
): Promise<T> {
  return toast.promise(promise, messages, {
    success: {
      icon: <CheckIcon />,
      style: { borderRadius: '12px', background: '#1d1d1f', color: '#f5f5f7', fontSize: '14px' },
    },
    error: {
      icon: <XIcon />,
      style: { borderRadius: '12px', background: '#1d1d1f', color: '#f5f5f7', fontSize: '14px' },
    },
    loading: {
      icon: <Spinner />,
      style: { borderRadius: '12px', background: '#1d1d1f', color: '#f5f5f7', fontSize: '14px' },
    },
  })
}
