import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { getBlogPosts, type BlogLocale } from '@/lib/blog'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isSpanish = locale === 'es'
  return constructMetadata({
    locale,
    path: '/blog',
    title: isSpanish ? 'Blog de CV y búsqueda de empleo' : 'Resume and job search blog',
    description: isSpanish
      ? 'Consejos prácticos para crear, adaptar y mejorar tu CV para cada oportunidad laboral.'
      : 'Practical guidance to create, tailor, and improve your resume for every job opportunity.',
  })
}

export default async function BlogIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isSpanish = locale === 'es'
  const posts = getBlogPosts((isSpanish ? 'es' : 'en') as BlogLocale)

  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-24">
      <header className="max-w-2xl">
        <p className="eyebrow">CVMeld</p>
        <h1 className="title">{isSpanish ? 'Ideas para conseguir mejores oportunidades' : 'Ideas for better opportunities'}</h1>
        <p className="subtitle mt-5">{isSpanish ? 'Guías claras para crear tu CV, adaptarlo a cada oferta y postularte con confianza.' : 'Clear guides to build your resume, tailor it to each job, and apply with confidence.'}</p>
      </header>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.slug} className="card flex flex-col">
            <p className="text-xs text-[#5f6368]">{post.date}</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#1d1d1f]">{post.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#474747]">{post.description}</p>
            <Link href={`/${locale}/blog/${post.slug}`} className="mt-6 text-sm font-medium text-[#0066cc] hover:underline">
              {isSpanish ? 'Leer artículo' : 'Read article'} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
