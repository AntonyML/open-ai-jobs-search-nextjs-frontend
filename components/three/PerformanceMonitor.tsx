'use client'

import { PerformanceMonitor as DreiPerformanceMonitor } from '@react-three/drei'

interface PerformanceMonitorProps {
  /** Fired when FPS stays below threshold → degrade quality (lower dpr). */
  onDecline?: () => void
  /** Fired when FPS recovers → restore quality. */
  onIncline?: () => void
}

/**
 * Wraps drei's PerformanceMonitor so scenes can react to sustained frame drops
 * (e.g. lowering the renderer DPR on weak GPUs or low-power mode).
 *
 * Must be rendered inside <Canvas> (it reads the gl state via useThree).
 */
export function PerformanceMonitor({ onDecline, onIncline }: PerformanceMonitorProps) {
  return <DreiPerformanceMonitor onDecline={onDecline} onIncline={onIncline} />
}
