'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center font-normal transition-all duration-150 select-none cursor-pointer outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-1',
  {
    variants: {
      variant: {
        primary:
          'rounded-full bg-[#0071e3] text-white hover:bg-[#0068d2] shadow-xs tracking-[-0.015em]',
        default:
          'rounded-full bg-[#0071e3] text-white hover:bg-[#0068d2] shadow-xs tracking-[-0.015em]',
        secondary:
          'rounded-lg border border-[#0066cc] bg-[#f4f8fb] text-[#0066cc] hover:bg-[#e6f0fa] tracking-[-0.015em]',
        outline:
          'rounded-lg border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] tracking-[-0.015em]',
        ghost:
          'rounded-md text-[#0066cc] hover:bg-[#f4f8fb] hover:underline underline-offset-2 tracking-[-0.017em]',
        danger:
          'rounded-lg border border-rose-300 bg-white text-[#e11d48] hover:bg-rose-50 hover:border-rose-400 tracking-[-0.015em]',
        destructive:
          'rounded-lg border border-rose-300 bg-white text-[#e11d48] hover:bg-rose-50 hover:border-rose-400 tracking-[-0.015em]',
        link:
          'text-[#0066cc] underline-offset-4 hover:underline p-0 h-auto tracking-[-0.017em]',
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm',
        md: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-3 py-1 text-xs rounded-md',
        xs: 'h-7 px-2.5 py-0.5 text-[11px] rounded-md',
        lg: 'h-12 px-7 py-3 text-[15px]',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { buttonVariants }
