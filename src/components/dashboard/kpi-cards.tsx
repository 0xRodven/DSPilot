"use client"

import { Card, CardContent } from "@/components/ui/card"
import { KPICardSkeleton } from "@/components/ui/skeletons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTier, getTierBgColor } from "@/lib/utils/tier"
import { TrendingUp, TrendingDown, Users, AlertTriangle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { useRouter } from "next/navigation"

const tierLabels = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

export function KPICards() {
  const router = useRouter()
  const { selectedStation } = useDashboardStore()
  const { period, year, weekNum, date, normalizedTime } = useFilters()

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // No data state
  if (!kpis) {
    const periodLabel = period === "day" ? `le ${date}` : period === "range" ? "cette période" : `la semaine ${weekNum}`
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Aucune donnée pour {periodLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">Importez un rapport pour voir les KPIs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate comparison label based on mode (after null check)
  const comparisonLabel = period === "day"
    ? "vs veille"
    : period === "range"
      ? `sur ${"periodWeeks" in kpis ? kpis.periodWeeks : 1} sem.`
      : `vs S${"prevWeek" in kpis ? kpis.prevWeek : weekNum - 1}`

  const dwcTier = getTier(kpis.avgDwc)
  const iadcTier = getTier(kpis.avgIadc)

  return (
    <TooltipProvider delayDuration={300}>
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {/* DWC Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">DWC</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Delivered With Customer - Taux de livraisons conformes avec interaction client (photo, signature, OTP). Objectif : ≥98.5% (Fantastic)</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
            <span className="text-muted-foreground hidden sm:inline">{comparisonLabel}</span>
          </div>
        </CardContent>
      </Card>

      {/* IADC Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">IADC</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">In Absence Delivery Compliance - Taux de livraisons conformes en l'absence du client (boîte aux lettres, lieu sûr). Objectif : ≥95%</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
            <span className="text-muted-foreground hidden sm:inline">{comparisonLabel}</span>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Drivers</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Nombre de drivers actifs sur la période sélectionnée par rapport au total enregistré</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">
            <span>{kpis.activeDrivers}</span>
            <span className="text-sm md:text-lg text-muted-foreground">/{kpis.totalDrivers}</span>
          </div>
          <div className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              {period === "day" ? "actifs ce jour" : period === "range" ? "actifs sur la période" : "actifs cette semaine"}
            </span>
            <span className="sm:hidden">actifs</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Card */}
      <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Alertes</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Drivers avec un score DWC inférieur à 90% nécessitant un coaching ou une attention particulière</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
          </div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-card-foreground">{kpis.alerts}</div>
          <div className="mt-2 md:mt-3">
            <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 md:py-1 text-xs font-medium text-amber-400">
              À traiter
            </span>
          </div>
          <button
            className="mt-2 md:mt-3 text-xs md:text-sm text-primary hover:underline"
            onClick={() => router.push("/dashboard/errors")}
          >
            Voir →
          </button>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  )
}
