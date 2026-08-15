'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Logo from '@/components/Logo'

export default function Footer() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  const FOOTER_LINKS = [
    {
      title: t('product'),
      links: [
        { label: t('features'), href: '/#features' },
        { label: t('pricing'), href: '/#pricing' },
        { label: t('about'), href: '/about' },
        { label: t('blog'), href: '/blog' },
      ],
    },
    {
      title: t('resources'),
      links: [
        {
          label: t('github'),
          href: 'https://github.com/AntonyML/open-ai-jobs-search-nextjs-frontend',
        },
        {
          label: t('docs'),
          href: 'https://github.com/AntonyML/open-ai-jobs-search-nextjs-frontend#readme',
        },
        {
          label: t('backend'),
          href: 'https://github.com/AntonyML/open-ai-jobs-search-FastAPI-backend',
        },
        {
          label: t('searchService'),
          href: 'https://github.com/AntonyML/open-ai-jobs-search-microservice-searchjobs-backend',
        },
        {
          label: t('rankService'),
          href: 'https://github.com/AntonyML/open-ai-jobs-search-microservice-rankjobs-backend',
        },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('privacy'), href: '/privacy' },
        { label: t('terms'), href: '/terms' },
        { label: t('limits'), href: '/limits' },
      ],
    },
  ]

  return (
    <footer className="border-t border-[#d2d2d7] bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {FOOTER_LINKS.map(section => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1d1d1f] mb-3">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-[#707070] hover:text-[#1d1d1f] transition-colors"
                      {...(link.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#d2d2d7]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size={24} showIconOnly={false} showBackground={false} />
            </div>

            <p className="text-[11px] text-[#858585]">
              {t('allRightsReserved', { year }).replace('Open Ai Jobs Search', 'CVMeld')}
            </p>

            <div className="flex items-center gap-3">
              <a href="https://github.com/AntonyML" target="_blank" rel="noopener noreferrer" className="text-[#858585] hover:text-[#1d1d1f] transition-colors" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/antony-monge-lopez/" target="_blank" rel="noopener noreferrer" className="text-[#858585] hover:text-[#1d1d1f] transition-colors" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
              </a>
              <a href="https://x.com/TonyML_" target="_blank" rel="noopener noreferrer" className="text-[#858585] hover:text-[#1d1d1f] transition-colors" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
