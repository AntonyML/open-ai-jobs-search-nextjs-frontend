'use client'

import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'

interface Props {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  onChange: (name: string, value: string) => void
  locale: string
}

export function BasicInfoSection({
  full_name,
  email,
  phone,
  location,
  linkedin_url = '',
  github_url = '',
  portfolio_url = '',
  onChange,
  locale,
}: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  return (
    <div id="section-basic-info" className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f0f4] pb-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('basicInfoSection')}</h2>
            <p className="mt-0.5 text-[11px] text-[#5f6368] leading-relaxed">{t('basicInfoDesc')}</p>
          </div>
        </div>
        <div className="text-[11px] font-medium text-[#707070] bg-[#f2f2f7] px-2.5 py-1 rounded-full w-fit">
          <span className="text-rose-500 font-bold" aria-hidden="true">*</span> {t('requiredFieldsLegend')}
        </div>
      </div>

      {/* 2-Column Responsive Form Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <label htmlFor="basic-fullname" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('fullName')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
            <span className="sr-only"> ({t('required')})</span>
          </label>
          <div className="relative">
            <input
              id="basic-fullname"
              name="full_name"
              required
              aria-required="true"
              autoComplete="name"
              className="field w-full pr-9 bg-[#f5f5f7] text-[#1d1d1f] cursor-default"
              placeholder={t('basicNamePlaceholder')}
              value={full_name}
              readOnly
              tabIndex={-1}
            />
            <a
              href={`/${locale}/profile`}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#0066cc] hover:bg-white hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] transition-all"
              title={t('editName') || 'Edit name in profile'}
              aria-label={t('editName') || 'Edit name in profile'}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="basic-email" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('email')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
            <span className="sr-only"> ({t('required')})</span>
          </label>
          <input
            id="basic-email"
            name="email"
            required
            aria-required="true"
            aria-describedby="basic-email-notice"
            type="email"
            autoComplete="email"
            className="field bg-[#f5f5f7] text-[#1d1d1f] cursor-default"
            placeholder={t('basicEmailPlaceholder')}
            value={email}
            readOnly
            tabIndex={-1}
          />
          <p id="basic-email-notice" className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-[11px] text-amber-800 leading-normal">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t('emailCorrelationNotice')}</span>
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="basic-phone" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('phone')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
          </label>
          <input
            id="basic-phone"
            name="phone"
            className="field"
            autoComplete="tel"
            placeholder={t('basicPhonePlaceholder')}
            value={phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="basic-location" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('location')} <span className="text-rose-500 font-bold" aria-hidden="true">*</span>
            <span className="sr-only"> ({t('required')})</span>
          </label>
          <input
            id="basic-location"
            name="location"
            required
            aria-required="true"
            autoComplete="address-level2"
            className="field"
            placeholder={t('basicLocationPlaceholder')}
            value={location}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label htmlFor="basic-linkedin" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('linkedin')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
          </label>
          <input
            id="basic-linkedin"
            name="linkedin_url"
            type="url"
            className="field"
            placeholder="https://linkedin.com/in/username"
            value={linkedin_url}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
          />
        </div>

        {/* GitHub */}
        <div>
          <label htmlFor="basic-github" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('github')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
          </label>
          <input
            id="basic-github"
            name="github_url"
            type="url"
            className="field"
            placeholder="https://github.com/username"
            value={github_url}
            onChange={(e) => onChange('github_url', e.target.value)}
          />
        </div>

        {/* Portfolio / Website (Full width inside 2-col grid) */}
        <div className="sm:col-span-2">
          <label htmlFor="basic-portfolio" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            {t('portfolio')} <span className="text-[#707070] font-normal">({tc('optional')})</span>
          </label>
          <input
            id="basic-portfolio"
            name="portfolio_url"
            type="url"
            className="field"
            placeholder="https://yourwebsite.com"
            value={portfolio_url}
            onChange={(e) => onChange('portfolio_url', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
