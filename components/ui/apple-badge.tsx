'use client'

import React from 'react'
import { Badge, type BadgeProps } from '@/components/ui/badge'

type BadgeColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple' | 'cyan'

export interface AppleBadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md'
  className?: string
}

const colorToVariant: Record<BadgeColor, BadgeProps['variant']> = {
  blue: 'blue',
  emerald: 'success',
  amber: 'warning',
  rose: 'danger',
  slate: 'neutral',
  purple: 'purple',
  cyan: 'blue',
}

/**
 * @deprecated Use canonical `Badge` from `@/components/ui/badge` instead.
 * Retained as a transitional proxy for legacy callers.
 */
export function AppleBadge({ children, color = 'slate', size = 'sm', className }: AppleBadgeProps) {
  return (
    <Badge variant={colorToVariant[color] || 'neutral'} size={size} className={className}>
      {children}
    </Badge>
  )
}

export function StatusDot({
  color = 'slate',
  pulse,
  label,
  className,
}: {
  color?: string
  pulse?: boolean
  label?: string
  className?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5f6368]">
      <span className={`relative inline-flex h-2 w-2 ${pulse ? 'animate-pulse' : ''}`}>
        <span className="inline-block h-2 w-2 rounded-full bg-[#0071e3]" />
      </span>
      {label && <span>{label}</span>}
    </span>
  )
}
