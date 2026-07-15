'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import {
  BarChart3,
  TrendingUp,
  Globe,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ChartContainer } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface FunnelData {
  stage: string
  count: number
  fill?: string
}

interface CompletionData {
  name: string
  completed: number
  total: number
}

const FUNNEL_COLORS = ['#e2e2e5', '#2997ff', '#0071e3', '#5856d6', '#34c759']
const PIE_COLORS = ['#34c759', '#ff3b30', '#ff9500', '#5856d6', '#0071e3']

export default function Analytics() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('funnel')

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    apiFetch<{ funnel: FunnelData[]; total_jobs: number; ranked_jobs: number; applications: number; interviews: number; hired: number }>('/api/v1/analytics/funnel')
      .then((data) => {
        const funnel = (data.funnel || []).map((item, idx) => ({
          ...item,
          fill: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
          count: item.count || 0,
        }))
        setFunnelData(funnel)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const total = funnelData.reduce((sum, item) => sum + item.count, 0)
  const conversionRate = funnelData.length >= 2 && funnelData[0].count > 0
    ? Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)
    : 0

  const pieData = funnelData.length > 0
    ? funnelData
        .filter((d) => d.count > 0)
        .map((d, idx) => ({
          name: d.stage,
          value: d.count,
          fill: PIE_COLORS[idx % PIE_COLORS.length],
        }))
    : []

  const conversionPairs: { label: string; from: number; to: number; rate: number }[] = []
  for (let i = 1; i < funnelData.length; i++) {
    const from = funnelData[i - 1].count
    const to = funnelData[i].count
    conversionPairs.push({
      label: `${funnelData[i - 1].stage} → ${funnelData[i].stage}`,
      from,
      to,
      rate: from > 0 ? Math.round((to / from) * 100) : 0,
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[#707070]">
          Job search performance and conversion metrics
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total jobs', value: total, icon: Globe, color: '#0071e3' },
          { label: 'Ranked', value: funnelData[1]?.count ?? 0, icon: BarChart3, color: '#34c759' },
          { label: 'Applications', value: funnelData[2]?.count ?? 0, icon: FileText, color: '#ff9500' },
          { label: 'Conversion rate', value: `${conversionRate}%`, icon: TrendingUp, color: '#5856d6' },
        ].map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <stat.icon className="size-5" style={{ color: stat.color }} />
              </div>
              <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  stat.value
                )}
              </CardTitle>
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#f5f5f7]">
          <TabsTrigger value="funnel" className="text-sm">Funnel</TabsTrigger>
          <TabsTrigger value="conversion" className="text-sm">Conversion rates</TabsTrigger>
          <TabsTrigger value="distribution" className="text-sm">Distribution</TabsTrigger>
        </TabsList>

        {/* Tab 1: Funnel bar chart */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('conversionFunnel')}</CardTitle>
              <CardDescription>{t('fromScrapedToHired')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : funnelData.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#d2d2d7]">
                  <p className="text-sm text-[#858585]">No data yet. Start scraping jobs to see your funnel.</p>
                </div>
              ) : (
                <div className="h-72">
                  <ChartContainer
                    config={{
                      scraped: { label: 'Scraped', color: '#e2e2e5' },
                      ranked: { label: 'Ranked', color: '#2997ff' },
                      applied: { label: 'Applied', color: '#0071e3' },
                      interviewed: { label: 'Interviewed', color: '#5856d6' },
                      hired: { label: 'Hired', color: '#34c759' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <XAxis
                          dataKey="stage"
                          tick={{ fontSize: 11, fill: '#858585' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#858585' }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-xs shadow-sm">
                                <p className="font-medium text-[#1d1d1f]">{payload[0].payload.stage}</p>
                                <p className="text-[#0071e3] font-semibold mt-0.5">
                                  {payload[0].value} jobs
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={72}>
                          {funnelData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill || FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funnel step details */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {funnelData.map((step, idx) => (
              <Card key={step.stage} size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>{step.stage}</CardDescription>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: step.fill }}
                    />
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {step.count.toLocaleString()}
                  </CardTitle>
                  {idx > 0 && funnelData[idx - 1].count > 0 && (
                    <div className="flex items-center gap-1">
                      {step.count >= funnelData[idx - 1].count ? (
                        <ArrowUpRight className="size-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="size-3 text-rose-400" />
                      )}
                      <span className="text-xs text-[#707070]">
                        {Math.round((step.count / funnelData[idx - 1].count) * 100)}% from previous
                      </span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Conversion rates */}
        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion rates</CardTitle>
              <CardDescription>Step-by-step conversion between funnel stages</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : conversionPairs.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#d2d2d7]">
                  <p className="text-sm text-[#858585]">Not enough data to calculate conversion rates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversionPairs.map((pair) => (
                    <div key={pair.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#1d1d1f] font-medium">{pair.label}</span>
                        <span className="text-[#0071e3] font-semibold">{pair.rate}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#707070]">
                        <span>{pair.from.toLocaleString()} → {pair.to.toLocaleString()}</span>
                        <span className="text-rose-400">
                          -{((1 - pair.to / pair.from) * 100).toFixed(0)}% drop
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#e2e2e5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0071e3] transition-all"
                          style={{ width: `${pair.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Distribution pie chart */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job distribution</CardTitle>
              <CardDescription>How your opportunities are distributed across pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : pieData.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#d2d2d7]">
                  <p className="text-sm text-[#858585]">No data to display.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
                  <div className="h-64 w-full max-w-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-xs shadow-sm">
                                <p className="font-medium text-[#1d1d1f]">{payload[0].name}</p>
                                <p className="text-[#0071e3] font-semibold mt-0.5">
                                  {payload[0].value} jobs
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-xs text-[#474747]">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 w-full space-y-2 md:mt-0 md:w-auto">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-[#1d1d1f]">{item.name}</span>
                        </div>
                        <span className="font-medium text-[#474747]">{item.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#d2d2d7]/40 pt-2 mt-2">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-[#1d1d1f]">Total</span>
                        <span className="text-[#474747]">{total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
