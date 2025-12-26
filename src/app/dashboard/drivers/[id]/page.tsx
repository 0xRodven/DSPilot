"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { DriverHeader } from "@/components/drivers/driver-header"
import { DriverKpis } from "@/components/drivers/driver-kpis"
import { DriverPerformanceChart } from "@/components/drivers/driver-performance-chart"
import { ErrorBreakdown } from "@/components/drivers/error-breakdown"
import { CoachingHistory } from "@/components/drivers/coaching-history"
import { DailyPerformance } from "@/components/drivers/daily-performance"
import { NewActionModal } from "@/components/coaching/new-action-modal"
import { useDashboardStore } from "@/lib/store"
import { getWeek } from "date-fns"
import { ChevronLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { DriverDetail, CoachingSuggestion } from "@/lib/types"

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
  const { selectedStation, selectedDate, granularity } = useDashboardStore()
  const [coachingModalOpen, setCoachingModalOpen] = useState(false)

  // Calculate current week/year
  const year = selectedDate.getFullYear()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get driver detail from Convex
  const driverDetail = useQuery(api.drivers.getDriverDetail, {
    driverId: id as Id<"drivers">,
    year,
    week,
  })

  // Get coaching history
  const coachingHistory = useQuery(api.coaching.getDriverCoachingHistory, {
    driverId: id as Id<"drivers">,
  })

  // Calculate comparison label based on granularity
  const getComparisonLabel = () => {
    if (granularity === "week") {
      const prevWeek = week === 1 ? 52 : week - 1
      return `vs S${prevWeek}`
    } else {
      return "vs veille"
    }
  }
  const comparisonLabel = getComparisonLabel()

  // Loading state
  if (driverDetail === undefined || coachingHistory === undefined || station === undefined) {
    return <LoadingSkeleton />
  }

  // Not found state
  if (driverDetail === null) {
    return <NotFoundState />
  }

  // Combine driver detail with coaching history
  const driver: DriverDetail = {
    ...driverDetail,
    coachingHistory: coachingHistory || [],
  }

  // No data for this week (driver exists but no stats)
  if (driver.deliveries === 0 && driver.dailyPerformance.length === 0) {
    return <NoDataState driverName={driver.name} />
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Drivers
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm text-card-foreground">{driver.name}</span>
        </div>

        {/* Driver Header */}
        <div className="mb-6">
          <DriverHeader driver={driver} onPlanCoaching={() => setCoachingModalOpen(true)} />
        </div>

        {/* KPIs */}
        <div className="mb-6">
          <DriverKpis driver={driver} comparisonLabel={comparisonLabel} />
        </div>

        {/* Performance Chart */}
        <div className="mb-6">
          <DriverPerformanceChart driver={driver} />
        </div>

        {/* Two Columns: Error Breakdown + Coaching History */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ErrorBreakdown driver={driver} />
          <CoachingHistory driver={driver} onPlanCoaching={() => setCoachingModalOpen(true)} />
        </div>

        {/* Daily Performance */}
        <DailyPerformance driver={driver} week={week} />
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
