'use client'

import { cn } from '@/lib/utils'
import type { TabOption } from '@/types/shared'

interface AppleTabsProps {
  tabs: TabOption[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function AppleTabs({ tabs, active, onChange, className }: AppleTabsProps) {
  return (
    <div className={cn('tab-group', className)}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'tab-pill',
            active === tab.key && 'active'
          )}
        >
          {tab.icon && <tab.icon className="size-4 shrink-0" />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
