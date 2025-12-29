"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts"
import { HelpCircle } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"

const tierConfig = [
  { key: "fantastic", label: "Fantastic", color: "#34d399" },
  { key: "great", label: "Great", color: "#60a5fa" },
  { key: "fair", label: "Fair", color: "#fbbf24" },
  { key: "poor", label: "Poor", color: "#f87171" },
]

export function TierDistribution() {
  const { selectedStation } = useDashboardStore()
  const { period, year, weekNum, date, displayLabel, normalizedTime } = useFilters()

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get KPIs from Convex - choose query based on mode
  const kpisWeekly = useQuery(
    api.stats.getDashboardKPIs,
    station && period === "week" ? { stationId: station._id, year, week: weekNum } : "skip"
  )

  const kpisDaily = useQuery(
    api.stats.getDashboardKPIsDaily,
    station && period === "day" ? { stationId: station._id, date } : "skip"
  )

  const kpisRange = useQuery(
    api.stats.getDashboardKPIsRange,
    station && period === "range"
      ? { stationId: station._id, startDate: normalizedTime.start, endDate: normalizedTime.end }
      : "skip"
  )

  const kpis = period === "day" ? kpisDaily : period === "range" ? kpisRange : kpisWeekly

  // Loading state
  if (!station || kpis === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24 mt-1" />
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-4 w-full border-t border-border pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full mt-2 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!kpis || !kpis.tierDistribution) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">Distribution Tiers</CardTitle>
          <p className="text-xs text-muted-foreground">{displayLabel}</p>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground text-sm">Aucune donnée</p>
        </CardContent>
      </Card>
    )
  }

  const data = tierConfig.map((tier) => ({
    name: tier.label,
    value: kpis.tierDistribution[tier.key as keyof typeof kpis.tierDistribution] || 0,
    color: tier.color,
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const highPerformers = total > 0
    ? Math.round(((kpis.tierDistribution.fantastic + kpis.tierDistribution.great) / total) * 100)
    : 0

  return (
    <TooltipProvider delayDuration={300}>
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base font-semibold text-card-foreground">Distribution Tiers</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">Répartition des drivers par niveau de performance DWC : Fantastic (≥98.5%), Great (≥96%), Fair (≥90%), Poor (&lt;90%)</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <p className="text-xs text-muted-foreground">{displayLabel} • {total} drivers</p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="text-xs font-medium text-card-foreground">
                {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>

        {/* High performers progress */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">High Performers</span>
            <span className="font-medium text-card-foreground">{highPerformers}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              style={{ width: `${highPerformers}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Objectif: ≥75%</p>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}
