'use client'

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
