import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notFound } from 'next/navigation'
import { constructMetadata } from '@/lib/seo'
import { getBlogPost, getBlogPosts, type BlogLocale } from '@/lib/blog'

export function generateStaticParams() {
  return (['en', 'es'] as BlogLocale[]).flatMap((locale) =>
    getBlogPosts(locale).map((post) => ({ locale, slug: post.slug })),
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getBlogPost((locale === 'es' ? 'es' : 'en') as BlogLocale, slug)
  if (!post) return {}
  return constructMetadata({ locale, path: `/blog/${slug}`, title: post.title, description: post.description })
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const post = getBlogPost((locale === 'es' ? 'es' : 'en') as BlogLocale, slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <header className="border-b border-[#d2d2d7] pb-8">
        <p className="eyebrow">CVMeld · {post.date}</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[#1d1d1f] md:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[#474747]">{post.description}</p>
      </header>
      <div className="prose prose-neutral mt-10 max-w-none prose-headings:tracking-tight prose-a:text-[#0066cc] prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  )
}
