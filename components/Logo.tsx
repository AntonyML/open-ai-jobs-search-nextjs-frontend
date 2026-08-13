import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
  alt?: string
  showIconOnly?: boolean
  showBackground?: boolean
}

export function Logo({
  size = 32,
  className = '',
  alt = 'Open AI Jobs Search',
  showIconOnly = true,
  showBackground = false,
  ...props
}: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={alt}
        focusable="false"
        className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        {...props}
      >
        {showBackground && (
          <rect
            width="32"
            height="32"
            rx="8"
            className="fill-primary/10 dark:fill-primary/20"
          />
        )}
        {/* Brain / AI Node Network Mesh */}
        <path
          d="M16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25C20.9706 25 25 20.9706 25 16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-primary"
        />
        {/* Active AI Node */}
        <circle cx="21" cy="11" r="3" className="fill-primary" />
        {/* Search Check / Spark */}
        <path
          d="M12 16.5L15 19.5L22 12.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </svg>
      {!showIconOnly && (
        <span className="font-semibold tracking-tight text-foreground text-sm md:text-base">
          Open AI Jobs
        </span>
      )}
    </span>
  )
}

export default Logo