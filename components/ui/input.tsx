'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'w-full min-w-0 rounded-[8px] border bg-white px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#5f6368] transition-all duration-150',
          'h-10 md:h-10.5',
          'border-[#d2d2d7] hover:border-[#707070]',
          'focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:ring-offset-1 focus:border-[#0066cc]',
          'disabled:bg-[#f2f2f7] disabled:text-[#5f6368] disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-[#e11d48] focus:ring-[#e11d48] focus:border-[#e11d48]',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
