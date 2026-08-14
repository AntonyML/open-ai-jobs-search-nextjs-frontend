import type { Metadata } from 'next'

export const SITE_CONFIG = {
  name: 'Open AI Jobs Search',
  shortName: 'AI Jobs Search',
  description:
    'AI-powered intelligent job search & multi-provider matching platform for Machine Learning, AI Engineering, and Tech roles.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://openaijobssearch.com',
  ogImage: '/android-chrome-512x512.png',
  twitterHandle: '@openaijobs',
  keywords: [
    'AI Jobs',
    'Machine Learning Jobs',
    'OpenAI Jobs',
    'AI Engineering',
    'Tech Careers',
    'Job Search Engine',
    'Automated Resume Matcher',
    'AI Job Search',
  ],
}

interface GenerateMetadataOptions {
  title?: string
  description?: string
  path?: string
  locale?: string
  keywords?: string[]
  noIndex?: boolean
  image?: string
}

export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  path = '',
  locale = 'en',
  keywords = SITE_CONFIG.keywords,
  noIndex = false,
  image = SITE_CONFIG.ogImage,
}: GenerateMetadataOptions = {}): Metadata {
  const brand = 'Open AI Jobs'
  const fullTitle = title
    ? (title.includes('Open AI Jobs')
        ? title
        : `${title} | ${brand}`)
    : brand

  const baseUrl = SITE_CONFIG.url
  const canonicalUrl = `${baseUrl}/${locale}${path}`

  const localizedAlternates = {
    canonical: canonicalUrl,
    languages: {
      en: `${baseUrl}/en${path}`,
      es: `${baseUrl}/es${path}`,
      'x-default': `${baseUrl}/en${path}`,
    },
  }

  return {
    title: fullTitle,
    description,
    keywords,
    applicationName: SITE_CONFIG.name,
    metadataBase: new URL(baseUrl),
    alternates: localizedAlternates,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: image,
          width: 512,
          height: 512,
          alt: SITE_CONFIG.name,
        },
      ],
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: SITE_CONFIG.twitterHandle,
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: '/favicon.svg',
    },
    manifest: '/manifest.json',
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
