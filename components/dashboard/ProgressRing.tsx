'use client'

import { useEffect, useId, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Animated circular progress ring (d3-style data visualization).
 * The arc sweeps from 0 → value with an ease-out curve and a dot
 * tracks the tip of the arc.
 */
export function ProgressRing({
  value,
  size = 196,
  strokeWidth = 14,
  children,
}: {
  value: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const [progress, setProgress] = useState(0)
  const gradientId = useId().replace(/:/g, '')

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const duration = 1100
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(progress, 0), 100)
  const dashOffset = circumference - (clamped / 100) * circumference
  const angle = (clamped / 100) * 2 * Math.PI - Math.PI / 2
  const tipX = size / 2 + radius * Math.cos(angle)
  const tipY = size / 2 + radius * Math.sin(angle)

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Pipeline progress"
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>

        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2997ff" />
            <stop offset="100%" stopColor="#0071e3" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8e8ed"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            filter: 'drop-shadow(0 2px 10px rgba(0, 113, 227, 0.35))',
          }}
        />
      </svg>
      {/* Tip dot */}
      {clamped > 0 && (
        <span
          className="absolute transition-none"
          style={{ left: tipX - 6, top: tipY - 6 }}
          aria-hidden
        >
          <span className="block size-3 rounded-full bg-white shadow ring-2 ring-[#0071e3]" />
        </span>
      )}
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
