import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url
  const locales = ['en', 'es']
  const routes = ['', '/dashboard', '/about', '/privacy', '/terms', '/blog']

  const sitemapEntries: MetadataRoute.Sitemap = []

  const now = new Date()

  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: now,
        changeFrequency: route === '' || route === '/dashboard' ? 'daily' : 'monthly',
        priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.5,
        alternates: {
          languages: {
            en: `${baseUrl}/en${route}`,
            es: `${baseUrl}/es${route}`,
          },
        },
      })
    }
  }

  return sitemapEntries
}
