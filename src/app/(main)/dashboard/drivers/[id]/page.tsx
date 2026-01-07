"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { DriverHeader } from "@/components/drivers/driver-header"
import { DriverKpis } from "@/components/drivers/driver-kpis"
import { DriverPerformanceChart } from "@/components/drivers/driver-performance-chart"
import { DailyPerformanceChartWithCoaching } from "@/components/drivers/daily-performance-chart-with-coaching"
import { ErrorBreakdown } from "@/components/drivers/error-breakdown"
import { CoachingHistory } from "@/components/drivers/coaching-history"
import { DailyPerformance } from "@/components/drivers/daily-performance"
import { NewActionModal } from "@/components/coaching/new-action-modal"
import { useDashboardStore } from "@/lib/store"
import { useFilters, useBuildFilteredHref } from "@/lib/filters"
import { ChevronLeft, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { DriverDetail } from "@/lib/types"

interface DriverDetailPageProps {
  params: Promise<{ id: string }>
}

function LoadingSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs skeleton */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Two columns skeleton */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function NotFoundState() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Drivers
          </Link>
        </div>

        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Driver non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Ce driver n&apos;existe pas ou vous n&apos;avez pas accès à ses données.
            </p>
            <Link
              href="/dashboard/drivers"
              className="text-primary hover:underline"
            >
              Retour à la liste des drivers
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function NoDataState({ driverName }: { driverName: string }) {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Drivers
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm text-card-foreground">{driverName}</span>
        </div>

        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">Pas de données</h2>
            <p className="text-muted-foreground mb-4">
              Aucune donnée de performance n&apos;est disponible pour cette semaine.
              Essayez de sélectionner une autre période.
            </p>
            <Link
              href="/dashboard/drivers"
              className="text-primary hover:underline"
            >
              Retour à la liste des drivers
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = use(params)
  const { selectedStation } = useDashboardStore()
  const [coachingModalOpen, setCoachingModalOpen] = useState(false)

  // Use global week filter from URL (nuqs)
  const { week: globalWeek } = useFilters()
  const buildHref = useBuildFilteredHref()

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Get driver detail with GLOBAL week filter (linked to header selector)
  const driverDetail = useQuery(api.drivers.getDriverWithFullHistory, {
    driverId: id as Id<"drivers">,
    weeksLimit: 12, // Always load 12 weeks of history for charts
    year: globalWeek.year,
    week: globalWeek.week,
  })

  // Get coaching history
  const coachingHistory = useQuery(api.coaching.getDriverCoachingHistory, {
    driverId: id as Id<"drivers">,
  })

  // Comparison label based on latest week
  const comparisonLabel = "vs sem. préc."

  // Loading state
  if (driverDetail === undefined || coachingHistory === undefined || station === undefined) {
    return <LoadingSkeleton />
  }

  // Not found state (driver or station)
  if (driverDetail === null || station === null) {
    return <NotFoundState />
  }

  // No data at all for this driver
  if (!driverDetail.hasData) {
    return <NoDataState driverName={driverDetail.name} />
  }

  // Combine driver detail with coaching history
  const driver: DriverDetail = {
    ...driverDetail,
    coachingHistory: coachingHistory || [],
  }

  // Week info - now using global filter
  const latestWeek = driverDetail.latestWeek
  const weekNum = globalWeek.week
  const hasDataForWeek = driverDetail.hasDataForSelectedWeek !== false

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center">
          <Link
            href={buildHref("/dashboard/drivers")}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Drivers
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm text-card-foreground">{driver.name}</span>
          {latestWeek && (
            <Badge variant="secondary" className="ml-3">
              Dernière donnée: S{latestWeek.week} {latestWeek.year}
            </Badge>
          )}
        </div>

        {/* Driver Header */}
        <div className="mb-6">
          <DriverHeader
            driver={driver}
            driverId={id as Id<"drivers">}
            stationId={station._id}
            year={globalWeek.year}
            week={globalWeek.week}
            onPlanCoaching={() => setCoachingModalOpen(true)}
          />
        </div>

        {/* No data warning for selected week */}
        {!hasDataForWeek && (
          <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Aucune donnée pour la semaine {globalWeek.week}</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Ce driver n&apos;a pas de données pour la semaine sélectionnée.
              {latestWeek && (
                <> Dernière donnée disponible: S{latestWeek.week} {latestWeek.year}.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Performance</h2>
            <Badge variant="outline" className="text-muted-foreground">
              Semaine {globalWeek.week} • {globalWeek.year}
            </Badge>
          </div>
          <DriverKpis driver={driver} comparisonLabel={comparisonLabel} />
        </div>

        {/* Daily Performance Chart with Coaching Markers */}
        <div className="mb-6">
          <DailyPerformanceChartWithCoaching
            driverId={id as Id<"drivers">}
            driverName={driver.name}
          />
        </div>

        {/* Weekly Performance Chart */}
        <div className="mb-6">
          <DriverPerformanceChart driver={driver} />
        </div>

        {/* Two Columns: Error Breakdown + Coaching History */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ErrorBreakdown driver={driver} />
          <CoachingHistory driver={driver} onPlanCoaching={() => setCoachingModalOpen(true)} />
        </div>

        {/* Daily Performance */}
        <DailyPerformance driver={driver} week={weekNum} />
      </div>

      {/* Coaching Modal */}
      {station && (
        <NewActionModal
          open={coachingModalOpen}
          onOpenChange={setCoachingModalOpen}
          stationId={station._id}
          prefillSuggestion={{
            id: `suggestion-${driver.id}`,
            driverId: driver.id,
            driverName: driver.name,
            driverTier: driver.tier,
            driverDwc: driver.dwcPercent,
            priority: driver.tier === "poor" ? "high" : "new_poor",
            reason: `Performance ${driver.tier}: ${driver.dwcPercent}% DWC`,
            mainError: "DWC",
            mainErrorCount: driver.errors,
            hasActiveAction: false,
          }}
        />
      )}
    </main>
  )
}
