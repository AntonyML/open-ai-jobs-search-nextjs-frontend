'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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

const steps = [
  { labelKey: 'providers', subKey: 'providersDesc', href: '/pipeline/providers', icon: User },
  { labelKey: 'setup', subKey: 'setupDesc', href: '/pipeline/setup', icon: FileText },
  { labelKey: 'scrape', subKey: 'scrapeDesc', href: '/pipeline/scrape', icon: Globe },
  { labelKey: 'rank', subKey: 'rankDesc', href: '/pipeline/rank', icon: BarChart3 },
  { labelKey: 'apply', subKey: 'applyDesc', href: '/pipeline/apply', icon: Search },
  { labelKey: 'interview', subKey: 'interviewDesc', href: '/pipeline/interview', icon: Mic },
  { labelKey: 'outcome', subKey: 'outcomeDesc', href: '/pipeline/outcome', icon: TrendingUp },
]

const extraSteps = [
  { labelKey: 'extras.expand', subKey: 'extras.expandDesc', href: '/pipeline/expand', icon: Plus },
  { labelKey: 'extras.upskill', subKey: 'extras.upskillDesc', href: '/pipeline/upskill', icon: ArrowLeftRight },
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
  const t = useTranslations('pipeline')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleReset = async () => {
    try {
      const res = await apiFetch<{ status: string; total_deleted: number; message: string }>(
        '/api/v1/pipeline-reset/',
        { method: 'DELETE' }
      )
      showSuccess(res.message || t('reset'))
    } catch (err) {
      showError(err instanceof Error ? err.message : t('reset'))
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
          Open Ai Jobs Search
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {steps.map((step, i) => {
                const isActive = i === currentStep
                const isDone = completedSteps.includes(i)
                const Icon = step.icon
                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={<Link href={step.href} />}
                      isActive={isActive}
                      tooltip={t(`steps.${step.labelKey}`)}
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
                          <span className="text-sm font-medium">{t(`steps.${step.labelKey}`)}</span>
                          <span className="text-[10px] text-muted-foreground">{t(`steps.${step.subKey}`)}</span>
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
          <SidebarGroupLabel>{t('extras.expand')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {extraSteps.map((step) => {
                const isActive = pathname === step.href
                const Icon = step.icon
                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={<Link href={step.href} />}
                      isActive={isActive}
                      tooltip={t(step.labelKey)}
                    >
                      <Icon className="size-4" />
                      <span className="text-sm">{t(step.labelKey)}</span>
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
              {t('resetConfirm')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-600 transition-colors"
              >
                {t('resetYes')}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-1 text-[10px] font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
              >
                {t('resetNo')}
              </button>
            </div>
          </div>
        ) : (
          <SidebarMenuButton
            onClick={() => setShowResetConfirm(true)}
            tooltip={t('reset')}
            className="text-[#858585] hover:text-rose-500"
          >
            <RotateCcw className="size-4" />
            <span className="text-xs">{t('reset')}</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
