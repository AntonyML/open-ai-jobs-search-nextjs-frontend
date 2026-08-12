'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AppSidebar from '@/components/AppSidebar'
import { isLoggedIn } from '@/lib/auth'
import LLMControlCenter from '@/components/LLMControlCenter'
import UpgradeListener from '@/components/UpgradeListener'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    setReady(true)
  }, [router])
  if (!ready) return null
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="pt-12 md:flex">
          <AppSidebar />
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