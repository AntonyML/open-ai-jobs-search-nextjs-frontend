'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PipelineSidebar from '@/components/PipelineSidebar'
import { isLoggedIn, getCompletedSteps } from '@/lib/auth'
import LLMControlCenter from '@/components/LLMControlCenter'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'

const routes = ['providers', 'setup', 'scrape', 'rank', 'apply', 'interview', 'outcome']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(), [ready, setReady] = useState(false), [done, setDone] = useState<number[]>([])
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    // Leer el estado del pipeline asociado al usuario actual (no global).
    setDone(getCompletedSteps())
    setReady(true)
  }, [router])
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
      <LLMControlCenter />
    </div>
  )
}
