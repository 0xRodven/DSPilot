"use client"

import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KPICardSkeleton } from "@/components/ui/skeletons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTier, getIadcTier, getTierBgColor } from "@/lib/utils/tier"
import { TrendingUp, TrendingDown, Users, AlertTriangle, HelpCircle, Package, PackageX } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
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
        <Card className="col-span-full">
          <CardHeader className="text-center">
            <CardDescription>Aucune donnée pour {periodLabel}</CardDescription>
            <CardTitle className="text-base font-normal text-muted-foreground">Importez un rapport pour voir les KPIs</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Calculate comparison label based on mode
  const comparisonLabel = period === "day"
    ? "vs veille"
    : period === "range"
      ? `sur ${"periodWeeks" in kpis ? kpis.periodWeeks : 1} sem.`
      : `vs S${"prevWeek" in kpis ? kpis.prevWeek : weekNum - 1}`

  const dwcTier = getTier(kpis.avgDwc)
  const iadcTier = getIadcTier(kpis.avgIadc)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        {/* DWC Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>DWC</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Delivered With Customer - Taux de livraisons conformes avec interaction client (photo, signature, OTP). Objectif : ≥95% (Fantastic)</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">{kpis.avgDwc}%</CardTitle>
            <CardAction>
              <Badge variant="outline" className={kpis.dwcTrend >= 0 ? "text-emerald-500" : "text-red-500"}>
                {kpis.dwcTrend >= 0 ? <TrendingUp className="mr-1" /> : <TrendingDown className="mr-1" />}
                {kpis.dwcTrend >= 0 ? "+" : ""}{kpis.dwcTrend}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getTierBgColor(dwcTier))}>
                {tierLabels[dwcTier]}
              </span>
            </div>
            <div className="text-muted-foreground">{comparisonLabel}</div>
          </CardFooter>
        </Card>

        {/* IADC Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>IADC</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">In Absence Delivery Compliance - Taux de livraisons conformes en l'absence du client (boîte aux lettres, lieu sûr). Objectif : ≥70% (Fantastic)</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">{kpis.avgIadc}%</CardTitle>
            <CardAction>
              <Badge variant="outline" className={kpis.iadcTrend >= 0 ? "text-emerald-500" : "text-red-500"}>
                {kpis.iadcTrend >= 0 ? <TrendingUp className="mr-1" /> : <TrendingDown className="mr-1" />}
                {kpis.iadcTrend >= 0 ? "+" : ""}{kpis.iadcTrend}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getTierBgColor(iadcTier))}>
                {tierLabels[iadcTier]}
              </span>
            </div>
            <div className="text-muted-foreground">{comparisonLabel}</div>
          </CardFooter>
        </Card>

        {/* Colis Livrés Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Colis livrés</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Nombre total de colis traités sur la période (conformes + non-conformes)</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {"totalDeliveries" in kpis ? kpis.totalDeliveries.toLocaleString("fr-FR") : "—"}
            </CardTitle>
            <CardAction>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-muted-foreground">
              {period === "day" ? "ce jour" : period === "range" ? "sur la période" : "cette semaine"}
            </div>
          </CardFooter>
        </Card>

        {/* DNR Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>DNR</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Delivery Non-conformités à Risque - Livraisons avec erreurs impactant le score DWC</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {"dnrMisses" in kpis ? kpis.dnrMisses.toLocaleString("fr-FR") : "—"}
            </CardTitle>
            <CardAction>
              <PackageX className="h-5 w-5 text-amber-400" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-muted-foreground">
              {period === "day" ? "ce jour" : period === "range" ? "sur la période" : "cette semaine"}
            </div>
          </CardFooter>
        </Card>

        {/* Drivers Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Drivers</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Nombre de drivers actifs sur la période sélectionnée par rapport au total enregistré</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {kpis.activeDrivers}
              <span className="text-lg text-muted-foreground">/{kpis.totalDrivers}</span>
            </CardTitle>
            <CardAction>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-muted-foreground">
              {period === "day" ? "actifs ce jour" : period === "range" ? "actifs sur la période" : "actifs cette semaine"}
            </div>
          </CardFooter>
        </Card>

        {/* Alerts Card */}
        <Card className="@container/card cursor-pointer hover:border-primary/20 transition-colors" onClick={() => router.push("/dashboard/errors")}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Alertes</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Drivers avec un score DWC inférieur à 88% nécessitant un coaching ou une attention particulière</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">{kpis.alerts}</CardTitle>
            <CardAction>
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                À traiter
              </span>
            </div>
            <div className="text-muted-foreground text-primary hover:underline">Voir les erreurs →</div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  )
}
