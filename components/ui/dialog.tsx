'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  onClose: () => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) {
    throw new Error('Dialog components must be used within a <Dialog />')
  }
  return ctx
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Dialog({ open, onClose, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <DialogContext.Provider value={{ open, onClose }}>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity animate-fade-in-up"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Content Container */}
        {children}
      </div>
    </DialogContext.Provider>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function DialogContent({
  className,
  size = 'md',
  children,
  ...props
}: DialogContentProps) {
  const { onClose } = useDialog()

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'relative z-10 flex w-full flex-col bg-white p-5 sm:p-6 shadow-2xl',
        // Mobile Presentation: Bottom Sheet
        'rounded-t-[20px] max-h-[90vh] sm:max-h-[85vh] animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]',
        // Desktop Presentation: Centered Rounded Modal
        'sm:rounded-[16px] overflow-y-auto',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Mobile Drawer Pull Indicator */}
      <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-[#d2d2d7] sm:hidden" aria-hidden="true" />
      
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1.5 text-[#5f6368] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] transition-colors"
        aria-label="Cerrar ventana"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {children}
    </div>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1 pr-6 pb-3 text-left', className)}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f]', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs sm:text-sm text-[#5f6368] leading-relaxed', className)}
      {...props}
    />
  )
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('py-3 space-y-3', className)} {...props} />
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-[#f0f0f4]',
        className
      )}
      {...props}
    />
  )
}
