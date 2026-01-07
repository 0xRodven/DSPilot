"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStore } from "@/lib/store"
import { useFilters, useBuildFilteredHref } from "@/lib/filters"
import { DataTable } from "./data-table"
import { createColumns, type DashboardDriver } from "./columns"

export function DriversTable() {
  const router = useRouter()
  const { selectedStation } = useDashboardStore()
  const { period, year, weekNum, date, displayLabel, normalizedTime } = useFilters()
  const buildHref = useBuildFilteredHref()

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

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

  const driversData = period === "day" ? driversDaily : period === "range" ? driversRange : driversWeekly

  // Transform data for the table
  const drivers: DashboardDriver[] = useMemo(() => {
    if (!driversData) return []
    return driversData.map((d) => ({
      id: d.id,
      name: d.name,
      amazonId: d.amazonId,
      dwcPercent: d.dwcPercent,
      iadcPercent: d.iadcPercent,
      totalDeliveries: d.totalDeliveries,
      daysActive: d.daysActive,
      tier: d.tier,
    }))
  }, [driversData])

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      createColumns({
        onViewDriver: (driverId) => router.push(buildHref(`/dashboard/drivers/${driverId}`)),
        onPlanCoaching: (driverId) => router.push(buildHref(`/dashboard/coaching`) + `&driverId=${driverId}`),
      }),
    [router, buildHref]
  )

  // Loading state
  if (!station || driversData === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40 mt-1" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-0">
                <Skeleton className="h-4 w-8" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground">Tous les Drivers</CardTitle>
            <p className="text-sm text-muted-foreground">{drivers.length} drivers • {displayLabel}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <DataTable
          columns={columns}
          data={drivers}
          periodLabel={displayLabel}
          onRowClick={(driverId) => router.push(buildHref(`/dashboard/drivers/${driverId}`))}
        />
      </CardContent>
    </Card>
  )
}
