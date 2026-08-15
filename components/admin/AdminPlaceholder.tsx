import type { LucideIcon } from 'lucide-react'

interface AdminPlaceholderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  comingTitle: string
  comingDesc: string
}

/**
 * Empty state for admin pages that are routed in Fase A but get their
 * content in later phases (plan.md §3): Users, User detail, Billing, System.
 */
export function AdminPlaceholder({
  icon: Icon,
  title,
  subtitle,
  comingTitle,
  comingDesc,
}: AdminPlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
          <Icon className="h-6 w-6 text-[#0071e3]" />
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-[#707070]">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-[#d2d2d7]/60 bg-white p-12 text-center">
        <Icon className="mx-auto mb-4 h-9 w-9 text-[#c6c6cc]" />
        <p className="text-sm font-bold text-[#1d1d1f]">{comingTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#707070]">{comingDesc}</p>
      </div>
    </div>
  )
}
