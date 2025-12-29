"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTierColor } from "@/lib/utils/tier"
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { useRouter } from "next/navigation"

type MetricType = "dwc" | "iadc" | "volume"
type ViewType = "top" | "bottom"

const metricLabels: Record<MetricType, string> = {
  dwc: "DWC %",
  iadc: "IADC %",
  volume: "Jours actifs",
}

const rankEmojis = ["🥇", "🥈", "🥉", "4.", "5."]

export function TopDrivers() {
  const router = useRouter()
  const { selectedStation } = useDashboardStore()
  const { period, year, weekNum, date, displayLabel, normalizedTime } = useFilters()

  const [metric, setMetric] = useState<MetricType>("dwc")
  const [view, setView] = useState<ViewType>("top")

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get drivers from Convex - choose query based on mode
  const driversWeekly = useQuery(
    api.stats.getDashboardDrivers,
    station && period === "week" ? { stationId: station._id, year, week: weekNum } : "skip"
  )

  const driversDaily = useQuery(
    api.stats.getDashboardDriversDaily,
    station && period === "day" ? { stationId: station._id, date } : "skip"
  )

  const driversRange = useQuery(
    api.stats.getDashboardDriversRange,
    station && period === "range"
      ? { stationId: station._id, startDate: normalizedTime.start, endDate: normalizedTime.end }
      : "skip"
  )

  const drivers = period === "day" ? driversDaily : period === "range" ? driversRange : driversWeekly

  const sortedDrivers = useMemo(() => {
    if (!drivers) return []

    return [...drivers]
      .sort((a, b) => {
        const getValue = (driver: typeof a) => {
          switch (metric) {
            case "dwc":
              return driver.dwcPercent
            case "iadc":
              return driver.iadcPercent
            case "volume":
              return driver.daysActive
          }
        }
        return view === "top" ? getValue(b) - getValue(a) : getValue(a) - getValue(b)
      })
      .slice(0, 5)
  }, [drivers, metric, view])

  const getDisplayValue = (driver: NonNullable<typeof drivers>[0]) => {
    switch (metric) {
      case "dwc":
        return `${driver.dwcPercent}%`
      case "iadc":
        return `${driver.iadcPercent}%`
      case "volume":
        return `${driver.daysActive} jours`
    }
  }

  // Loading state
  if (!station || drivers === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
              <Skeleton className="h-6 w-6" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!drivers || drivers.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">Top 5 Drivers</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-center py-8">
          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">Aucun driver</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {view === "top" ? "Top 5 Drivers" : "Bottom 5 Drivers"}
          </CardTitle>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Select value={metric} onValueChange={(value: MetricType) => setMetric(value)}>
            <SelectTrigger className="h-8 w-[120px] border-border bg-muted text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {Object.entries(metricLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
            <Button
              variant={view === "top" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 px-2 text-xs", view === "top" && "bg-card")}
              onClick={() => setView("top")}
            >
              <Trophy className="mr-1 h-3 w-3" />
              Top
            </Button>
            <Button
              variant={view === "bottom" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 px-2 text-xs", view === "bottom" && "bg-card")}
              onClick={() => setView("bottom")}
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Bottom
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-3">
          {sortedDrivers.map((driver, index) => (
            <div
              key={driver.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-sm">{rankEmojis[index]}</span>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{driver.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {driver.trend === null ? (
                      <>
                        <span className="text-muted-foreground">—</span>
                        <span>pas de données S{weekNum > 1 ? weekNum - 1 : 52}</span>
                      </>
                    ) : (
                      <>
                        {driver.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={driver.trend >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {driver.trend > 0 ? "+" : ""}
                          {driver.trend}%
                        </span>
                        <span>
                          {period === "day" ? "vs veille" : period === "range" ? "évol." : `vs S${weekNum > 1 ? weekNum - 1 : 52}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={cn("text-sm font-semibold", getTierColor(driver.tier))}>
                  {getDisplayValue(driver)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full text-primary hover:text-primary"
          onClick={() => router.push("/dashboard/drivers")}
        >
          Voir tous →
        </Button>
      </CardContent>
    </Card>
  )
}
