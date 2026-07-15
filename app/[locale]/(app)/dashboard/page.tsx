'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import {
  Search,
  User,
  BarChart3,
  FileText,
  Globe,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

interface DashboardStats {
  jobs_scraped: number
  jobs_ranked: number
  applications: number
  interviews: number
}

const QUICK_ACTIONS = [
  { label: 'Find jobs', href: '/pipeline/scrape', icon: Globe, desc: 'Scrape job portals' },
  { label: 'Rank jobs', href: '/pipeline/rank', icon: BarChart3, desc: 'Evaluate fit' },
  { label: 'Create CV', href: '/pipeline/apply', icon: FileText, desc: 'Generate application' },
  { label: 'Prepare', href: '/pipeline/interview', icon: TrendingUp, desc: 'Interview prep' },
]

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    jobs_scraped: 0, jobs_ranked: 0, applications: 0, interviews: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const fetchStats = async () => {
      try {
        const data = await apiFetch<DashboardStats>('/api/v1/dashboard/stats')
        setStats(data)
      } catch { /* stats unavailable */ }
      setLoading(false)
    }
    fetchStats()
  }, [router])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#707070]">Your job search at a glance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Jobs scraped', value: stats.jobs_scraped, icon: Globe, color: 'text-[#0071e3]' },
          { label: 'Jobs ranked', value: stats.jobs_ranked, icon: BarChart3, color: 'text-emerald-500' },
          { label: 'Applications', value: stats.applications, icon: FileText, color: 'text-amber-500' },
          { label: 'Interviews', value: stats.interviews, icon: TrendingUp, color: 'text-violet-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#1d1d1f]">
              {loading ? '...' : stat.value}
            </p>
            <p className="text-xs text-[#707070]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-[#d2d2d7]/60 bg-white p-4 hover:border-[#0071e3]/30 hover:shadow-sm transition-all"
            >
              <action.icon className="size-5 text-[#0071e3] group-hover:scale-110 transition-transform" />
              <p className="mt-2 text-sm font-medium text-[#1d1d1f]">{action.label}</p>
              <p className="text-xs text-[#707070]">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline overview */}
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Job pipeline</h2>
        <div className="rounded-xl border border-[#d2d2d7]/60 bg-white divide-y divide-[#d2d2d7]/40">
          {[
            { step: '1. Providers', label: 'AI provider', href: '/pipeline/providers', icon: User },
            { step: '2. Setup', label: 'Your profile', href: '/pipeline/setup', icon: FileText },
            { step: '3. Scrape', label: 'Find jobs', href: '/pipeline/scrape', icon: Globe },
            { step: '4. Rank', label: 'Evaluate fit', href: '/pipeline/rank', icon: BarChart3 },
            { step: '5. Apply', label: 'CV + letter', href: '/pipeline/apply', icon: FileText },
            { step: '6. Interview', label: 'Prepare', href: '/pipeline/interview', icon: TrendingUp },
            { step: '7. Outcome', label: 'Track progress', href: '/pipeline/outcome', icon: TrendingUp },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#f5f5f7] transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-4 text-[#707070]" />
                <div>
                  <p className="text-sm font-medium text-[#1d1d1f]">{item.step}</p>
                  <p className="text-xs text-[#707070]">{item.label}</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-[#b0b0b0]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
