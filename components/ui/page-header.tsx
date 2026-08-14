'use client'

interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  loading?: boolean
  loadingLabel?: string
}

export function PageHeader({ eyebrow, title, subtitle, loading, loadingLabel }: PageHeaderProps) {
  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="title">{title}</h2>
        <div className="mt-10 flex items-center justify-center py-20">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
          <span className="ml-3 text-sm text-[#707070]">{loadingLabel || 'Loading…'}</span>
        </div>
      </section>
    )
  }

  return (
    <div className="mb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="title">{title}</h2>
      {subtitle && (
        <p className="subtitle mt-2">{subtitle}</p>
      )}
    </div>
  )
}
