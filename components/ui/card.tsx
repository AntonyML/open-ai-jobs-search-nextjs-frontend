'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'sunken'
  size?: 'default' | 'sm'
}

export function Card({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border bg-white text-[#1d1d1f] transition-all duration-150',
        size === 'sm' ? 'p-3 sm:p-4' : 'p-4 sm:p-6',
        variant === 'default' && 'border-[#d2d2d7]',
        variant === 'interactive' &&
          'border-[#d2d2d7] hover:border-[#0066cc] hover:shadow-xs cursor-pointer',
        variant === 'sunken' && 'border-[#e5e5ea] bg-[#fbfbfd]',
        className
      )}
      {...props}
    />
  )
}

export function CardAction({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ml-auto flex items-center gap-2', className)} {...props} />
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-4 border-b border-[#f0f0f4]', className)}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-tight text-[#1d1d1f]', className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[#5f6368] leading-relaxed', className)}
      {...props}
    />
  )
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-[#f0f0f4]', className)}
      {...props}
    />
  )
}
