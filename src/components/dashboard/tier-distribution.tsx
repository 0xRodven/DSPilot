"use client"

import Link from "next/link"
import { PieChart, Pie, Label } from "recharts"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { HelpCircle } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"

// Chart configuration with tier colors
const tierChartConfig = {
  drivers: { label: "Drivers" },
  fantastic: { label: "Fantastic", color: "#34d399" },
  great: { label: "Great", color: "#60a5fa" },
  fair: { label: "Fair", color: "#fbbf24" },
  poor: { label: "Poor", color: "#f87171" },
} satisfies ChartConfig

type TierKey = "fantastic" | "great" | "fair" | "poor"

export function TierDistribution() {
  const { selectedStation } = useDashboardStore()
  const { period, year, weekNum, date, displayLabel, normalizedTime } = useFilters()

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

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
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!kpis || !kpis.tierDistribution) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Distribution des Tiers</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground text-sm">Aucune donnee disponible</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for recharts
  const chartData = (["fantastic", "great", "fair", "poor"] as TierKey[]).map((tier) => ({
    tier,
    drivers: kpis.tierDistribution[tier] || 0,
    fill: `var(--color-${tier})`,
  }))

  const totalDrivers = chartData.reduce((sum, item) => sum + item.drivers, 0)

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base font-semibold">Distribution des Tiers</CardTitle>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Repartition des drivers par niveau de performance DWC : Fantastic (≥98.5%), Great
                  (≥96%), Fair (≥90%), Poor (&lt;90%)
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
        </CardHeader>

        <CardContent className="h-48">
          <ChartContainer config={tierChartConfig} className="size-full">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="drivers"
                nameKey="tier"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground font-bold text-3xl tabular-nums"
                          >
                            {totalDrivers.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Drivers
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                content={() => (
                  <ul className="ml-8 flex flex-col gap-3">
                    {chartData.map((item) => (
                      <li key={item.tier} className="flex w-32 items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: item.fill }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {tierChartConfig[item.tier].label}
                          </span>
                        </span>
                        <span className="text-sm font-medium tabular-nums">{item.drivers}</span>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="gap-2 pt-0">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/dashboard/drivers">Voir les drivers</Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Exporter
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
