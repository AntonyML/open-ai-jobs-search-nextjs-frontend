import React from 'react'
import { SITE_CONFIG } from '@/lib/seo'

interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
}

export function OrganizationJsonLd({
  name = SITE_CONFIG.name,
  url = SITE_CONFIG.url,
  logo = `${SITE_CONFIG.url}/android-chrome-512x512.png`,
}: OrganizationJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'legal.ai-jobs@tonyml.com',
      availableLanguage: ['English', 'Spanish'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface WebSiteJsonLdProps {
  name?: string
  url?: string
}

export function WebSiteJsonLd({
  name = SITE_CONFIG.name,
  url = SITE_CONFIG.url,
}: WebSiteJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/en/dashboard?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export interface JobPostingData {
  title: string
  description: string
  datePosted: string
  validThrough?: string
  employmentType?: string
  hiringOrganization: {
    name: string
    sameAs?: string
    logo?: string
  }
  jobLocation?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  applicantLocationRequirements?: {
    name: string
  }
  jobLocationType?: string
  baseSalary?: {
    currency: string
    value: number | { minValue: number; maxValue: number; unitText: string }
  }
}

export function JobPostingJsonLd({ job }: { job: JobPostingData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.hiringOrganization.name,
      sameAs: job.hiringOrganization.sameAs,
      logo: job.hiringOrganization.logo,
    },
    ...(job.jobLocationType && { jobLocationType: job.jobLocationType }),
    ...(job.applicantLocationRequirements && {
      applicantLocationRequirements: {
        '@type': 'Country',
        name: job.applicantLocationRequirements.name,
      },
    }),
    jobLocation: job.jobLocation
      ? {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            ...job.jobLocation,
          },
        }
      : {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'Remote',
          },
        },
    ...(job.baseSalary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: job.baseSalary.currency,
        value: typeof job.baseSalary.value === 'number'
          ? {
              '@type': 'QuantitativeValue',
              value: job.baseSalary.value,
              unitText: 'YEAR',
            }
          : {
              '@type': 'QuantitativeValue',
              minValue: job.baseSalary.value.minValue,
              maxValue: job.baseSalary.value.maxValue,
              unitText: job.baseSalary.value.unitText || 'YEAR',
            },
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
