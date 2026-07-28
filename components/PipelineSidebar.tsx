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
import { clearCompletedSteps, getCompletedSteps, isPremium } from '@/lib/auth'
import UpgradeModal from '@/components/UpgradeModal'
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
  Lock,
} from 'lucide-react'

const debugSlideMenu = process.env.NEXT_PUBLIC_DEBUG_SLIDE_MENU === 'true'

const steps = [
  { labelKey: 'providers', subKey: 'providersDesc', href: '/pipeline/providers', icon: User },
  { labelKey: 'setup', subKey: 'setupDesc', href: '/pipeline/setup', icon: FileText },
  { labelKey: 'search', subKey: 'searchDesc', href: '/pipeline/search', icon: Search },
  { labelKey: 'rank', subKey: 'rankDesc', href: '/pipeline/rank', icon: BarChart3 },
  { labelKey: 'apply', subKey: 'applyDesc', href: '/pipeline/apply', icon: Search },
  { labelKey: 'interview', subKey: 'interviewDesc', href: '/pipeline/interview', icon: Mic },
  { labelKey: 'outcome', subKey: 'outcomeDesc', href: '/pipeline/outcome', icon: TrendingUp },
]

const extraSteps = [
  { labelKey: 'extras.expand', subKey: 'extras.expandDesc', href: '/pipeline/expand', icon: Plus },
  { labelKey: 'extras.upskill', subKey: 'extras.upskillDesc', href: '/pipeline/upskill', icon: ArrowLeftRight },
]

// ── Subcomponents ─────────────────────────────────────────────────

function StepStatusIcon({ isDone, isActive }: { isDone: boolean; isActive: boolean }) {
  if (isDone) {
    return <CheckCircle2 className="size-4 text-emerald-500" />
  }
  if (isActive) {
    return <Circle className="size-4 fill-[#0071e3]/20 text-[#0071e3]" />
  }
  return <Circle className="size-4 text-[#b0b0b0]" />
}

function ResetSection({ completedSteps, t }: { completedSteps: number[]; t: (key: string) => string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

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
    localStorage.removeItem('ranking_job_id')
    clearCompletedSteps()
    setShowConfirm(false)
    router.push('/pipeline/providers')
    setTimeout(() => window.location.reload(), 0)
  }

  if (completedSteps.length === 0) {
    return (
      <SidebarMenuButton disabled tooltip={t('resetEmpty')} className="cursor-not-allowed text-[#b0b0b0]">
        <RotateCcw className="size-4" />
        <span className="text-xs">{t('reset')}</span>
      </SidebarMenuButton>
    )
  }

  if (showConfirm) {
    return (
      <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
        <p className="text-[11px] leading-snug text-rose-700">{t('resetConfirm')}</p>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-rose-600"
          >
            {t('resetYes')}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-2 py-1 text-[10px] font-medium text-[#707070] transition-colors hover:bg-[#f5f5f7]"
          >
            {t('resetNo')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <SidebarMenuButton
      onClick={() => setShowConfirm(true)}
      tooltip={t('reset')}
      className="text-[#858585] hover:text-rose-500"
    >
      <RotateCcw className="size-4" />
      <span className="text-xs">{t('reset')}</span>
    </SidebarMenuButton>
  )
}

function UpgradeFooter({ onUpgrade }: { onUpgrade: () => void }) {
  const t = useTranslations('pipeline')

  return (
    <div className="mb-2">
      <button
        onClick={onUpgrade}
        className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/80 px-3 py-2 text-xs font-medium text-amber-700 transition-all hover:from-amber-100 hover:to-amber-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {t('upgradeBanner') || 'Upgrade to Premium'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PipelineSidebar({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: number[]
}) {
  const pathname = usePathname()
  const t = useTranslations('pipeline')
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-sidebar-foreground transition-opacity hover:opacity-70"
        >
          <CheckCircle2 className="size-4 text-[#0071e3]" />
          Open Ai Jobs Search
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main pipeline steps */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {steps.map((step, i) => {
                const isActive = i === currentStep
                const isDone = completedSteps.includes(i)
                const accessible = debugSlideMenu || i === 0 || completedSteps.includes(i - 1)
                const linkEl = accessible ? <Link href={step.href} /> : undefined

                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={linkEl}
                      isActive={isActive}
                      tooltip={t(`steps.${step.labelKey}`)}
                      className={!accessible ? 'cursor-not-allowed opacity-40' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <StepStatusIcon isDone={isDone} isActive={isActive} />
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">
                            {t(`steps.${step.labelKey}`)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {t(`steps.${step.subKey}`)}
                          </span>
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

        {/* Extra steps (expand, upskill) */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('extras.expand')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {extraSteps.map((step) => {
                const isActive = pathname === step.href
                const accessible = debugSlideMenu || isPremium()
                const linkEl = accessible ? <Link href={step.href} /> : undefined
                const Icon = step.icon

                return (
                  <SidebarMenuItem key={step.href}>
                    <SidebarMenuButton
                      render={linkEl}
                      isActive={isActive}
                      tooltip={t(step.labelKey)}
                      className={!accessible ? 'cursor-not-allowed opacity-40' : ''}
                      onClick={!accessible ? () => setShowUpgrade(true) : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span className="text-sm">{t(step.labelKey)}</span>
                        {!accessible && <Lock className="size-3 text-amber-500" />}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {/* Upgrade banner for free tier */}
        {!isPremium() && !debugSlideMenu && <UpgradeFooter onUpgrade={() => setShowUpgrade(true)} />}

        {/* Reset button */}
        <ResetSection completedSteps={completedSteps} t={t} />
      </SidebarFooter>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </Sidebar>
  )
}
