"use client"

import { Card, CardContent } from "@/components/ui/card"
import { KPICardSkeleton } from "@/components/ui/skeletons"
import { getTier, getTierBgColor } from "@/lib/utils/tier"
import { TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { getWeek } from "date-fns"

const tierLabels = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

export function KPICards() {
  const { selectedStation, selectedDate } = useDashboardStore()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })
  const year = selectedDate.getFullYear()

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get KPIs from Convex
  const kpis = useQuery(
    api.stats.getDashboardKPIs,
    station ? { stationId: station._id, year, week } : "skip"
  )

  // Loading state
  if (!station || kpis === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // No data state
  if (!kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Aucune donnée pour la semaine {week}</p>
            <p className="text-sm text-muted-foreground mt-1">Importez un rapport pour voir les KPIs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dwcTier = getTier(kpis.avgDwc)
  const iadcTier = getTier(kpis.avgIadc)

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {/* DWC Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">DWC</span>
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">{kpis.avgDwc}%</div>
          <div className="mt-2 md:mt-3">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 md:py-1 text-xs font-medium",
                getTierBgColor(dwcTier),
              )}
            >
              {tierLabels[dwcTier]}
            </span>
          </div>
          <div className="mt-2 md:mt-3 flex items-center gap-1 text-xs md:text-sm">
            {kpis.dwcTrend >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-400" />
                <span className="text-emerald-400">+{kpis.dwcTrend}</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
                <span className="text-red-400">{kpis.dwcTrend}</span>
              </>
            )}
            <span className="text-muted-foreground hidden sm:inline">vs S{kpis.prevWeek}</span>
          </div>
        </CardContent>
      </Card>

      {/* IADC Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">IADC</span>
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">{kpis.avgIadc}%</div>
          <div className="mt-2 md:mt-3">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 md:py-1 text-xs font-medium",
                getTierBgColor(iadcTier),
              )}
            >
              {tierLabels[iadcTier]}
            </span>
          </div>
          <div className="mt-2 md:mt-3 flex items-center gap-1 text-xs md:text-sm">
            {kpis.iadcTrend >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-400" />
                <span className="text-emerald-400">+{kpis.iadcTrend}</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
                <span className="text-red-400">{kpis.iadcTrend}</span>
              </>
            )}
            <span className="text-muted-foreground hidden sm:inline">vs S{kpis.prevWeek}</span>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">Drivers</span>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">
            <span>{kpis.activeDrivers}</span>
            <span className="text-sm md:text-lg text-muted-foreground">/{kpis.totalDrivers}</span>
          </div>
          <div className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
            <span className="hidden sm:inline">actifs cette semaine</span>
            <span className="sm:hidden">actifs</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">Alertes</span>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">{kpis.alerts}</div>
          <div className="mt-2 md:mt-3">
            <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 md:py-1 text-xs font-medium text-amber-400">
              À traiter
            </span>
          </div>
          <button className="mt-2 md:mt-3 text-xs md:text-sm text-primary hover:underline">Voir →</button>
        </CardContent>
      </Card>
    </div>
  )
}
