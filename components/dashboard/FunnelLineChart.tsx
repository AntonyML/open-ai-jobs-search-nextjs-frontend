'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface FunnelChartDatum {
  stage: string
  count: number
}

/**
 * Echarts-style line chart (smooth curve, gradient area fill,
 * animated draw-in) rendered with recharts. Display-only.
 */
export function FunnelLineChart({
  data,
  jobsLabel,
}: {
  data: FunnelChartDatum[]
  jobsLabel: string
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="funnelFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#2997ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e8e8ed"
            vertical={false}
          />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 12, fill: '#858585' }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#858585' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: '#2997ff', strokeDasharray: '4 4', strokeWidth: 1.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as FunnelChartDatum
              return (
                <div className="rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium text-[#1d1d1f]">{item.stage}</p>
                  <p className="mt-0.5 font-semibold text-[#0071e3]">
                    {item.count.toLocaleString()} {jobsLabel}
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#0071e3"
            strokeWidth={2.5}
            fill="url(#funnelFill)"
            dot={{ r: 4, fill: '#0071e3', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#0071e3', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
