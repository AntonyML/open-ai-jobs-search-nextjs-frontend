'use client'

import { type KeyboardEvent, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  color?: 'blue' | 'rose' | 'amber' | 'violet'
  max?: number
}

const COLOR_MAP = {
  blue: 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]',
  rose: 'border-rose-300 bg-rose-50 text-rose-600',
  amber: 'border-amber-300 bg-amber-50 text-amber-700',
  violet: 'border-violet-300 bg-violet-50 text-violet-700',
}

const BTN_MAP = {
  blue: 'hover:bg-[#0071e3]/20',
  rose: 'hover:bg-rose-100',
  amber: 'hover:bg-amber-100',
  violet: 'hover:bg-violet-100',
}

export function TagInput({ tags, onChange, placeholder = '', color = 'blue', max }: Props) {
  const [input, setInput] = useState('')

  function add(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) return
    if (max && tags.length >= max) return
    onChange([...tags, trimmed])
  }

  function remove(idx: number) {
    onChange(tags.filter((_, i) => i !== idx))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      remove(tags.length - 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
      const newTags = [...tags]
      for (const part of parts) {
        if (part && !newTags.includes(part) && (!max || newTags.length < max)) {
          newTags.push(part)
        }
      }
      onChange(newTags)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 focus-within:border-[#0071e3] focus-within:shadow-[0_0_0_3px_rgba(0,113,227,0.15)] transition-all">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${COLOR_MAP[color]}`}
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(i)}
            className={`rounded-full p-0.5 transition-colors ${BTN_MAP[color]}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        className="min-w-[80px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#b0b0b0]"
        placeholder={tags.length === 0 ? placeholder : ''}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
      />
    </div>
  )
}
