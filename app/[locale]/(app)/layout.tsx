'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PipelineSidebar from '@/components/PipelineSidebar'
import { isLoggedIn, getCompletedSteps, COMPLETED_STEPS_UPDATED } from '@/lib/auth'
import LLMControlCenter from '@/components/LLMControlCenter'
import UpgradeListener from '@/components/UpgradeListener'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'

const routes = ['providers', 'setup', 'search', 'rank', 'apply', 'interview', 'outcome']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(), [ready, setReady] = useState(false), [done, setDone] = useState<number[]>([])
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    setDone(getCompletedSteps())
    setReady(true)
  }, [router])

  // Re-sync completed steps from localStorage when steps are updated
  useEffect(() => {
    const handler = () => setDone(getCompletedSteps())
    window.addEventListener(COMPLETED_STEPS_UPDATED, handler)
    return () => window.removeEventListener(COMPLETED_STEPS_UPDATED, handler)
  }, [])
  if (!ready) return null
  const step = Math.max(0, routes.findIndex(x => path.includes(x)))
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="pt-12 md:flex">
          <PipelineSidebar currentStep={step} completedSteps={done} />
          <SidebarInset className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-14">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
      {['search', 'rank', 'apply', 'interview', 'expand', 'upskill'].some(s => path.includes(s)) && <LLMControlCenter />}
      <UpgradeListener />
    </div>
  )
}
