'use client'

import { cn } from '@/lib/utils'

type BadgeColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple' | 'cyan'

interface AppleBadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md'
  className?: string
}

const colorClasses: Record<BadgeColor, string> = {
  blue:    'bg-[#f4f8fb] text-[#0066cc]',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  rose:    'bg-rose-50 text-rose-500',
  slate:   'bg-[#f5f5f7] text-[#707070]',
  purple:  'bg-purple-50 text-purple-600',
  cyan:    'bg-cyan-50 text-cyan-600',
}

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[12px] px-2.5 py-1',
}

export function AppleBadge({ children, color = 'slate', size = 'sm', className }: AppleBadgeProps) {
  return (
    <span className={cn('tag-filled', colorClasses[color], sizeClasses[size], className)}>
      {children}
    </span>
  )
}

// Status dot — inline colored circle with optional label
interface StatusDotProps {
  color?: BadgeColor | 'green' | 'gray' | 'blue'
  pulse?: boolean
  label?: string
  className?: string
}

const dotColors: Record<string, string> = {
  blue:    'bg-[#0071e3]',
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  rose:    'bg-rose-400',
  slate:   'bg-slate-400',
  cyan:    'bg-cyan-400',
  green:   'bg-emerald-400',
  gray:    'bg-slate-400',
}

export function StatusDot({ color = 'slate', pulse, label, className }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`relative inline-flex h-2 w-2 ${pulse ? 'animate-pulse' : ''}`}>
        <span className={cn('inline-block h-2 w-2 rounded-full', dotColors[color], className)} />
        {pulse && (
          <span className={cn('absolute inset-0 inline-block h-2 w-2 rounded-full animate-ping opacity-30', dotColors[color])} />
        )}
      </span>
      {label && <span className="text-[11px] font-medium text-[#474747]">{label}</span>}
    </span>
  )
}
