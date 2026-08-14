'use client'

import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'

interface Props {
  full_name: string
  email: string
  phone: string
  location: string
  onChange: (name: string, value: string) => void
  locale: string
}

export function BasicInfoSection({ full_name, email, phone, location, onChange, locale }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  return (
    <div className="card space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('basicInfoSection')}</p>
          <p className="mt-0.5 text-[11px] text-[#707070] leading-relaxed">{t('basicInfoDesc')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[#1d1d1f]">
          {t('fullName')} <span className="text-rose-400">*</span>
          <div className="relative mt-1.5">
            <input
              required
              autoComplete="name"
              className="field w-full pr-9 bg-[#f5f5f7] text-[#1d1d1f] cursor-default"
              placeholder={t('basicNamePlaceholder')}
              value={full_name}
              readOnly
              tabIndex={-1}
            />
            <a
              href={`/${locale}/profile`}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0071e3] hover:text-[#0068d2] transition-colors"
              title={t('editName') || 'Edit name in profile'}
            >
              <Pencil className="h-4 w-4" />
            </a>
          </div>
        </label>
        <label className="block text-sm text-[#1d1d1f]">
          {t('email')} <span className="text-rose-400">*</span>
          <input
            required
            type="email"
            autoComplete="email"
            className="field mt-1.5 bg-[#f5f5f7] text-[#1d1d1f] cursor-default"
            placeholder={t('basicEmailPlaceholder')}
            value={email}
            readOnly
            tabIndex={-1}
          />
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t('emailCorrelationNotice')}</span>
          </p>
        </label>
        <label className="block text-sm text-[#1d1d1f]">
          {t('phone')} <span className="text-[#858585]">{tc('optional')}</span>
          <input
            className="field mt-1.5"
            autoComplete="tel"
            placeholder={t('basicPhonePlaceholder')}
            value={phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </label>
        <label className="block text-sm text-[#1d1d1f]">
          {t('location')} <span className="text-rose-400">*</span>
          <input
            required
            autoComplete="address-level2"
            className="field mt-1.5"
            placeholder={t('basicLocationPlaceholder')}
            value={location}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
