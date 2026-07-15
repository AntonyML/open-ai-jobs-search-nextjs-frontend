import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-12">
        {children}
      </main>
      <Footer />
    </>
  )
}
