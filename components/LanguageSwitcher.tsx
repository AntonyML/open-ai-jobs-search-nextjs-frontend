'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

const LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
}

const FULL_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div className="relative flex items-center gap-0.5 rounded-full border border-[#d2d2d7] bg-white p-0.5">
      {routing.locales.map(loc => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          disabled={isPending || loc === locale}
          className={`rounded-full px-3 py-2 text-[11px] font-medium transition-all md:px-2.5 md:py-1 ${
            loc === locale
              ? 'bg-[#0071e3] text-white shadow-sm'
              : 'text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
          }`}
          title={FULL_LABELS[loc] || loc}
        >
          {LABELS[loc] || loc}
        </button>
      ))}
    </div>
  )
}
