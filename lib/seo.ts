import type { Metadata } from 'next'

export const SITE_CONFIG = {
  name: 'CVMeld',
  shortName: 'CVMeld',
  description:
    'Create your CV once and tailor it to every job opportunity with AI-powered matching, applications, interviews, and career growth tools.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://cvmeld.tonyml.com',
  ogImage: '/og/cvmeld-og.svg',
  twitterHandle: '@cvmeld',
  keywords: [
    'AI Jobs',
    'Machine Learning Jobs',
    'OpenAI Jobs',
    'AI Engineering',
    'Tech Careers',
    'Job Search Engine',
    'Automated Resume Matcher',
    'AI Job Search',
    'AI resume builder',
    'ATS resume',
    'generador de CV con IA',
    'currículum ATS',
    'adaptar CV a oferta',
    'carta de presentación IA',
    'buscar trabajo Costa Rica',
    'generador de currículum gratis',
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
  const brand = SITE_CONFIG.name
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

  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

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
          width: 1200,
          height: 630,
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
    ...(verification ? { verification: { google: verification } } : {}),
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
