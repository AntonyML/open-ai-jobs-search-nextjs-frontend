'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight select-none transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border border-[#d2d2d7] bg-[#f2f2f7] text-[#1d1d1f]',
        blue: 'border border-[#0066cc]/20 bg-[#f4f8fb] text-[#0066cc]',
        success: 'border border-[#34c759]/30 bg-[#e9f9ef] text-[#107c41]',
        warning: 'border border-[#f59e0b]/30 bg-[#fffbeb] text-[#b45309]',
        danger: 'border border-rose-300 bg-rose-50 text-rose-700',
        purple: 'border border-purple-200 bg-purple-50 text-purple-700',
      },
      size: {
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-[#107c41]',
            variant === 'warning' && 'bg-[#b45309]',
            variant === 'danger' && 'bg-rose-600',
            variant === 'blue' && 'bg-[#0066cc]',
            (!variant || variant === 'neutral') && 'bg-[#707070]'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
