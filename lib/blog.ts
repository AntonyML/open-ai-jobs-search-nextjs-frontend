import fs from 'node:fs'
import path from 'node:path'

export type BlogLocale = 'en' | 'es'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  content: string
}

const BLOG_ROOT = path.join(process.cwd(), 'content', 'blog')

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error('Invalid blog frontmatter')

  const metadata: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    metadata[key] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
  }

  return { metadata, content: match[2].trim() }
}

export function getBlogPosts(locale: BlogLocale): BlogPost[] {
  const directory = path.join(BLOG_ROOT, locale)
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory)
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '')
      const parsed = parseFrontmatter(fs.readFileSync(path.join(directory, filename), 'utf8'))
      return {
        slug,
        title: parsed.metadata.title || slug,
        description: parsed.metadata.description || '',
        date: parsed.metadata.date || '',
        content: parsed.content,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getBlogPost(locale: BlogLocale, slug: string) {
  return getBlogPosts(locale).find((post) => post.slug === slug)
}
