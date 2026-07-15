'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import {
  Search,
  User,
  Globe,
  BarChart3,
  FileText,
  Mic,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  RotateCcw,
  CheckCircle2,
  Circle,
} from 'lucide-react'

const PIPELINE_STEPS = [
  { label: 'Providers', sub: 'AI provider', href: '/pipeline/providers', icon: User },
  { label: 'Setup', sub: 'Your profile', href: '/pipeline/setup', icon: FileText },
  { label: 'Scrape', sub: 'Find jobs', href: '/pipeline/scrape', icon: Globe },
  { label: 'Rank', sub: 'Evaluate fit', href: '/pipeline/rank', icon: BarChart3 },
  { label: 'Apply', sub: 'CV + letter', href: '/pipeline/apply', icon: Search },
  { label: 'Interview', sub: 'Prepare', href: '/pipeline/interview', icon: Mic },
  { label: 'Outcome', sub: 'Track progress', href: '/pipeline/outcome', icon: TrendingUp },
]

const EXTRA_STEPS = [
  { label: 'Expand', sub: 'Discover skills', href: '/pipeline/expand', icon: Plus },
  { label: 'Upskill', sub: 'Skill gaps', href: '/pipeline/upskill', icon: ArrowLeftRight },
]

export default function PipelineSidebar({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: number[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleReset = async () => {
    try {
      const res = await apiFetch<{ status: string; total_deleted: number; message: string }>(
        '/api/v1/pipeline-reset/',
        { method: 'DELETE' }
      )
      showSuccess(res.message || `Pipeline reset — ${res.total_deleted} records deleted`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reset pipeline data')
    }
    localStorage.removeItem('completed_steps')
    localStorage.removeItem('ranking_job_id')
    setShowResetConfirm(false)
    router.push('/pipeline/providers')
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-sidebar-foreground hover:opacity-70 transition-opacity">
          <CheckCircle2 className="size-4 text-[#0071e3]" />
          Career OS
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PIPELINE_STEPS.map((step, i) => {
                const isActive = i === currentStep
                const isDone = completedSteps.includes(i)
                const Icon = step.icon
                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={<Link href={step.href} />}
                      isActive={isActive}
                      tooltip={step.label}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : isActive ? (
                          <Circle className="size-4 fill-[#0071e3]/20 text-[#0071e3]" />
                        ) : (
                          <Circle className="size-4 text-[#b0b0b0]" />
                        )}
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{step.label}</span>
                          <span className="text-[10px] text-muted-foreground">{step.sub}</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Extras</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {EXTRA_STEPS.map((step) => {
                const isActive = pathname === step.href
                const Icon = step.icon
                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={<Link href={step.href} />}
                      isActive={isActive}
                      tooltip={step.label}
                    >
                      <Icon className="size-4" />
                      <span className="text-sm">{step.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {showResetConfirm ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-2">
            <p className="text-[11px] text-rose-700 leading-snug">
              ¿Estás seguro? Se borrará todo el progreso del pipeline.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-600 transition-colors"
              >
                Sí, reiniciar
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-1 text-[10px] font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <SidebarMenuButton
            onClick={() => setShowResetConfirm(true)}
            tooltip="Reset pipeline"
            className="text-[#858585] hover:text-rose-500"
          >
            <RotateCcw className="size-4" />
            <span className="text-xs">Reset pipeline</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
