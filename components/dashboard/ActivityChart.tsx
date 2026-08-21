'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ActivityDatum {
  date: string
  applications: number
  interviews: number
}

/**
 * Daily activity — grouped bars for applications vs interviews.
 * Rounded caps, soft grid, custom tooltip. Display-only.
 */
export function ActivityChart({
  data,
  appsLabel,
  interviewsLabel,
  locale,
}: {
  data: ActivityDatum[]
  appsLabel: string
  interviewsLabel: string
  locale: string
}) {
  if (data.length === 0) return null

  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    })

  const chartData = data.map((d) => ({
    ...d,
    label: fmt(d.date),
  }))

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
        initialDimension={{ width: 320, height: 256 }}
      >
        <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#858585' }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#858585' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: '#f5f5f7' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as ActivityDatum & { label: string }
              return (
                <div className="rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium capitalize text-[#1d1d1f]">{item.label}</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="flex items-center gap-1.5 text-[#707070]">
                      <span className="size-2 rounded-full bg-[#0071e3]" />
                      {appsLabel}:{' '}
                      <span className="font-semibold text-[#1d1d1f]">{item.applications}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[#707070]">
                      <span className="size-2 rounded-full bg-[#5856d6]" />
                      {interviewsLabel}:{' '}
                      <span className="font-semibold text-[#1d1d1f]">{item.interviews}</span>
                    </p>
                  </div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="applications"
            name={appsLabel}
            fill="#0071e3"
            radius={[4, 4, 0, 0]}
            maxBarSize={16}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="interviews"
            name={interviewsLabel}
            fill="#5856d6"
            radius={[4, 4, 0, 0]}
            maxBarSize={16}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
