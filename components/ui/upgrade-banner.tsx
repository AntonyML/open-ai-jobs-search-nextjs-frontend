'use client'

import type { UpgradeBannerProps } from '@/types/pipeline'

export function UpgradeBanner({ message, usage, onUpgrade, upgradeLabel = 'Upgrade' }: UpgradeBannerProps) {
  return (
    <div className="upgrade-banner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(251, 191, 36, 0.8)', flexShrink: 0 }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="upgrade-banner-text">
        {message}
        {usage && <span className="ml-1 opacity-70">({usage})</span>}
      </span>
      <button
        onClick={onUpgrade}
        className="upgrade-banner-btn"
      >
        {upgradeLabel}
      </button>
    </div>
  )
}
