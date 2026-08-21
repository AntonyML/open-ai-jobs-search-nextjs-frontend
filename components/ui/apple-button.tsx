'use client'

import React, { forwardRef } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface AppleButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

/**
 * @deprecated Use canonical `Button` from `@/components/ui/button` instead.
 * Retained as a transitional proxy for legacy consumers.
 */
export const AppleButton = forwardRef<HTMLButtonElement, AppleButtonProps>(
  (props, ref) => {
    return <Button ref={ref} {...props} />
  }
)

AppleButton.displayName = 'AppleButton'
