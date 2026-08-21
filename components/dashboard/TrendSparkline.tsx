'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

/**
 * Minimal premium sparkline — no axes, no grid, gradient area fill.
 * Highlights the latest data point with an accent dot so the current
 * trend direction is readable at a glance (best practice for KPI cards).
 */
export function TrendSparkline({
  data,
  color,
  id,
}: {
  data: number[]
  color: string
  id: string
}) {
  if (data.length === 0) return null
  const chartData = data.map((v, i) => ({ i, v }))

  return (
    <div className="h-10 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 40 }}>
        <AreaChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={(props: any) =>
              props.index === data.length - 1 ? (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={3}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              ) : (
                <g />
              )
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
