'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FormFieldContextValue {
  id: string
  required?: boolean
  error?: string | boolean
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

export function useFormField() {
  const ctx = React.useContext(FormFieldContext)
  if (!ctx) {
    throw new Error('useFormField must be used within a <FormField />')
  }
  return ctx
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
  required?: boolean
  error?: string | boolean
}

export function FormField({
  id,
  required,
  error,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <FormFieldContext.Provider value={{ id, required, error }}>
      <div className={cn('space-y-1.5', className)} {...props}>
        {children}
      </div>
    </FormFieldContext.Provider>
  )
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredText?: string
  optionalText?: string
}

export function FormLabel({
  className,
  children,
  requiredText = 'obligatorio',
  optionalText,
  ...props
}: FormLabelProps) {
  const { id, required } = useFormField()

  return (
    <label
      htmlFor={id}
      className={cn('block text-xs font-semibold text-[#1d1d1f]', className)}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span className="ml-1 text-rose-500 font-bold" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> ({requiredText})</span>
        </>
      ) : optionalText ? (
        <span className="ml-1 text-[#5f6368] font-normal">({optionalText})</span>
      ) : null}
    </label>
  )
}

export function FormHelperText({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { id } = useFormField()

  return (
    <p
      id={`${id}-help`}
      className={cn('text-[11px] text-[#5f6368] leading-normal', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function FormErrorMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { id, error } = useFormField()
  const content = children || (typeof error === 'string' ? error : null)

  if (!content) return null

  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={cn('text-xs font-medium text-rose-600 leading-normal animate-fade-in-up', className)}
      {...props}
    >
      {content}
    </p>
  )
}
