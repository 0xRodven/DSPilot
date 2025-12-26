"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { getWeek, format } from "date-fns"
import { fr } from "date-fns/locale"
import { TierStatsCards } from "@/components/drivers/tier-stats-cards"
import { DriversListTable } from "@/components/drivers/drivers-list-table"
import { Button } from "@/components/ui/button"
import { Users, Download } from "lucide-react"
import { downloadCSV, formatDriversForCSV } from "@/lib/utils/csv"
import { toast } from "sonner"

export default function DriversPage() {
  const { selectedStation, selectedDate, granularity } = useDashboardStore()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })
  const year = selectedDate.getFullYear()
  const dateStr = format(selectedDate, "yyyy-MM-dd")

  const [selectedTier, setSelectedTier] = useState("all")

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get KPIs - choose query based on granularity
  const kpisWeekly = useQuery(
    api.stats.getDashboardKPIs,
    station && granularity === "week" ? { stationId: station._id, year, week } : "skip"
  )
  const kpisDaily = useQuery(
    api.stats.getDashboardKPIsDaily,
    station && granularity === "day" ? { stationId: station._id, date: dateStr } : "skip"
  )
  const kpis = granularity === "week" ? kpisWeekly : kpisDaily

  // Get drivers list - choose query based on granularity
  const driversWeekly = useQuery(
    api.stats.getDashboardDrivers,
    station && granularity === "week" ? { stationId: station._id, year, week } : "skip"
  )
  const driversDaily = useQuery(
    api.stats.getDashboardDriversDaily,
    station && granularity === "day" ? { stationId: station._id, date: dateStr } : "skip"
  )
  const drivers = granularity === "week" ? driversWeekly : driversDaily

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

  // Period label for display
  const getPeriodLabel = () => {
    if (granularity === "week") {
      return `Semaine ${week}`
    } else {
      return format(selectedDate, "EEEE d MMMM", { locale: fr })
    }
  }
  const periodLabel = getPeriodLabel()

  // Loading state
  if (!station || kpis === undefined || drivers === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Drivers</h1>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </main>
    )
  }

  // No data state
  if (!kpis || !drivers || drivers.length === 0) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Drivers</h1>
            <p className="text-sm text-muted-foreground capitalize">{periodLabel}</p>
          </div>
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucun driver pour {periodLabel.toLowerCase()}</p>
            <p className="text-sm text-muted-foreground mt-1">Importez un rapport pour voir les drivers</p>
          </div>
        </div>
      </main>
    )
  }

  // Build tier stats from KPIs
  const tierStats = {
    fantastic: {
      count: kpis.tierDistribution.fantastic,
      percentage: kpis.totalDrivers > 0
        ? ((kpis.tierDistribution.fantastic / kpis.totalDrivers) * 100).toFixed(0)
        : "0",
      trend: 0,
    },
    great: {
      count: kpis.tierDistribution.great,
      percentage: kpis.totalDrivers > 0
        ? ((kpis.tierDistribution.great / kpis.totalDrivers) * 100).toFixed(0)
        : "0",
      trend: 0,
    },
    fair: {
      count: kpis.tierDistribution.fair,
      percentage: kpis.totalDrivers > 0
        ? ((kpis.tierDistribution.fair / kpis.totalDrivers) * 100).toFixed(0)
        : "0",
      trend: 0,
    },
    poor: {
      count: kpis.tierDistribution.poor,
      percentage: kpis.totalDrivers > 0
        ? ((kpis.tierDistribution.poor / kpis.totalDrivers) * 100).toFixed(0)
        : "0",
      trend: 0,
    },
    total: kpis.totalDrivers,
    active: kpis.activeDrivers,
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] animate-in fade-in duration-300">
      <div className="p-4 md:p-6">
        {/* Page Title */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Drivers</h1>
            <p className="text-xs md:text-sm text-muted-foreground capitalize">
              {periodLabel} • {tierStats.total} drivers • {tierStats.active} actifs
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              const csvData = formatDriversForCSV(
                drivers.map(d => ({
                  name: d.name,
                  amazonId: d.amazonId,
                  dwcPercent: d.dwcPercent,
                  iadcPercent: d.iadcPercent,
                  tier: d.tier,
                  daysActive: d.daysActive,
                })),
                selectedStation.code,
                week,
                year
              )
              downloadCSV(csvData, `drivers-${selectedStation.code}-S${week}-${year}`)
              toast.success("Export CSV téléchargé")
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Tier Stats Cards */}
        <div className="mb-4 md:mb-6">
          <TierStatsCards
            stats={tierStats}
            selectedTier={selectedTier}
            onTierSelect={setSelectedTier}
            comparisonLabel={comparisonLabel}
          />
        </div>

        {/* Drivers Table */}
        <DriversListTable
          drivers={drivers}
          stats={tierStats}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          granularity={granularity}
        />
      </div>
    </main>
  )
}
