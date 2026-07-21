'use client'

import { useTranslations } from 'next-intl'

interface BasicInfoForm {
  full_name: string
  email: string
  phone: string
  location: string
}

interface Props {
  form: BasicInfoForm
  onChange: (name: string, value: string) => void
}

export function BasicInfoSection({ form, onChange }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">{t('basicInfoSection')}</p>
          <p className="text-[11px] text-[#b0b0b0]">{t('basicInfoDesc')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[#1d1d1f]">
          {t('fullName')} <span className="text-rose-400">*</span>
          <input
            required
            autoComplete="name"
            className="field mt-1.5"
            placeholder={t('basicNamePlaceholder')}
            value={form.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
          />
        </label>
        <label className="block text-sm text-[#1d1d1f]">
          {t('email')} <span className="text-rose-400">*</span>
          <input
            required
            type="email"
            autoComplete="email"
            className="field mt-1.5"
            placeholder={t('basicEmailPlaceholder')}
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </label>
        <label className="block text-sm text-[#1d1d1f]">
          {t('phone')} <span className="text-[#b0b0b0]">{tc('optional')}</span>
          <input
            className="field mt-1.5"
            autoComplete="tel"
            placeholder={t('basicPhonePlaceholder')}
            value={form.phone}
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
            value={form.location}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
