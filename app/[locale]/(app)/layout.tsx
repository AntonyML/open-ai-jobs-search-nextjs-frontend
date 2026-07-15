'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StepSidebar from '@/components/StepSidebar'
import { isLoggedIn } from '@/lib/auth'
import LLMControlCenter from '@/components/LLMControlCenter'

const routes = ['providers', 'setup', 'scrape', 'rank', 'apply', 'interview', 'outcome']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(), [ready, setReady] = useState(false), [done, setDone] = useState<number[]>([])
  useEffect(() => { if (!isLoggedIn()) router.replace('/login'); else { try { setDone(JSON.parse(localStorage.getItem('completed_steps') || '[]')) } catch {} setReady(true) } }, [router])
  if (!ready) return null
  const step = Math.max(0, routes.findIndex(x => path.includes(x)))
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />
      <div className="pt-12 md:flex">
        <StepSidebar currentStep={step} completedSteps={done} />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-14">
          {children}
        </main>
        <LLMControlCenter />
      </div>
    </div>
  )
}
